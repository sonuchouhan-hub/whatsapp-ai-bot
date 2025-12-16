import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

/* =========================
   ROOT ROUTE (FIX Cannot GET /)
========================= */
app.get("/", (req, res) => {
  res.send("WhatsApp AI Bot is running 🚀");
});

/* =========================
   WEBHOOK (MYOPERATOR)
========================= */
app.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;

    // ✅ IMPORTANT: Ignore sent/delivered/read events
    if (payload?.data?.action !== "incoming") {
      return res.sendStatus(200);
    }

    const userMessage =
      payload?.data?.data?.context?.body;

    const userNumber =
      payload?.data?.conversation?.customer_contact;

    if (!userMessage || !userNumber) {
      return res.sendStatus(200);
    }

    console.log("📩 Incoming:", userMessage);
    console.log("👤 From:", userNumber);

    let reply = "";

    const text = userMessage.toLowerCase();

    // 👋 Greeting
    if (text.includes("hi") || text.includes("hello")) {
      reply =
        "👋 Welcome to *Dhanshri Infrabulls*\n\n" +
        "Please share your budget:\n" +
        "👉 Below 20 Lakh\n👉 20–30 Lakh\n👉 Above 30 Lakh";
    }

    // 💰 Budget
    else if (text.includes("lakh") || text.includes("20") || text.includes("30")) {
      reply =
        "Great 👍\n" +
        "Please select your preferred location:\n" +
        "📍 Rau\n📍 Indore\n📍 Mhow\n📍 Pithampur";
    }

    // 📍 Location
    else if (
      text.includes("rau") ||
      text.includes("indore") ||
      text.includes("mhow") ||
      text.includes("pithampur")
    ) {
      reply =
        "Perfect ✅\n" +
        "Our sales team will contact you shortly.\n\n" +
        "Reply *CALL* for callback or *VISIT* for site visit.";
    }

    // 🔁 Fallback
    else {
      reply =
        "Thank you for your message 😊\n" +
        "Please reply with your *Budget* or *Location*.";
    }

    await sendWhatsAppMessage(userNumber, reply);

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook Error:", err.message);
    res.sendStatus(500);
  }
});

/* =========================
   SEND MESSAGE (MYOPERATOR)
========================= */
async function sendWhatsAppMessage(number, message) {
  await axios.post(
    process.env.MYOPERATOR_SEND_API, // ✅ exact URL from MyOperator
    {
      number: number,
      message: message
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.MYOPERATOR_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );
}

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
