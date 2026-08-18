const inventoryTableBody =
    document.getElementById("inventoryTableBody");

const searchInventory =
    document.getElementById("searchInventory");

const stockFilter =
    document.getElementById("stockFilter");

const totalProductsCount =
    document.getElementById("totalProductsCount");

const inStockCount =
    document.getElementById("inStockCount");

const lowStockCount =
    document.getElementById("lowStockCount");

const outOfStockCount =
    document.getElementById("outOfStockCount");

const stockInModalElement =
    document.getElementById("stockInModal");

const adjustStockModalElement =
    document.getElementById("adjustStockModal");

const stockInModal =
    new bootstrap.Modal(stockInModalElement);

const adjustStockModal =
    new bootstrap.Modal(adjustStockModalElement);

const stockInForm =
    document.getElementById("stockInForm");

const stockInProduct =
    document.getElementById("stockInProduct");

const stockInQuantity =
    document.getElementById("stockInQuantity");

const saveStockInBtn =
    document.getElementById("saveStockInBtn");

const adjustStockForm =
    document.getElementById("adjustStockForm");

const adjustStockProduct =
    document.getElementById("adjustStockProduct");

const adjustStockCurrent =
    document.getElementById("adjustStockCurrent");

const adjustStockQuantity =
    document.getElementById("adjustStockQuantity");


let inventory = [];

let selectedProductId = null;


const MESSAGES = {

    LOAD_ERROR:
        "Unable to load inventory.",

    STOCK_IN_SUCCESS:
        "Stock added successfully.",

    STOCK_IN_ERROR:
        "Unable to add stock.",

    ADJUST_SUCCESS:
        "Inventory updated successfully.",

    ADJUST_ERROR:
        "Unable to update inventory."

};


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


function formatDate(dateValue) {

    if (!dateValue) {

        return "-";

    }

    const value =
        String(dateValue).split("T")[0];

    const parts =
        value.split("-");

    if (parts.length !== 3) {

        return new Date(
            dateValue
        ).toLocaleDateString();

    }

    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    ).toLocaleDateString();

}


function getStockStatus(item) {

    const stock =
        Number(item.current_stock);

    const minimum =
        Number(item.minimum_stock);

    if (stock <= 0) {

        return "out-of-stock";

    }

    if (stock <= minimum) {

        return "low-stock";

    }

    return "in-stock";

}


function getStockBadge(item) {

    const status =
        getStockStatus(item);

    if (status === "out-of-stock") {

        return `
            <span class="badge bg-danger">
                Out of Stock
            </span>
        `;

    }

    if (status === "low-stock") {

        return `
            <span class="badge bg-warning text-dark">
                Low Stock
            </span>
        `;

    }

    return `
        <span class="badge bg-success">
            In Stock
        </span>
    `;

}


function updateDashboardCards() {

    totalProductsCount.textContent =
        inventory.length;

    inStockCount.textContent =
        inventory.filter(
            item =>
                getStockStatus(item) ===
                "in-stock"
        ).length;

    lowStockCount.textContent =
        inventory.filter(
            item =>
                getStockStatus(item) ===
                "low-stock"
        ).length;

    outOfStockCount.textContent =
        inventory.filter(
            item =>
                getStockStatus(item) ===
                "out-of-stock"
        ).length;

}


async function loadInventory() {

    inventoryTableBody.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="text-center py-4">

                Loading inventory...

            </td>

        </tr>

    `;

    try {

        const response =
            await fetch("/inventory");

        if (!response.ok) {

            const result =
                await response
                    .json()
                    .catch(
                        () => ({})
                    );

            throw new Error(
                result.message ||
                MESSAGES.LOAD_ERROR
            );

        }

        inventory =
            await response.json();

        updateDashboardCards();

        filterInventory();

    } catch (error) {

        inventoryTableBody.innerHTML = `

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


function filterInventory() {

    const searchText =
        searchInventory.value
            .toLowerCase()
            .trim();

    const selectedStatus =
        stockFilter.value;

    const filteredInventory =
        inventory.filter(item => {

            const productName =
                (
                    item.product_name ||
                    ""
                )
                .toLowerCase();

            const matchesSearch =
                productName.includes(
                    searchText
                );

            const matchesStatus =
                selectedStatus === "" ||
                getStockStatus(item) ===
                selectedStatus;

            return (
                matchesSearch &&
                matchesStatus
            );

        });

    displayInventory(
        filteredInventory
    );

}


function displayInventory(items) {

    if (items.length === 0) {

        inventoryTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="text-center py-4">

                    No inventory records found.

                </td>

            </tr>

        `;

        return;

    }


    let rows = "";


    items.forEach(item => {

        const stock =
            Number(item.current_stock);

        const minimum =
            Number(item.minimum_stock);


        rows += `

            <tr>

                <td>

                    <div class="fw-semibold">

                        ${escapeHtml(
                            item.product_name
                        )}

                    </div>

                    ${
                        item.track_inventory
                            ? ""
                            : `
                                <small class="text-muted">
                                    Inventory tracking disabled
                                </small>
                              `
                    }

                </td>


                <td>

                    <span class="fw-bold">

                        ${stock.toFixed(2)}

                    </span>

                </td>


                <td>

                    ${minimum.toFixed(2)}

                </td>


                <td>

                    ${getStockBadge(item)}

                </td>


                <td>

                    ${formatDate(
                        item.last_stock_in
                    )}

                </td>


                <td class="text-end">

                    ${
                        item.track_inventory

                            ?

                            `

                            <div class="d-flex justify-content-end gap-2 flex-wrap">

                                <button
                                    type="button"
                                    class="btn btn-sm btn-success stock-in-btn"
                                    data-id="${item.product_id}"
                                    data-name="${escapeHtml(
                                        item.product_name
                                    )}">

                                    <i class="bi bi-plus-circle me-1"></i>

                                    Add Stock

                                </button>


                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-primary adjust-stock-btn"
                                    data-id="${item.product_id}"
                                    data-name="${escapeHtml(
                                        item.product_name
                                    )}"
                                    data-stock="${stock}">

                                    <i class="bi bi-sliders me-1"></i>

                                    Adjust

                                </button>

                            </div>

                            `

                            :

                            `

                            <span class="text-muted">

                                Not tracked

                            </span>

                            `

                    }

                </td>

            </tr>

        `;

    });


    inventoryTableBody.innerHTML =
        rows;

}


function openStockInModal(
    productId,
    productName
) {

    selectedProductId =
        Number(productId);

    stockInProduct.value =
        productName;

    stockInQuantity.value =
        "";

    stockInModal.show();

}


function openAdjustStockModal(
    productId,
    productName,
    currentStock
) {

    selectedProductId =
        Number(productId);

    adjustStockProduct.value =
        productName;

    adjustStockCurrent.value =
        Number(currentStock).toFixed(2);

    adjustStockQuantity.value =
        Number(currentStock).toFixed(2);

    adjustStockModal.show();

}


async function addStock(event) {

    event.preventDefault();


    if (!selectedProductId) {

        return;

    }


    const quantity =
        Number(
            stockInQuantity.value
        );


    if (
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {

        showToast(
            "Stock quantity must be greater than zero.",
            "danger"
        );

        return;

    }


    saveStockInBtn.disabled =
        true;

    saveStockInBtn.innerHTML = `

        <span
            class="spinner-border spinner-border-sm me-1"
            role="status"
            aria-hidden="true">
        </span>

        Adding...

    `;


    try {

        const response =
            await fetch(
                `/inventory/${selectedProductId}/stock-in`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            quantity
                        })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                MESSAGES.STOCK_IN_ERROR
            );

        }


        stockInModal.hide();


        showToast(
            result.message ||
            MESSAGES.STOCK_IN_SUCCESS,
            "success"
        );


        selectedProductId =
            null;


        await loadInventory();

    } catch (error) {

        showToast(
            error.message,
            "danger"
        );

    } finally {

        saveStockInBtn.disabled =
            false;

        saveStockInBtn.innerHTML = `

            <i class="bi bi-plus-circle me-1"></i>

            Add Stock

        `;

    }

}


async function adjustStock(event) {

    event.preventDefault();


    if (!selectedProductId) {

        return;

    }


    const newStock =
        Number(
            adjustStockQuantity.value
        );


    if (
        !Number.isFinite(newStock) ||
        newStock < 0
    ) {

        showToast(
            "Stock cannot be negative.",
            "danger"
        );

        return;

    }


    const submitButton =
        adjustStockForm.querySelector(
            'button[type="submit"]'
        );


    submitButton.disabled =
        true;


    submitButton.innerHTML = `

        <span
            class="spinner-border spinner-border-sm me-1"
            role="status"
            aria-hidden="true">
        </span>

        Saving...

    `;


    try {

        const response =
            await fetch(
                `/inventory/${selectedProductId}`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            current_stock:
                                newStock
                        })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                MESSAGES.ADJUST_ERROR
            );

        }


        adjustStockModal.hide();


        showToast(
            result.message ||
            MESSAGES.ADJUST_SUCCESS,
            "success"
        );


        selectedProductId =
            null;


        await loadInventory();

    } catch (error) {

        showToast(
            error.message,
            "danger"
        );

    } finally {

        submitButton.disabled =
            false;

        submitButton.innerHTML = `

            <i class="bi bi-check-circle me-1"></i>

            Save Adjustment

        `;

    }

}


inventoryTableBody.addEventListener(
    "click",
    event => {

        const stockInButton =
            event.target.closest(
                ".stock-in-btn"
            );


        if (stockInButton) {

            openStockInModal(
                stockInButton.dataset.id,
                stockInButton.dataset.name
            );

            return;

        }


        const adjustButton =
            event.target.closest(
                ".adjust-stock-btn"
            );


        if (adjustButton) {

            openAdjustStockModal(
                adjustButton.dataset.id,
                adjustButton.dataset.name,
                adjustButton.dataset.stock
            );

        }

    }
);


searchInventory.addEventListener(
    "input",
    filterInventory
);


stockFilter.addEventListener(
    "change",
    filterInventory
);


stockInForm.addEventListener(
    "submit",
    addStock
);


adjustStockForm.addEventListener(
    "submit",
    adjustStock
);


stockInModalElement.addEventListener(
    "hidden.bs.modal",
    () => {

        stockInForm.reset();

        selectedProductId =
            null;

    }
);


adjustStockModalElement.addEventListener(
    "hidden.bs.modal",
    () => {

        adjustStockForm.reset();

        selectedProductId =
            null;

    }
);


loadInventory();

