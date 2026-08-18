const reportType =
    document.getElementById("reportType");

const fromDate =
    document.getElementById("fromDate");

const toDate =
    document.getElementById("toDate");

const customerSelect =
    document.getElementById("customerSelect");

const customerWrapper =
    document.getElementById("customerWrapper");

const fromDateWrapper =
    document.getElementById("fromDateWrapper");

const inventoryFilterRow =
    document.getElementById("inventoryFilterRow");

const inventoryStatus =
    document.getElementById("inventoryStatus");

const generateReportBtn =
    document.getElementById("generateReportBtn");

const printReportBtn =
    document.getElementById("printReportBtn");

const reportTitle =
    document.getElementById("reportTitle");

const reportDescription =
    document.getElementById("reportDescription");

const summaryValue1 =
    document.getElementById("summaryValue1");

const summaryValue2 =
    document.getElementById("summaryValue2");

const summaryValue3 =
    document.getElementById("summaryValue3");

const summaryLabel1 =
    document.getElementById("summaryLabel1");

const summaryLabel2 =
    document.getElementById("summaryLabel2");

const summaryLabel3 =
    document.getElementById("summaryLabel3");

const reportTableHead =
    document.getElementById("reportTableHead");

const reportTableBody =
    document.getElementById("reportTableBody");

const reportTableFoot =
    document.getElementById("reportTableFoot");


let currentReport = null;

let customers = [];

 
function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function formatMoney(value) {

    const number =
        Number(value) || 0;

    return `Rs ${number.toLocaleString(
        "en-MU",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;

}


function formatNumber(value) {

    return (
        Number(value) || 0
    ).toLocaleString(
        "en-MU",
        {
            maximumFractionDigits: 2
        }
    );

}


function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


function setDefaultDates() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    fromDate.value =
        `${year}-${month}-01`;

    toDate.value =
        `${year}-${month}-${day}`;

}

 
async function loadCustomers() {

    try {

        const response =
            await fetch(
                "/statements/customers"
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to load customers."
            );

        }


        customers =
            result.customers || [];


        customerSelect.innerHTML = `

            <option value="">
                All Customers
            </option>

        `;


        customers.forEach(
            customer => {

                customerSelect.innerHTML += `

                    <option
                        value="${customer.customer_id}">

                        ${escapeHtml(
                            customer.company_name
                        )}

                    </option>

                `;

            }
        );


    } catch (error) {

        showToast(
            error.message,
            "danger"
        );

    }

}


 
function updateReportControls() {

    const type =
        reportType.value;


    const isInventory =
        type === "inventory";


    const isReceivables =
        type === "receivables";


    const isTopProducts =
        type === "top-products";


    customerWrapper.classList.toggle(
        "d-none",
        isInventory ||
        isTopProducts
    );


    fromDateWrapper.classList.toggle(
        "d-none",
        isInventory ||
        isReceivables
    );


    inventoryFilterRow.classList.toggle(
        "d-none",
        !isInventory
    );


    if (type === "sales") {

        reportTitle.textContent =
            "Sales Report";

        reportDescription.textContent =
            "Finalized sales grouped by customer.";

    }


    if (type === "invoices") {

        reportTitle.textContent =
            "Invoice Report";

        reportDescription.textContent =
            "Invoice transactions for the selected period.";

    }


    if (type === "payments") {

        reportTitle.textContent =
            "Payment Report";

        reportDescription.textContent =
            "Customer payments received during the selected period.";

    }


    if (type === "receivables") {

        reportTitle.textContent =
            "Outstanding Receivables";

        reportDescription.textContent =
            "Outstanding customer balances as of the selected To date.";

    }


    if (type === "inventory") {

        reportTitle.textContent =
            "Inventory Report";

        reportDescription.textContent =
            "Current inventory position and stock status.";

    }


    if (type === "top-products") {

        reportTitle.textContent =
            "Top Selling Products";

        reportDescription.textContent =
            "Products ranked by quantity sold on finalized invoices.";

    }


    clearReport();

}

 
function clearReport() {

    currentReport = null;

    printReportBtn.disabled = true;


    summaryValue1.textContent =
        "Rs 0.00";

    summaryValue2.textContent =
        "0";

    summaryValue3.textContent =
        "0";


    summaryLabel1.textContent =
        "-";

    summaryLabel2.textContent =
        "-";

    summaryLabel3.textContent =
        "-";


    reportTableHead.innerHTML = "";

    reportTableFoot.innerHTML = "";


    reportTableBody.innerHTML = `

        <tr>

            <td
                colspan="10"
                class="empty-state">

                Generate a report
                to view results.

            </td>

        </tr>

    `;

}

 
async function generateReport() {

    const type =
        reportType.value;


    const params =
        new URLSearchParams();


    if (
        fromDate.value &&
        ![
            "inventory",
            "receivables"
        ].includes(type)
    ) {

        params.set(
            "from",
            fromDate.value
        );

    }


    if (toDate.value) {

        params.set(
            "to",
            toDate.value
        );

    }


    if (
        customerSelect.value &&
        ![
            "inventory",
            "top-products"
        ].includes(type)
    ) {

        params.set(
            "customer_id",
            customerSelect.value
        );

    }


    if (type === "inventory") {

        if (
            inventoryStatus.value
        ) {

            params.set(
                "status",
                inventoryStatus.value
            );

        }

    }


    if (type === "top-products") {

        params.set(
            "limit",
            "10"
        );

    }


    if (
        fromDate.value &&
        toDate.value &&
        fromDate.value >
        toDate.value &&
        ![
            "inventory",
            "receivables"
        ].includes(type)
    ) {

        showToast(
            "The From date cannot be after the To date.",
            "danger"
        );

        return;

    }


    generateReportBtn.disabled =
        true;


    generateReportBtn.innerHTML = `

        <span
            class="spinner-border spinner-border-sm"
            role="status">
        </span>

    `;


    reportTableBody.innerHTML = `

        <tr>

            <td
                colspan="10"
                class="text-center py-5">

                Loading report...

            </td>

        </tr>

    `;


    try {

        const response =
            await fetch(
                `/reports/${type}?${params.toString()}`
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to generate report."
            );

        }


        currentReport = {
            type,
            data: result
        };


        displayReport(
            type,
            result
        );


        printReportBtn.disabled =
            false;


    } catch (error) {

        reportTableBody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="text-center text-danger py-5">

                    ${escapeHtml(
                        error.message
                    )}

                </td>

            </tr>

        `;


        showToast(
            error.message,
            "danger"
        );

    } finally {

        generateReportBtn.disabled =
            false;


        generateReportBtn.innerHTML = `

            <i class="bi bi-search"></i>

        `;

    }

}

function displayReport(
    type,
    result
) {

    if (type === "sales") {

        displaySalesReport(result);

        return;

    }


    if (type === "invoices") {

        displayInvoiceReport(result);

        return;

    }


    if (type === "payments") {

        displayPaymentReport(result);

        return;

    }


    if (type === "receivables") {

        displayReceivablesReport(result);

        return;

    }


    if (type === "inventory") {

        displayInventoryReport(result);

        return;

    }


    if (type === "top-products") {

        displayTopProductsReport(result);

        return;

    }

}

 
function displaySalesReport(result) {

    const summary =
        result.summary || {};

    const rows =
        result.rows || [];


    summaryValue1.textContent =
        formatMoney(
            summary.total_sales
        );

    summaryValue2.textContent =
        formatNumber(
            summary.invoice_count
        );

    summaryValue3.textContent =
        formatNumber(
            summary.customer_count
        );


    summaryLabel1.textContent =
        "Finalized sales";

    summaryLabel2.textContent =
        "Finalized invoices";

    summaryLabel3.textContent =
        "Customers";


    reportTableHead.innerHTML = `

        <tr>

            <th>
                Customer
            </th>

            <th>
                Invoices
            </th>

            <th class="text-end">
                Total Sales
            </th>

        </tr>

    `;


    if (rows.length === 0) {

        showEmptyReport(
            3,
            "No finalized sales found."
        );

        return;

    }


    reportTableBody.innerHTML =
        rows.map(
            row => `

                <tr>

                    <td>
                        ${escapeHtml(
                            row.company_name
                        )}
                    </td>

                    <td>
                        ${formatNumber(
                            row.invoice_count
                        )}
                    </td>

                    <td class="text-end fw-semibold">

                        ${formatMoney(
                            row.total_sales
                        )}

                    </td>

                </tr>

            `
        ).join("");


    reportTableFoot.innerHTML = `

        <tr class="table-light fw-bold">

            <td>
                TOTAL
            </td>

            <td>
                ${formatNumber(
                    summary.invoice_count
                )}
            </td>

            <td class="text-end">
                ${formatMoney(
                    summary.total_sales
                )}
            </td>

        </tr>

    `;

}


 
function displayInvoiceReport(result) {

    const summary =
        result.summary || {};

    const rows =
        result.rows || [];


    summaryValue1.textContent =
        formatMoney(
            summary.total_amount
        );

    summaryValue2.textContent =
        formatNumber(
            summary.invoice_count
        );

    summaryValue3.textContent =
        "-";


    summaryLabel1.textContent =
        "Invoice value";

    summaryLabel2.textContent =
        "Invoices";

    summaryLabel3.textContent =
        "";


    reportTableHead.innerHTML = `

        <tr>

            <th>
                Invoice
            </th>

            <th>
                Date
            </th>

            <th>
                Customer
            </th>

            <th>
                Customer PO
            </th>

            <th>
                Status
            </th>

            <th class="text-end">
                Amount
            </th>

        </tr>

    `;


    if (rows.length === 0) {

        showEmptyReport(
            6,
            "No invoices found."
        );

        return;

    }


    reportTableBody.innerHTML =
        rows.map(
            row => `

                <tr>

                    <td>

                        <strong>

                            ${escapeHtml(
                                row.invoice_number
                            )}

                        </strong>

                    </td>


                    <td>
                        ${formatDate(
                            row.invoice_date
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            row.company_name
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            row.customer_po_number ||
                            "-"
                        )}
                    </td>


                    <td>

                        <span class="badge ${
                            row.status === "FINAL"
                                ? "bg-success"
                                : row.status === "CANCELLED"
                                    ? "bg-danger"
                                    : "bg-secondary"
                        }">

                            ${escapeHtml(
                                row.status
                            )}

                        </span>

                    </td>


                    <td class="text-end">

                        ${formatMoney(
                            row.total_amount
                        )}

                    </td>

                </tr>

            `
        ).join("");


    reportTableFoot.innerHTML = `

        <tr class="table-light fw-bold">

            <td colspan="5">
                TOTAL
            </td>

            <td class="text-end">

                ${formatMoney(
                    summary.total_amount
                )}

            </td>

        </tr>

    `;

}


 
function displayPaymentReport(result) {

    const summary =
        result.summary || {};

    const rows =
        result.rows || [];


    summaryValue1.textContent =
        formatMoney(
            summary.total_payments
        );

    summaryValue2.textContent =
        formatNumber(
            summary.payment_count
        );

    summaryValue3.textContent =
        "-";


    summaryLabel1.textContent =
        "Payments received";

    summaryLabel2.textContent =
        "Payment transactions";

    summaryLabel3.textContent =
        "";


    reportTableHead.innerHTML = `

        <tr>

            <th>
                Payment #
            </th>

            <th>
                Date
            </th>

            <th>
                Customer
            </th>

            <th>
                Reference
            </th>

            <th>
                Notes
            </th>

            <th class="text-end">
                Amount
            </th>

        </tr>

    `;


    if (rows.length === 0) {

        showEmptyReport(
            6,
            "No payments found."
        );

        return;

    }


    reportTableBody.innerHTML =
        rows.map(
            row => `

                <tr>

                    <td>
                        #${row.payment_id}
                    </td>

                    <td>
                        ${formatDate(
                            row.payment_date
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            row.company_name
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            row.payment_references ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            row.notes ||
                            "-"
                        )}
                    </td>

                    <td class="text-end fw-semibold">

                        ${formatMoney(
                            row.total_amount
                        )}

                    </td>

                </tr>

            `
        ).join("");


    reportTableFoot.innerHTML = `

        <tr class="table-light fw-bold">

            <td colspan="5">
                TOTAL
            </td>

            <td class="text-end">

                ${formatMoney(
                    summary.total_payments
                )}

            </td>

        </tr>

    `;

}


 
function displayReceivablesReport(result) {

    const summary =
        result.summary || {};

    const rows =
        result.rows || [];


    summaryValue1.textContent =
        formatMoney(
            summary.total_outstanding
        );

    summaryValue2.textContent =
        formatNumber(
            summary.customer_count
        );

    summaryValue3.textContent =
        "-";


    summaryLabel1.textContent =
        "Total outstanding";

    summaryLabel2.textContent =
        "Customers owing";

    summaryLabel3.textContent =
        "";


    reportTableHead.innerHTML = `

        <tr>

            <th>
                Customer
            </th>

            <th class="text-end">
                Total Invoiced
            </th>

            <th class="text-end">
                Total Paid
            </th>

            <th class="text-end">
                Outstanding
            </th>

        </tr>

    `;


    if (rows.length === 0) {

        showEmptyReport(
            4,
            "No outstanding receivables."
        );

        return;

    }


    reportTableBody.innerHTML =
        rows.map(
            row => `

                <tr>

                    <td>

                        <strong>

                            ${escapeHtml(
                                row.company_name
                            )}

                        </strong>

                    </td>


                    <td class="text-end">

                        ${formatMoney(
                            row.total_invoiced
                        )}

                    </td>


                    <td class="text-end text-success">

                        ${formatMoney(
                            row.total_paid
                        )}

                    </td>


                    <td class="text-end text-danger fw-bold">

                        ${formatMoney(
                            row.outstanding
                        )}

                    </td>

                </tr>

            `
        ).join("");


    reportTableFoot.innerHTML = `

        <tr class="table-light fw-bold">

            <td>
                TOTAL
            </td>

            <td class="text-end">

                ${formatMoney(
                    rows.reduce(
                        (sum, row) =>
                            sum +
                            Number(
                                row.total_invoiced
                            ),
                        0
                    )
                )}

            </td>

            <td class="text-end">

                ${formatMoney(
                    rows.reduce(
                        (sum, row) =>
                            sum +
                            Number(
                                row.total_paid
                            ),
                        0
                    )
                )}

            </td>

            <td class="text-end">

                ${formatMoney(
                    summary.total_outstanding
                )}

            </td>

        </tr>

    `;

}


 
function displayInventoryReport(result) {

    const summary =
        result.summary || {};

    const rows =
        result.rows || [];


    summaryValue1.textContent =
        formatNumber(
            summary.total_stock
        );

    summaryValue2.textContent =
        formatNumber(
            summary.low_stock
        );

    summaryValue3.textContent =
        formatNumber(
            summary.out_of_stock
        );


    summaryLabel1.textContent =
        "Total stock quantity";

    summaryLabel2.textContent =
        "Low stock products";

    summaryLabel3.textContent =
        "Out of stock products";


    reportTableHead.innerHTML = `

        <tr>

            <th>
                Product
            </th>

            <th class="text-end">
                Current Stock
            </th>

            <th class="text-end">
                Minimum Stock
            </th>

            <th>
                Status
            </th>

            <th>
                Active
            </th>

            <th>
                Last Stock In
            </th>

        </tr>

    `;


    if (rows.length === 0) {

        showEmptyReport(
            6,
            "No inventory records found."
        );

        return;

    }


    reportTableBody.innerHTML =
        rows.map(
            row => `

                <tr>

                    <td>

                        <strong>

                            ${escapeHtml(
                                row.product_name
                            )}

                        </strong>

                    </td>


                    <td class="text-end">

                        ${formatNumber(
                            row.current_stock
                        )}

                    </td>


                    <td class="text-end">

                        ${formatNumber(
                            row.minimum_stock
                        )}

                    </td>


                    <td>

                        <span class="badge ${
                            row.stock_status === "OUT"
                                ? "bg-danger"
                                : row.stock_status === "LOW"
                                    ? "bg-warning text-dark"
                                    : "bg-success"
                        }">

                            ${
                                row.stock_status === "OUT"
                                    ? "Out of Stock"
                                    : row.stock_status === "LOW"
                                        ? "Low Stock"
                                        : "In Stock"
                            }

                        </span>

                    </td>


                    <td>

                        ${
                            row.is_active
                                ? "Yes"
                                : "No"
                        }

                    </td>


                    <td>

                        ${formatDate(
                            row.last_stock_in
                        )}

                    </td>

                </tr>

            `
        ).join("");


    reportTableFoot.innerHTML = `

        <tr class="table-light fw-bold">

            <td>
                TOTAL
            </td>

            <td class="text-end">

                ${formatNumber(
                    summary.total_stock
                )}

            </td>

            <td colspan="4"></td>

        </tr>

    `;

}


 
function displayTopProductsReport(result) {

    const rows =
        result.rows || [];


    summaryValue1.textContent =
        rows.length;


    summaryValue2.textContent =
        formatNumber(
            rows.reduce(
                (sum, row) =>
                    sum +
                    Number(
                        row.quantity_sold
                    ),
                0
            )
        );


    summaryValue3.textContent =
        formatMoney(
            rows.reduce(
                (sum, row) =>
                    sum +
                    Number(
                        row.sales_value
                    ),
                0
            )
        );


    summaryLabel1.textContent =
        "Products shown";

    summaryLabel2.textContent =
        "Units sold";

    summaryLabel3.textContent =
        "Sales value";


    reportTableHead.innerHTML = `

        <tr>

            <th>
                Rank
            </th>

            <th>
                Product
            </th>

            <th class="text-end">
                Quantity Sold
            </th>

            <th class="text-end">
                Sales Value
            </th>

        </tr>

    `;


    if (rows.length === 0) {

        showEmptyReport(
            4,
            "No finalized product sales found."
        );

        return;

    }


    reportTableBody.innerHTML =
        rows.map(
            (row, index) => `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>

                        <strong>

                            ${escapeHtml(
                                row.product_name
                            )}

                        </strong>

                    </td>

                    <td class="text-end">

                        ${formatNumber(
                            row.quantity_sold
                        )}

                    </td>

                    <td class="text-end">

                        ${formatMoney(
                            row.sales_value
                        )}

                    </td>

                </tr>

            `
        ).join("");


    reportTableFoot.innerHTML = "";

}
 
function showEmptyReport(
    colspan,
    message
) {

    reportTableBody.innerHTML = `

        <tr>

            <td
                colspan="${colspan}"
                class="empty-state">

                ${escapeHtml(
                    message
                )}

            </td>

        </tr>

    `;


    reportTableFoot.innerHTML = "";

}

 
function printReport() {

    if (!currentReport) {

        showToast(
            "Generate a report first.",
            "warning"
        );

        return;

    }


    window.print();

}
 
reportType.addEventListener(
    "change",
    updateReportControls
);


inventoryStatus.addEventListener(
    "change",
    () => {

        if (
            reportType.value ===
            "inventory"
        ) {

            clearReport();

        }

    }
);


generateReportBtn.addEventListener(
    "click",
    generateReport
);


printReportBtn.addEventListener(
    "click",
    printReport
);

 
setDefaultDates();

updateReportControls();

loadCustomers();
