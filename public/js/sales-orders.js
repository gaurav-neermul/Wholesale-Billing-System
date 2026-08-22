const pendingOrdersCount = document.getElementById("pendingOrdersCount");
const invoicedOrdersCount = document.getElementById("invoicedOrdersCount");
const totalOrdersCount = document.getElementById("totalOrdersCount");

const salesOrdersContainer = document.getElementById("salesOrdersContainer");
const customerFilter = document.getElementById("customerFilter");
const statusFilter = document.getElementById("statusFilter");
const searchSalesOrder = document.getElementById("searchSalesOrder");

const addSalesOrderForm = document.getElementById("addSalesOrderForm");
const customer = document.getElementById("customer");
const customerPo = document.getElementById("customerPo");
const remarks = document.getElementById("remarks");

const product = document.getElementById("product");
const quantity = document.getElementById("quantity");
const unitPrice = document.getElementById("unitPrice");

const viewSalesOrderModal = document.getElementById("viewSalesOrderModal");
const viewModal = new bootstrap.Modal(viewSalesOrderModal);
const viewCustomer = document.getElementById("viewCustomer");
const viewStatus = document.getElementById("viewStatus");
const viewCustomerPo = document.getElementById("viewCustomerPo");
const viewOrderDate = document.getElementById("viewOrderDate");
const viewRemarks = document.getElementById("viewRemarks");
const viewItemsTableBody = document.getElementById("viewItemsTableBody");
const viewGrandTotal = document.getElementById("viewGrandTotal");

const addItemBtn = document.getElementById("addItemBtn");
const orderItemsTableBody = document.getElementById("orderItemsTableBody");
const grandTotal = document.getElementById("grandTotal");

const addSalesOrderModal = document.getElementById("addSalesOrderModal");
const modal = new bootstrap.Modal(addSalesOrderModal);

const deleteSalesOrderModal = document.getElementById("deleteSalesOrderModal");
const generateInvoiceModal =
    document.getElementById("generateInvoiceModal");

const generateInvoiceConfirmModal =
    new bootstrap.Modal(generateInvoiceModal);

const confirmGenerateInvoiceBtn =
    document.getElementById("confirmGenerateInvoiceBtn");

let selectedInvoiceSalesOrderId = null;
const deleteModal = new bootstrap.Modal(deleteSalesOrderModal);
const deliveryDate = document.getElementById("deliveryDate");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

let selectedSalesOrderId = null;
let editingSalesOrderId = null;
// searchSalesOrder.addEventListener("input", searchSalesOrders);
addSalesOrderForm.addEventListener("submit", addSalesOrder);
addItemBtn.addEventListener("click", addItem);
product.addEventListener("change", loadDefaultPrice);
customerFilter.addEventListener("change", filterSalesOrders);
statusFilter.addEventListener("change", filterSalesOrders);
searchSalesOrder.addEventListener("input", filterSalesOrders);
document.addEventListener("click", openDeleteModal);
document.addEventListener("click", openEditSalesOrder);
confirmDeleteBtn.addEventListener("click", deleteSalesOrder);
confirmGenerateInvoiceBtn.addEventListener(
    "click",
    confirmGenerateInvoice
);
document.addEventListener("click", openViewSalesOrder)

salesOrdersContainer.addEventListener("click", generateInvoice);

const MESSAGES = {
    LOAD_ERROR: "Unable to load sales orders.",
    CREATE_SUCCESS: "Sales order created successfully.",
    CREATE_ERROR: "Unable to create sales order."
};

let salesOrders = [];
let customers = [];
let products = [];
let orderItems = [];

function formatDate(value) {
    if (!value) return "-";

    const datePart = String(value).split("T")[0];
    const [year, month, day] = datePart.split("-");

    if (!year || !month || !day) return "-";

    return `${day}/${month}/${year}`;
}

function updateDashboardCards() {

    pendingOrdersCount.textContent =
        salesOrders.filter(
            order => order.status === "Pending"
        ).length;

    invoicedOrdersCount.textContent =
        salesOrders.filter(
            order => order.status === "Invoiced"
        ).length;



    totalOrdersCount.textContent =
        salesOrders.length;

}


async function loadCustomers() {

    try {

        const response = await fetch("/customers");

        if (!response.ok) {
            throw new Error("Unable to load customers.");
        }

        customers = await response.json();

        customer.innerHTML = `
            <option value="">
                Select Customer
            </option>
        `;

        customerFilter.innerHTML = `
            <option value="">
                All Customers
            </option>
        `;

        // Only ACTIVE customers can be used in sales orders
        const activeCustomers =
            customers.filter(item => item.is_active === true);

        activeCustomers.forEach(item => {

            customer.innerHTML += `
                <option value="${item.customer_id}">
                    ${item.company_name}
                </option>
            `;

            customerFilter.innerHTML += `
                <option value="${item.company_name}">
                    ${item.company_name}
                </option>
            `;

        });

    } catch (error) {

        showToast(error.message, "danger");

    }

}

async function loadProducts() {

    try {

        const response = await fetch("/products");

        if (!response.ok) {
            throw new Error("Unable to load products.");
        }

        products = await response.json();

        product.innerHTML = `
            <option value="">
                Select Product
            </option>
        `;

        // Only ACTIVE products can be used in sales orders
        const activeProducts =
            products.filter(item => item.is_active === true);

        activeProducts.forEach(item => {

            product.innerHTML += `
                <option
                    value="${item.product_id}"
                    data-price="${item.default_price}">

                    ${item.product_name}

                </option>
            `;

        });

    } catch (error) {

        showToast(error.message, "danger");

    }

}


async function loadSalesOrders() {

    salesOrdersContainer.innerHTML = `
    <div class="col-12">

        <div class="alert alert-light text-center">

            Loading sales orders...

        </div>

    </div>
`;

    try {

        const response = await fetch("/sales-orders");

        if (!response.ok) {
            throw new Error(MESSAGES.LOAD_ERROR);
        }

        salesOrders = await response.json();
        updateDashboardCards();

        //displaySalesOrders(salesOrders);
        filterSalesOrders();

    } catch (error) {

        salesOrdersContainer.innerHTML = `
    <div class="col-12">

        <div class="alert alert-danger text-center">

            ${error.message}

        </div>

    </div>
`;

        showToast(error.message, "danger");

    }

}

function loadDefaultPrice() {

    const selectedOption =
        product.options[product.selectedIndex];

    unitPrice.value =
        selectedOption.dataset.price || "";

}

function addItem() {

    if (
        product.value === "" ||
        quantity.value === "" ||
        unitPrice.value === ""
    ) {
        showToast("Complete all product details.", "danger");
        return;
    }

    const selectedProduct = products.find(
        item => item.product_id === Number(product.value)
    );

    if (!selectedProduct) {

        showToast(
            "Selected product is not available.",
            "danger"
        );

        return;
    }

    if (!selectedProduct.is_active) {

        showToast(
            "This product is inactive and cannot be added to a sales order.",
            "danger"
        );

        return;
    }

    if (Number(quantity.value) <= 0) {
        showToast("Quantity must be greater than zero.", "danger");
        return;
    }

    if (Number(unitPrice.value) < 0) {
        showToast("Invalid unit price.", "danger");
        return;
    }
    orderItems.push({
        product_id: Number(product.value),
        product_name: selectedProduct.product_name,
        quantity: Number(quantity.value),
        unit_price: Number(unitPrice.value)
    });

    renderOrderItems();

    product.selectedIndex = 0;
    // product.value = "";
    quantity.value = "";
    unitPrice.value = "";

}

function renderOrderItems() {

    let rows = "";

    let total = 0;

    orderItems.forEach((item, index) => {

        const lineTotal =
            item.quantity * item.unit_price;

        total += lineTotal;

        rows += `
            <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>Rs ${item.unit_price.toFixed(2)}</td>
                <td>Rs ${lineTotal.toFixed(2)}</td>
                <td>
                    <button
                        class="btn btn-sm btn-danger"
                        onclick="removeItem(${index})">

                        <i class="bi bi-trash"></i>

                    </button>
                </td>
            </tr>
        `;

    });

    orderItemsTableBody.innerHTML = rows;

    grandTotal.textContent =
        `Rs ${total.toFixed(2)}`;

}

function removeItem(index) {

    orderItems.splice(index, 1);

    renderOrderItems();

}

function displaySalesOrders(salesOrders) {

    if (salesOrders.length === 0) {

        salesOrdersContainer.innerHTML = `
            <div class="col-12">

                <div class="alert alert-light border text-center shadow-sm">

                    No sales orders found.

                </div>

            </div>
        `;

        return;

    }

    let cards = "";

    salesOrders.forEach(order => {

        const badgeClass =
            order.status === "Pending"
                ? "warning"
                : order.status === "Invoiced"
                    ? "success"
                    : "secondary";

        const cardClass =
            order.status === "Pending"
                ? "pending-card"
                : order.status === "Invoiced"
                    ? "invoiced-card"
                    : "cancelled-card";

        cards += `

            <div class="col-lg-6 col-xl-6 mb-4">

                <div class="card sales-order-card ${cardClass} border-0 shadow h-100">

                    <div class="card-body d-flex flex-column">

                        <div class="d-flex justify-content-between align-items-center mb-4">

                            <h4 class="fw-bold mb-0">

                                SO-${order.sales_order_id}

                            </h4>

                            <span class="badge rounded-pill bg-${badgeClass} px-3 py-2">

                                ${order.status}

                            </span>

                        </div>

                        <div class="table-responsive mb-4">

                            <table class="table table-borderless table-sm align-middle mb-0">

                                <tbody>

                                    <tr>

                                        <td class="text-muted" style="width:170px;">

                                            <i class="bi bi-person me-2"></i>

                                            Customer

                                        </td>

                                        <td class="fw-semibold">

                                            ${order.company_name}

                                        </td>

                                    </tr>

                                    <tr>

                                        <td class="text-muted">

                                            <i class="bi bi-file-earmark-text me-2"></i>

                                            PO Number

                                        </td>

                                        <td>

                                            ${order.customer_po_number || "-"}

                                        </td>

                                    </tr>

                                    <tr>

                                        <td class="text-muted">

                                            <i class="bi bi-calendar-event me-2"></i>

                                            Order Date

                                        </td>

                                        <td>

                                            ${formatDate(order.order_date)}

                                        </td>

                                    </tr>

                                    <tr>

                                        <td class="text-muted">

                                            <i class="bi bi-truck me-2"></i>

                                            Delivery Date

                                        </td>

                                        <td>

                          ${formatDate(order.delivery_date)}

                                        </td>

                                    </tr>

                                </tbody>

                            </table>

                        </div>

                        <div class="border-top pt-3 mt-auto">

                            <div class="d-flex justify-content-end gap-2 flex-wrap">

                                <button
                                    class="btn btn-outline-primary btn-sm view-btn"
                                    data-id="${order.sales_order_id}">

                                    <i class="bi bi-eye me-1"></i>

                                    View

                                </button>

                                <button
                                    class="btn btn-outline-warning btn-sm edit-btn"
                                    data-id="${order.sales_order_id}">

                                    <i class="bi bi-pencil-square me-1"></i>

                                    Edit

                                </button>

                                <button
                                    class="btn btn-success btn-sm convert-btn"
                                    data-id="${order.sales_order_id}">

                                    <i class="bi bi-receipt me-1"></i>

                                    Invoice

                                </button>

                                <button
                                    class="btn btn-outline-danger btn-sm delete-btn"
                                    data-id="${order.sales_order_id}">

                                    <i class="bi bi-trash me-1"></i>

                                    Delete

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        `;

    });

    salesOrdersContainer.innerHTML = cards;

}

/*function searchSalesOrders() {

    const searchText =
        searchSalesOrder.value
            .toLowerCase()
            .trim();

    const filteredOrders =
        salesOrders.filter(order =>

            order.company_name
                .toLowerCase()
                .includes(searchText)

            ||

            (order.customer_po_number || "")
                .toLowerCase()
                .includes(searchText)

        );

    displaySalesOrders(filteredOrders);

} */

function filterSalesOrders() {

    const searchText =
        searchSalesOrder.value
            .toLowerCase()
            .trim();

    const selectedCustomer =
        customerFilter.value;

    const selectedStatus =
        statusFilter.value;

    const filteredOrders =
        salesOrders.filter(order => {

            const matchesSearch =

                order.company_name
                    .toLowerCase()
                    .includes(searchText)

                ||

                (order.customer_po_number || "")
                    .toLowerCase()
                    .includes(searchText);

            const matchesCustomer =

                selectedCustomer === ""

                ||

                order.company_name === selectedCustomer;

            const matchesStatus =

                selectedStatus === ""

                ||

                order.status === selectedStatus;

            return (
                matchesSearch &&
                matchesCustomer &&
                matchesStatus);

        });

    displaySalesOrders(filteredOrders);

}

async function addSalesOrder(event) {

    event.preventDefault();

    if (orderItems.length === 0) {

        showToast("Add at least one product.", "danger");

        return;

    }

    const salesOrder = {

        customer_id: Number(customer.value),

        customer_po_number: customerPo.value.trim(),

        delivery_date: deliveryDate.value,

        remarks: remarks.value.trim(),

        items: orderItems

    };

    try {

        const isEditing = editingSalesOrderId !== null;

        const response = await fetch(

            isEditing
                ? `/sales-orders/${editingSalesOrderId}`
                : "/sales-orders",

            {

                method: isEditing ? "PUT" : "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(salesOrder)

            }

        );

        const result = await response.json();

        if (!response.ok) {

            throw new Error(result.message);

        }

        showToast(

            result.message,

            "success"

        );

        modal.hide();

        addSalesOrderForm.reset();

        orderItems = [];

        renderOrderItems();

        editingSalesOrderId = null;

        document.querySelector(
            "#addSalesOrderModal .modal-title"
        ).textContent = "New Sales Order";

        saveSalesOrderBtn.textContent =
            "Create Sales Order";

        loadSalesOrders();

    }

    catch (error) {

        showToast(error.message, "danger");

    }

}

function openDeleteModal(event) {

    const button =
        event.target.closest(".delete-btn");

    if (!button) {
        return;
    }

    selectedSalesOrderId =
        Number(button.dataset.id);

    deleteModal.show();

}

async function deleteSalesOrder() {

    try {

        const response = await fetch(
            `/sales-orders/${selectedSalesOrderId}`,
            {
                method: "DELETE"
            }
        );

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        deleteModal.hide();

        showToast(result.message, "success");

        loadSalesOrders();

    } catch (error) {

        showToast(error.message, "danger");

    }

}

addSalesOrderModal.addEventListener("hidden.bs.modal", () => {

    editingSalesOrderId = null;

    addSalesOrderForm.reset();

    orderItems = [];

    renderOrderItems();

    document.querySelector(
        "#addSalesOrderModal .modal-title"
    ).textContent = "New Sales Order";

    saveSalesOrderBtn.textContent =
        "Create Sales Order";

});
async function openEditSalesOrder(event) {

    const button = event.target.closest(".edit-btn");

    if (!button) {
        return;
    }

    try {

        const response = await fetch(
            `/sales-orders/${button.dataset.id}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        editingSalesOrderId = button.dataset.id;

        customer.value = result.salesOrder.customer_id;

        customerPo.value =
            result.salesOrder.customer_po_number ?? "";

        deliveryDate.value =
            result.salesOrder.delivery_date
                ? result.salesOrder.delivery_date.split("T")[0]
                : "";

        remarks.value =
            result.salesOrder.remarks ?? "";

        orderItems = result.items.map(item => ({

            product_id: item.product_id,

            product_name: item.product_name,

            quantity: Number(item.quantity),

            unit_price: Number(item.unit_price)

        }));

        renderOrderItems();

        document.querySelector(
            "#addSalesOrderModal .modal-title"
        ).textContent = "Edit Sales Order";

        saveSalesOrderBtn.textContent =
            "Update Sales Order";

        modal.show();

    } catch (error) {

        showToast(error.message, "danger");

    }

}

async function openViewSalesOrder(event) {

    const button = event.target.closest(".view-btn");

    if (!button) {
        return;
    }

    try {

        const response = await fetch(
            `/sales-orders/${button.dataset.id}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        const order = result.salesOrder;

        viewCustomer.textContent =
            order.company_name;

        viewStatus.textContent =
            order.status;

        viewCustomerPo.textContent =
            order.customer_po_number || "-";

        viewOrderDate.textContent =
            formatDate(order.order_date);

        viewDeliveryDate.textContent =
            formatDate(order.delivery_date);
        viewRemarks.textContent =
            order.remarks || "-";

        let rows = "";

        let grandTotal = 0;

        result.items.forEach(item => {

            const lineTotal =
                Number(item.quantity) *
                Number(item.unit_price);

            grandTotal += lineTotal;

            rows += `
                <tr>

                    <td>${item.product_name}</td>

                    <td>${item.quantity}</td>

                    <td>Rs ${Number(item.unit_price).toFixed(2)}</td>

                    <td>Rs ${lineTotal.toFixed(2)}</td>

                </tr>
            `;

        });

        viewItemsTableBody.innerHTML = rows;

        viewGrandTotal.textContent =
            `Rs ${grandTotal.toFixed(2)}`;

        viewModal.show();

    } catch (error) {

        showToast(error.message, "danger");

    }

}
function generateInvoice(event) {

    const button =
        event.target.closest(".convert-btn");

    if (!button) {
        return;
    }

    selectedInvoiceSalesOrderId =
        Number(button.dataset.id);

    generateInvoiceConfirmModal.show();

}

async function confirmGenerateInvoice() {

    if (!selectedInvoiceSalesOrderId) {
        return;
    }

    confirmGenerateInvoiceBtn.disabled = true;

    confirmGenerateInvoiceBtn.innerHTML = `
        <span
            class="spinner-border spinner-border-sm me-1"
            role="status"
            aria-hidden="true">
        </span>

        Generating...
    `;

    try {

        const response =
            await fetch(
                `/sales-orders/${selectedInvoiceSalesOrderId}/generate-invoice`,
                {
                    method: "POST"
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to generate invoice."
            );

        }

        generateInvoiceConfirmModal.hide();

        showToast(
            result.message,
            "success"
        );

        selectedInvoiceSalesOrderId = null;

        await loadSalesOrders();

    } catch (error) {

        generateInvoiceConfirmModal.hide();

        showToast(
            error.message,
            "danger"
        );

    } finally {

        confirmGenerateInvoiceBtn.disabled = false;

        confirmGenerateInvoiceBtn.innerHTML = `
            <i class="bi bi-receipt me-1"></i>

            Generate Invoice
        `;

    }

}

loadCustomers();
loadProducts();
loadSalesOrders();
