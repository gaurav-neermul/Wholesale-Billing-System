const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                i.inventory_id,
                i.product_id,
                p.product_name,
                p.default_price,
                p.minimum_stock,
                p.track_inventory,
                i.current_stock,
                i.last_stock_in,
                i.updated_at
            FROM inventory i
            INNER JOIN products p
                ON i.product_id = p.product_id
            WHERE p.is_active = true
            ORDER BY p.product_name;
        `);

        res.json(result.rows);

    } catch (error) {

        console.error("Inventory load error:", error);

        res.status(500).json({
            message: "Unable to load inventory."
        });

    }

});


router.get("/:productId", async (req, res) => {

    try {

        const { productId } = req.params;

        const result = await db.query(`
            SELECT
                i.inventory_id,
                i.product_id,
                p.product_name,
                p.default_price,
                p.minimum_stock,
                p.track_inventory,
                i.current_stock,
                i.last_stock_in,
                i.updated_at
            FROM inventory i
            INNER JOIN products p
                ON i.product_id = p.product_id
            WHERE i.product_id = $1;
        `, [productId]);

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Inventory record not found."
            });

        }

        res.json(result.rows[0]);

    } catch (error) {

        console.error("Inventory item error:", error);

        res.status(500).json({
            message: "Unable to load inventory."
        });

    }

});


router.post("/:productId/stock-in", async (req, res) => {

    const client = await db.connect();

    try {

        const { productId } = req.params;

        const quantity = Number(req.body.quantity);

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            return res.status(400).json({
                message: "Stock quantity must be greater than zero."
            });

        }

        await client.query("BEGIN");

        const productResult = await client.query(`
            SELECT
                product_id,
                product_name,
                track_inventory
            FROM products
            WHERE product_id = $1;
        `, [productId]);

        if (productResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Product not found."
            });

        }

        const product = productResult.rows[0];

        if (!product.track_inventory) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Inventory tracking is disabled for this product."
            });

        }

        const inventoryResult = await client.query(`
            SELECT
                inventory_id,
                current_stock
            FROM inventory
            WHERE product_id = $1
            FOR UPDATE;
        `, [productId]);

        if (inventoryResult.rows.length === 0) {

            await client.query(`
                INSERT INTO inventory (
                    product_id,
                    current_stock,
                    last_stock_in,
                    updated_at
                )
                VALUES (
                    $1,
                    $2,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                );
            `, [
                productId,
                quantity
            ]);

        } else {

            await client.query(`
                UPDATE inventory
                SET
                    current_stock = current_stock + $1,
                    last_stock_in = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE product_id = $2;
            `, [
                quantity,
                productId
            ]);

        }

        await client.query("COMMIT");

        res.status(201).json({
            message: "Stock added successfully.",
            product_id: Number(productId),
            quantity_added: quantity
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Stock-in error:", error);

        res.status(500).json({
            message: "Unable to add stock."
        });

    } finally {

        client.release();

    }

});


router.put("/:productId", async (req, res) => {

    const client = await db.connect();

    try {

        const { productId } = req.params;

        const currentStock =
            Number(req.body.current_stock);

        if (
            !Number.isFinite(currentStock) ||
            currentStock < 0
        ) {

            return res.status(400).json({
                message: "Stock cannot be negative."
            });

        }

        await client.query("BEGIN");

        const productResult = await client.query(`
            SELECT
                product_id,
                product_name,
                track_inventory
            FROM products
            WHERE product_id = $1;
        `, [productId]);

        if (productResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Product not found."
            });

        }

        if (!productResult.rows[0].track_inventory) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Inventory tracking is disabled for this product."
            });

        }

        const inventoryResult = await client.query(`
            SELECT inventory_id
            FROM inventory
            WHERE product_id = $1;
        `, [productId]);

        if (inventoryResult.rows.length === 0) {

            await client.query(`
                INSERT INTO inventory (
                    product_id,
                    current_stock,
                    updated_at
                )
                VALUES (
                    $1,
                    $2,
                    CURRENT_TIMESTAMP
                );
            `, [
                productId,
                currentStock
            ]);

        } else {

            await client.query(`
                UPDATE inventory
                SET
                    current_stock = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE product_id = $2;
            `, [
                currentStock,
                productId
            ]);

        }

        await client.query("COMMIT");

        res.json({
            message: "Inventory updated successfully.",
            product_id: Number(productId),
            current_stock: currentStock
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Inventory update error:", error);

        res.status(500).json({
            message: "Unable to update inventory."
        });

    } finally {

        client.release();

    }

});


module.exports = router;
