const express = require("express");
const db = require("../db");

const router = express.Router();

 
function isValidDate(value) {

    if (!value) {
        return false;
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(value);

}

 
router.get("/sales", async (req, res) => {

    try {

        const {
            from,
            to,
            customer_id
        } = req.query;


        const conditions = [
            "i.status = 'FINAL'"
        ];

        const values = [];

        let index = 1;


        if (from) {

            if (!isValidDate(from)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid From date."
                });

            }

            conditions.push(
                `i.invoice_date >= $${index}`
            );

            values.push(from);

            index++;

        }


        if (to) {

            if (!isValidDate(to)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid To date."
                });

            }

            conditions.push(
                `i.invoice_date <= $${index}`
            );

            values.push(to);

            index++;

        }


        if (customer_id) {

            const customerId =
                Number(customer_id);

            if (!Number.isInteger(customerId)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid customer."
                });

            }

            conditions.push(
                `i.customer_id = $${index}`
            );

            values.push(customerId);

            index++;

        }


        const result =
            await db.query(
                `
                SELECT

                    c.customer_id,

                    c.company_name,

                    COUNT(i.invoice_id)::INTEGER
                        AS invoice_count,

                    COALESCE(
                        SUM(i.total_amount),
                        0
                    ) AS total_sales

                FROM invoices i

                INNER JOIN customers c
                    ON c.customer_id =
                       i.customer_id

                WHERE
                    ${conditions.join(" AND ")}

                GROUP BY
                    c.customer_id,
                    c.company_name

                ORDER BY
                    total_sales DESC;
                `,
                values
            );


        const rows =
            result.rows.map(row => ({

                customer_id:
                    row.customer_id,

                company_name:
                    row.company_name,

                invoice_count:
                    Number(row.invoice_count),

                total_sales:
                    Number(row.total_sales) || 0

            }));


        const totalSales =
            rows.reduce(
                (sum, row) =>
                    sum + row.total_sales,
                0
            );


        const invoiceCount =
            rows.reduce(
                (sum, row) =>
                    sum + row.invoice_count,
                0
            );


        res.json({

            success: true,

            rows,

            summary: {

                total_sales:
                    totalSales,

                invoice_count:
                    invoiceCount,

                customer_count:
                    rows.length

            }

        });


    } catch (error) {

        console.error(
            "Sales report error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to generate sales report."

        });

    }

});


 
router.get("/invoices", async (req, res) => {

    try {

        const {
            from,
            to,
            customer_id,
            status
        } = req.query;


        const conditions = [];

        const values = [];

        let index = 1;


        if (from) {

            if (!isValidDate(from)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid From date."
                });

            }

            conditions.push(
                `i.invoice_date >= $${index}`
            );

            values.push(from);

            index++;

        }


        if (to) {

            if (!isValidDate(to)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid To date."
                });

            }

            conditions.push(
                `i.invoice_date <= $${index}`
            );

            values.push(to);

            index++;

        }


        if (customer_id) {

            const customerId =
                Number(customer_id);

            if (!Number.isInteger(customerId)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid customer."
                });

            }

            conditions.push(
                `i.customer_id = $${index}`
            );

            values.push(customerId);

            index++;

        }


        if (
            status &&
            [
                "DRAFT",
                "FINAL",
                "CANCELLED"
            ].includes(status)
        ) {

            conditions.push(
                `i.status = $${index}`
            );

            values.push(status);

            index++;

        }


        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";


        const result =
            await db.query(
                `
                SELECT

                    i.invoice_id,

                    i.invoice_number,

                    i.invoice_date,

                    i.status,

                    i.customer_po_number,

                    i.total_amount,

                    c.customer_id,

                    c.company_name

                FROM invoices i

                INNER JOIN customers c
                    ON c.customer_id =
                       i.customer_id

                ${whereClause}

                ORDER BY
                    i.invoice_date DESC,
                    i.invoice_id DESC;
                `,
                values
            );


        const rows =
            result.rows.map(row => ({

                invoice_id:
                    row.invoice_id,

                invoice_number:
                    row.invoice_number,

                invoice_date:
                    row.invoice_date,

                status:
                    row.status,

                customer_po_number:
                    row.customer_po_number,

                total_amount:
                    Number(row.total_amount) || 0,

                customer_id:
                    row.customer_id,

                company_name:
                    row.company_name

            }));


        const totalAmount =
            rows.reduce(
                (sum, row) =>
                    sum + row.total_amount,
                0
            );


        res.json({

            success: true,

            rows,

            summary: {

                invoice_count:
                    rows.length,

                total_amount:
                    totalAmount

            }

        });


    } catch (error) {

        console.error(
            "Invoice report error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to generate invoice report."

        });

    }

});
 
router.get("/payments", async (req, res) => {

    try {

        const {
            from,
            to,
            customer_id
        } = req.query;


        const conditions = [];

        const values = [];

        let index = 1;


        if (from) {

            if (!isValidDate(from)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid From date."
                });

            }

            conditions.push(
                `p.payment_date >= $${index}`
            );

            values.push(from);

            index++;

        }


        if (to) {

            if (!isValidDate(to)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid To date."
                });

            }

            conditions.push(
                `p.payment_date <= $${index}`
            );

            values.push(to);

            index++;

        }


        if (customer_id) {

            const customerId =
                Number(customer_id);

            if (!Number.isInteger(customerId)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid customer."
                });

            }

            conditions.push(
                `p.customer_id = $${index}`
            );

            values.push(customerId);

            index++;

        }


        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";


        const result =
            await db.query(
                `
                SELECT

                    p.payment_id,

                    p.payment_date,

                    p.total_amount,

                    p.payment_references,

                    p.notes,

                    c.customer_id,

                    c.company_name

                FROM payments p

                INNER JOIN customers c
                    ON c.customer_id =
                       p.customer_id

                ${whereClause}

                ORDER BY
                    p.payment_date DESC,
                    p.payment_id DESC;
                `,
                values
            );


        const rows =
            result.rows.map(row => ({

                payment_id:
                    row.payment_id,

                payment_date:
                    row.payment_date,

                total_amount:
                    Number(row.total_amount) || 0,

                payment_references:
                    row.payment_references,

                notes:
                    row.notes,

                customer_id:
                    row.customer_id,

                company_name:
                    row.company_name

            }));


        const totalPayments =
            rows.reduce(
                (sum, row) =>
                    sum + row.total_amount,
                0
            );


        res.json({

            success: true,

            rows,

            summary: {

                payment_count:
                    rows.length,

                total_payments:
                    totalPayments

            }

        });


    } catch (error) {

        console.error(
            "Payment report error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to generate payment report."

        });

    }

});

 
router.get("/receivables", async (req, res) => {

    try {

        const {
            to,
            customer_id
        } = req.query;


        const values = [];

        let index = 1;


        let invoiceDateCondition =
            "i.status = 'FINAL'";


        let paymentDateCondition =
            "TRUE";


        if (to) {

            if (!isValidDate(to)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid To date."
                });

            }


            invoiceDateCondition +=
                ` AND i.invoice_date <= $${index}`;


            paymentDateCondition =
                `p.payment_date <= $${index}`;


            values.push(to);

            index++;

        }


        if (customer_id) {

            const customerId =
                Number(customer_id);

            if (!Number.isInteger(customerId)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid customer."
                });

            }


            values.push(customerId);


            const customerParameter =
                `$${index}`;

            index++;


            invoiceDateCondition +=
                ` AND i.customer_id = ${customerParameter}`;


            paymentDateCondition +=
                ` AND p.customer_id = ${customerParameter}`;

        }


        const result =
            await db.query(
                `
                SELECT

                    c.customer_id,

                    c.company_name,

                    COALESCE(
                        invoice_totals.total_invoiced,
                        0
                    ) AS total_invoiced,

                    COALESCE(
                        payment_totals.total_paid,
                        0
                    ) AS total_paid,

                    GREATEST(
                        COALESCE(
                            invoice_totals.total_invoiced,
                            0
                        )
                        -
                        COALESCE(
                            payment_totals.total_paid,
                            0
                        ),
                        0
                    ) AS outstanding

                FROM customers c


                LEFT JOIN (

                    SELECT

                        i.customer_id,

                        SUM(
                            i.total_amount
                        ) AS total_invoiced

                    FROM invoices i

                    WHERE
                        ${invoiceDateCondition}

                    GROUP BY
                        i.customer_id

                ) invoice_totals

                    ON invoice_totals.customer_id =
                       c.customer_id


                LEFT JOIN (

                    SELECT

                        p.customer_id,

                        SUM(
                            p.total_amount
                        ) AS total_paid

                    FROM payments p

                    WHERE
                        ${paymentDateCondition}

                    GROUP BY
                        p.customer_id

                ) payment_totals

                    ON payment_totals.customer_id =
                       c.customer_id


                WHERE

                    (
                        COALESCE(
                            invoice_totals.total_invoiced,
                            0
                        )
                        -
                        COALESCE(
                            payment_totals.total_paid,
                            0
                        )
                    ) > 0

                ORDER BY
                    outstanding DESC;
                `,
                values
            );


        const rows =
            result.rows.map(row => ({

                customer_id:
                    row.customer_id,

                company_name:
                    row.company_name,

                total_invoiced:
                    Number(
                        row.total_invoiced
                    ) || 0,

                total_paid:
                    Number(
                        row.total_paid
                    ) || 0,

                outstanding:
                    Number(
                        row.outstanding
                    ) || 0

            }));


        const totalOutstanding =
            rows.reduce(
                (sum, row) =>
                    sum + row.outstanding,
                0
            );


        res.json({

            success: true,

            rows,

            summary: {

                customer_count:
                    rows.length,

                total_outstanding:
                    totalOutstanding

            }

        });


    } catch (error) {

        console.error(
            "Receivables report error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to generate receivables report."

        });

    }

});


 
router.get("/inventory", async (req, res) => {

    try {

        const {
            status
        } = req.query;


        let stockCondition = "";


        if (status === "LOW") {

            stockCondition = `
                AND i.current_stock <= p.minimum_stock
                AND i.current_stock > 0
            `;

        }


        if (status === "OUT") {

            stockCondition = `
                AND i.current_stock = 0
            `;

        }


        if (status === "IN_STOCK") {

            stockCondition = `
                AND i.current_stock > p.minimum_stock
            `;

        }


        const result =
            await db.query(
                `
                SELECT

                    p.product_id,

                    p.product_name,

                    p.default_price,

                    p.minimum_stock,

                    p.track_inventory,

                    p.is_active,

                    COALESCE(
                        i.current_stock,
                        0
                    ) AS current_stock,

                    i.last_stock_in,

                    i.updated_at

                FROM products p

                LEFT JOIN inventory i
                    ON i.product_id =
                       p.product_id

                WHERE
                    p.track_inventory = TRUE

                ${stockCondition}

                ORDER BY
                    current_stock ASC,
                    p.product_name ASC;
                `
            );


        const rows =
            result.rows.map(row => {

                const currentStock =
                    Number(
                        row.current_stock
                    ) || 0;

                const minimumStock =
                    Number(
                        row.minimum_stock
                    ) || 0;


                let stockStatus =
                    "IN_STOCK";


                if (currentStock === 0) {

                    stockStatus =
                        "OUT";

                } else if (
                    currentStock <=
                    minimumStock
                ) {

                    stockStatus =
                        "LOW";

                }


                return {

                    product_id:
                        row.product_id,

                    product_name:
                        row.product_name,

                    default_price:
                        Number(
                            row.default_price
                        ) || 0,

                    minimum_stock:
                        minimumStock,

                    current_stock:
                        currentStock,

                    track_inventory:
                        row.track_inventory,

                    is_active:
                        row.is_active,

                    last_stock_in:
                        row.last_stock_in,

                    updated_at:
                        row.updated_at,

                    stock_status:
                        stockStatus

                };

            });


        const totalProducts =
            rows.length;


        const totalStockUnits =
            rows.reduce(
                (sum, row) =>
                    sum + row.current_stock,
                0
            );


        const lowStockCount =
            rows.filter(
                row =>
                    row.stock_status ===
                    "LOW"
            ).length;


        const outOfStockCount =
            rows.filter(
                row =>
                    row.stock_status ===
                    "OUT"
            ).length;


        res.json({

            success: true,

            rows,

            summary: {

                product_count:
                    totalProducts,

                total_stock:
                    totalStockUnits,

                low_stock:
                    lowStockCount,

                out_of_stock:
                    outOfStockCount

            }

        });


    } catch (error) {

        console.error(
            "Inventory report error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to generate inventory report."

        });

    }

});

 
router.get("/top-products", async (req, res) => {

    try {

        const {
            from,
            to,
            limit
        } = req.query;


        const values = [];

        const conditions = [
            "i.status = 'FINAL'"
        ];

        let index = 1;


        if (from) {

            if (!isValidDate(from)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid From date."
                });

            }

            conditions.push(
                `i.invoice_date >= $${index}`
            );

            values.push(from);

            index++;

        }


        if (to) {

            if (!isValidDate(to)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid To date."
                });

            }

            conditions.push(
                `i.invoice_date <= $${index}`
            );

            values.push(to);

            index++;

        }


        let productLimit =
            Number(limit) || 10;


        if (
            productLimit < 1 ||
            productLimit > 100
        ) {

            productLimit = 10;

        }


        values.push(productLimit);


        const result =
            await db.query(
                `
                SELECT

                    ii.product_id,

                    ii.product_name,

                    SUM(
                        ii.quantity
                    ) AS quantity_sold,

                    SUM(
                        ii.line_total
                    ) AS sales_value

                FROM invoice_items ii

                INNER JOIN invoices i
                    ON i.invoice_id =
                       ii.invoice_id

                WHERE
                    ${conditions.join(" AND ")}

                GROUP BY
                    ii.product_id,
                    ii.product_name

                ORDER BY
                    quantity_sold DESC

                LIMIT $${index};
                `,
                values
            );


        const rows =
            result.rows.map(row => ({

                product_id:
                    row.product_id,

                product_name:
                    row.product_name,

                quantity_sold:
                    Number(
                        row.quantity_sold
                    ) || 0,

                sales_value:
                    Number(
                        row.sales_value
                    ) || 0

            }));


        res.json({

            success: true,

            rows

        });


    } catch (error) {

        console.error(
            "Top products report error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to generate top products report."

        });

    }

});


module.exports = router;