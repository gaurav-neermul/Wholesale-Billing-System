const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                i.invoice_id,
                i.invoice_number,
                i.sales_order_id,
                i.customer_po_number,
                i.delivery_date,
                i.invoice_date,
                i.status,
                i.total_amount,
                c.company_name
            FROM invoices i
            JOIN customers c
                ON i.customer_id = c.customer_id
            ORDER BY i.invoice_id DESC;
        `);

        res.json(result.rows);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Failed to retrieve invoices."

        });

    }

});

router.get("/:id/print", async (req, res) => {

    try {

        const { id } = req.params;

        const invoiceResult = await db.query(
            `
    SELECT
        i.invoice_id,
        i.invoice_number,
        i.invoice_date,
        i.status,
        i.total_amount,
        i.notes,
        i.customer_po_number,
        i.delivery_date,
        i.sales_order_id,
        c.company_name,
        c.company_brn,
        c.address
    FROM invoices i
    JOIN customers c
        ON i.customer_id = c.customer_id
    WHERE i.invoice_id = $1;
    `,
            [id]
        );
        if (invoiceResult.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Invoice not found."

            });

        }

        const itemsResult = await db.query(
            `
            SELECT
                ii.product_id,
                ii.quantity,
                ii.unit_price,
                p.product_name
            FROM invoice_items ii
            JOIN products p
                ON ii.product_id = p.product_id
            WHERE ii.invoice_id = $1
            ORDER BY ii.invoice_item_id;
            `,
            [id]
        );

        res.json({

            success: true,

            invoice: invoiceResult.rows[0],

            items: itemsResult.rows

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Failed to load invoice."

        });

    }

});
router.get("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const invoiceResult = await db.query(`
            SELECT
                i.*,
                c.company_name
            FROM invoices i
            JOIN customers c
                ON i.customer_id=c.customer_id
            WHERE invoice_id=$1;
        `, [id]);

        if (invoiceResult.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Invoice not found."

            });

        }

        const itemsResult = await db.query(`
            SELECT
                *
            FROM invoice_items
            WHERE invoice_id=$1
            ORDER BY invoice_item_id;
        `, [id]);

        res.json({

            success: true,

            invoice: invoiceResult.rows[0],

            items: itemsResult.rows

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Failed to retrieve invoice."

        });

    }

});

router.put("/:id/finalize", async (req, res) => {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const { id } = req.params;

        const invoiceResult = await client.query(
            `
            SELECT *
            FROM invoices
            WHERE invoice_id = $1
            FOR UPDATE;
            `,
            [id]
        );

        if (invoiceResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Invoice not found."
            });
        }

        const invoice = invoiceResult.rows[0];

        if (invoice.status === "FINAL") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Invoice is already finalized."
            });
        }

        if (invoice.status === "CANCELLED") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Cancelled invoices cannot be finalized."
            });
        }

        const itemsResult = await client.query(
            `
            SELECT
                ii.product_id,
                ii.quantity,
                p.product_name,
                p.track_inventory
            FROM invoice_items ii
            INNER JOIN products p
                ON ii.product_id = p.product_id
            WHERE ii.invoice_id = $1;
            `,
            [id]
        );

        if (itemsResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Invoice has no products."
            });
        }

        for (const item of itemsResult.rows) {
            if (!item.track_inventory) {
                continue;
            }

            const stockResult = await client.query(
                `
                SELECT current_stock
                FROM inventory
                WHERE product_id = $1
                FOR UPDATE;
                `,
                [item.product_id]
            );

            if (stockResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: `Inventory record not found for ${item.product_name}.`
                });
            }

            const currentStock =
                Number(stockResult.rows[0].current_stock);

            const requiredQuantity =
                Number(item.quantity);

            if (currentStock < requiredQuantity) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        `Insufficient stock for ${item.product_name}. ` +
                        `Available: ${currentStock}, ` +
                        `Required: ${requiredQuantity}.`
                });
            }
        }

        for (const item of itemsResult.rows) {
            if (!item.track_inventory) {
                continue;
            }

            await client.query(
                `
                UPDATE inventory
                SET
                    current_stock = current_stock - $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE product_id = $2;
                `,
                [
                    Number(item.quantity),
                    item.product_id
                ]
            );
        }

        await client.query(
            `
            UPDATE invoices
            SET
                status = 'FINAL',
                updated_at = CURRENT_TIMESTAMP
            WHERE invoice_id = $1;
            `,
            [id]
        );

        if (invoice.sales_order_id) {
            await client.query(
                `
                UPDATE sales_orders
                SET
                    status = 'Invoiced',
                    updated_at = CURRENT_TIMESTAMP
                WHERE sales_order_id = $1;
                `,
                [invoice.sales_order_id]
            );
        }

        await client.query("COMMIT");

        res.json({
            success: true,
            message: "Invoice finalized successfully."
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to finalize invoice."
        });

    } finally {
        client.release();
    }
});

router.delete("/:id", async (req, res) => {

    const client = await db.connect();

    try {

        await client.query("BEGIN");

        const { id } = req.params;

        const invoiceResult = await client.query(`
            SELECT *
            FROM invoices
            WHERE invoice_id=$1;
        `, [id]);

        if (invoiceResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({

                success: false,

                message: "Invoice not found."

            });

        }

        if (invoiceResult.rows[0].status === "FINAL") {

            await client.query("ROLLBACK");

            return res.status(400).json({

                success: false,

                message: "Finalized invoices cannot be deleted."

            });

        }

        await client.query(`
            DELETE FROM invoice_items
            WHERE invoice_id=$1;
        `, [id]);

        await client.query(`
            DELETE FROM invoices
            WHERE invoice_id=$1;
        `, [id]);

        if (invoiceResult.rows[0].sales_order_id) {

            await client.query(`
                UPDATE sales_orders
                SET status='Pending'
                WHERE sales_order_id=$1;
            `, [invoiceResult.rows[0].sales_order_id]);

        }

        await client.query("COMMIT");

        res.json({

            success: true,

            message: "Invoice deleted successfully."

        });

    }

    catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Failed to delete invoice."

        });

    }

    finally {

        client.release();

    }

});

router.put("/:id", async (req, res) => {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const { id } = req.params;

        const {
            customer_po_number,
            delivery_date,
            notes,
            items
        } = req.body;

        const invoiceCheck = await client.query(
            `
            SELECT *
            FROM invoices
            WHERE invoice_id = $1
            FOR UPDATE;
            `,
            [id]
        );

        if (invoiceCheck.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Invoice not found."
            });
        }

        const invoice = invoiceCheck.rows[0];

        if (invoice.status !== "DRAFT") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Only draft invoices can be edited."
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Invoice must contain at least one item."
            });
        }

        const poNumber =
            customer_po_number &&
                customer_po_number.trim() !== ""
                ? customer_po_number.trim()
                : null;

        await client.query(
            `
    UPDATE invoices
    SET
        customer_po_number = $1,
        delivery_date = $2,
        notes = $3,
        revision_number = revision_number + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE invoice_id = $4;
    `,
            [
                poNumber,
                delivery_date || null,
                notes || null,
                id
            ]
        );

        await client.query(
            `
            DELETE FROM invoice_items
            WHERE invoice_id = $1;
            `,
            [id]
        );

        let grandTotal = 0;

        for (const item of items) {
            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unit_price);

            if (
                !Number.isFinite(quantity) ||
                quantity <= 0
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: "Invalid item quantity."
                });
            }

            if (
                !Number.isFinite(unitPrice) ||
                unitPrice < 0
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: "Invalid item price."
                });
            }

            const lineTotal =
                quantity * unitPrice;

            grandTotal += lineTotal;

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
                    id,
                    item.product_id,
                    item.product_name,
                    quantity,
                    unitPrice,
                    lineTotal
                ]
            );
        }

        await client.query(
            `
            UPDATE invoices
            SET
                total_amount = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE invoice_id = $2;
            `,
            [
                grandTotal,
                id
            ]
        );

        await client.query("COMMIT");

        res.json({
            success: true,
            message: "Invoice updated successfully."
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update invoice."
        });

    } finally {
        client.release();
    }
});




module.exports = router;