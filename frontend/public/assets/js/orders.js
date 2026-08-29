const API_URL = "https://ai-powered-resturant.onrender.com/api/orders";

const cartItemsElement = document.getElementById("cartItems");
const cartTotalElement = document.getElementById("cartTotal");
const orderForm = document.getElementById("orderForm");
const customerNameElement = document.getElementById("customerName");
const orderMessageElement = document.getElementById("orderMessage");
const placeOrderButton = document.getElementById("placeOrderButton");
const ordersListElement = document.getElementById("orders-List");
const refreshOrdersButton = document.getElementById("refreshOrders");

let cart = [];
let cartTotal = 0;

function readCart() {
    const possibleKeys = ["cart", "restaurantCart", "menuCart"];

    for (const key of possibleKeys) {
        try {
            const saved = localStorage.getItem(key);

            if (!saved) {
                continue;
            }

            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed)) {
                return parsed;
            }

            if (parsed && Array.isArray(parsed.items)) {
                return parsed.items;
            }

            if (parsed && Array.isArray(parsed.cart)) {
                return parsed.cart;
            }
        } catch (error) {
            continue;
        }
    }

    return [];
}

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

function getItemName(item) {
    return item.name || item.title || item.item_name || item.menu_name || "Menu item";
}

function getItemPrice(item) {
    return getNumber(item.price ?? item.amount ?? item.unit_price ?? item.cost);
}

function getItemQuantity(item) {
    const quantity = Number(item.quantity ?? item.qty ?? 1);
    return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
    }).format(amount);
}

function renderCart() {
    cartItemsElement.innerHTML = "";
    cartTotal = 0;

    if (!cart.length) {
        cartItemsElement.innerHTML = `
            <div class="empty-cart">
                <span class="empty-icon">+</span>
                <h4>Your order is empty</h4>
                <p>Go back to the menu and choose something you like.</p>
                <a href="menu.html" class="button button-dark">Explore Menu</a>
            </div>
        `;

        cartTotalElement.textContent = formatCurrency(0);
        placeOrderButton.disabled = true;
        return;
    }

    placeOrderButton.disabled = false;

    cart.forEach((item) => {
        const quantity = getItemQuantity(item);
        const price = getItemPrice(item);
        const lineTotal = price * quantity;

        cartTotal += lineTotal;

        const row = document.createElement("div");
        row.className = "cart-row";

        row.innerHTML = `
            <div class="item-name">${escapeHtml(getItemName(item))}</div>
            <div class="item-quantity">x${quantity}</div>
            <div class="item-price">${formatCurrency(lineTotal)}</div>
        `;

        cartItemsElement.appendChild(row);
    });

    cartTotalElement.textContent = formatCurrency(cartTotal);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showMessage(message, type = "") {
    orderMessageElement.textContent = message;
    orderMessageElement.className = `order-message ${type}`;
}

function clearSavedCart() {
    ["cart", "restaurantCart", "menuCart"].forEach((key) => {
        localStorage.removeItem(key);
    });
}

async function placeOrder(event) {
    event.preventDefault();

    const customerName = customerNameElement.value.trim();

    if (!customerName) {
        showMessage("Please enter your name.", "error");
        customerNameElement.focus();
        return;
    }

    if (cartTotal <= 0) {
        showMessage("Your order is empty. Add something from the menu first.", "error");
        return;
    }

    placeOrderButton.disabled = true;
    placeOrderButton.textContent = "Placing order...";
    showMessage("");

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customer_name: customerName,
                total_amount: cartTotal
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || "Unable to place order.");
        }

        showMessage("Order placed successfully.", "success");
        clearSavedCart();
        cart = [];
        renderCart();
        customerNameElement.value = "";
        loadOrders();
    } catch (error) {
        showMessage(error.message || "Something went wrong. Please try again.", "error");
    } finally {
        placeOrderButton.textContent = "Place Order";

        if (cartTotal > 0) {
            placeOrderButton.disabled = false;
        }
    }
}

async function loadOrders() {
    ordersListElement.innerHTML= '<div class="loading-state">Loading recent orders...</div>';

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to load orders.");
        }

        const orders = await response.json();
        renderOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
        ordersListElement.innerHTML = `
            <div class="no-orders">
                Could not load orders right now. Please try again.
            </div>
        `;
    }
}

function renderOrders(orders) {
    if (!orders.length) {
        ordersListElement.innerHTML = `
            <div class="no-orders">
                No orders have been placed yet.
            </div>
        `;
        return;
    }

    ordersListElement.innerHTML = "";

    orders.forEach((order) => {
        const row = document.createElement("div");
        row.className = "order-history-row";

        const name = escapeHtml(order.customer_name || "Guest");
        const amount = getNumber(order.total_amount);
        const status = escapeHtml(order.status || "pending");
        const date = formatDate(order.created_at);

        row.innerHTML = `
            <div class="history-name">${name}</div>
            <div class="history-date">${date}</div>
            <div class="history-total">${formatCurrency(amount)}</div>
            <div class="status">${status}</div>
        `;

        ordersListElement.appendChild(row);
    });
}

function formatDate(value) {
    if (!value) {
        return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    }).format(date);
}

orderForm.addEventListener("submit", placeOrder);
refreshOrdersButton.addEventListener("click", loadOrders);

cart = readCart();
renderCart();
loadOrders();
