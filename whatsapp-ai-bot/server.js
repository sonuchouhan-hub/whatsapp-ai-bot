import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

/* =========================
   1️⃣ WEBHOOK VERIFICATION
   (Only if your provider uses it)
========================= */
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/* =========================
   2️⃣ SEND WHATSAPP MESSAGE
   (WABA Chat API)
========================= */
async function sendWhatsAppMessage(to, text) {
  const response = await axios.post(
    `${process.env.WHATSAPP_BASE_URL}/chat/messages`,
    {
      to: to,
      type: "text",
      text: {
        body: text
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
        "X-MYOP-COMPANY-ID": process.env.COMPANY_ID,
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    }
  );

  return response.data;
}

/* =========================
   3️⃣ TEST ROUTE (IMPORTANT)
   Use this to confirm API works
========================= */
app.get("/test-send", async (req, res) => {
  try {
    await sendWhatsAppMessage(
      "918269579135", // 🔁 REPLACE with your WhatsApp number (country code + number)
      "✅ Test message from Dhanshri Infrabulls bot"
    );
    res.send("Message sent successfully");
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to send message");
  }
});

/* =========================
   4️⃣ INCOMING MESSAGES
   (Webhook from WABA Chat)
========================= */
app.post("/webhook", async (req, res) => {
  console.log("📩 Incoming webhook:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    // This covers most WABA Chat message formats
    const message =
      req.body?.messages?.[0] ||
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from || message.phone;
      const text = message.text?.body || message.text;

      console.log("From:", from);
      console.log("Text:", text);

      // Auto-reply
      await sendWhatsAppMessage(
        from,
        "Welcome to Dhanshri Infrabulls 👋\nMay I know your name?"
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

/* =========================
   5️⃣ START SERVER
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
