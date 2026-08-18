const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT *
            FROM products
            ORDER BY product_name;
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve products."
        });
    }
});

router.post("/", async (req, res) => {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const {
            product_name,
            default_price,
            minimum_stock,
            track_inventory
        } = req.body;

        if (!product_name || product_name.trim() === "") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Product name is required."
            });
        }

        if (
            !Number.isFinite(Number(default_price)) ||
            Number(default_price) < 0
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Invalid default price."
            });
        }

        if (
            !Number.isFinite(Number(minimum_stock)) ||
            Number(minimum_stock) < 0
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Invalid minimum stock."
            });
        }

        const productResult = await client.query(
            `
            INSERT INTO products (
                product_name,
                default_price,
                minimum_stock,
                track_inventory
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *;
            `,
            [
                product_name.trim(),
                Number(default_price),
                Number(minimum_stock),
                Boolean(track_inventory)
            ]
        );

        const product = productResult.rows[0];

        if (Boolean(track_inventory)) {
            await client.query(
                `
                INSERT INTO inventory (
                    product_id,
                    current_stock,
                    updated_at
                )
                VALUES ($1, 0, CURRENT_TIMESTAMP)
                ON CONFLICT (product_id)
                DO NOTHING;
                `,
                [product.product_id]
            );
        }

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Product created successfully.",
            product
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Product creation error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create product."
        });

    } finally {
        client.release();
    }
});

router.put("/:id", async (req, res) => {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const { id } = req.params;

        const {
            product_name,
            default_price,
            minimum_stock,
            track_inventory
        } = req.body;

        if (!product_name || product_name.trim() === "") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Product name is required."
            });
        }

        if (
            !Number.isFinite(Number(default_price)) ||
            Number(default_price) < 0
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Invalid default price."
            });
        }

        if (
            !Number.isFinite(Number(minimum_stock)) ||
            Number(minimum_stock) < 0
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Invalid minimum stock."
            });
        }

        const existingProductResult = await client.query(
            `
            SELECT *
            FROM products
            WHERE product_id = $1;
            `,
            [id]
        );

        if (existingProductResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const result = await client.query(
            `
            UPDATE products
            SET
                product_name = $1,
                default_price = $2,
                minimum_stock = $3,
                track_inventory = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE product_id = $5
            RETURNING *;
            `,
            [
                product_name.trim(),
                Number(default_price),
                Number(minimum_stock),
                Boolean(track_inventory),
                id
            ]
        );

        const updatedProduct = result.rows[0];

        if (Boolean(track_inventory)) {
            await client.query(
                `
        INSERT INTO inventory (
            product_id,
            current_stock,
            updated_at
        )
        VALUES ($1, 0, CURRENT_TIMESTAMP)
        ON CONFLICT (product_id)
        DO NOTHING;
        `,
                [id]
            );
        } else {
            await client.query(
                `
        DELETE FROM inventory
        WHERE product_id = $1;
        `,
                [id]
            );
        }
        await client.query("COMMIT");

        res.status(200).json({
            success: true,
            message: "Product updated successfully.",
            product: updatedProduct
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Product update error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update product."
        });

    } finally {
        client.release();
    }
});

router.patch("/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const result = await db.query(
            `
            UPDATE products
            SET
                is_active = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE product_id = $2
            RETURNING *;
            `,
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Product status updated successfully.",
            product: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update product status."
        });
    }
});

module.exports = router;