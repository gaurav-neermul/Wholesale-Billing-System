const COMPANY = {

    name: "Madhvi Product",

    logo: "../images/logo.jpg",

    address: "Marigold Ave, Belle Mare",

    telephone: "4155755",

    mobile: "57507021",

    whatsapp: "58203697",

    email: "madhviproductbm@gmail.com",

    brn: "I06004600"

};

const params = new URLSearchParams(window.location.search);

const invoiceId = params.get("id");

const companyTel = document.getElementById("companyTel");
const companyMobile = document.getElementById("companyMobile");
const companyWhatsapp = document.getElementById("companyWhatsapp");
const companyEmail = document.getElementById("companyEmail");
const companyBrn = document.getElementById("companyBrn");

const customerName = document.getElementById("customerName");
const customerAddress = document.getElementById("customerAddress");
const customerBrn = document.getElementById("customerBrn");
const customerPo = document.getElementById("customerPo");

const invoiceNumber = document.getElementById("invoiceNumber");
const invoiceDate = document.getElementById("invoiceDate");

const remarks = document.getElementById("remarks");

const invoiceItems = document.getElementById("invoiceItems");

const grandTotal = document.getElementById("grandTotal");

const printBtn = document.getElementById("printBtn");

printBtn.addEventListener("click", () => {

    window.print();

});

async function loadInvoice() {

    try {

        const response = await fetch(
            `/invoices/${invoiceId}/print`
        );

        const result = await response.json();

        if (!response.ok) {

            throw new Error(result.message);

        }

        const invoice = result.invoice;

        companyTel.textContent =
            COMPANY.telephone;

        companyMobile.textContent =
            COMPANY.mobile;

        companyWhatsapp.textContent =
            COMPANY.whatsapp;

        companyEmail.textContent =
            COMPANY.email;

        companyBrn.textContent =
            COMPANY.brn;

        customerName.textContent =
            invoice.company_name;

        customerAddress.textContent =
            invoice.address || "-";

        customerBrn.textContent =
            invoice.company_brn || "-";

        customerPo.textContent =
            invoice.customer_po_number || "-";

        invoiceNumber.textContent =
            invoice.invoice_number;

        invoiceDate.textContent =
            new Date(invoice.invoice_date).toLocaleDateString();

        remarks.textContent =
            invoice.notes || "-";

        let rows = "";

        let total = 0;

        result.items.forEach(item => {

            const lineTotal =
                Number(item.quantity) *
                Number(item.unit_price);

            total += lineTotal;

            rows += `

                <tr>

                    <td class="text-center">

                        ${item.quantity}

                    </td>

                    <td>

                        ${item.product_name}

                    </td>

                    <td class="text-end">

                        Rs ${Number(item.unit_price).toFixed(2)}

                    </td>

                    <td class="text-end">

                        Rs ${lineTotal.toFixed(2)}

                    </td>

                </tr>

            `;

        });

        invoiceItems.innerHTML = rows;

        grandTotal.textContent =
            `Rs ${total.toFixed(2)}`;

    }

    catch (error) {

        alert(error.message);

    }

}
loadInvoice();