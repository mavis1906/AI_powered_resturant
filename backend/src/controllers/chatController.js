import { generateAIResponse } from "../services/aiService.js";

export async function handleChatMessage(req, res) {
  try {
    const { message, history = [], order = null } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const [menuResponse, ordersResponse] = await Promise.all([
      fetch("http://localhost:5000/api/menu/direct"),
      fetch("http://localhost:5000/api/orders/direct")
    ]);

    if (!menuResponse.ok) {
      throw new Error(`Menu request failed with status ${menuResponse.status}`);
    }

    if (!ordersResponse.ok) {
      throw new Error(`Orders request failed with status ${ordersResponse.status}`);
    }

    const menu = await menuResponse.json();
    const orders = await ordersResponse.json();

    const aiReply = await generateAIResponse(message, {
      menu: Array.isArray(menu) ? menu : [],
      orders: Array.isArray(orders) ? orders : [],
      history: Array.isArray(history) ? history : [],
      order
    });

    return res.status(200).json({
      reply: aiReply.reply,
      order: aiReply.order,
      needs_name: aiReply.needs_name,
      ready_to_confirm: aiReply.ready_to_confirm
    });
  } catch (error) {
    console.error("Error in chat controller:", error);

    return res.status(500).json({
      error: "Internal Server Error"
    });
  }
}
