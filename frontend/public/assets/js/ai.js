const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const typingIndicator = document.getElementById("typingIndicator");
const orderPreview = document.getElementById("orderPreview");
const clearChatBtn = document.getElementById("clearChatBtn");

const CHAT_URL = "https://ai-powered-resturant.onrender.com/api/chat/direct";
const ORDER_URL = "https://ai-powered-resturant.onrender.com/api/orders/direct";

let history = [];
let currentOrder = null;
let isSending = false;
let customerName = "";

function addMessage(text, sender) {
    if (!chatMessages) return;

    const row = document.createElement("div");
    row.className = sender === "user"
        ? "message-row user-row"
        : "message-row assistant-row";

    if (sender !== "user") {
        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = "✦";
        row.appendChild(avatar);
    }

    const message = document.createElement("div");
    message.className = sender === "user"
        ? "message user-message"
        : "message assistant-message";

    const paragraph = document.createElement("p");
    paragraph.textContent = text || "";

    message.appendChild(paragraph);
    row.appendChild(message);
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setLoading(loading) {
    isSending = loading;

    if (typingIndicator) {
        typingIndicator.classList.toggle("hidden", !loading);
    }

    if (sendButton) {
        sendButton.disabled = loading;

        const label = sendButton.querySelector("span:first-child");

        if (label) {
            label.textContent = loading ? "Checking..." : "Send";
        }
    }

    if (messageInput) {
        messageInput.disabled = loading;
    }
}

function normalizeOrder(order) {
    if (!order || typeof order !== "object") {
        return null;
    }

    const items = Array.isArray(order.items)
        ? order.items
            .map((item) => ({
                menu_item_id: item?.menu_item_id || null,
                name: String(item?.name || "").trim(),
                quantity: Math.max(1, Number(item?.quantity) || 1),
                price: Math.max(0, Number(item?.price) || 0)
            }))
            .filter((item) => item.name)
        : [];

    if (!items.length) {
        return null;
    }

    return {
        items,
        total_amount: Math.max(0, Number(order.total_amount) || 0)
    };
}

function formatMoney(value) {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2
    }).format(Number(value) || 0);
}

function renderOrder(order, showNameField = false) {
    currentOrder = normalizeOrder(order);

    if (!orderPreview) return;

    orderPreview.innerHTML = "";

    if (!currentOrder) {
        orderPreview.classList.add("hidden");
        return;
    }

    const top = document.createElement("div");
    top.className = "preview-top";

    const title = document.createElement("h3");
    title.textContent = "Review Your Order";

    const status = document.createElement("span");
    status.className = "preview-status";
    status.textContent = "Ready to review";

    top.appendChild(title);
    top.appendChild(status);
    orderPreview.appendChild(top);

    currentOrder.items.forEach((item) => {
        const itemRow = document.createElement("div");
        itemRow.className = "preview-item";

        const itemInfo = document.createElement("div");

        const itemName = document.createElement("div");
        itemName.className = "preview-item-name";
        itemName.textContent = item.name;

        const itemMeta = document.createElement("div");
        itemMeta.className = "preview-item-meta";
        itemMeta.textContent = `${item.quantity} × ${formatMoney(item.price)}`;

        itemInfo.appendChild(itemName);
        itemInfo.appendChild(itemMeta);

        const itemPrice = document.createElement("div");
        itemPrice.className = "preview-price";
        itemPrice.textContent = formatMoney(item.price * item.quantity);

        itemRow.appendChild(itemInfo);
        itemRow.appendChild(itemPrice);
        orderPreview.appendChild(itemRow);
    });

    const total = document.createElement("div");
    total.className = "preview-total";

    const totalLabel = document.createElement("span");
    totalLabel.textContent = "Total";

    const totalValue = document.createElement("span");
    totalValue.textContent = formatMoney(currentOrder.total_amount);

    total.appendChild(totalLabel);
    total.appendChild(totalValue);
    orderPreview.appendChild(total);

    if (showNameField && !getCustomerName()) {
        const nameBox = document.createElement("div");
        nameBox.className = "name-box";

        const label = document.createElement("label");
        label.setAttribute("for", "aiCustomerName");
        label.textContent = "Your name";

        const input = document.createElement("input");
        input.id = "aiCustomerName";
        input.type = "text";
        input.placeholder = "Enter your name";
        input.autocomplete = "name";
        input.value = customerName;

        input.addEventListener("input", () => {
            customerName = input.value.trim();
        });

        nameBox.appendChild(label);
        nameBox.appendChild(input);
        orderPreview.appendChild(nameBox);
    }

    const actions = document.createElement("div");
    actions.className = "preview-actions";

    const rejectButton = document.createElement("button");
    rejectButton.type = "button";
    rejectButton.className = "reject-button";
    rejectButton.textContent = "Reject";
    rejectButton.addEventListener("click", rejectOrder);

    const acceptButton = document.createElement("button");
    acceptButton.type = "button";
    acceptButton.className = "accept-button";
    acceptButton.textContent = "Accept Order";
    acceptButton.addEventListener("click", submitOrder);

    actions.appendChild(rejectButton);
    actions.appendChild(acceptButton);
    orderPreview.appendChild(actions);

    orderPreview.classList.remove("hidden");

    orderPreview.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

function getCustomerName() {
    if (customerName.trim()) {
        return customerName.trim();
    }

    const storedName =
        localStorage.getItem("customerName") ||
        localStorage.getItem("customer_name") ||
        "";

    if (storedName.trim()) {
        customerName = storedName.trim();
        return customerName;
    }

    const nameInput =
        document.getElementById("customerName") ||
        document.getElementById("nameInput") ||
        document.getElementById("aiCustomerName");

    if (nameInput && nameInput.value.trim()) {
        customerName = nameInput.value.trim();
        localStorage.setItem("customerName", customerName);
        return customerName;
    }

    return "";
}

function rejectOrder() {
    currentOrder = null;
    renderOrder(null);
    addMessage("Order rejected. What would you like instead?", "ai");
}

function resetConversation() {
    history = [];
    currentOrder = null;
    customerName = "";

    localStorage.removeItem("customerName");
    localStorage.removeItem("customer_name");

    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="message-row assistant-row">
                <div class="message-avatar">✦</div>
                <div class="message assistant-message">
                    <p>Hi! Tell me what you’d like to eat. You can describe a dish, a few dishes, or even a preference like “something spicy and filling.”</p>
                    <div class="quick-prompts">
                        <button type="button" data-prompt="I want something filling">Something filling</button>
                        <button type="button" data-prompt="Show me a popular meal">Popular meal</button>
                        <button type="button" data-prompt="I want a meal under 20">Under 20</button>
                    </div>
                </div>
            </div>
        `;

        attachQuickPrompts();
    }

    renderOrder(null);

    if (messageInput) {
        messageInput.value = "";
        messageInput.placeholder = "Tell me what you’d like to order...";
        messageInput.focus();
    }
}

function attachQuickPrompts() {
    document.querySelectorAll("[data-prompt]").forEach((button) => {
        button.addEventListener("click", () => {
            const prompt = button.dataset.prompt;

            if (!prompt || isSending) {
                return;
            }

            messageInput.value = prompt;
            chatForm.requestSubmit();
        });
    });
}

async function sendMessage(message) {
    const cleanMessage = String(message || "").trim();

    if (!cleanMessage || isSending) {
        return;
    }

    addMessage(cleanMessage, "user");

    history.push({
        role: "user",
        content: cleanMessage
    });

    setLoading(true);

    try {
        const response = await fetch(CHAT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: cleanMessage,
                history,
                order: currentOrder
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data?.error ||
                `Chat request failed with status ${response.status}.`
            );
        }

        const reply = String(
            data?.reply ||
            "I could not process that request."
        );

        addMessage(reply, "ai");

        history.push({
            role: "assistant",
            content: reply
        });

        if (data?.order) {
            renderOrder(data.order, Boolean(data?.needs_name));
        } else {
            currentOrder = null;
            renderOrder(null);
        }

        if (data?.needs_name && messageInput) {
            messageInput.placeholder = "Enter your name...";
        }
    } catch (error) {
        addMessage(
            error?.message ||
            "Something went wrong. Please try again.",
            "ai"
        );
    } finally {
        setLoading(false);

        if (messageInput) {
            messageInput.focus();
        }
    }
}

async function submitOrder() {
    if (!currentOrder || !currentOrder.items.length || isSending) {
        return;
    }

    const name = getCustomerName();

    if (!name) {
        renderOrder(currentOrder, true);

        addMessage(
            "Please enter your name in the order box before accepting it.",
            "ai"
        );

        const nameInput = document.getElementById("aiCustomerName");

        if (nameInput) {
            nameInput.focus();
        }

        return;
    }

    setLoading(true);

    try {
        const response = await fetch(ORDER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customer_name: name,
                total_amount: currentOrder.total_amount,
                items: currentOrder.items.map((item) => ({
                    name: item.name,
                    quantity: item.quantity
                }))
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data?.error ||
                `Order request failed with status ${response.status}.`
            );
        }

        addMessage(
            `Order placed successfully for ${name}.`,
            "ai"
        );

        history.push({
            role: "assistant",
            content: `Order placed successfully for ${name}.`
        });

        currentOrder = null;
        renderOrder(null);
        localStorage.setItem("customerName", name);
    } catch (error) {
        addMessage(
            error?.message ||
            "Unable to place the order. Please try again.",
            "ai"
        );
    } finally {
        setLoading(false);

        if (messageInput) {
            messageInput.value = "";
            messageInput.placeholder = "Tell me what you’d like to order...";
            messageInput.focus();
        }
    }
}

if (chatForm) {
    chatForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!messageInput || isSending) {
            return;
        }

        const message = messageInput.value.trim();

        if (!message) {
            return;
        }

        messageInput.value = "";
        await sendMessage(message);
    });
}

if (messageInput) {
    messageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();

            if (chatForm) {
                chatForm.requestSubmit();
            }
        }
    });
}

if (clearChatBtn) {
    clearChatBtn.addEventListener("click", resetConversation);
}

attachQuickPrompts();

window.sendAIMessage = sendMessage;
window.acceptAIOrder = submitOrder;
window.rejectAIOrder = rejectOrder;