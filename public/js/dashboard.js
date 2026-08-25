const dashboardLoading = document.getElementById("dashboardLoading");

const dashboardContent = document.getElementById("dashboardContent");

const dashboardDate = document.getElementById("dashboardDate");

const refreshDashboardBtn = document.getElementById("refreshDashboardBtn");

const todaySales = document.getElementById("todaySales");

const monthSales = document.getElementById("monthSales");

const outstanding = document.getElementById("outstanding");

const monthPayments = document.getElementById("monthPayments");

const activeCustomers = document.getElementById("activeCustomers");

const inactiveCustomers = document.getElementById("inactiveCustomers");

const totalStock = document.getElementById("totalStock");

const lowStock = document.getElementById("lowStock");

const outOfStock = document.getElementById("outOfStock");

const totalOrders = document.getElementById("totalOrders");

const pendingOrders = document.getElementById("pendingOrders");

const invoicedOrders = document.getElementById("invoicedOrders");

const recentInvoices = document.getElementById("recentInvoices");

const recentPayments = document.getElementById("recentPayments");

const recentOrders = document.getElementById("recentOrders");

const topProducts = document.getElementById("topProducts");

let salesChart = null;


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


function showEmptyRow(
    colspan,
    message
) {

    return `
        <tr>
            <td
                colspan="${colspan}"
                class="text-center text-muted py-4">

                ${escapeHtml(message)}

            </td>
        </tr>
    `;

}


function updateDashboardDate() {

    const now =
        new Date();

    dashboardDate.textContent =
        now.toLocaleDateString(
            "en-GB",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

}


function renderSummary(summary) {

    todaySales.textContent =
        formatMoney(
            summary.today_sales
        );

    monthSales.textContent =
        formatMoney(
            summary.month_sales
        );

    outstanding.textContent =
        formatMoney(
            summary.outstanding
        );

    monthPayments.textContent =
        formatMoney(
            summary.month_payments
        );


    activeCustomers.textContent =
        formatNumber(
            summary.active_customers
        );

    inactiveCustomers.textContent =
        formatNumber(
            summary.inactive_customers
        );


    totalStock.textContent =
        formatNumber(
            summary.total_stock
        );

    lowStock.textContent =
        formatNumber(
            summary.low_stock
        );

    outOfStock.textContent =
        formatNumber(
            summary.out_of_stock
        );


    totalOrders.textContent =
        formatNumber(
            summary.total_orders
        );

    pendingOrders.textContent =
        formatNumber(
            summary.pending_orders
        );

    invoicedOrders.textContent =
        formatNumber(
            summary.invoiced_orders
        );

}


function renderSalesChart(data) {

    const canvas =
        document.getElementById(
            "salesChart"
        );

    if (!canvas) {
        return;
    }


    const labels =
        data.map(
            item =>
                new Date(
                    item.date
                ).toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short"
                    }
                )
        );


    const values =
        data.map(
            item =>
                Number(
                    item.sales
                ) || 0
        );


    if (salesChart) {

        salesChart.destroy();

    }


    salesChart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {

                    labels,

                    datasets: [

                        {
                            label: "Sales",

                            data: values,

                            tension: 0.35,

                            fill: true,

                            borderWidth: 2,

                            pointRadius: 4,

                            pointHoverRadius: 6
                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                callback: function (value) {

                                    return "Rs " +
                                        Number(
                                            value
                                        ).toLocaleString(
                                            "en-MU"
                                        );

                                }

                            }

                        }

                    }

                }

            }
        );

}


function renderTopProducts(data) {

    if (!data.length) {

        topProducts.innerHTML = `
            <div class="text-center text-muted py-4">
                No product sales yet.
            </div>
        `;

        return;

    }


    topProducts.innerHTML =
        data.map(
            (product, index) => `

                <div
                    class="d-flex justify-content-between align-items-center py-3 top-product-row">

                    <div
                        class="d-flex align-items-center gap-3">

                        <div
                            class="fw-bold text-muted">

                            ${index + 1}

                        </div>

                        <div>

                            <div class="fw-semibold">

                                ${escapeHtml(
                product.product_name
            )}

                            </div>

                            <small class="text-muted">

                                ${formatNumber(
                product.quantity_sold
            )}
                                units sold

                            </small>

                        </div>

                    </div>


                    <div class="text-end">

                        <div class="fw-semibold">

                            ${formatMoney(
                product.sales_value
            )}

                        </div>

                    </div>

                </div>

            `
        ).join("");

}


function renderRecentInvoices(data) {

    if (!data.length) {

        recentInvoices.innerHTML =
            showEmptyRow(
                4,
                "No invoices found."
            );

        return;

    }


    recentInvoices.innerHTML =
        data.map(
            invoice => `

                <tr>

                    <td>

                        <strong>

                            ${escapeHtml(
                invoice.invoice_number
            )}

                        </strong>

                    </td>

                    <td>

                        ${escapeHtml(
                invoice.company_name
            )}

                    </td>

                    <td>

                        ${formatDate(
                invoice.invoice_date
            )}

                    </td>

                    <td class="text-end">

                        ${formatMoney(
                invoice.total_amount
            )}

                    </td>

                </tr>

            `
        ).join("");

}


function renderRecentPayments(data) {

    if (!data.length) {

        recentPayments.innerHTML =
            showEmptyRow(
                4,
                "No payments found."
            );

        return;

    }


    recentPayments.innerHTML =
        data.map(
            payment => `

                <tr>

                    <td>

                        ${formatDate(
                payment.payment_date
            )}

                    </td>

                    <td>

                        ${escapeHtml(
                payment.company_name
            )}

                    </td>

                    <td>

                        ${escapeHtml(
                payment.payment_references ||
                "-"
            )}

                    </td>

                    <td class="text-end">

                        ${formatMoney(
                payment.total_amount
            )}

                    </td>

                </tr>

            `
        ).join("");

}


function getOrderStatusBadge(status) {

    const normalized =
        String(
            status || ""
        ).toLowerCase();


    if (
        normalized === "pending"
    ) {

        return `
            <span class="badge bg-warning text-dark">
                Pending
            </span>
        `;

    }


    if (
        normalized === "invoiced"
    ) {

        return `
            <span class="badge bg-success">
                Invoiced
            </span>
        `;

    }


    return `
        <span class="badge bg-secondary">
            ${escapeHtml(status || "-")}
        </span>
    `;

}


function renderRecentOrders(data) {

    if (!data.length) {

        recentOrders.innerHTML =
            showEmptyRow(
                6,
                "No sales orders found."
            );

        return;

    }


    recentOrders.innerHTML =
        data.map(
            order => `

                <tr>

                    <td>

                        <strong>
                            SO-${order.sales_order_id}
                        </strong>

                    </td>

                    <td>

                        ${escapeHtml(
                order.company_name
            )}

                    </td>

                    <td>

                        ${escapeHtml(
                order.customer_po_number ||
                "-"
            )}

                    </td>

                    <td>

                        ${formatDate(
                order.order_date
            )}

                    </td>

                    <td>

                        ${formatDate(
                order.delivery_date
            )}

                    </td>

                    <td>

                        ${getOrderStatusBadge(
                order.status
            )}

                    </td>

                </tr>

            `
        ).join("");

}


function renderDashboard(data) {

    renderSummary(
        data.summary || {}
    );

    renderSalesChart(
        data.sales_chart || []
    );

    renderTopProducts(
        data.top_products || []
    );

    renderRecentInvoices(
        data.recent_invoices || []
    );

    renderRecentPayments(
        data.recent_payments || []
    );

    renderRecentOrders(
        data.recent_orders || []
    );

}


async function loadDashboard() {

    dashboardLoading.classList.remove(
        "d-none"
    );

    dashboardContent.classList.add(
        "d-none"
    );


    try {

        const response =
            await fetch(
                "/dashboard"
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to load dashboard."
            );

        }


        if (
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Failed to load dashboard."
            );

        }

        renderDashboard(result);

        dashboardLoading.classList.add("d-none");

        dashboardContent.classList.remove("d-none");


    } catch (error) {

        dashboardLoading.innerHTML = `

            <div class="text-center text-danger">

                <i
                    class="bi bi-exclamation-triangle fs-1">
                </i>

                <div class="mt-3 fw-semibold">

                    Failed to load dashboard

                </div>

                <div class="text-muted small mt-1">

                    ${escapeHtml(
            error.message
        )}

                </div>

                <button
                    type="button"
                    class="btn btn-outline-primary btn-sm mt-3"
                    onclick="loadDashboard()">

                    Try Again

                </button>

            </div>

        `;

        if (
            typeof showToast ===
            "function"
        ) {

            showToast(
                error.message,
                "danger"
            );

        }

    }

}


refreshDashboardBtn.addEventListener(
    "click",
    loadDashboard
);


updateDashboardDate();

loadDashboard();
