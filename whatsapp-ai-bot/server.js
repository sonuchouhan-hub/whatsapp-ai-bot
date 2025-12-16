import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

/* =========================
   1️⃣ WEBHOOK VERIFICATION
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
========================= */
async function sendWhatsAppMessage(to, text) {
  const response = await axios.post(
    `${process.env.WHATSAPP_BASE_URL}/chat/messages`,
    {
      to,
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
   3️⃣ TEST ROUTE (OPTIONAL)
========================= */
app.get("/test-send", async (req, res) => {
  try {
    await sendWhatsAppMessage(
      "918269579135", // replace with your number for testing
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
   (AUTO-REPLY LOGIC)
========================= */
app.post("/webhook", async (req, res) => {
  try {
    console.log("📩 Incoming webhook:");
    console.log(JSON.stringify(req.body, null, 2));

    const message =
      req.body?.messages?.[0] ||
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from || message.phone;
    const text = message.text?.body?.toLowerCase() || "";

    console.log("From:", from);
    console.log("Text:", text);

    // ✅ AUTO-REPLY LOGIC
    if (text === "hi" || text === "hello") {
      await sendWhatsAppMessage(
        from,
        "👋 *Welcome to Dhanshri Infrabulls*\n\nPlease share:\n1️⃣ Budget\n2️⃣ Location\n3️⃣ Purpose (Investment / Home)"
      );
    } else {
      await sendWhatsAppMessage(
        from,
        "Thank you for your message 🙏\nOur team will assist you shortly."
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
