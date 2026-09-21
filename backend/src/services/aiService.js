import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

function cleanJsonText(text) {
  if (!text) return "";

  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeResponse(parsed) {
  return {
    reply: typeof parsed?.reply === "string" ? parsed.reply : "",
    order: parsed?.order && typeof parsed.order === "object"
      ? {
          items: Array.isArray(parsed.order.items)
            ? parsed.order.items
                .map((item) => ({
                  menu_item_id: item.menu_item_id,
                  name: item.name,
                  quantity: Number(item.quantity) || 1,
                  price: Number(item.price) || 0
                }))
                .filter((item) => item.menu_item_id != null)
            : [],
          total_amount: Number(parsed.order.total_amount) || 0
        }
      : null,
    needs_name: Boolean(parsed?.needs_name),
    ready_to_confirm: Boolean(parsed?.ready_to_confirm)
  };
}

export async function generateAIResponse(promptText, context = {}) {
  try {
    const menu = Array.isArray(context.menu) ? context.menu : [];
    const orders = Array.isArray(context.orders) ? context.orders : [];
    const history = Array.isArray(context.history) ? context.history : [];
    const currentOrder =
      context.order && typeof context.order === "object"
        ? context.order
        : null;

    const contextText = `
Restaurant menu:
${JSON.stringify(menu, null, 2)}

Restaurant orders:
${JSON.stringify(orders, null, 2)}

Conversation history:
${JSON.stringify(history, null, 2)}

Current order being built:
${JSON.stringify(currentOrder, null, 2)}
`;

    const systemInstruction = `
You are the restaurant ordering assistant.

Your job is to:
1. Answer questions about the restaurant menu using ONLY the supplied menu.
2. Never invent a menu item, price, menu item ID, or availability.
3. Help the customer build an order across multiple messages.
4. Remember the order details from the supplied conversation history and current order.
5. If the customer asks for an item that is not on the menu, clearly say it is unavailable and offer/list available items.
6. When the customer has selected one or more valid menu items and quantities, calculate the total from the supplied menu prices.
7. Before an order is submitted, ask for the customer's name.
8. Once a valid order exists, keep that order in the conversation instead of starting over.
9. Do NOT pretend that an order has been placed. The frontend will display the confirmation board and submit the order only after the customer clicks Accept Order.
10. Keep the conversation natural and concise.

Return ONLY valid JSON in this exact shape:
{
  "reply": "message to show the customer",
  "order": {
    "items": [
      {
        "menu_item_id": "exact menu item id",
        "name": "exact menu item name",
        "quantity": 1,
        "price": 0
      }
    ],
    "total_amount": 0
  },
  "needs_name": false,
  "ready_to_confirm": false
}

Rules for the JSON:
- If there is no order being built, use "order": null.
- Use exact IDs and prices from the supplied menu.
- If an order is being built but the customer's name is missing, set needs_name to true.
- Once the customer has supplied their name and the order is valid, set ready_to_confirm to true.
- Do not create an order in the database. The frontend/backend order endpoint does that after confirmation.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `${systemInstruction}\n\n${contextText}\n\nUser message:\n${promptText}`
    });

    const rawText = response.text || "";
    const cleanedText = cleanJsonText(rawText);

    try {
      return normalizeResponse(JSON.parse(cleanedText));
    } catch (parseError) {
      console.error("Gemini returned invalid JSON:", rawText);

      return {
        reply: rawText || "Sorry, I could not process that request.",
        order: null,
        needs_name: false,
        ready_to_confirm: false
      };
    }
  } catch (error) {
    console.error("Error calling Gemini AI:", error);
    throw error;
  }
}
