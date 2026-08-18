const paymentModalElement =
    document.getElementById("paymentModal");

const paymentModal =
    new bootstrap.Modal(paymentModalElement);

const paymentForm =
    document.getElementById("paymentForm");

const paymentCustomer =
    document.getElementById("paymentCustomer");

const paymentDate =
    document.getElementById("paymentDate");

const paymentAmount =
    document.getElementById("paymentAmount");

const paymentReference =
    document.getElementById("paymentReference");

const paymentNotes =
    document.getElementById("paymentNotes");

const invoiceAllocationBody =
    document.getElementById(
        "invoiceAllocationBody"
    );

const paymentAmountDisplay =
    document.getElementById(
        "paymentAmountDisplay"
    );

const allocatedAmount =
    document.getElementById(
        "allocatedAmount"
    );

const remainingAmount =
    document.getElementById(
        "remainingAmount"
    );

const allocationStatus =
    document.getElementById(
        "allocationStatus"
    );

const savePaymentBtn =
    document.getElementById(
        "savePaymentBtn"
    );

const paymentsTableBody =
    document.getElementById(
        "paymentsTableBody"
    );

const paymentSearch =
    document.getElementById(
        "paymentSearch"
    );

const totalPayments =
    document.getElementById(
        "totalPayments"
    );

const paymentCount =
    document.getElementById(
        "paymentCount"
    );

const latestPayment =
    document.getElementById(
        "latestPayment"
    );


let invoices = [];

let payments = [];


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

    if (Number.isNaN(date.getTime())) {
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


function setToday() {

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

    paymentDate.value =
        `${year}-${month}-${day}`;

}


async function loadCustomers() {

    try {

        const response =
            await fetch(
                "/payments/customers"
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to load customers."
            );

        }


        paymentCustomer.innerHTML = `

            <option value="">
                Select Customer
            </option>

        `;


        result.customers.forEach(
            customer => {

                paymentCustomer.innerHTML += `

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


async function loadCustomerInvoices() {

    const customerId =
        paymentCustomer.value;


    invoices = [];


    if (!customerId) {

        invoiceAllocationBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-state">

                    Select a customer
                    to load invoices.

                </td>

            </tr>

        `;

        allocationStatus.textContent =
            "Select a customer";

        allocationStatus.className =
            "badge bg-secondary";

        updateAllocationSummary();

        return;

    }


    invoiceAllocationBody.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="text-center py-4">

                Loading invoices...

            </td>

        </tr>

    `;


    try {

        const response =
            await fetch(
                `/payments/customers/${customerId}/invoices`
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to load invoices."
            );

        }


        invoices =
            result.invoices || [];


        displayInvoices();

    } catch (error) {

        invoiceAllocationBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="text-center text-danger py-4">

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

    }

}


function displayInvoices() {

    if (invoices.length === 0) {

        invoiceAllocationBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-state">

                    This customer has no
                    outstanding finalized invoices.

                </td>

            </tr>

        `;

        allocationStatus.textContent =
            "No outstanding invoices";

        allocationStatus.className =
            "badge bg-secondary";

        updateAllocationSummary();

        return;

    }


    let rows = "";


    invoices.forEach(
        invoice => {

            rows += `

                <tr>

                    <td>

                        <strong>
                            ${escapeHtml(
                                invoice.invoice_number
                            )}
                        </strong>

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


                    <td class="text-end">

                        ${formatMoney(
                            invoice.paid_amount
                        )}

                    </td>


                    <td class="text-end">

                        <strong>

                            ${formatMoney(
                                invoice.outstanding
                            )}

                        </strong>

                    </td>


                    <td>

                        <input
                            type="number"
                            class="form-control form-control-sm allocation-input invoice-allocation"
                            data-invoice-id="${invoice.invoice_id}"
                            data-outstanding="${invoice.outstanding}"
                            min="0"
                            max="${invoice.outstanding}"
                            step="0.01"
                            value="0">

                    </td>

                </tr>

            `;

        }
    );


    invoiceAllocationBody.innerHTML =
        rows;


    document
        .querySelectorAll(
            ".invoice-allocation"
        )
        .forEach(
            input => {

                input.addEventListener(
                    "input",
                    updateAllocationSummary
                );

            }
        );


    updateAllocationSummary();

}


function getPaymentAmount() {

    return Number(
        paymentAmount.value
    ) || 0;

}


function getAllocations() {

    const allocations = [];


    document
        .querySelectorAll(
            ".invoice-allocation"
        )
        .forEach(
            input => {

                const amount =
                    Number(input.value) || 0;


                if (amount > 0) {

                    allocations.push({

                        invoice_id:
                            Number(
                                input.dataset.invoiceId
                            ),

                        amount_paid:
                            amount

                    });

                }

            }
        );


    return allocations;

}


function updateAllocationSummary() {

    const payment =
        getPaymentAmount();


    const allocations =
        getAllocations();


    const allocated =
        allocations.reduce(
            (sum, item) =>
                sum + item.amount_paid,
            0
        );


    const remaining =
        payment - allocated;


    paymentAmountDisplay.textContent =
        formatMoney(payment);


    allocatedAmount.textContent =
        formatMoney(allocated);


    remainingAmount.textContent =
        formatMoney(
            Math.max(
                0,
                remaining
            )
        );


    if (payment <= 0) {

        allocationStatus.textContent =
            "Enter payment amount";

        allocationStatus.className =
            "badge bg-secondary";

        return;

    }


    if (Math.abs(remaining) < 0.01) {

        allocationStatus.textContent =
            "Fully allocated";

        allocationStatus.className =
            "badge bg-success";

        return;

    }


    if (remaining > 0) {

        allocationStatus.textContent =
            "Amount still to allocate";

        allocationStatus.className =
            "badge bg-warning text-dark";

        return;

    }


    allocationStatus.textContent =
        "Over allocated";

    allocationStatus.className =
        "badge bg-danger";

}


function resetPaymentForm() {

    paymentForm.reset();

    invoices = [];

    invoiceAllocationBody.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="empty-state">

                Select a customer
                to load invoices.

            </td>

        </tr>

    `;


    allocationStatus.textContent =
        "Select a customer";

    allocationStatus.className =
        "badge bg-secondary";


    updateAllocationSummary();

    setToday();

}


async function savePayment(event) {

    event.preventDefault();


    const customerId =
        Number(
            paymentCustomer.value
        );


    const totalAmount =
        getPaymentAmount();


    const allocations =
        getAllocations();


    if (!customerId) {

        showToast(
            "Please select a customer.",
            "warning"
        );

        return;

    }


    if (
        !Number.isFinite(totalAmount) ||
        totalAmount <= 0
    ) {

        showToast(
            "Payment amount must be greater than zero.",
            "danger"
        );

        return;

    }


    if (
        allocations.length === 0
    ) {

        showToast(
            "Allocate the payment to at least one invoice.",
            "warning"
        );

        return;

    }


    const allocated =
        allocations.reduce(
            (sum, item) =>
                sum + item.amount_paid,
            0
        );


    if (
        Math.abs(
            allocated -
            totalAmount
        ) > 0.01
    ) {

        showToast(
            "The payment must be fully allocated.",
            "danger"
        );

        return;

    }


    savePaymentBtn.disabled =
        true;


    savePaymentBtn.innerHTML = `

        <span
            class="spinner-border spinner-border-sm me-1"
            role="status">
        </span>

        Saving...

    `;


    try {

        const response =
            await fetch(
                "/payments",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        customer_id:
                            customerId,

                        payment_date:
                            paymentDate.value,

                        total_amount:
                            totalAmount,

                        payment_references:
                            paymentReference.value.trim(),

                        notes:
                            paymentNotes.value.trim(),

                        items:
                            allocations

                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to record payment."
            );

        }


        paymentModal.hide();


        showToast(
            result.message ||
            "Payment recorded successfully.",
            "success"
        );


        await loadPayments();


    } catch (error) {

        showToast(
            error.message,
            "danger"
        );

    } finally {

        savePaymentBtn.disabled =
            false;

        savePaymentBtn.innerHTML = `

            <i class="bi bi-check-circle me-1"></i>

            Record Payment

        `;

    }

}


async function loadPayments() {

    paymentsTableBody.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="text-center py-4">

                Loading payments...

            </td>

        </tr>

    `;


    try {

        const response =
            await fetch(
                "/payments"
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to load payments."
            );

        }


        payments =
            result.payments || [];


        displayPayments(
            payments
        );


        updatePaymentSummary();


    } catch (error) {

        paymentsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="text-center text-danger py-4">

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

    }

}


function displayPayments(data) {

    if (data.length === 0) {

        paymentsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-state">

                    No payments recorded yet.

                </td>

            </tr>

        `;

        return;

    }


    let rows = "";


    data.forEach(
        payment => {

            rows += `

                <tr>

                    <td>

                        <strong>
                            #${payment.payment_id}
                        </strong>

                    </td>


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

                        <strong>

                            ${formatMoney(
                                payment.total_amount
                            )}

                        </strong>

                    </td>


                    <td>

                        ${escapeHtml(
                            payment.notes ||
                            "-"
                        )}

                    </td>

                </tr>

            `;

        }
    );


    paymentsTableBody.innerHTML =
        rows;

}


function updatePaymentSummary() {

    const total =
        payments.reduce(
            (sum, payment) =>
                sum +
                Number(
                    payment.total_amount
                ),
            0
        );


    totalPayments.textContent =
        formatMoney(total);


    paymentCount.textContent =
        payments.length;


    if (payments.length > 0) {

        latestPayment.textContent =
            formatMoney(
                payments[0].total_amount
            );

    } else {

        latestPayment.textContent =
            "-";

    }

}


function filterPayments() {

    const search =
        paymentSearch.value
            .trim()
            .toLowerCase();


    if (!search) {

        displayPayments(
            payments
        );

        return;

    }


    const filtered =
        payments.filter(
            payment => {

                return (

                    String(
                        payment.payment_id
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        payment.company_name ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        payment.payment_references ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        payment.notes ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)

                );

            }
        );


    displayPayments(
        filtered
    );

}


paymentCustomer.addEventListener(
    "change",
    loadCustomerInvoices
);


paymentAmount.addEventListener(
    "input",
    updateAllocationSummary
);


paymentForm.addEventListener(
    "submit",
    savePayment
);


paymentSearch.addEventListener(
    "input",
    filterPayments
);


paymentModalElement.addEventListener(
    "shown.bs.modal",
    () => {

        setToday();

    }
);


paymentModalElement.addEventListener(
    "hidden.bs.modal",
    resetPaymentForm
);


loadCustomers();

loadPayments();
