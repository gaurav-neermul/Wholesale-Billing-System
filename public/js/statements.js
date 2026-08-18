const customerSelect =
    document.getElementById("customerSelect");

const fromDate =
    document.getElementById("fromDate");

const toDate =
    document.getElementById("toDate");

const generateStatementBtn =
    document.getElementById(
        "generateStatementBtn"
    );

const printStatementBtn =
    document.getElementById(
        "printStatementBtn"
    );

const statementCustomer =
    document.getElementById(
        "statementCustomer"
    );

const statementCustomerAddress =
    document.getElementById(
        "statementCustomerAddress"
    );

const statementCustomerBrn =
    document.getElementById(
        "statementCustomerBrn"
    );

const statementPeriod =
    document.getElementById(
        "statementPeriod"
    );

const statementDate =
    document.getElementById(
        "statementDate"
    );

const statementTableBody =
    document.getElementById(
        "statementTableBody"
    );

const totalInvoiced =
    document.getElementById(
        "totalInvoiced"
    );

const totalPaid =
    document.getElementById(
        "totalPaid"
    );

const outstandingBalance =
    document.getElementById(
        "outstandingBalance"
    );

const footerDebit =
    document.getElementById(
        "footerDebit"
    );

const footerCredit =
    document.getElementById(
        "footerCredit"
    );

const footerBalance =
    document.getElementById(
        "footerBalance"
    );


let currentStatement = null;


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


function formatPeriod(
    from,
    to
) {

    if (
        from &&
        to
    ) {

        return `${formatDate(from)} - ${formatDate(to)}`;

    }


    if (from) {

        return `From ${formatDate(from)}`;

    }


    if (to) {

        return `Up to ${formatDate(to)}`;

    }


    return "All transactions";

}


async function loadCustomers() {

    customerSelect.innerHTML = `

        <option value="">
            Loading customers...
        </option>

    `;


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


        customerSelect.innerHTML = `

            <option value="">
                Select Customer
            </option>

        `;


        result.customers.forEach(
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

        customerSelect.innerHTML = `

            <option value="">
                Unable to load customers
            </option>

        `;


        showToast(
            error.message,
            "danger"
        );

    }

}


async function generateStatement() {

    const customerId =
        customerSelect.value;


    if (!customerId) {

        showToast(
            "Please select a customer.",
            "warning"
        );

        return;

    }


    if (
        fromDate.value &&
        toDate.value &&
        fromDate.value >
        toDate.value
    ) {

        showToast(
            "The From date cannot be after the To date.",
            "danger"
        );

        return;

    }


    generateStatementBtn.disabled =
        true;


    generateStatementBtn.innerHTML = `

        <span
            class="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true">
        </span>

    `;


    statementTableBody.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="text-center py-5">

                Loading statement...

            </td>

        </tr>

    `;


    try {

        const params =
            new URLSearchParams();


        if (fromDate.value) {

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


        const response =
            await fetch(
                `/statements/${customerId}?${params.toString()}`
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to generate statement."
            );

        }


        currentStatement =
            result;


        displayStatement(
            result
        );


        printStatementBtn.disabled =
            false;


    } catch (error) {

        currentStatement =
            null;


        printStatementBtn.disabled =
            true;


        statementTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
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

        generateStatementBtn.disabled =
            false;


        generateStatementBtn.innerHTML = `

            <i class="bi bi-search"></i>

        `;

    }

}

function displayStatement(result) {

    const customer =
        result.customer;

    const transactions =
        result.transactions || [];

    const summary =
        result.summary || {};


    statementCustomer.textContent =
        customer.company_name ||
        "-";


    statementCustomerAddress.textContent =
        customer.address ||
        "-";


    statementCustomerBrn.textContent =
        customer.company_brn ||
        "-";


    statementPeriod.textContent =
        formatPeriod(
            fromDate.value,
            toDate.value
        );


    statementDate.textContent =
        formatDate(
            new Date()
        );


    totalInvoiced.textContent =
        formatMoney(
            summary.total_invoiced
        );


    totalPaid.textContent =
        formatMoney(
            summary.total_paid
        );


    outstandingBalance.textContent =
        formatMoney(
            summary.outstanding
        );


    footerDebit.textContent =
        formatMoney(
            summary.total_invoiced
        );


    footerCredit.textContent =
        formatMoney(
            summary.total_paid
        );


    footerBalance.textContent =
        formatMoney(
            summary.outstanding
        );


    if (
        transactions.length === 0
    ) {

        statementTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-state">

                    No invoices or payments
                    found for this period.

                </td>

            </tr>

        `;

        return;

    }



    let rows = "";


    transactions.forEach(
        transaction => {

            const isPayment =
                transaction.transaction_type ===
                "PAYMENT";


            rows += `

                <tr>

                    <td>

                        ${formatDate(
                transaction.date
            )}

                    </td>


                    <td>

                        <strong>

                            ${escapeHtml(
                transaction.reference
            )}

                        </strong>

                    </td>


                    <td>

                        ${isPayment
                    ? `
                                    <span
                                        class="text-success">

                                        <i
                                            class="bi bi-cash-stack me-1">
                                        </i>

                                        Payment Received

                                    </span>
                                `
                    : `
                                    <span>

                                        Invoice

                                    </span>
                                `
                }

                    </td>


                    <td>

                        ${escapeHtml(
                    transaction.po_number
                )}

                    </td>


                    <td
                        class="text-end">

                        ${Number(
                    transaction.debit
                ) > 0
                    ? formatMoney(
                        transaction.debit
                    )
                    : "-"
                }

                    </td>


                    <td
                        class="text-end text-success">

                        ${Number(
                    transaction.credit
                ) > 0
                    ? formatMoney(
                        transaction.credit
                    )
                    : "-"
                }

                    </td>


                    <td
                        class="text-end fw-bold">

                        ${formatMoney(
                    transaction.balance
                )}

                    </td>

                </tr>

            `;

        }
    );


    statementTableBody.innerHTML =
        rows;

}


function printStatement() {

    if (!currentStatement) {

        showToast(
            "Generate a statement first.",
            "warning"
        );

        return;

    }


    window.print();

}


generateStatementBtn.addEventListener(
    "click",
    generateStatement
);


printStatementBtn.addEventListener(
    "click",
    printStatement
);


customerSelect.addEventListener(
    "change",
    () => {

        currentStatement =
            null;

        printStatementBtn.disabled =
            true;

    }
);


setDefaultDates();

loadCustomers();