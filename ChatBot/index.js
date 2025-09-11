import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

// Variables de Meta
const ACCESS_TOKEN = "EAAZA2q3efktgBPbEYI9yOPzJiuF75LMhRx3Y1zZBbWZAwEEoDwD97P3f92cOi0AHLOcaSnUwjeMlfIOJcyLWmQexKeZClHcgNat6iH4Cy62s64XOOKvlRQ95g9ctrGqfllPtqUA2BEjpOZBo0ZBlcZBkkeq3bktZALebYwZCZCuZBZCYHc6MYPLdehG1x7o1nJ9D6LOeKCY077vcOUQqyMGqabHSZBSaGxVhxosCoMDKwZA4hZBX0MZD"; // Lo obtienes en Meta Developer
const PHONE_NUMBER_ID = "738896325981718"; // También en la consola de Meta
const VERIFY_TOKEN = "12345"; // Elige uno cualquiera

const API_URL = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

// 📩 Webhook para recibir mensajes
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;

    if (changes?.messages) {
      const message = changes.messages[0];
      const from = message.from; // Número del usuario
      const text = message.text?.body || "";

      console.log("Mensaje recibido:", text);

      // Responder con un texto
      await sendMessage(from, `Hola 👋, Bienvenido a DuoChat estamos para tu asistencia, que tengas una buena tarde`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error en webhook:", error);
    res.sendStatus(500);
  }
});

// 📤 Función para enviar mensaje
async function sendMessage(to, text) {
  try {
    await axios.post(
      API_URL,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error enviando mensaje:", error.response?.data || error);
  }
}

// 🔐 Verificación del webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado ✅");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 🚀 Iniciar servidor
app.listen(5000, () => {
  console.log("Servidor escuchando en http://localhost:5000");
});
