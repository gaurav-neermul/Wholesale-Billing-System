const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const result = await db.query(`
            SELECT
                so.sales_order_id,
                so.customer_po_number,
                so.order_date,
                so.delivery_date,
                so.status,
                c.company_name
            FROM sales_orders so
            JOIN customers c
                ON so.customer_id = c.customer_id
            ORDER BY so.sales_order_id DESC;
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve sales orders."
        });

    }
});

router.post("/", async (req, res) => {

    const client = await db.connect();

    try {

        await client.query("BEGIN");

        const {
            customer_id,
            customer_po_number,
            delivery_date,
            remarks,
            items
        } = req.body;

        const poNumber =
            customer_po_number &&
                customer_po_number.trim() !== ""
                ? customer_po_number.trim()
                : null;
        // Check customer is active
        const customerResult = await client.query(
            `
    SELECT customer_id, is_active
    FROM customers
    WHERE customer_id = $1;
    `,
            [customer_id]
        );

        if (customerResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Customer not found."
            });

        }

        if (!customerResult.rows[0].is_active) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Inactive customers cannot be used in sales orders."
            });

        }

        const orderResult = await client.query(
            `
            INSERT INTO sales_orders
            (
                customer_id,
                customer_po_number,
                delivery_date,
                remarks
            )
            VALUES
            ($1, $2, $3,$4)
            RETURNING *;
            `,
            [
                customer_id,
                poNumber,
                delivery_date,
                remarks
            ]
        );

        const salesOrderId = orderResult.rows[0].sales_order_id;
// Check all products are active
for (const item of items) {

    const productResult = await client.query(
        `
        SELECT product_id, product_name, is_active
        FROM products
        WHERE product_id = $1;
        `,
        [item.product_id]
    );

    if (productResult.rows.length === 0) {

        await client.query("ROLLBACK");

        return res.status(400).json({
            success: false,
            message: "Product not found."
        });

    }

    if (!productResult.rows[0].is_active) {

        await client.query("ROLLBACK");

        return res.status(400).json({
            success: false,
            message:
                `Product "${productResult.rows[0].product_name}" is inactive and cannot be used in a sales order.`
        });

    }

}
        for (const item of items) {

            await client.query(
                `
        INSERT INTO sales_order_items
        (
            sales_order_id,
            product_id,
            quantity,
            unit_price
        )
        VALUES
        ($1, $2, $3, $4);
        `,
                [
                    salesOrderId,
                    item.product_id,
                    item.quantity,
                    item.unit_price
                ]
            );

        }
        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Sales order created successfully.",
            salesOrder: orderResult.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(error);
        if (error.code === "23505") {

            return res.status(409).json({

                success: false,

                message: "Customer PO Number already exists."

            });

        }

        res.status(500).json({
            success: false,
            message: "Failed to create sales order."
        });

    } finally {

        client.release();

    }

});

router.delete("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const result = await db.query(
            `
            DELETE FROM sales_orders
            WHERE sales_order_id = $1
            RETURNING *;
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Sales order not found."
            });

        }

        res.json({
            success: true,
            message: "Sales order deleted successfully."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to delete sales order."
        });

    }

});


router.get("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const orderResult = await db.query(
            `
            SELECT
                so.*,
                c.company_name
            FROM sales_orders so
            JOIN customers c
                ON so.customer_id = c.customer_id
            WHERE so.sales_order_id = $1;
            `,
            [id]
        );

        if (orderResult.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Sales order not found."
            });

        }

        const itemsResult = await db.query(
            `
            SELECT
                soi.*,
                p.product_name
            FROM sales_order_items soi
            JOIN products p
                ON soi.product_id = p.product_id
            WHERE soi.sales_order_id = $1
            ORDER BY soi.sales_order_item_id;
            `,
            [id]
        );

        res.json({

            success: true,

            salesOrder: orderResult.rows[0],

            items: itemsResult.rows

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Failed to retrieve sales order."

        });

    }

});

router.put("/:id", async (req, res) => {

    const client = await db.connect();

    try {

        await client.query("BEGIN");

        const { id } = req.params;

        const {
            customer_id,
            customer_po_number,
            delivery_date,
            remarks,
            items
        } = req.body;

        const poNumber =
            customer_po_number &&
                customer_po_number.trim() !== ""
                ? customer_po_number.trim()
                : null;

// Check customer is active
const customerResult = await client.query(
    `
    SELECT customer_id, is_active
    FROM customers
    WHERE customer_id = $1;
    `,
    [customer_id]
);

if (customerResult.rows.length === 0) {

    await client.query("ROLLBACK");

    return res.status(400).json({
        success: false,
        message: "Customer not found."
    });

}

if (!customerResult.rows[0].is_active) {

    await client.query("ROLLBACK");

    return res.status(400).json({
        success: false,
        message: "Inactive customers cannot be used in sales orders."
    });

}

        const orderResult = await client.query(
            `
            UPDATE sales_orders
            SET
                customer_id = $1,
                customer_po_number = $2,
                delivery_date = $3,
                remarks = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE sales_order_id = $5
            RETURNING *;
            `,
            [
                customer_id,
                poNumber,
                delivery_date,
                remarks,
                id
            ]
        );

        if (orderResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Sales order not found."
            });

        }

        await client.query(
            `
            DELETE FROM sales_order_items
            WHERE sales_order_id = $1;
            `,
            [id]
        );

// Check all products are active
for (const item of items) {

    const productResult = await client.query(
        `
        SELECT product_id, product_name, is_active
        FROM products
        WHERE product_id = $1;
        `,
        [item.product_id]
    );

    if (productResult.rows.length === 0) {

        await client.query("ROLLBACK");

        return res.status(400).json({
            success: false,
            message: "Product not found."
        });

    }

    if (!productResult.rows[0].is_active) {

        await client.query("ROLLBACK");

        return res.status(400).json({
            success: false,
            message:
                `Product "${productResult.rows[0].product_name}" is inactive and cannot be used in a sales order.`
        });

    }

}

        for (const item of items) {

            await client.query(
                `
                INSERT INTO sales_order_items
                (
                    sales_order_id,
                    product_id,
                    quantity,
                    unit_price
                )
                VALUES
                ($1,$2,$3,$4);
                `,
                [
                    id,
                    item.product_id,
                    item.quantity,
                    item.unit_price
                ]
            );

        }

        await client.query("COMMIT");

        res.json({

            success: true,

            message: "Sales order updated successfully."

        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(error);
        if (error.code === "23505") {

            return res.status(409).json({

                success: false,

                message: "Customer PO Number already exists."

            });

        }
        res.status(500).json({

            success: false,

            message: "Failed to update sales order."

        });

    } finally {

        client.release();

    }

});

router.post("/:id/generate-invoice", async (req, res) => {

    const client = await db.connect();

    try {

        await client.query("BEGIN");

        const { id } = req.params;

        const salesOrderResult = await client.query(
            `
            SELECT *
            FROM sales_orders
            WHERE sales_order_id = $1;
            `,
            [id]
        );

        if (salesOrderResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Sales order not found."
            });

        }

        const salesOrder =
            salesOrderResult.rows[0];

        const existingInvoice =
            await client.query(
                `
                SELECT invoice_id
                FROM invoices
                WHERE sales_order_id = $1;
                `,
                [id]
            );

        if (existingInvoice.rows.length > 0) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Invoice already exists for this sales order."
            });

        }

        const itemsResult =
            await client.query(
                `
                SELECT
                    soi.*,
                    p.product_name
                FROM sales_order_items soi
                JOIN products p
                    ON soi.product_id = p.product_id
                WHERE soi.sales_order_id = $1;
                `,
                [id]
            );

        if (itemsResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Sales order has no items."
            });

        }

        let totalAmount = 0;

        itemsResult.rows.forEach(item => {

            totalAmount +=
                Number(item.quantity) *
                Number(item.unit_price);

        });

        const countResult =
            await client.query(
                `
                SELECT COUNT(*) AS total
                FROM invoices;
                `
            );

        const invoiceNumber =
            `INV-${String(
                Number(countResult.rows[0].total) + 1
            ).padStart(4, "0")}`;

        const invoiceResult =
            await client.query(
                `
                INSERT INTO invoices
                (
                    invoice_number,
                    sales_order_id,
                    customer_id,
                    customer_po_number,
                    delivery_date,
                    invoice_date,
                    status,
                    total_amount,
                    notes
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    CURRENT_DATE,
                    'DRAFT',
                    $6,
                    $7
                )
                RETURNING *;
                `,
                [
                    invoiceNumber,
                    id,
                    salesOrder.customer_id,
                    salesOrder.customer_po_number,
                    salesOrder.delivery_date,
                    totalAmount,
                    salesOrder.remarks
                ]
            );

        const invoiceId =
            invoiceResult.rows[0].invoice_id;

        for (const item of itemsResult.rows) {

            const lineTotal =
                Number(item.quantity) *
                Number(item.unit_price);

            await client.query(
                `
                INSERT INTO invoice_items
                (
                    invoice_id,
                    product_id,
                    product_name,
                    quantity,
                    unit_price,
                    line_total
                )
                VALUES
                ($1, $2, $3, $4, $5, $6);
                `,
                [
                    invoiceId,
                    item.product_id,
                    item.product_name,
                    item.quantity,
                    item.unit_price,
                    lineTotal
                ]
            );

        }

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Invoice generated successfully.",
            invoice: invoiceResult.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        if (error.code === "23505") {

            return res.status(409).json({
                success: false,
                message: "An invoice already exists for this sales order."
            });

        }

        res.status(500).json({
            success: false,
            message: "Failed to generate invoice."
        });

    } finally {

        client.release();

    }

});
module.exports = router;
