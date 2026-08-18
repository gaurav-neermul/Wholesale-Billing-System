const invoicesContainer =
    document.getElementById("invoicesContainer");

const searchInvoice =
    document.getElementById("searchInvoice");

const customerFilter =
    document.getElementById("customerFilter");

const statusFilter =
    document.getElementById("statusFilter");

const draftInvoicesCount =
    document.getElementById("draftInvoicesCount");

const finalInvoicesCount =
    document.getElementById("finalInvoicesCount");

const cancelledInvoicesCount =
    document.getElementById("cancelledInvoicesCount");

const totalInvoicesCount =
    document.getElementById("totalInvoicesCount");

const viewInvoiceModal =
    document.getElementById("viewInvoiceModal");

const editInvoiceModal =
    document.getElementById("editInvoiceModal");

const deleteInvoiceModal =
    document.getElementById("deleteInvoiceModal");
const finalizeInvoiceModal =
    document.getElementById("finalizeInvoiceModal");
const viewModal =
    new bootstrap.Modal(viewInvoiceModal);

const editModal =
    new bootstrap.Modal(editInvoiceModal);

const deleteModal =
    new bootstrap.Modal(deleteInvoiceModal);
const finalizeModal =
    new bootstrap.Modal(finalizeInvoiceModal);
const viewInvoiceNumber =
    document.getElementById("viewInvoiceNumber");

const viewStatus =
    document.getElementById("viewStatus");

const viewCustomer =
    document.getElementById("viewCustomer");

const viewSalesOrder =
    document.getElementById("viewSalesOrder");

const viewCustomerPo =
    document.getElementById("viewCustomerPo");

const viewInvoiceDate =
    document.getElementById("viewInvoiceDate");

const viewDeliveryDate =
    document.getElementById("viewDeliveryDate");

const viewRevision =
    document.getElementById("viewRevision");

const viewNotes =
    document.getElementById("viewNotes");

const viewItemsTableBody =
    document.getElementById("viewItemsTableBody");

const viewGrandTotal =
    document.getElementById("viewGrandTotal");

const editInvoiceForm =
    document.getElementById("editInvoiceForm");

const editInvoiceId =
    document.getElementById("editInvoiceId");

const editCustomer =
    document.getElementById("editCustomer");

const editInvoiceNumber =
    document.getElementById("editInvoiceNumber");

const editCustomerPo =
    document.getElementById("editCustomerPo");

const editDeliveryDate =
    document.getElementById("editDeliveryDate");

const editNotes =
    document.getElementById("editNotes");

const editProduct =
    document.getElementById("editProduct");

const editQuantity =
    document.getElementById("editQuantity");

const editUnitPrice =
    document.getElementById("editUnitPrice");

const addEditItemBtn =
    document.getElementById("addEditItemBtn");

const editInvoiceItemsTableBody =
    document.getElementById("editInvoiceItemsTableBody");

const editInvoiceGrandTotal =
    document.getElementById("editInvoiceGrandTotal");

const confirmDeleteBtn =
    document.getElementById("confirmDeleteBtn");
const confirmFinalizeBtn =
    document.getElementById("confirmFinalizeBtn");
const printInvoiceBtn =
    document.getElementById("printInvoiceBtn");
let invoices = [];
let products = [];
let editInvoiceItems = [];
let selectedInvoiceId = null;
let currentInvoice = null;

const MESSAGES = {

    LOAD_ERROR:
        "Unable to load invoices.",

    VIEW_ERROR:
        "Unable to load invoice.",

    UPDATE_SUCCESS:
        "Invoice updated successfully.",

    UPDATE_ERROR:
        "Unable to update invoice.",

    FINALIZE_SUCCESS:
        "Invoice finalized successfully.",

    FINALIZE_ERROR:
        "Unable to finalize invoice.",

    DELETE_SUCCESS:
        "Invoice deleted successfully.",

    DELETE_ERROR:
        "Unable to delete invoice."

};


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function formatDate(dateValue) {
    if (!dateValue) {
        return "-";
    }

    const value = String(dateValue).split("T")[0];

    const parts = value.split("-");

    if (parts.length !== 3) {
        return value;
    }

    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    return `${day}/${month}/${year}`;
}

function formatDateForInput(dateValue) {
    if (!dateValue) {
        return "";
    }

    return String(dateValue)
        .split("T")[0]
        .split(" ")[0];
}

function formatDateForInput(dateValue) {

    if (!dateValue) {
        return "";
    }

    return String(dateValue)
        .split("T")[0];

}


function formatMoney(value) {

    return `Rs ${Number(value || 0).toFixed(2)}`;

}


function updateDashboardCards() {

    draftInvoicesCount.textContent =
        invoices.filter(
            invoice => invoice.status === "DRAFT"
        ).length;

    finalInvoicesCount.textContent =
        invoices.filter(
            invoice => invoice.status === "FINAL"
        ).length;


    totalInvoicesCount.textContent =
        invoices.length;

}


async function loadProducts() {

    try {

        const response =
            await fetch("/products");

        if (!response.ok) {
            throw new Error(
                "Unable to load products."
            );
        }

        products =
            await response.json();

        editProduct.innerHTML = `
            <option value="">
                Select Product
            </option>
        `;

        products.forEach(product => {

            editProduct.innerHTML += `
                <option
                    value="${product.product_id}"
                    data-price="${product.default_price}">

                    ${escapeHtml(product.product_name)}

                </option>
            `;

        });

    } catch (error) {

        showToast(
            error.message,
            "danger"
        );

    }

}


async function loadInvoices() {

    invoicesContainer.innerHTML = `
        <div class="col-12">

            <div class="alert alert-light text-center">

                Loading invoices...

            </div>

        </div>
    `;

    try {

        const response =
            await fetch("/invoices");

        if (!response.ok) {

            const result =
                await response.json().catch(
                    () => ({})
                );

            throw new Error(
                result.message ||
                MESSAGES.LOAD_ERROR
            );

        }

        invoices =
            await response.json();

        updateDashboardCards();

        loadCustomerFilter();

        filterInvoices();

    } catch (error) {

        invoicesContainer.innerHTML = `
            <div class="col-12">

                <div class="alert alert-danger text-center">

                    ${escapeHtml(error.message)}

                </div>

            </div>
        `;

        showToast(
            error.message,
            "danger"
        );

    }

}


function loadCustomerFilter() {

    const currentValue =
        customerFilter.value;

    const customerNames =
        [
            ...new Set(
                invoices
                    .map(invoice =>
                        invoice.company_name
                    )
                    .filter(Boolean)
            )
        ]
            .sort();

    customerFilter.innerHTML = `
        <option value="">
            All Customers
        </option>
    `;

    customerNames.forEach(customerName => {

        customerFilter.innerHTML += `
            <option value="${escapeHtml(customerName)}">

                ${escapeHtml(customerName)}

            </option>
        `;

    });

    if (
        customerNames.includes(currentValue)
    ) {

        customerFilter.value =
            currentValue;

    }

}


function filterInvoices() {

    const searchText =
        searchInvoice.value
            .toLowerCase()
            .trim();

    const selectedCustomer =
        customerFilter.value;

    const selectedStatus =
        statusFilter.value;

    const filteredInvoices =
        invoices.filter(invoice => {

            const invoiceNumber =
                (
                    invoice.invoice_number ||
                    ""
                )
                    .toLowerCase();

            const companyName =
                (
                    invoice.company_name ||
                    ""
                )
                    .toLowerCase();

            const poNumber =
                (
                    invoice.customer_po_number ||
                    ""
                )
                    .toLowerCase();

            const salesOrder =
                String(
                    invoice.sales_order_id ||
                    ""
                )
                    .toLowerCase();

            const matchesSearch =

                invoiceNumber.includes(searchText)

                ||

                companyName.includes(searchText)

                ||

                poNumber.includes(searchText)

                ||

                salesOrder.includes(searchText);

            const matchesCustomer =

                selectedCustomer === ""

                ||

                invoice.company_name ===
                selectedCustomer;

            const matchesStatus =

                selectedStatus === ""

                ||

                invoice.status ===
                selectedStatus;

            return (
                matchesSearch &&
                matchesCustomer &&
                matchesStatus
            );

        });

    displayInvoices(filteredInvoices);

}


function displayInvoices(invoiceList) {

    if (invoiceList.length === 0) {

        invoicesContainer.innerHTML = `
            <div class="col-12">

                <div class="alert alert-light border text-center shadow-sm">

                    No invoices found.

                </div>

            </div>
        `;

        return;

    }

    let cards = "";

    invoiceList.forEach(invoice => {

        const statusClass =

            invoice.status === "DRAFT"
                ? "warning"

                : invoice.status === "FINAL"
                    ? "success"

                    : "danger";

        const statusText =

            invoice.status === "DRAFT"
                ? "Draft"

                : invoice.status === "FINAL"
                    ? "Final"
                    : "Cancelled";


        cards += `

            <div class="col-lg-6 col-xl-6 mb-4">

                <div class="card sales-order-card border-0 shadow h-100">

                    <div class="card-body d-flex flex-column">

                        <div class="d-flex justify-content-between align-items-center mb-4">

                            <h4 class="fw-bold mb-0">

                                ${escapeHtml(
            invoice.invoice_number
        )}

                            </h4>

                            <span class="badge rounded-pill bg-${statusClass} px-3 py-2">

                                ${statusText}

                            </span>

                        </div>


                        <div class="table-responsive mb-4">

                            <table class="table table-borderless table-sm align-middle mb-0">

                                <tbody>

                                    <tr>

                                        <td
                                            class="text-muted"
                                            style="width:180px;">

                                            <i class="bi bi-person me-2"></i>

                                            Customer

                                        </td>

                                        <td class="fw-semibold">

                                            ${escapeHtml(
            invoice.company_name
        )}

                                        </td>

                                    </tr>


                                    <tr>

                                        <td class="text-muted">

                                            <i class="bi bi-cart-check me-2"></i>

                                            Sales Order

                                        </td>

                                        <td>

                                            ${invoice.sales_order_id
                ? `SO-${invoice.sales_order_id}`
                : "-"
            }

                                        </td>

                                    </tr>


                                    <tr>

                                        <td class="text-muted">

                                            <i class="bi bi-file-earmark-text me-2"></i>

                                            PO Number

                                        </td>

                                        <td>

                                            ${escapeHtml(
                invoice.customer_po_number ||
                "-"
            )}

                                        </td>

                                    </tr>


                                    <tr>

                                        <td class="text-muted">

                                            <i class="bi bi-calendar-event me-2"></i>

                                            Invoice Date

                                        </td>

                                        <td>

                                            ${formatDate(
                invoice.invoice_date
            )}

                                        </td>

                                    </tr>


                                    <tr>

                                        <td class="text-muted">

                                            <i class="bi bi-truck me-2"></i>

                                            Delivery Date

                                        </td>

                                        <td>

                                            ${formatDate(
                invoice.delivery_date
            )}

                                        </td>

                                    </tr>


                                    <tr>

                                        <td class="text-muted">

                                            <i class="bi bi-cash-stack me-2"></i>

                                            Total

                                        </td>

                                        <td class="fw-bold">

                                            ${formatMoney(
                invoice.total_amount
            )}

                                        </td>

                                    </tr>

                                </tbody>

                            </table>

                        </div>


                        <div class="border-top pt-3 mt-auto">

                            <div class="d-flex justify-content-end gap-2 flex-wrap">


                                <button
                                    class="btn btn-outline-primary btn-sm view-invoice-btn"
                                    data-id="${invoice.invoice_id}">

                                    <i class="bi bi-eye me-1"></i>

                                    View

                                </button>


                                ${invoice.status === "DRAFT"

                ?

                `

                                    <button
                                        class="btn btn-outline-warning btn-sm edit-invoice-btn"
                                        data-id="${invoice.invoice_id}">

                                        <i class="bi bi-pencil-square me-1"></i>

                                        Edit

                                    </button>


                                    <button
                                        class="btn btn-success btn-sm finalize-invoice-btn"
                                        data-id="${invoice.invoice_id}">

                                        <i class="bi bi-check-circle me-1"></i>

                                        Finalize

                                    </button>


                                    <button
                                        class="btn btn-outline-danger btn-sm delete-invoice-btn"
                                        data-id="${invoice.invoice_id}">

                                        <i class="bi bi-trash me-1"></i>

                                        Delete

                                    </button>

                                    `

                :

                ""

            }

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        `;

    });

    invoicesContainer.innerHTML =
        cards;

}

function printInvoice() {

    if (!currentInvoice || !currentInvoice.invoice) {

        showToast(
            "No invoice selected.",
            "danger"
        );

        return;
    }

    const invoiceId =
        currentInvoice.invoice.invoice_id;

    window.open(
        `/pages/print-invoice.html?id=${invoiceId}`,
        "_blank"
    );

}

async function openViewInvoice(invoiceId) {

    try {

        const response =
            await fetch(
                `/invoices/${invoiceId}`
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                MESSAGES.VIEW_ERROR
            );

        }

        const invoice =
            result.invoice;

        currentInvoice = {
            invoice,
            items: result.items
        };

        viewInvoiceNumber.textContent =
            invoice.invoice_number || "-";

        viewStatus.textContent =
            invoice.status || "-";

        viewCustomer.textContent =
            invoice.company_name || "-";

        viewSalesOrder.textContent =
            invoice.sales_order_id
                ? `SO-${invoice.sales_order_id}`
                : "-";

        viewCustomerPo.textContent =
            invoice.customer_po_number || "-";

        viewInvoiceDate.textContent =
            formatDate(
                invoice.invoice_date
            );

        viewDeliveryDate.textContent =
            formatDate(
                invoice.delivery_date
            );

        viewRevision.textContent =
            invoice.revision_number || 1;

        viewNotes.textContent =
            invoice.notes || "-";


        let rows = "";

        let total = 0;


        result.items.forEach(item => {

            const quantity =
                Number(item.quantity);

            const unitPrice =
                Number(item.unit_price);

            const lineTotal =
                item.line_total !== undefined &&
                    item.line_total !== null

                    ? Number(item.line_total)

                    : quantity * unitPrice;

            total += lineTotal;


            rows += `

                <tr>

                    <td>

                        ${escapeHtml(
                item.product_name
            )}

                    </td>

                    <td>

                        ${quantity}

                    </td>

                    <td>

                        ${formatMoney(
                unitPrice
            )}

                    </td>

                    <td>

                        ${formatMoney(
                lineTotal
            )}

                    </td>

                </tr>

            `;

        });


        viewItemsTableBody.innerHTML =
            rows;

        viewGrandTotal.textContent =
            formatMoney(
                total
            );

        viewModal.show();

    } catch (error) {

        showToast(
            error.message,
            "danger"
        );

    }

}


async function openEditInvoice(invoiceId) {

    try {

        const response =
            await fetch(
                `/invoices/${invoiceId}`
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                MESSAGES.VIEW_ERROR
            );

        }

        const invoice =
            result.invoice;


        if (invoice.status !== "DRAFT") {

            showToast(
                "Only draft invoices can be edited.",
                "danger"
            );

            return;

        }


        editInvoiceId.value =
            invoice.invoice_id;

        editCustomer.value =
            invoice.company_name || "";

        editInvoiceNumber.value =
            invoice.invoice_number || "";

        editCustomerPo.value =
            invoice.customer_po_number || "";

        editDeliveryDate.value =
            formatDateForInput(
                invoice.delivery_date
            );

        editNotes.value =
            invoice.notes || "";


        editInvoiceItems =
            result.items.map(item => ({

                product_id:
                    Number(item.product_id),

                product_name:
                    item.product_name,

                quantity:
                    Number(item.quantity),

                unit_price:
                    Number(item.unit_price)

            }));


        renderEditInvoiceItems();

        editModal.show();

    } catch (error) {

        showToast(
            error.message,
            "danger"
        );

    }

}


function loadEditProductPrice() {

    const selectedOption =
        editProduct.options[
        editProduct.selectedIndex
        ];

    if (!selectedOption) {
        return;
    }

    editUnitPrice.value =
        selectedOption.dataset.price || "";

}


function addEditItem() {

    const productId =
        editProduct.value;

    const quantityValue =
        Number(editQuantity.value);

    const unitPriceValue =
        Number(editUnitPrice.value);

    if (productId === "") {

        showToast(
            "Select a product.",
            "danger"
        );

        return;

    }

    if (
        !Number.isFinite(quantityValue) ||
        quantityValue <= 0
    ) {

        showToast(
            "Quantity must be greater than zero.",
            "danger"
        );

        return;

    }

    if (
        !Number.isFinite(unitPriceValue) ||
        unitPriceValue < 0
    ) {

        showToast(
            "Enter a valid unit price.",
            "danger"
        );

        return;

    }

    const selectedProduct =
        products.find(
            item =>
                Number(item.product_id) ===
                Number(productId)
        );

    if (!selectedProduct) {

        showToast(
            "Product could not be found.",
            "danger"
        );

        return;

    }

    editInvoiceItems.push({

        product_id:
            Number(selectedProduct.product_id),

        product_name:
            selectedProduct.product_name,

        quantity:
            quantityValue,

        unit_price:
            unitPriceValue

    });

    renderEditInvoiceItems();

    editProduct.value = "";

    editQuantity.value = "";

    editUnitPrice.value = "";

}

function renderEditInvoiceItems() {

    let rows = "";

    let total = 0;


    editInvoiceItems.forEach(
        (item, index) => {

            const lineTotal =
                Number(item.quantity) *
                Number(item.unit_price);

            total += lineTotal;


            rows += `

                <tr>

                    <td>

                        ${escapeHtml(
                item.product_name
            )}

                    </td>

                    <td>

                        ${Number(
                item.quantity
            )}

                    </td>

                    <td>

                        ${formatMoney(
                item.unit_price
            )}

                    </td>

                    <td>

                        ${formatMoney(
                lineTotal
            )}

                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn btn-sm btn-danger remove-edit-item-btn"
                            data-index="${index}">

                            <i class="bi bi-trash"></i>

                        </button>

                    </td>

                </tr>

            `;

        }
    );


    editInvoiceItemsTableBody.innerHTML =
        rows;


    editInvoiceGrandTotal.textContent =
        formatMoney(total);

}


function removeEditItem(index) {

    editInvoiceItems.splice(
        index,
        1
    );

    renderEditInvoiceItems();

}


async function updateInvoice(event) {

    event.preventDefault();


    if (
        editInvoiceItems.length === 0
    ) {

        showToast(
            "Invoice must contain at least one item.",
            "danger"
        );

        return;

    }


    const invoiceId =
        editInvoiceId.value;


    const data = {
        customer_po_number:
            editCustomerPo.value.trim() || null,

        delivery_date:
            editDeliveryDate.value || null,

        notes:
            editNotes.value.trim() || null,

        items:
            editInvoiceItems.map(item => ({
                product_id:
                    Number(item.product_id),

                product_name:
                    item.product_name,

                quantity:
                    Number(item.quantity),

                unit_price:
                    Number(item.unit_price)
            }))
    };

    try {

        const response =
            await fetch(
                `/invoices/${invoiceId}`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(data)

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                MESSAGES.UPDATE_ERROR
            );

        }


        editModal.hide();


        showToast(
            result.message ||
            MESSAGES.UPDATE_SUCCESS,
            "success"
        );


        await loadInvoices();

    } catch (error) {

        showToast(
            error.message,
            "danger"
        );

    }

}


function openFinalizeInvoice(invoiceId) {
    selectedInvoiceId = Number(invoiceId);
    finalizeModal.show();
}

async function finalizeInvoice() {
    if (!selectedInvoiceId) {
        return;
    }

    try {
        const response = await fetch(
            `/invoices/${selectedInvoiceId}/finalize`,
            {
                method: "PUT"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                MESSAGES.FINALIZE_ERROR
            );
        }

        finalizeModal.hide();

        showToast(
            result.message ||
            MESSAGES.FINALIZE_SUCCESS,
            "success"
        );

        selectedInvoiceId = null;

        await loadInvoices();

    } catch (error) {
        finalizeModal.hide();

        showToast(
            error.message,
            "danger"
        );
    }
}


function openDeleteInvoice(invoiceId) {

    selectedInvoiceId =
        Number(invoiceId);

    deleteModal.show();

}


async function deleteInvoice() {

    if (!selectedInvoiceId) {
        return;
    }


    try {

        const response =
            await fetch(
                `/invoices/${selectedInvoiceId}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                MESSAGES.DELETE_ERROR
            );

        }


        deleteModal.hide();


        showToast(
            result.message ||
            MESSAGES.DELETE_SUCCESS,
            "success"
        );


        selectedInvoiceId =
            null;


        await loadInvoices();

    } catch (error) {

        showToast(
            error.message,
            "danger"
        );

    }

}


invoicesContainer.addEventListener(
    "click",
    event => {

        const viewButton =
            event.target.closest(
                ".view-invoice-btn"
            );

        if (viewButton) {

            openViewInvoice(
                viewButton.dataset.id
            );

            return;

        }


        const editButton =
            event.target.closest(
                ".edit-invoice-btn"
            );

        if (editButton) {

            openEditInvoice(
                editButton.dataset.id
            );

            return;

        }


        const finalizeButton =
            event.target.closest(
                ".finalize-invoice-btn"
            );

        if (finalizeButton) {
            openFinalizeInvoice(
                finalizeButton.dataset.id
            );

            return;
        }


        const deleteButton =
            event.target.closest(
                ".delete-invoice-btn"
            );

        if (deleteButton) {

            openDeleteInvoice(
                deleteButton.dataset.id
            );

        }

    }
);


editInvoiceItemsTableBody.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".remove-edit-item-btn"
            );

        if (!button) {
            return;
        }

        removeEditItem(
            Number(button.dataset.index)
        );

    }
);


searchInvoice.addEventListener(
    "input",
    filterInvoices
);


customerFilter.addEventListener(
    "change",
    filterInvoices
);


statusFilter.addEventListener(
    "change",
    filterInvoices
);


document.addEventListener("change", function (event) {

    if (
        event.target.id === "editProduct"
    ) {

        loadEditProductPrice();

    }

});


document.addEventListener("click", function (event) {

    const button =
        event.target.closest("#addEditItemBtn");

    if (!button) {
        return;
    }

    addEditItem();

});

editInvoiceForm.addEventListener(
    "submit",
    updateInvoice
);


confirmDeleteBtn.addEventListener(
    "click",
    deleteInvoice
);
confirmFinalizeBtn.addEventListener(
    "click",
    finalizeInvoice
);
printInvoiceBtn.addEventListener(
    "click",
    printInvoice
);
editInvoiceModal.addEventListener(
    "hidden.bs.modal",
    () => {

        editInvoiceForm.reset();

        editInvoiceItems = [];

        editInvoiceId.value = "";

        editInvoiceItemsTableBody.innerHTML = "";

        editInvoiceGrandTotal.textContent =
            "Rs 0.00";

    }
);


loadProducts();

loadInvoices();

