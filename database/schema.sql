  -- 1. CUSTOMERS
 
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,

    company_name VARCHAR(150) NOT NULL,

    company_brn VARCHAR(30),

    address TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_company_name
        UNIQUE (company_name)
);

ALTER TABLE customers
ADD COLUMN phone_number VARCHAR(12);

 -- 2. PRODUCTS
 
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,

    product_name VARCHAR(150) NOT NULL,

    default_price DECIMAL(10,2) NOT NULL DEFAULT 0
        CHECK (default_price >= 0),

    track_inventory BOOLEAN NOT NULL DEFAULT TRUE,

    minimum_stock DECIMAL(10,2) NOT NULL DEFAULT 0
        CHECK (minimum_stock >= 0),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_product_name
        UNIQUE (product_name)
);


 -- 3. CUSTOMER-SPECIFIC PRODUCT PRICES
 
CREATE TABLE customer_prices (
    customer_price_id SERIAL PRIMARY KEY,

    customer_id INT NOT NULL,

    product_id INT NOT NULL,

    custom_price DECIMAL(10,2) NOT NULL
        CHECK (custom_price >= 0),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_price_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id),

    CONSTRAINT fk_customer_price_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    CONSTRAINT unique_customer_product
        UNIQUE (customer_id, product_id)
);


 -- 4. INVENTORY
 
CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,

    product_id INT NOT NULL UNIQUE,

    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0
        CHECK (current_stock >= 0),

    last_stock_in TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);


 -- 5. SALES ORDERS
 
CREATE TABLE sales_orders (
    sales_order_id SERIAL PRIMARY KEY,

    customer_id INT NOT NULL,

    customer_po_number VARCHAR(100),

    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    delivery_date DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'Pending',

    remarks TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sales_order_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
);


 -- 6. SALES ORDER ITEMS
 
CREATE TABLE sales_order_items (
    sales_order_item_id SERIAL PRIMARY KEY,

    sales_order_id INT NOT NULL,

    product_id INT NOT NULL,

    quantity DECIMAL(10,2) NOT NULL
        CHECK (quantity > 0),

    unit_price DECIMAL(10,2) NOT NULL
        CHECK (unit_price >= 0),

    CONSTRAINT fk_sales_order_item_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_orders(sales_order_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sales_order_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);


 -- 7. INVOICES
 
CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,

    invoice_number VARCHAR(20) NOT NULL UNIQUE,

    customer_id INT NOT NULL,

    sales_order_id INT UNIQUE,

    invoice_date DATE NOT NULL,

    delivery_date DATE,

    customer_po_number VARCHAR(100),

    status VARCHAR(20) NOT NULL
        CHECK (
            status IN (
                'DRAFT',
                'FINAL',
                'CANCELLED'
            )
        ),

    revision_number INT NOT NULL DEFAULT 1
        CHECK (revision_number >= 1),

    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0
        CHECK (total_amount >= 0),

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invoice_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id),

    CONSTRAINT fk_invoice_sales_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_orders(sales_order_id)
);


 -- 8. INVOICE ITEMS
 
CREATE TABLE invoice_items (
    invoice_item_id SERIAL PRIMARY KEY,

    invoice_id INT NOT NULL,

    product_id INT NOT NULL,

    product_name VARCHAR(150) NOT NULL,

    quantity DECIMAL(10,2) NOT NULL
        CHECK (quantity > 0),

    unit_price DECIMAL(10,2) NOT NULL
        CHECK (unit_price >= 0),

    line_total DECIMAL(10,2) NOT NULL
        CHECK (line_total >= 0),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invoice_item_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(invoice_id),

    CONSTRAINT fk_invoice_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    CONSTRAINT unique_invoice_product
        UNIQUE (invoice_id, product_id)
);


 -- 9. PAYMENTS
 
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,

    customer_id INT NOT NULL,

    payment_date DATE NOT NULL,

    total_amount DECIMAL(10,2) NOT NULL
        CHECK (total_amount > 0),

    payment_references VARCHAR(100),

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
);


 -- 10. PAYMENT ITEMS
 
CREATE TABLE payment_items (
    payment_item_id SERIAL PRIMARY KEY,

    payment_id INT NOT NULL,

    invoice_id INT NOT NULL,

    amount_paid DECIMAL(10,2) NOT NULL
        CHECK (amount_paid > 0),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_item_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(payment_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payment_item_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(invoice_id),

    CONSTRAINT unique_payment_invoice
        UNIQUE (payment_id, invoice_id)
);


 -- INDEXES
 
CREATE INDEX idx_customers_active
    ON customers(is_active);

CREATE INDEX idx_products_active
    ON products(is_active);

CREATE INDEX idx_customer_prices_customer
    ON customer_prices(customer_id);

CREATE INDEX idx_customer_prices_product
    ON customer_prices(product_id);

CREATE INDEX idx_inventory_product
    ON inventory(product_id);

CREATE INDEX idx_sales_orders_customer
    ON sales_orders(customer_id);

CREATE INDEX idx_sales_orders_date
    ON sales_orders(order_date);

CREATE INDEX idx_sales_order_items_order
    ON sales_order_items(sales_order_id);

CREATE INDEX idx_sales_order_items_product
    ON sales_order_items(product_id);

CREATE INDEX idx_invoices_customer
    ON invoices(customer_id);

CREATE INDEX idx_invoices_sales_order
    ON invoices(sales_order_id);

CREATE INDEX idx_invoices_date
    ON invoices(invoice_date);

CREATE INDEX idx_invoices_status
    ON invoices(status);

CREATE INDEX idx_invoice_items_invoice
    ON invoice_items(invoice_id);

CREATE INDEX idx_invoice_items_product
    ON invoice_items(product_id);

CREATE INDEX idx_payments_customer
    ON payments(customer_id);

CREATE INDEX idx_payments_date
    ON payments(payment_date);

CREATE INDEX idx_payment_items_payment
    ON payment_items(payment_id);

CREATE INDEX idx_payment_items_invoice
    ON payment_items(invoice_id);


 
 

 

CREATE UNIQUE INDEX unique_customer_po
    ON sales_orders(customer_po_number)
    WHERE customer_po_number IS NOT NULL;


 - 



 -- wipe data:

-- BEGIN;

-- TRUNCATE TABLE
--     payment_items,
--     payments,
--     invoice_items,
--     invoices,
--     sales_order_items,
--     sales_orders,
--     customer_prices,
--     inventory,
--     customers,
--     products
-- RESTART IDENTITY;

-- COMMIT;
