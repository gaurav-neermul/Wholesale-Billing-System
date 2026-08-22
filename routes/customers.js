const express = require("express");
const db = require("../db");
const router = express.Router(); //Create a small router dedicated to customers



router.get("/", async (req, res) => { //If someone reaches the customers route, execute the follwing function
    try { //ssend SQL to PostgeSQL
        const result = await db.query(` 
            SELECT * FROM customers
            ORDER BY company_name;
            `);
        res.json(result.rows); //psql sends back a result obj 
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve customers."
        })
    }

});



router.post("/", async (req, res) => {

    try {

        const {
            company_name,
            company_brn,
            address,
            phone_number
        } = req.body;

        const result = await db.query(
            `INSERT INTO customers
            (company_name, company_brn, address, phone_number)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                company_name,
                company_brn,
                address,
                phone_number
            ]
        );

        res.status(201).json({
            success: true,
            message: "Customer created successfully.",
            customer: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to create customer."
        });

    }

});



router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            company_name,
            company_brn,
            address,
            phone_number
        } = req.body;

        const result = await db.query(
            `
            UPDATE customers
            SET
                company_name = $1,
                company_brn = $2,
                address = $3,
                phone_number = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE customer_id = $5
            RETURNING *;
            `,
            [
                company_name,
                company_brn,
                address,
                phone_number,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Customer updated successfully.",
            customer: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to update customer."
        });

    }

});



//PATCH updates only the specific field you want to change, not the entire resource. for example changing is_active to false
// PATCH - Activate / Deactivate Customer
// it updts oonly specific fields 
router.patch("/:id/status", async (req, res) => {
    try {

        const { id } = req.params;
        const { is_active } = req.body;

        const result = await db.query(
            `
            UPDATE customers
            SET
                is_active = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE customer_id = $2
            RETURNING *;
            `,
            [is_active, id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });

        }

        res.status(200).json({
            success: true,
            message: "Customer status updated successfully.",
            customer: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to update customer status."
        });
    }
});


module.exports = router;