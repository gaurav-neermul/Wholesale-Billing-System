const saveProductBtn = document.getElementById("saveProductBtn")
const updateProductBtn = document.getElementById("updateProductBtn")
const tableBody = document.getElementById("productTableBody");
const searchProduct = document.getElementById("searchProduct");
const addProductForm = document.getElementById("addProductForm");
const productName = document.getElementById("productName");
const defaultPrice = document.getElementById("defaultPrice");
const minimumStock = document.getElementById("minimumStock");
const trackInventory = document.getElementById("trackInventory");
const addProductModal = document.getElementById("addProductModal");
const editProductForm = document.getElementById("editProductForm");
const editProductId = document.getElementById("editProductId");
const editProductName = document.getElementById("editProductName");
const editDefaultPrice = document.getElementById("editDefaultPrice");
const editMinimumStock = document.getElementById("editMinimumStock");
const editTrackInventory = document.getElementById("editTrackInventory");
const editProductModal = document.getElementById("editProductModal");
const statusModal = document.getElementById("statusModal");
const statusModalTitle = document.getElementById("statusModalTitle");
const statusModalMessage = document.getElementById("statusModalMessage");
const confirmStatusBtn = document.getElementById("confirmStatusBtn");

const modal = new bootstrap.Modal(addProductModal); //this create a JS object that lets me control this Bootstrap modal
const editModal = new bootstrap.Modal(editProductModal);
const statusConfirmationModal = new bootstrap.Modal(statusModal);

searchProduct.addEventListener("input", searchProducts);
addProductForm.addEventListener("submit", addProduct);
editProductForm.addEventListener("submit", updateProduct);
confirmStatusBtn.addEventListener("click", updateProductStatus);
const MESSAGES = {
    LOAD_ERROR: "Unable to load products.",
    CREATE_SUCCESS: "Product created successfully.",
    CREATE_ERROR: "Unable to create product.",
    UPDATE_SUCCESS: "Product updated successfully.",
    UPDATE_ERROR: "Unable to update product."
};

let products = []; // Stores customers loaded from the database
let selectedProductId = null;
let selectedProductStatus = null;

async function loadProducts() {

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                Loading products...
            </td>
        </tr>
    `;

    try {
        const response = await fetch("/products");
        if (!response.ok) {
            throw new Error(MESSAGES.LOAD_ERROR);
        }
        const data = await response.json();
        products = data;
        displayProducts(products);

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

function displayProducts(products) {
    if (products.length === 0) {
        tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-5">

                <i class="bi bi-box-seam display-4 text-secondary"></i>

                <h5 class="mt-3">
                    No products found
                </h5>

                <p class="text-muted mb-3">
                    Click "Add Product" to create your first product.
                </p>

                <button
                    class="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#addProductModal">

                    <i class="bi bi-plus-circle me-2"></i>

                    Add Product

                </button>

            </td>
        </tr>
    `;

        return;
    }
    let rows = "";

    products.forEach(product => {
        rows += `
            <tr>
                <td>${product.product_name}</td>

                <td>Rs ${Number(product.default_price).toFixed(2)}</td>

                <td>
                    ${product.track_inventory
                ? '<span class="badge bg-success">Yes</span>'
                : '<span class="badge bg-secondary">No</span>'}
                </td>

                <td>${Number(product.minimum_stock).toFixed(2)}</td>

                <td class="status-cell">
                    <span class="status-badge ${product.is_active ? "bg-success" : "bg-danger"}">
                        ${product.is_active ? "Active" : "Inactive"}
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
                                    data-id="${product.product_id}">
                                    <i class="bi bi-pencil-square me-2"></i>
                                    Edit Product
                                </button>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <button
                                    class="dropdown-item status-btn"
                                    data-id="${product.product_id}"
                                    data-status="${product.is_active}">
                                    <i class="bi ${product.is_active ? "bi-box-arrow-down" : "bi-box-arrow-in-down"} me-2"></i>
                                    ${product.is_active
                ? "Deactivate Product"
                : "Activate Product"}
                                </button>
                            </li>
                        </ul>
                    </div>
                </td>
            </tr>
        `;
    });
    tableBody.innerHTML = rows;
    attachEditButtonEvents();
    attachStatusButtonEvents();
}

loadProducts();

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
            "click", openStatusConfirmation
        )
    })
}

function openStatusConfirmation(event) {
    const button = event.target.closest(".status-btn");
    const productId = Number(button.dataset.id)

    const currentStatus =
        button.dataset.status === "true";
    selectedProductId = productId;
    selectedProductStatus = currentStatus;
    //console.log(customerId)
    //console.log(currentStatus)

    const product = products.find(
        product => product.product_id === productId
    );

    statusModalTitle.textContent = currentStatus
        ? "Deactivate Product"
        : "Activate Product";

    statusModalMessage.textContent = currentStatus
        ? `Are you sure you want to deactivate "${product.product_name}"?`
        : `Are you sure you want to activate "${product.product_name}"?`;

    confirmStatusBtn.textContent = currentStatus
        ? "Deactivate"
        : "Activate";

    statusConfirmationModal.show();

}

function openEditModal(event) {
    const button = event.target.closest(".edit-btn");
    const productId = Number(button.dataset.id);
    //console.log(customerId);
    const product = products.find(
        product => product.product_id === productId
    );
    // from the customer array, Search until you find the first customer that matches
    //find was used bcz it rtns one obj whereas filter returns an array 
    //console.log(customer)3

    editProductId.value = product.product_id;
    editProductName.value = product.product_name; //here we are taking the company name and put in inside the textbox 

    editDefaultPrice.value = product.default_price;
    editMinimumStock.value = product.minimum_stock;
    editTrackInventory.checked = product.track_inventory; //if psql saays track inventory is true then switch becomeds on and if false -> off 
    editModal.show()
}

function searchProducts() {
    const searchText = searchProduct.value.toLowerCase().trim(); //read input 
    const filteredProducts = products.filter(product => //It creates a new array containing only matching customers.
        product.product_name.toLowerCase().includes(searchText)
    );
    displayProducts(filteredProducts);

}
async function addProduct(event) {
    event.preventDefault();
    saveProductBtn.disabled = true;

    saveProductBtn.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2"></span>
    Saving...
`;

    //  console.log("Submitting...")
    const product = {
        product_name: productName.value.trim(),
        default_price: Number(defaultPrice.value),
        minimum_stock: Number(minimumStock.value),
        track_inventory: trackInventory.checked
    };

    if (product.product_name === "") {
        showToast("Product name is required.", "danger");

        saveProductBtn.disabled = false;
        saveProductBtn.innerHTML = "Save Product";

        productName.focus();

        return;
    }

    if (product.default_price < 0) {
        showToast("Default price cannot be negative.", "danger");

        saveProductBtn.disabled = false;
        saveProductBtn.innerHTML = "Save Product";

        defaultPrice.focus();

        return;
    }

    if (product.minimum_stock < 0) {
        showToast("Minimum stock cannot be negative.", "danger");

        saveProductBtn.disabled = false;
        saveProductBtn.innerHTML = "Save Product";

        minimumStock.focus(); //cursor moves automatically if not filled

        return;
    }
    try {
        const response = await fetch("/products", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(product)
        });
        if (!response.ok) {
            throw new Error(MESSAGES.CREATE_ERROR)
        }
        const result = await response.json()

        showToast(MESSAGES.CREATE_SUCCESS, "success");

        modal.hide()
        addProductForm.reset();
        trackInventory.checked = true;

        await loadProducts();
    } catch (error) {
        showToast(error.message, "danger");
    }


}


async function updateProduct(event) {
    event.preventDefault();
    const productId = editProductId.value

    const product = {
        product_name: editProductName.value.trim(),
        default_price: Number(editDefaultPrice.value),
        minimum_stock: Number(editMinimumStock.value),
        track_inventory: editTrackInventory.checked
    };
    // console.log(productId); 
    // console.log(product)
    try {
        const response = await fetch(`/products/${productId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(product)
        });
        if (!response.ok) {
            throw new Error(MESSAGES.UPDATE_ERROR);
        }
        const result = await response.json()

        showToast(MESSAGES.UPDATE_SUCCESS, "success");

        editModal.hide()
        editProductForm.reset()
        await loadProducts()

    } catch (error) {
        showToast(error.message, "danger");
    }
}

async function updateProductStatus() {
    try {
        const response = await fetch(
            `/products/${selectedProductId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    is_active: !selectedProductStatus
                })
            }
        );
        if (!response.ok) {
            throw new Error("Unable to update product status.")
        }
        statusConfirmationModal.hide()

        await loadProducts()

        showToast(
            selectedProductStatus
                ? "Product deactivated successfully."
                : "Product activated successfully",
            "danger"
        );

    } catch (error) {
        showToast(error.message, "danger");
    }
}
