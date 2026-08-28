const API_BASE_URL = "http://localhost:5000/api";

const menuGrid = document.getElementById("menuGrid");
const menuStatus = document.getElementById("menuStatus");
const menuSearch = document.getElementById("menuSearch");
const categoryFilter = document.getElementById("categoryFilter");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileNav = document.getElementById("mobileNav");

let menuItems = [];

async function loadMenu() {
    menuStatus.textContent = "Loading menu...";

    try {
        const response = await fetch(`${API_BASE_URL}/menu`);

        if (!response.ok) {
            throw new Error(
                `Menu request failed with status ${response.status}`
            );
        }

        const data = await response.json();

        menuItems = Array.isArray(data) ? data : [];

        buildCategoryFilter(menuItems);
        renderMenu();

    } catch (error) {
        console.error("Error loading menu:", error);

        menuStatus.textContent =
            "Unable to load the menu. Make sure the backend is running on port 5000.";

        menuGrid.innerHTML = `
            <div class="empty-state">
                <h3>Menu unavailable</h3>
                <p>
                    Check that your backend server is running
                    and try again.
                </p>
            </div>
        `;
    }
}

function buildCategoryFilter(items) {
    const categories = [
        ...new Set(
            items
                .map(item => item.category)
                .filter(
                    category =>
                        category &&
                        String(category).trim()
                )
        )
    ].sort();

    categoryFilter.innerHTML =
        '<option value="all">All categories</option>';

    categories.forEach(category => {
        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryFilter.appendChild(option);
    });
}

function renderMenu() {
    const searchTerm =
        menuSearch.value.trim().toLowerCase();

    const selectedCategory =
        categoryFilter.value;

    const filteredItems = menuItems.filter(item => {
        const name =
            String(item.name || "").toLowerCase();

        const description =
            String(item.description || "").toLowerCase();

        const category =
            String(item.category || "");

        const matchesSearch =
            !searchTerm ||
            name.includes(searchTerm) ||
            description.includes(searchTerm);

        const matchesCategory =
            selectedCategory === "all" ||
            category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    menuGrid.innerHTML = "";

    if (filteredItems.length === 0) {
        menuStatus.textContent =
            menuItems.length === 0
                ? "No menu items have been added yet."
                : "No menu items match your search.";

        menuGrid.innerHTML = `
            <div class="empty-state">
                <h3>No items found</h3>
                <p>
                    Try another search or category.
                </p>
            </div>
        `;

        return;
    }

    menuStatus.textContent =
        `${filteredItems.length} menu item${
            filteredItems.length === 1 ? "" : "s"
        }`;

    filteredItems.forEach(item => {
        const card =
            document.createElement("article");

        card.className = "menu-card";

        const imageUrl =
            String(item.image_url || "").trim();

        const safeName =
            escapeHtml(item.name || "Menu item");

        const safeDescription =
            escapeHtml(
                item.description ||
                "A delicious choice from our menu."
            );

        const safeCategory =
            escapeHtml(item.category || "Menu");

        const price =
            Number(item.price);

        const imageMarkup = imageUrl
            ? `
                <img
                    class="menu-image"
                    src="${escapeAttribute(imageUrl)}"
                    alt="${safeName}"
                    loading="lazy"
                >
              `
            : `
                <div
                    class="menu-image-placeholder"
                    aria-label="No image available"
                >
                    🍽
                </div>
              `;

        card.innerHTML = `
            ${imageMarkup}

            <div class="menu-card-body">
                <div class="menu-card-top">
                    <h3>${safeName}</h3>

                    <span class="menu-price">
                        ${formatPrice(price)}
                    </span>
                </div>

                <span class="menu-category">
                    ${safeCategory}
                </span>

                <p class="menu-description">
                    ${safeDescription}
                </p>
            </div>
        `;

        menuGrid.appendChild(card);
    });
}

function formatPrice(price) {
    if (!Number.isFinite(price)) {
        return "Price unavailable";
    }

    return `$${price.toFixed(2)}`;
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

menuSearch.addEventListener(
    "input",
    renderMenu
);

categoryFilter.addEventListener(
    "change",
    renderMenu
);

mobileMenuButton?.addEventListener(
    "click",
    () => {
        mobileNav.classList.toggle("open");
    }
);

loadMenu();
