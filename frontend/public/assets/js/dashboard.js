const API_BASE_URL = "http://localhost:5000/api";

const totalOrdersElement = document.getElementById("totalOrders");
const totalRevenueElement = document.getElementById("totalRevenue");
const pendingOrdersElement = document.getElementById("pendingOrders");
const analyticsStatusElement = document.getElementById("analyticsStatus");

const menuManagementGrid = document.getElementById("menuManagementGrid");
const menuManagementStatus = document.getElementById("menuManagementStatus");

const addMenuSection = document.getElementById("addMenuSection");
const showAddMenuButton = document.getElementById("showAddMenuButton");
const cancelAddMenuButton = document.getElementById("cancelAddMenuButton");
const addMenuForm = document.getElementById("addMenuForm");
const addMenuButton = document.getElementById("addMenuButton");
const addMenuMessage = document.getElementById("addMenuMessage");

const refreshDashboardButton = document.getElementById("refreshDashboard");

const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileNav = document.getElementById("mobileNav");

const menuName = document.getElementById("menuName");
const menuPrice = document.getElementById("menuPrice");
const menuCategory = document.getElementById("menuCategory");
const menuImageUrl = document.getElementById("menuImageUrl");
const menuDescription = document.getElementById("menuDescription");

let menuItems = [];

function getNumber(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {
        const cleaned = value.replace(/[^0-9.-]/g, "");
        const number = Number(cleaned);

        return Number.isFinite(number) ? number : 0;
    }

    return 0;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
    }).format(amount);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

async function loadAnalytics() {
    analyticsStatusElement.textContent = "Loading analytics...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/analytics/direct`
        );

        if (!response.ok) {
            throw new Error(
                `Analytics request failed with status ${response.status}`
            );
        }

        const data = await response.json();

        totalOrdersElement.textContent =
            getNumber(data.totalOrders);

        totalRevenueElement.textContent =
            formatCurrency(getNumber(data.totalRevenue));

        pendingOrdersElement.textContent =
            getNumber(data.pendingOrders);

        analyticsStatusElement.textContent =
            "Analytics updated successfully.";
    } catch (error) {
        console.error("Error loading analytics:", error);

        analyticsStatusElement.textContent =
            "Unable to load analytics right now.";
    }
}

async function loadMenu() {
    menuManagementStatus.textContent = "Loading menu...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/menu/direct`
        );

        if (!response.ok) {
            throw new Error(
                `Menu request failed with status ${response.status}`
            );
        }

        const data = await response.json();

        menuItems = Array.isArray(data) ? data : [];

        renderMenuManagement();
    } catch (error) {
        console.error("Error loading menu:", error);

        menuManagementStatus.textContent =
            "Unable to load the menu right now.";

        menuManagementGrid.innerHTML = `
            <div class="empty-state">
                <h3>Menu unavailable</h3>
                <p>
                    Check that the backend server is running
                    and try again.
                </p>
            </div>
        `;
    }
}

function renderMenuManagement() {
    menuManagementGrid.innerHTML = "";

    if (!menuItems.length) {
        menuManagementStatus.textContent =
            "No menu items have been added yet.";

        menuManagementGrid.innerHTML = `
            <div class="empty-state">
                <h3>Your menu is empty</h3>
                <p>
                    Add your first menu item using the form below.
                </p>
            </div>
        `;

        return;
    }

    menuManagementStatus.textContent =
        `${menuItems.length} menu item${
            menuItems.length === 1 ? "" : "s"
        }`;

    menuItems.forEach(item => {
        const card = document.createElement("article");

        card.className = "menu-management-card";

        const imageUrl =
            String(item.image_url || "").trim();

        const safeName =
            escapeHtml(item.name || "Menu item");

        const safeDescription =
            escapeHtml(
                item.description ||
                "No description provided."
            );

        const safeCategory =
            escapeHtml(item.category || "Menu");

        const price =
            getNumber(item.price);

        const isAvailable =
            item.is_available !== false;

        const availabilityClass =
            isAvailable ? "" : "unavailable";

        const availabilityText =
            isAvailable ? "Available" : "Unavailable";

        const imageMarkup = imageUrl
            ? `
                <img
                    class="menu-management-image"
                    src="${escapeAttribute(imageUrl)}"
                    alt="${safeName}"
                    loading="lazy"
                >
            `
            : `
                <div
                    class="menu-management-placeholder"
                    aria-label="No image available"
                >
                    🍽
                </div>
            `;

        card.innerHTML = `
            ${imageMarkup}

            <div class="menu-management-body">

                <div class="menu-management-top">
                    <h3>${safeName}</h3>

                    <span class="menu-management-price">
                        ${formatCurrency(price)}
                    </span>
                </div>

                <span class="menu-management-category">
                    ${safeCategory}
                </span>

                <p class="menu-management-description">
                    ${safeDescription}
                </p>

                <span class="availability ${availabilityClass}">
                    <span class="availability-dot"></span>
                    ${availabilityText}
                </span>

            </div>
        `;

        menuManagementGrid.appendChild(card);
    });
}

async function addMenuItem(event) {
    event.preventDefault();

    const name = menuName.value.trim();
    const description = menuDescription.value.trim();
    const price = Number(menuPrice.value);
    const category = menuCategory.value.trim();
    const image_url = menuImageUrl.value.trim();

    if (!name) {
        showAddMenuMessage(
            "Please enter a menu item name.",
            "error"
        );

        menuName.focus();

        return;
    }

    if (!Number.isFinite(price) || price <= 0) {
        showAddMenuMessage(
            "Please enter a valid price.",
            "error"
        );

        menuPrice.focus();

        return;
    }

    addMenuButton.disabled = true;
    addMenuButton.textContent = "Adding item...";
    showAddMenuMessage("");

    try {
        const response = await fetch(
            `${API_BASE_URL}/menu/direct`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    description,
                    price,
                    category,
                    image_url
                })
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.error ||
                `Menu request failed with status ${response.status}`
            );
        }

        showAddMenuMessage(
            "Menu item added successfully.",
            "success"
        );

        addMenuForm.reset();

        await loadMenu();
    } catch (error) {
        console.error("Error adding menu item:", error);

        showAddMenuMessage(
            error.message ||
            "Unable to add menu item.",
            "error"
        );
    } finally {
        addMenuButton.disabled = false;
        addMenuButton.textContent = "Add Menu Item";
    }
}

function showAddMenuMessage(message, type = "") {
    addMenuMessage.textContent = message;
    addMenuMessage.className = `form-message ${type}`;
}

function showAddMenuForm() {
    addMenuSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    menuName.focus();
}

function hideAddMenuForm() {
    addMenuForm.reset();
    showAddMenuMessage("");
}

async function refreshDashboard() {
    refreshDashboardButton.disabled = true;
    refreshDashboardButton.textContent = "Refreshing...";

    await Promise.all([
        loadAnalytics(),
        loadMenu()
    ]);

    refreshDashboardButton.disabled = false;
    refreshDashboardButton.textContent = "Refresh";
}

showAddMenuButton.addEventListener(
    "click",
    showAddMenuForm
);

cancelAddMenuButton.addEventListener(
    "click",
    hideAddMenuForm
);

addMenuForm.addEventListener(
    "submit",
    addMenuItem
);

refreshDashboardButton.addEventListener(
    "click",
    refreshDashboard
);

mobileMenuButton?.addEventListener(
    "click",
    () => {
        mobileNav.classList.toggle("open");
    }
);

loadAnalytics();
loadMenu();