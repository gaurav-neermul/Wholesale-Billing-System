const express = require("express");
const db = require("../db");

const router = express.Router();


  
router.get("/customers", async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                customer_id,
                company_name,
                company_brn,
                address
            FROM customers
            ORDER BY company_name;
        `);

        res.json({
            success: true,
            customers: result.rows
        });

    } catch (error) {

        console.error(
            "Statement customers error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load customers."
        });

    }

});

 
router.get("/:customerId", async (req, res) => {

    try {

        const customerId =
            Number(req.params.customerId);

        const {
            from,
            to
        } = req.query;
 
        if (!Number.isInteger(customerId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid customer ID."
            });

        }
 
        const customerResult =
            await db.query(
                `
                SELECT
                    customer_id,
                    company_name,
                    company_brn,
                    address
                FROM customers
                WHERE customer_id = $1;
                `,
                [customerId]
            );


        if (
            customerResult.rows.length === 0
        ) {

            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });

        }


        const customer =
            customerResult.rows[0];


       
        const invoiceConditions = [
            "i.customer_id = $1",
            "i.status = 'FINAL'"
        ];

        const paymentConditions = [
            "p.customer_id = $1"
        ];

        const invoiceValues = [
            customerId
        ];

        const paymentValues = [
            customerId
        ];


        let invoiceIndex = 2;
        let paymentIndex = 2;


        if (from) {

            invoiceConditions.push(
                `i.invoice_date >= $${invoiceIndex}`
            );

            invoiceValues.push(from);

            invoiceIndex++;


            paymentConditions.push(
                `p.payment_date >= $${paymentIndex}`
            );

            paymentValues.push(from);

            paymentIndex++;

        }


        if (to) {

            invoiceConditions.push(
                `i.invoice_date <= $${invoiceIndex}`
            );

            invoiceValues.push(to);

            invoiceIndex++;


            paymentConditions.push(
                `p.payment_date <= $${paymentIndex}`
            );

            paymentValues.push(to);

            paymentIndex++;

        }
        const invoiceResult =
            await db.query(
                `
                SELECT
                    i.invoice_id,
                    i.invoice_number,
                    i.invoice_date,
                    i.customer_po_number,
                    i.total_amount

                FROM invoices i

                WHERE
                    ${invoiceConditions.join(" AND ")}

                ORDER BY
                    i.invoice_date ASC,
                    i.invoice_id ASC;
                `,
                invoiceValues
            );


         const paymentResult =
            await db.query(
                `
                SELECT
                    p.payment_id,
                    p.payment_date,
                    p.total_amount,
                    p.payment_references,
                    p.notes

                FROM payments p

                WHERE
                    ${paymentConditions.join(" AND ")}

                ORDER BY
                    p.payment_date ASC,
                    p.payment_id ASC;
                `,
                paymentValues
            );

 
        const transactions = [];


 
        invoiceResult.rows.forEach(
            invoice => {

                transactions.push({

                    transaction_type:
                        "INVOICE",

                    transaction_id:
                        invoice.invoice_id,

                    date:
                        invoice.invoice_date,

                    reference:
                        invoice.invoice_number,

                    po_number:
                        invoice.customer_po_number ||
                        "-",

                    description:
                        "Invoice",

                    debit:
                        Number(
                            invoice.total_amount
                        ) || 0,

                    credit:
                        0

                });

            }
        );


 
        paymentResult.rows.forEach(
            payment => {

                transactions.push({

                    transaction_type:
                        "PAYMENT",

                    transaction_id:
                        payment.payment_id,

                    date:
                        payment.payment_date,

                    reference:
                        payment.payment_references ||
                        `PAY-${String(
                            payment.payment_id
                        ).padStart(4, "0")}`,

                    po_number:
                        "-",

                    description:
                        "Payment Received",

                    debit:
                        0,

                    credit:
                        Number(
                            payment.total_amount
                        ) || 0

                });

            }
        );
 
        transactions.sort(
            (a, b) => {

                const dateDifference =
                    new Date(a.date) -
                    new Date(b.date);

                if (
                    dateDifference !== 0
                ) {

                    return dateDifference;

                }


                // If invoice and payment
                // have same date, invoice first.

                if (
                    a.transaction_type ===
                    b.transaction_type
                ) {

                    return (
                        a.transaction_id -
                        b.transaction_id
                    );

                }


                return (
                    a.transaction_type ===
                    "INVOICE"
                )
                    ? -1
                    : 1;

            }
        );
 
        let runningBalance = 0;


        const statementTransactions =
            transactions.map(
                transaction => {

                    runningBalance +=
                        transaction.debit -
                        transaction.credit;


                    return {

                        ...transaction,

                        balance:
                            runningBalance

                    };

                }
            );
 
        const totalInvoiced =
            statementTransactions.reduce(
                (sum, transaction) =>
                    sum +
                    transaction.debit,
                0
            );


        const totalPaid =
            statementTransactions.reduce(
                (sum, transaction) =>
                    sum +
                    transaction.credit,
                0
            );


        const outstanding =
            runningBalance;

 
        res.json({

            success: true,

            customer,

            transactions:
                statementTransactions,

            summary: {

                total_invoiced:
                    totalInvoiced,

                total_paid:
                    totalPaid,

                outstanding:
                    outstanding

            }

        });


    } catch (error) {

        console.error(
            "Statement error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to generate statement."

        });

    }

});


module.exports = router;