# WBS — Wholesale Billing System

WBS (Wholesale Billing System) is a web-based wholesale billing and distribution management application built around the day-to-day flow of customers, products, sales orders, invoices, inventory, payments, statements of account, and business reports.

The system is designed to connect these operations instead of treating them as separate CRUD screens.

## Table of Contents

- [Overview](#overview)
- [Core Workflow](#core-workflow)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Database Design](#database-design)
- [Module Details](#module-details)
- [Invoice and Inventory Workflow](#invoice-and-inventory-workflow)
- [Payments and Receivables](#payments-and-receivables)
- [Statements of Account](#statements-of-account)
- [Reports](#reports)
- [Dashboard](#dashboard)
- [API Routes](#api-routes)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Data Reset](#data-reset)
- [Git and Sensitive Files](#git-and-sensitive-files)
- [Important Design Decisions](#important-design-decisions)
- [Current Limitations](#current-limitations)
- [Future Improvements](#future-improvements)


## Overview

WBS is intended for a wholesale distribution business that needs to manage the complete sales and billing lifecycle.

The central workflow is:

```text
Customer
   ↓
Sales Order
   ↓
Draft Invoice
   ↓
Final Invoice
   ↓
Payment
   ↓
Statement of Account
```

Inventory is connected to the invoice lifecycle:

```text
Product
   ↓
Inventory / Stock
   ↓
Sales Order
   ↓
Invoice Finalization
   ↓
Stock Validation
   ↓
Stock Deduction
```

The application also provides a dashboard and reporting layer for monitoring business activity.

## Core Workflow

A typical transaction in WBS works as follows:

1. A customer is created or selected.
2. Products are created with their default prices and inventory settings.
3. Stock is added for products that use inventory tracking.
4. A sales order is created for the customer.
5. Products, quantities, and unit prices are added to the order.
6. The sales order is converted into a draft invoice.
7. The draft invoice can be reviewed and edited.
8. The invoice is finalized.
9. For inventory-tracked products, WBS validates stock and deducts the invoiced quantities.
10. A payment is recorded and allocated to finalized invoices.
11. The customer's Statement of Account reflects finalized invoices and payments.
12. Dashboard and report data can be used to monitor the business.

## Features

### Customer Management

- Create customers.
- Edit customer information.
- Search customers.
- Activate or deactivate customers.
- Store company name, BRN, and address.
- Prevent inactive customers from being used for new sales orders.

### Product Management

- Create products.
- Edit products.
- Search products.
- Activate or deactivate products.
- Configure a default selling price.
- Configure whether inventory is tracked.
- Configure a minimum stock level.
- Automatically create an inventory record when inventory tracking is enabled.

### Inventory Management

- View active inventory records.
- Add stock through stock-in operations.
- Adjust the current stock level.
- Prevent negative stock values.
- Track the last stock-in timestamp.
- Identify low-stock and out-of-stock products.
- Prevent stock operations on products where inventory tracking is disabled.

### Sales Orders

- Create sales orders.
- Edit sales orders.
- View order details.
- Delete sales orders where the current workflow permits it.
- Select active customers.
- Select active products.
- Store customer PO numbers.
- Store delivery dates.
- Store remarks.
- Add multiple products to an order.
- Calculate item totals on the frontend.
- Generate an invoice from a sales order.

### Invoices

- List invoices.
- View invoice details.
- Print invoices.
- Edit draft invoices.
- Track invoice revision numbers.
- Generate draft invoices from sales orders.
- Finalize invoices.
- Prevent finalized invoices from being edited or deleted.
- Validate inventory during finalization.
- Deduct inventory during finalization.

Invoice statuses are:

```text
DRAFT
FINAL
CANCELLED
```

The current application does not implement a complete invoice cancellation workflow; `CANCELLED` exists in the database status definition and reporting filters.

### Payments

- Load customers.
- Load finalized invoices for a selected customer.
- Display invoice total, paid amount, and outstanding amount.
- Record customer payments.
- Allocate one payment across multiple invoices.
- Validate that allocations equal the payment amount.
- Prevent payments against draft invoices.
- Prevent payments against invoices belonging to another customer.
- Prevent payments greater than an invoice's outstanding balance.

### Statements of Account

- Select a customer.
- Optionally filter by a date range.
- Include finalized invoices as debits.
- Include customer payments as credits.
- Sort transactions chronologically.
- Calculate a running balance.
- Calculate total invoiced.
- Calculate total paid.
- Calculate outstanding balance.
- Print the statement.

### Reports

The reporting module provides:

- Sales reports.
- Invoice reports.
- Payment reports.
- Receivables reports.
- Inventory reports.
- Top-products reports.

Reports support relevant filters such as date ranges, customer selection, invoice status, inventory status, and product limits depending on the report.

### Dashboard

The dashboard provides an operational overview including:

- Today's sales.
- Current month's sales.
- Today's invoices.
- Total finalized invoices.
- Today's payments.
- Current month's payments.
- Outstanding receivables.
- Number of customers owing money.
- Active and inactive customers.
- Active and inactive products.
- Low-stock products.
- Out-of-stock products.
- Total tracked stock.
- Pending sales orders.
- Invoiced sales orders.
- A seven-day sales chart.
- Top products.
- Recent invoices.
- Recent payments.
- Recent sales orders.

## Architecture

WBS uses a simple client-server architecture.

```text
┌─────────────────────────────┐
│        Browser / UI         │
│ HTML + CSS + JavaScript     │
│ Bootstrap + Chart.js        │
└──────────────┬──────────────┘
               │ HTTP / JSON
               ▼
┌─────────────────────────────┐
│       Node.js + Express     │
│        REST-style API       │
└──────────────┬──────────────┘
               │ SQL
               ▼
┌─────────────────────────────┐
│          PostgreSQL         │
│ Relational data + constraints│
└─────────────────────────────┘
```

`server.js` initializes Express, serves the `public` directory, enables JSON request parsing, and mounts the route modules.

`db.js` creates the PostgreSQL connection pool using environment variables loaded with `dotenv`.

## Project Structure

```text
WBS/
├── database/
│   ├── schema.sql
│   
│
├── public/
│   ├── css/
│   │   ├── style.css
│   │   ├── toast.css
│   │   └── print-invoice.css
│   │
│   ├── images/
│   │   └── logo.jpg
│   │
│   ├── js/
│   │   ├── customers.js
│   │   ├── dashboard.js
│   │   ├── inventory.js
│   │   ├── invoices.js
│   │   ├── payments.js
│   │   ├── print-invoice.js
│   │   ├── products.js
│   │   ├── reports.js
│   │   ├── sales-orders.js
│   │   ├── statements.js
│   │   └── toast.js
│   │
│   └── pages/
│       ├── customers.html
│       ├── dashboard.html
│       ├── inventory.html
│       ├── invoices.html
│       ├── payments.html
│       ├── print-invoice.html
│       ├── products.html
│       ├── reports.html
│       ├── sales-orders.html
│       └── statements.html
│
├── routes/
│   ├── customers.js
│   ├── dashboard.js
│   ├── inventory.js
│   ├── invoices.js
│   ├── payments.js
│   ├── products.js
│   ├── reports.js
│   ├── salesOrders.js
│   └── statements.js
│
├── db.js
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── .env
```

`node_modules/` is created locally by npm and should not be committed.

## Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Bootstrap Icons
- Chart.js

### Backend

- Node.js
- Express.js

### Database

- PostgreSQL
- `pg` Node.js PostgreSQL client

### Configuration

- `dotenv`

## Database Design

The primary schema is maintained in `database/schema.sql`.

### Tables

#### `customers`

Stores customer/company information.

Important fields:

- `customer_id`
- `company_name`
- `company_brn`
- `address`
- `is_active`
- `created_at`
- `updated_at`

`company_name` is unique.

#### `products`

Stores products sold by the business.

Important fields:

- `product_id`
- `product_name`
- `default_price`
- `track_inventory`
- `minimum_stock`
- `is_active`
- `created_at`
- `updated_at`

`product_name` is unique.

#### `customer_prices`

Stores optional customer-specific prices for products.
The table supports negotiated prices through a unique customer/product combination.
The table exists in the database schema, but customer-specific pricing is not currently a primary application workflow.

#### `inventory`
Stores the current inventory record for a tracked product.
Each product can have at most one inventory record because `product_id` is unique.

#### `sales_orders`
Stores customer orders before invoicing.
Important fields include customer, customer PO number, order date, delivery date, status, and remarks.

#### `sales_order_items`
Stores products, quantities, and unit prices belonging to a sales order.
Sales-order items use `ON DELETE CASCADE` for the parent sales order.

#### `invoices`
Stores billing documents.
Important fields include invoice number, customer, sales order, invoice date, delivery date, customer PO number, status, revision number, total amount, and notes.

The `sales_order_id` is unique, which supports the one-sales-order-to-one-invoice relationship currently used by the application.

#### `invoice_items`
Stores the products and prices captured on an invoice.
The invoice item stores `product_name` as a snapshot alongside the product ID, as well as quantity, unit price, and line total.

#### `payments`
Stores customer payment headers.

#### `payment_items`
Allocates payment amounts to invoices.
This allows a payment to be associated with multiple invoices.

## Database Relationships
```text
customers
   │
   ├───────────────┐
   │               │
   ▼               ▼
sales_orders      invoices
   │               │
   ▼               ▼
sales_order_items invoice_items
   │               │
   └───────┬───────┘
           │
        products
           │
        inventory

customers ───── payments ───── payment_items ───── invoices

customers ───── customer_prices ───── products
```

The database uses primary keys, foreign keys, unique constraints, check constraints, and indexes to protect data integrity and support common lookups.

## Module Details

### Customer API

Mounted at `/customers`.

```text
GET    /customers
POST   /customers
PUT    /customers/:id
PATCH  /customers/:id/status
```

### Product API

Mounted at `/products`.

```text
GET    /products
POST   /products
PUT    /products/:id
PATCH  /products/:id/status
```

### Inventory API

Mounted at `/inventory`.

```text
GET    /inventory
GET    /inventory/:productId
POST   /inventory/:productId/stock-in
PUT    /inventory/:productId
```

The `PUT /inventory/:productId` operation is the stock adjustment operation used by the current system.

### Sales Order API

Mounted at `/sales-orders`.

```text
GET    /sales-orders
POST   /sales-orders
GET    /sales-orders/:id
PUT    /sales-orders/:id
DELETE /sales-orders/:id
POST   /sales-orders/:id/generate-invoice
```

### Invoice API

Mounted at `/invoices`.

```text
GET    /invoices
GET    /invoices/:id
GET    /invoices/:id/print
PUT    /invoices/:id
PUT    /invoices/:id/finalize
DELETE /invoices/:id
```

Only draft invoices can be edited. Finalized invoices cannot be deleted.

### Payment API

Mounted at `/payments`.

```text
GET    /payments/customers
GET    /payments/customers/:customerId/invoices
POST   /payments
GET    /payments
```

### Statement API

Mounted at `/statements`.

```text
GET    /statements/customers
GET    /statements/:customerId
```

The statement endpoint accepts optional `from` and `to` query parameters.

### Report API

Mounted at `/reports`.

```text
GET    /reports/sales
GET    /reports/invoices
GET    /reports/payments
GET    /reports/receivables
GET    /reports/inventory
GET    /reports/top-products
```

### Dashboard API

Mounted at `/dashboard`.

```text
GET    /dashboard
```

## Invoice and Inventory Workflow

This is one of the key business rules in WBS.

### Stage 1 — Generate Invoice

`POST /sales-orders/:id/generate-invoice` converts a sales order into a draft invoice.

The backend:

1. Starts a database transaction.
2. Checks that the sales order exists.
3. Checks that an invoice has not already been generated for the sales order.
4. Loads the sales-order items.
5. Rejects an order with no items.
6. Calculates the invoice total.
7. Generates an invoice number.
8. Creates the invoice with status `DRAFT`.
9. Copies the order items into `invoice_items`.
10. Commits the transaction.

No inventory is deducted at this stage.

### Stage 2 — Review Draft

A draft invoice can be viewed and edited.
Editing increases the invoice revision number and recalculates the invoice total.

### Stage 3 — Finalize Invoice

`PUT /invoices/:id/finalize` commits the billing transaction.

The backend:

1. Starts a transaction.
2. Locks the invoice row.
3. Checks that the invoice exists.
4. Checks that the invoice is still a draft.
5. Loads invoice items and product inventory settings.
6. Locks inventory rows for tracked products.
7. Checks available stock against required quantity.
8. Deducts the sold quantities.
9. Changes the invoice status to `FINAL`.
10. Changes the related sales order status to `Invoiced`.
11. Commits the transaction.

If stock is insufficient or an inventory record is missing, the transaction is rolled back and the invoice is not finalized.
This separation is deliberate: generating a draft document does not commit the physical stock movement; finalization does.

## Payments and Receivables

Payments are linked to customers and allocated to finalized invoices.
Before a payment is saved, the backend verifies:

- The customer exists.
- The payment amount is greater than zero.
- At least one invoice allocation exists.
- Every allocation has a valid invoice ID.
- Every allocation amount is greater than zero.
- Allocation total equals the payment total.
- Each invoice belongs to the selected customer.
- Each invoice is `FINAL`.
- The payment does not exceed the invoice's outstanding balance.

Payment creation is performed inside a database transaction.
Outstanding invoice balance is calculated as:

```text
Invoice Total - Payments Allocated to Invoice
```

Receivables reports use finalized invoices and recorded customer payments to calculate outstanding balances.

## Statements of Account

The Statement of Account endpoint builds a chronological transaction list from:

- Finalized invoices.
- Customer payments.

Invoices appear as debits.

Payments appear as credits.

The running balance is calculated as:

```text
Previous Balance + Debit - Credit
```

The statement summary includes:

- Total invoiced.
- Total paid.
- Outstanding balance.

The endpoint supports optional date filtering through `from` and `to`.

## Reports

### Sales Report

Reports finalized sales grouped by customer.

Filters:

- From date.
- To date.
- Customer.

Outputs include invoice count and total sales.

### Invoice Report

Lists invoices and supports:

- From date.
- To date.
- Customer.
- Status.

### Payment Report

Reports recorded customer payments with date and customer filters.

### Receivables Report

Shows customers with outstanding balances.

It calculates:

```text
Outstanding = Finalized Invoices - Payments
```

### Inventory Report

Reports tracked products and supports stock status filters:

```text
LOW
OUT
IN_STOCK
```

### Top Products Report

Ranks products by quantity sold using finalized invoice items.

An optional date range and product limit can be supplied.

## Dashboard

The dashboard API aggregates information from multiple tables rather than storing a separate dashboard dataset.

It calculates current operational metrics directly from invoices, payments, customers, products, inventory, and sales orders.

The seven-day sales chart uses finalized invoices only.

Top products are also based on finalized invoice items.

Recent activity displays the latest invoices, payments, and sales orders.

## Installation and Setup

### Requirements

Install the following before running WBS:

- Node.js
- npm
- PostgreSQL
- A PostgreSQL database client such as pgAdmin

### 1. Clone or copy the repository

```bash
git clone <repository-url>
cd wholesale-distribution-and-customer-billing-management-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the database

Create a PostgreSQL database for WBS.

Run the tracked schema file:

```text
database/schema.sql
```

The schema creates the application's tables, constraints, indexes, and relationships.

### 4. Configure `.env`

Create a local `.env` file containing the PostgreSQL connection settings.

### 5. Start WBS

The project does not currently define an `npm start` script. Start the application directly with:

```bash
node server.js
```

The default port is `3000`, unless `PORT` is defined in the environment.

Open:

```text
http://localhost:3000/pages/dashboard.html
```

## Environment Variables

The PostgreSQL connection pool reads these variables:

```text
DB_USER=your_database_user
DB_HOST=your_database_host
DB_NAME=your_database_name
DB_PASSWORD=your_database_password
DB_PORT=5432
PORT=3000
```

Do not commit real credentials.

## Database Setup

The tracked database definition is:

```text
database/schema.sql
```



If a clean test database is needed, run the schema first and then populate the system through the application.

## Data Reset

For development/testing, all transactional and master data can be wiped while keeping the database structure.

Use the following carefully:

```sql
BEGIN;

TRUNCATE TABLE
    payment_items,
    payments,
    invoice_items,
    invoices,
    sales_order_items,
    sales_orders,
    customer_prices,
    inventory,
    customers,
    products
RESTART IDENTITY;

COMMIT;
```

This removes records and resets serial IDs. It does not drop the tables.

Do not run this against a production database unless a complete data wipe is intentionally required.

## Git and Sensitive Files

The repository ignores:

```gitignore
.env
node_modules/
```

`database/schema.sql` remains tracked because it is the clean database definition for the project.



`.env` must remain local because it can contain database credentials.

## Important Design Decisions

### No separate manual stock-out module

WBS does not use a standalone manual stock-out workflow.
Normal stock reduction occurs when a tracked-product invoice is finalized.
Manual corrections are handled through the inventory adjustment operation.

### Draft versus final invoice

Invoice generation and invoice finalization are separate operations.
This allows a draft invoice to be reviewed or edited before stock is committed.

### Customer-specific pricing
The database contains the `customer_prices` table, but customer-specific pricing is not part of the main current application workflow.

### Active and inactive master data
Customers and products are not physically deleted through their normal management screens. They can be marked active or inactive.
Inactive customers and products are blocked from new sales-order use.

### Transactional operations

Operations that modify multiple related records use PostgreSQL transactions where appropriate. This is particularly important for stock changes, sales-order creation/editing, invoice generation/finalization, invoice editing/deletion, and payment recording.

## Current Limitations

WBS is a functional project application, not a finished production ERP.

Known limitations include:

- There is no authentication or role/permission system in the current application.
- There is no automated test suite; `package.json` currently contains a placeholder test command.
- Customer-specific pricing exists in the schema but is not exposed as a complete application feature.
- Sales-order cancellation is not implemented as a dedicated status workflow.
- The database contains an invoice `CANCELLED` status, but the current UI/backend workflow does not provide a complete cancellation process.
- Invoice number generation currently derives the next number from the count of invoices, which is suitable for the current project but is not a robust production-grade numbering strategy under concurrent creation or after deletions.
- The project currently has no dedicated authentication/security layer beyond backend validation and database constraints.
- The system is intended to run with a configured PostgreSQL database and is not packaged as a production deployment.

These limitations should be treated as known scope boundaries rather than hidden features.

## Future Improvements

Potential future work includes:

- Authentication and authorization.
- Different User roles and permissions.
- Customer-specific pricing management.
- Supplier and purchasing management.
- Delivery management.
- More advanced inventory history/audit trails.
- Robust invoice numbering using a sequence or dedicated numbering mechanism.
- Automated tests.
- Production deployment configuration.
- More advanced analytics.
- Additional business automation.

## Project Name

# WBS — Wholesale Billing System

Wholesale billing and distribution management application.


# 📄 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

**Gaurav Neermul**

- **GitHub:** https://github.com/Gaurav-WB
- **LinkedIn:** https://www.linkedin.com/in/gaurav-neermul-ng/

---

# ⭐ Support

If you found this project useful or learned something new, consider giving it a **⭐ Star** on GitHub. Your support helps others discover the project and encourages future development.