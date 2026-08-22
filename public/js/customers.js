const tableBody = document.getElementById("customerTableBody");
const searchCustomer = document.getElementById("searchCustomer");
const addCustomerForm = document.getElementById("addCustomerForm");
const companyName = document.getElementById("companyName");
const companyBrn = document.getElementById("companyBrn");
const companyAddress = document.getElementById("companyAddress");
const companyPhone = document.getElementById("companyPhone");
const addCustomerModal = document.getElementById("addCustomerModal");
const editCustomerForm = document.getElementById("editCustomerForm");
const editCustomerId = document.getElementById("editCustomerId");
const editCompanyName = document.getElementById("editCompanyName");
const editCompanyBrn = document.getElementById("editCompanyBrn");
const editCompanyAddress = document.getElementById("editCompanyAddress");
const editCompanyPhone = document.getElementById("editCompanyPhone");
const editCustomerModal = document.getElementById("editCustomerModal");
const statusModal = document.getElementById("statusModal");
const statusModalTitle = document.getElementById("statusModalTitle");
const statusModalMessage = document.getElementById("statusModalMessage");
const confirmStatusBtn = document.getElementById("confirmStatusBtn");

const modal = new bootstrap.Modal(addCustomerModal); //this create a JS object that lets me control this Bootstrap modal
const editModal = new bootstrap.Modal(editCustomerModal);
const statusConfirmationModal = new bootstrap.Modal(statusModal);

searchCustomer.addEventListener("input", searchCustomers);
addCustomerForm.addEventListener("submit", addCustomer);
editCustomerForm.addEventListener("submit", updateCustomer)
confirmStatusBtn.addEventListener("click", updateCustomerStatus)

const MESSAGES = {
    LOAD_ERROR: "Unable to load customers.",
    CREATE_SUCCESS: "Customer created successfully.",
    CREATE_ERROR: "Unable to create customer.",
    UPDATE_SUCCESS: "Customer updated successfully.",
    UPDATE_ERROR: "Unable to update customer."
};

let customers = []; // Stores customers loaded from the database
let selectedCustomerId = null;
let selectedCustomerStatus = null;

async function loadCustomers() {

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                Loading customers...
            </td>
        </tr>
    `;

    try {
        const response = await fetch("/customers");

        if (!response.ok) {
            throw new Error(MESSAGES.LOAD_ERROR);
        }

        const data = await response.json();

        customers = data;

        displayCustomers(customers);

    } catch (error) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    ${error.message}
                </td>
            </tr>
        `;

        showToast(error.message, "danger");
    }

}


function displayCustomers(customers) {

    let rows = "";

    customers.forEach(customer => {

        rows += `
            <tr>

                <td>${customer.company_name}</td>

                <td>${customer.company_brn || ""}</td>

                <td>${customer.phone_number || ""}</td>

                <td>${customer.address || ""}</td>

                <td class="status-cell">

                    <span class="status-badge ${customer.is_active
                ? "bg-success"
                : "bg-danger"
            }">

                        ${customer.is_active ? "Active" : "Inactive"}

                    </span>

                </td>

                <td class="text-center">

                    <div class="dropdown">

                        <button
                            class="btn btn-sm btn-outline-secondary"
                            data-bs-toggle="dropdown">

                            <i class="bi bi-three-dots-vertical"></i>

                        </button>

                        <ul class="dropdown-menu dropdown-menu-end">

                            <li>

                                <button
                                    class="dropdown-item edit-btn"
                                    data-id="${customer.customer_id}">

                                    <i class="bi bi-pencil-square me-2"></i>

                                    Edit Customer

                                </button>

                            </li>

                            <li><hr class="dropdown-divider"></li>

                            <li>

                                <button
                                    class="dropdown-item status-btn"
                                    data-id="${customer.customer_id}"
                                    data-status="${customer.is_active}">

                                    <i class="bi ${customer.is_active
                ? "bi-person-x"
                : "bi-person-check"
            } me-2"></i>

                                    ${customer.is_active
                ? "Deactivate Customer"
                : "Activate Customer"
            }

                                </button>

                            </li>

                        </ul>

                    </div>

                </td>

            </tr>
        `;

    });

    tableBody.innerHTML = rows;

    attachEditButtonEvents()
    attachStatusButtonEvents()

}


loadCustomers();


function attachEditButtonEvents() {

    const editButtons = document.querySelectorAll(".edit-btn");

    editButtons.forEach(button => {

        button.addEventListener("click", openEditModal)

    })

}


function attachStatusButtonEvents() {

    const statusButtons = document.querySelectorAll(".status-btn")

    statusButtons.forEach(button => {

        button.addEventListener(
            "click",
            openStatusConfirmation
        )

    })

}


function openStatusConfirmation(event) {

    const button = event.target.closest(".status-btn");

    const customerId = Number(button.dataset.id)

    const currentStatus =
        button.dataset.status === "true";

    selectedCustomerId = customerId;

    selectedCustomerStatus = currentStatus;

    //console.log(customerId)
    //console.log(currentStatus)

    const customer = customers.find(
        customer => customer.customer_id === customerId
    );

    statusModalTitle.textContent = currentStatus
        ? "Deactivate Customer"
        : "Activate Customer";

    statusModalMessage.textContent = currentStatus
        ? `Are you sure you want to deactivate "${customer.company_name}"?`
        : `Are you sure you want to activate "${customer.company_name}"?`;

    confirmStatusBtn.textContent = currentStatus
        ? "Deactivate"
        : "Activate";

    statusConfirmationModal.show();

}


function openEditModal(event) {

    const button = event.target.closest(".edit-btn");

    const customerId = Number(button.dataset.id);

    //console.log(customerId);

    const customer = customers.find(
        customer => customer.customer_id === customerId
    );

    // from the customer array, Search until you find the first customer that matches
    //find was used bcz it rtns one obj whereas filter returns an array 
    //console.log(customer)3

    editCustomerId.value = customer.customer_id;

    editCompanyName.value = customer.company_name; //here we are taking the company name and put in inside the textbox 

    editCompanyBrn.value = customer.company_brn || "";

    editCompanyPhone.value = customer.phone_number || "";

    editCompanyAddress.value = customer.address || "";

    editModal.show()

}


function searchCustomers() {

    const searchText = searchCustomer.value.toLowerCase().trim(); //read input 

    const filteredCustomers = customers.filter(customer => //It creates a new array containing only matching customers.

        (customer.company_name || "").toLowerCase().includes(searchText) ||

        (customer.company_brn || "").toLowerCase().includes(searchText) ||

        (customer.phone_number || "").toLowerCase().includes(searchText) ||

        (customer.address || "").toLowerCase().includes(searchText)

    );

    displayCustomers(filteredCustomers);

}


async function addCustomer(event) {

    event.preventDefault();

    console.log("Submitting...")

    const customer = {

        company_name: companyName.value.trim(),

        company_brn: companyBrn.value.trim(),

        address: companyAddress.value.trim(),

        phone_number: companyPhone.value.trim()

    };

    try {

        const response = await fetch("/customers", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(customer)

        });

        if (!response.ok) {

            throw new Error(MESSAGES.CREATE_ERROR)

        }

        const result = await response.json()

        showToast(MESSAGES.CREATE_SUCCESS, "success");

        modal.hide()

        addCustomerForm.reset();

        loadCustomers();

    } catch (error) {

        showToast(error.message, "danger");

    }

}



async function updateCustomer(event) {

    event.preventDefault();

    const customerId = editCustomerId.value

    const customer = {

        company_name: editCompanyName.value.trim(),

        company_brn: editCompanyBrn.value.trim(),

        address: editCompanyAddress.value.trim(),

        phone_number: editCompanyPhone.value.trim()

    };

    // console.log(customerId);
    // console.log(customer)

    try {

        const response = await fetch(`/customers/${customerId}`, {

            method: "PUT",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(customer)

        });

        if (!response.ok) {

            throw new Error(MESSAGES.UPDATE_ERROR);

        }

        const result = await response.json()

        showToast(MESSAGES.UPDATE_SUCCESS, "success");

        editModal.hide()

        editCustomerForm.reset()

        loadCustomers()

    } catch (error) {

        showToast(error.message, "danger");

    }

}


async function updateCustomerStatus() {

    try {

        const response = await fetch(
            `/customers/${selectedCustomerId}/status`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    is_active: !selectedCustomerStatus
                })
            }
        );

        if (!response.ok) {

            throw new Error("Unable to update customer status.")

        }

        statusConfirmationModal.hide()

        await loadCustomers()

        showToast(
            selectedCustomerStatus
                ? "Customer deactivated successfully."
                : "Customer activated successfully",
            "danger"
        );

    } catch (error) {

        showToast(error.message, "danger");

    }

}