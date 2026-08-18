const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const salesSummaryResult = await db.query(`
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN invoice_date = CURRENT_DATE
                            THEN total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS today_sales,

                COALESCE(
                    SUM(
                        CASE
                            WHEN DATE_TRUNC('month', invoice_date)
                                = DATE_TRUNC('month', CURRENT_DATE)
                            THEN total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS month_sales,

                COUNT(*) FILTER (
                    WHERE invoice_date = CURRENT_DATE
                ) AS today_invoices,

                COUNT(*) AS total_final_invoices

            FROM invoices
            WHERE status = 'FINAL';
        `);

        const salesSummary = salesSummaryResult.rows[0];

        const paymentSummaryResult = await db.query(`
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN payment_date = CURRENT_DATE
                            THEN total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS today_payments,

                COALESCE(
                    SUM(
                        CASE
                            WHEN DATE_TRUNC('month', payment_date)
                                = DATE_TRUNC('month', CURRENT_DATE)
                            THEN total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS month_payments

            FROM payments;
        `);

        const paymentSummary = paymentSummaryResult.rows[0];

        const receivablesResult = await db.query(`
            SELECT
                GREATEST(
                    COALESCE(
                        (
                            SELECT SUM(i.total_amount)
                            FROM invoices i
                            WHERE i.status = 'FINAL'
                        ),
                        0
                    )
                    -
                    COALESCE(
                        (
                            SELECT SUM(p.total_amount)
                            FROM payments p
                        ),
                        0
                    ),
                    0
                ) AS outstanding,

                COUNT(*) AS customers_owing

            FROM (
                SELECT c.customer_id
                FROM customers c
                WHERE EXISTS (
                    SELECT 1
                    FROM invoices i
                    WHERE i.customer_id = c.customer_id
                    AND i.status = 'FINAL'
                )
                AND (
                    COALESCE(
                        (
                            SELECT SUM(i2.total_amount)
                            FROM invoices i2
                            WHERE i2.customer_id = c.customer_id
                            AND i2.status = 'FINAL'
                        ),
                        0
                    )
                    -
                    COALESCE(
                        (
                            SELECT SUM(p2.total_amount)
                            FROM payments p2
                            WHERE p2.customer_id = c.customer_id
                        ),
                        0
                    )
                ) > 0
            ) owing;
        `);

        const receivables = receivablesResult.rows[0];

        const customerCountResult = await db.query(`
            SELECT
                COUNT(*) FILTER (
                    WHERE is_active = TRUE
                ) AS active_customers,

                COUNT(*) FILTER (
                    WHERE is_active = FALSE
                ) AS inactive_customers

            FROM customers;
        `);

        const customerCount = customerCountResult.rows[0];

        const productCountResult = await db.query(`
            SELECT
                COUNT(*) FILTER (
                    WHERE is_active = TRUE
                ) AS active_products,

                COUNT(*) FILTER (
                    WHERE is_active = FALSE
                ) AS inactive_products

            FROM products;
        `);

        const productCount = productCountResult.rows[0];

        const inventoryResult = await db.query(`
            SELECT
                COUNT(*) FILTER (
                    WHERE
                        p.track_inventory = TRUE
                        AND i.current_stock = 0
                ) AS out_of_stock,

                COUNT(*) FILTER (
                    WHERE
                        p.track_inventory = TRUE
                        AND i.current_stock > 0
                        AND i.current_stock <= p.minimum_stock
                ) AS low_stock,

                COALESCE(
                    SUM(
                        CASE
                            WHEN p.track_inventory = TRUE
                            THEN i.current_stock
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_stock

            FROM products p

            LEFT JOIN inventory i
                ON i.product_id = p.product_id

            WHERE p.is_active = TRUE;
        `);

        const inventory = inventoryResult.rows[0];

        const salesOrderSummaryResult = await db.query(`
            SELECT
                COUNT(*) AS total_orders,

                COUNT(*) FILTER (
                    WHERE status = 'Pending'
                ) AS pending_orders,

                COUNT(*) FILTER (
                    WHERE status = 'Invoiced'
                ) AS invoiced_orders

            FROM sales_orders;
        `);

        const salesOrderSummary = salesOrderSummaryResult.rows[0];

        const salesChartResult = await db.query(`
            SELECT
                days.sale_date,
                COALESCE(
                    SUM(i.total_amount),
                    0
                ) AS total_sales

            FROM (
                SELECT
                    CURRENT_DATE - day_offset AS sale_date
                FROM generate_series(6, 0, -1) AS day_offset
            ) days

            LEFT JOIN invoices i
                ON i.invoice_date = days.sale_date
                AND i.status = 'FINAL'

            GROUP BY days.sale_date
            ORDER BY days.sale_date;
        `);

        const topProductsResult = await db.query(`
            SELECT
                ii.product_id,
                ii.product_name,
                SUM(ii.quantity) AS quantity_sold,
                SUM(ii.line_total) AS sales_value

            FROM invoice_items ii

            INNER JOIN invoices i
                ON i.invoice_id = ii.invoice_id

            WHERE i.status = 'FINAL'

            GROUP BY
                ii.product_id,
                ii.product_name

            ORDER BY quantity_sold DESC
            LIMIT 5;
        `);

        const recentInvoicesResult = await db.query(`
            SELECT
                i.invoice_id,
                i.invoice_number,
                i.invoice_date,
                i.status,
                i.total_amount,
                c.company_name

            FROM invoices i

            INNER JOIN customers c
                ON c.customer_id = i.customer_id

            ORDER BY i.invoice_id DESC
            LIMIT 5;
        `);

        const recentPaymentsResult = await db.query(`
            SELECT
                p.payment_id,
                p.payment_date,
                p.total_amount,
                p.payment_references,
                c.company_name

            FROM payments p

            INNER JOIN customers c
                ON c.customer_id = p.customer_id

            ORDER BY p.payment_id DESC
            LIMIT 5;
        `);

        const recentOrdersResult = await db.query(`
            SELECT
                so.sales_order_id,
                so.order_date,
                so.delivery_date,
                so.status,
                so.customer_po_number,
                c.company_name

            FROM sales_orders so

            INNER JOIN customers c
                ON c.customer_id = so.customer_id

            ORDER BY so.sales_order_id DESC
            LIMIT 5;
        `);

        res.json({
            success: true,

            summary: {
                today_sales:
                    Number(salesSummary.today_sales) || 0,

                month_sales:
                    Number(salesSummary.month_sales) || 0,

                today_invoices:
                    Number(salesSummary.today_invoices) || 0,

                total_final_invoices:
                    Number(salesSummary.total_final_invoices) || 0,

                today_payments:
                    Number(paymentSummary.today_payments) || 0,

                month_payments:
                    Number(paymentSummary.month_payments) || 0,

                outstanding:
                    Number(receivables.outstanding) || 0,

                customers_owing:
                    Number(receivables.customers_owing) || 0,

                active_customers:
                    Number(customerCount.active_customers) || 0,

                inactive_customers:
                    Number(customerCount.inactive_customers) || 0,

                active_products:
                    Number(productCount.active_products) || 0,

                inactive_products:
                    Number(productCount.inactive_products) || 0,

                total_stock:
                    Number(inventory.total_stock) || 0,

                low_stock:
                    Number(inventory.low_stock) || 0,

                out_of_stock:
                    Number(inventory.out_of_stock) || 0,

                total_orders:
                    Number(salesOrderSummary.total_orders) || 0,

                pending_orders:
                    Number(salesOrderSummary.pending_orders) || 0,

                invoiced_orders:
                    Number(salesOrderSummary.invoiced_orders) || 0
            },

            sales_chart:
                salesChartResult.rows.map(row => ({
                    date: row.sale_date,
                    sales: Number(row.total_sales) || 0
                })),

            top_products:
                topProductsResult.rows.map(row => ({
                    product_id: row.product_id,
                    product_name: row.product_name,
                    quantity_sold:
                        Number(row.quantity_sold) || 0,
                    sales_value:
                        Number(row.sales_value) || 0
                })),

            recent_invoices:
                recentInvoicesResult.rows.map(row => ({
                    invoice_id: row.invoice_id,
                    invoice_number: row.invoice_number,
                    invoice_date: row.invoice_date,
                    status: row.status,
                    total_amount:
                        Number(row.total_amount) || 0,
                    company_name: row.company_name
                })),

            recent_payments:
                recentPaymentsResult.rows.map(row => ({
                    payment_id: row.payment_id,
                    payment_date: row.payment_date,
                    total_amount:
                        Number(row.total_amount) || 0,
                    payment_references:
                        row.payment_references,
                    company_name: row.company_name
                })),

            recent_orders:
                recentOrdersResult.rows.map(row => ({
                    sales_order_id:
                        row.sales_order_id,
                    order_date:
                        row.order_date,
                    delivery_date:
                        row.delivery_date,
                    status:
                        row.status,
                    customer_po_number:
                        row.customer_po_number,
                    company_name:
                        row.company_name
                }))
        });

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load dashboard."
        });
    }
});

module.exports = router;