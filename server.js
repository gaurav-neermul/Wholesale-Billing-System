const path = require("path");
const customerRoutes = require("./routes/customers");
const productRoutes = require("./routes/products")
const salesOrderRoutes = require("./routes/salesOrders");
const inventoryRoutes = require("./routes/inventory");
const invoiceRoutes = require("./routes/invoices");
const statementsRoutes = require("./routes/statements");
const paymentsRoutes = require("./routes/payments")
const reportsRoutes = require("./routes/reports");
const dashboardRoutes = require("./routes/dashboard");


const express = require("express"); //importing express library
const db = require("./db") //importing the PostgreSQL connection pool that was exported from db.js
const app = express(); //creating web application
const PORT = process.env.PORT || 3000; // webapp will run on this port
// testing conneection of postgresql
/* db.query("SELECT NOW()")
    .then(() => console.log("✅ PostgreSQL Connected"))
    .catch(err => console.error("❌ Database Connection Failed", err));
*/
//Middleware 
app.use(express.static("public")) //Translates to Express, whenever someone requests a file, first look inside the public folder.
app.use(express.json()) // transaltes to: Express, use the JSON middleware to automatically convert incoming JSON into a JavaScript object.

app.use("/customers", customerRoutes);
// 
app.use("/products", productRoutes)
app.use("/sales-orders", salesOrderRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/statements",statementsRoutes);
app.use("/payments", paymentsRoutes)
app.use("/reports", reportsRoutes);
app.use("/dashboard",dashboardRoutes
);

app.get("/", (req, res) => {
    res.send("Wholesale Billing System is running")
});



// Test Database Connection
/*app.get("/test-db", async (req, res) => {
    try {
        const result = await db.query("SELECT NOW()");
        res.json({
            success: true,
            message: "Database Connected Successfully",
            server_time: result.rows[0].now
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Database Connection Failed"
        });
    }
}); */






app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
});