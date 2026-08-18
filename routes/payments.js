const express = require("express");
const db = require("../db");

const router = express.Router();
 
router.get("/customers", async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                customer_id,
                company_name,
                company_brn
            FROM customers
            ORDER BY company_name;
        `);

        res.json({
            success: true,
            customers: result.rows
        });

    } catch (error) {

        console.error("Payment customers error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load customers."
        });

    }

});

 
router.get("/customers/:customerId/invoices", async (req, res) => {

    try {

        const customerId =
            Number(req.params.customerId);

        if (!Number.isInteger(customerId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid customer ID."
            });

        }


        const result = await db.query(
            `
            SELECT
                i.invoice_id,
                i.invoice_number,
                i.invoice_date,
                i.total_amount,

                COALESCE(
                    (
                        SELECT SUM(pi.amount_paid)
                        FROM payment_items pi
                        JOIN payments p
                            ON p.payment_id = pi.payment_id
                        WHERE pi.invoice_id = i.invoice_id
                    ),
                    0
                ) AS paid_amount

            FROM invoices i

            WHERE
                i.customer_id = $1
                AND i.status = 'FINAL'

            ORDER BY
                i.invoice_date ASC,
                i.invoice_id ASC;
            `,
            [customerId]
        );


        const invoices =
            result.rows.map(invoice => {

                const total =
                    Number(invoice.total_amount) || 0;

                const paid =
                    Number(invoice.paid_amount) || 0;

                const outstanding =
                    Math.max(
                        0,
                        total - paid
                    );

                return {

                    invoice_id:
                        invoice.invoice_id,

                    invoice_number:
                        invoice.invoice_number,

                    invoice_date:
                        invoice.invoice_date,

                    total_amount:
                        total,

                    paid_amount:
                        paid,

                    outstanding:
                        outstanding

                };

            });


        res.json({
            success: true,
            invoices
        });


    } catch (error) {

        console.error(
            "Customer invoices error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to load customer invoices."
        });

    }

});
 
router.post("/", async (req, res) => {

    const client =
        await db.connect();

    try {

        const {
            customer_id,
            payment_date,
            total_amount,
            payment_references,
            notes,
            items
        } = req.body;


        const customerId =
            Number(customer_id);

        const totalAmount =
            Number(total_amount);

 
        if (
            !Number.isInteger(customerId)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid customer."
            });

        }


        if (
            !payment_date
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Payment date is required."
            });

        }


        if (
            !Number.isFinite(totalAmount) ||
            totalAmount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Payment amount must be greater than zero."
            });

        }


        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Payment must be allocated to at least one invoice."
            });

        }


        await client.query("BEGIN");
         const customerResult =
            await client.query(
                `
                SELECT customer_id
                FROM customers
                WHERE customer_id = $1;
                `,
                [customerId]
            );


        if (
            customerResult.rows.length === 0
        ) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message:
                    "Customer not found."
            });

        }
 
        let allocationTotal = 0;

        for (const item of items) {

            const invoiceId =
                Number(item.invoice_id);

            const amountPaid =
                Number(item.amount_paid);


            if (
                !Number.isInteger(invoiceId)
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid invoice."
                });

            }


            if (
                !Number.isFinite(amountPaid) ||
                amountPaid <= 0
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "Payment allocation must be greater than zero."
                });

            }


            allocationTotal +=
                amountPaid;

        }


         const roundedAllocation =
            Math.round(
                allocationTotal * 100
            ) / 100;

        const roundedTotal =
            Math.round(
                totalAmount * 100
            ) / 100;


        if (
            roundedAllocation !==
            roundedTotal
        ) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message:
                    "Payment allocation total must equal the payment amount."
            });

        }

 
        const validatedItems = [];


        for (const item of items) {

            const invoiceId =
                Number(item.invoice_id);

            const amountPaid =
                Number(item.amount_paid);


            const invoiceResult =
                await client.query(
                    `
                    SELECT
                        i.invoice_id,
                        i.invoice_number,
                        i.customer_id,
                        i.status,
                        i.total_amount,

                        COALESCE(
                            (
                                SELECT SUM(
                                    pi.amount_paid
                                )
                                FROM payment_items pi
                                JOIN payments p
                                    ON p.payment_id =
                                       pi.payment_id
                                WHERE
                                    pi.invoice_id =
                                    i.invoice_id
                            ),
                            0
                        ) AS paid_amount

                    FROM invoices i

                    WHERE
                        i.invoice_id = $1

                    FOR UPDATE;
                    `,
                    [invoiceId]
                );


            if (
                invoiceResult.rows.length === 0
            ) {

                await client.query("ROLLBACK");

                return res.status(404).json({
                    success: false,
                    message:
                        `Invoice ${invoiceId} not found.`
                });

            }


            const invoice =
                invoiceResult.rows[0];


            // Invoice must belong to customer

            if (
                Number(invoice.customer_id) !==
                customerId
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        `Invoice ${invoice.invoice_number} does not belong to this customer.`
                });

            }
 
            if (
                invoice.status !== "FINAL"
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        `Invoice ${invoice.invoice_number} is not finalized and cannot receive payment.`
                });

            }


            const invoiceTotal =
                Number(invoice.total_amount) || 0;

            const alreadyPaid =
                Number(invoice.paid_amount) || 0;

            const outstanding =
                Math.max(
                    0,
                    invoiceTotal -
                    alreadyPaid
                );


            if (
                amountPaid >
                outstanding
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        `Payment exceeds the outstanding balance of ${invoice.invoice_number}. Outstanding: Rs ${outstanding.toFixed(2)}.`
                });

            }


            validatedItems.push({

                invoice_id:
                    invoiceId,

                amount_paid:
                    amountPaid

            });

        }

        const paymentResult =
            await client.query(
                `
                INSERT INTO payments
                (
                    customer_id,
                    payment_date,
                    total_amount,
                    payment_references,
                    notes
                )
                VALUES
                ($1, $2, $3, $4, $5)
                RETURNING *;
                `,
                [
                    customerId,
                    payment_date,
                    totalAmount,
                    payment_references ||
                        null,
                    notes || null
                ]
            );


        const payment =
            paymentResult.rows[0];


        for (
            const item of validatedItems
        ) {

            await client.query(
                `
                INSERT INTO payment_items
                (
                    payment_id,
                    invoice_id,
                    amount_paid
                )
                VALUES
                ($1, $2, $3);
                `,
                [
                    payment.payment_id,
                    item.invoice_id,
                    item.amount_paid
                ]
            );

        }


        await client.query("COMMIT");


        res.status(201).json({

            success: true,

            message:
                "Payment recorded successfully.",

            payment_id:
                payment.payment_id

        });


    } catch (error) {

        await client.query("ROLLBACK");

        console.error(
            "Create payment error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to record payment."

        });

    } finally {

        client.release();

    }

});


router.get("/", async (req, res) => {

    try {

        const result =
            await db.query(
                `
                SELECT
                    p.payment_id,
                    p.customer_id,
                    c.company_name,
                    p.payment_date,
                    p.total_amount,
                    p.payment_references,
                    p.notes,
                    p.created_at

                FROM payments p

                JOIN customers c
                    ON c.customer_id =
                       p.customer_id

                ORDER BY
                    p.payment_date DESC,
                    p.payment_id DESC;
                `
            );


        res.json({

            success: true,

            payments:
                result.rows

        });


    } catch (error) {

        console.error(
            "Load payments error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to load payments."

        });

    }

});


module.exports = router;
