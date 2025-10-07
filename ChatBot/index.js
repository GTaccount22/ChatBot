import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// 🔑 Variables de Meta desde .env
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Conexión a Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Estado de usuarios
const userStates = new Map();

// Validación de variables
if (
  !ACCESS_TOKEN ||
  !PHONE_NUMBER_ID ||
  !VERIFY_TOKEN ||
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_KEY
) {
  console.error("❌ Faltan variables de entorno requeridas");
  process.exit(1);
}

const API_URL = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

// 📤 Función para enviar mensajes a WhatsApp
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
    console.error(
      "❌ Error enviando mensaje:",
      error.response?.data || error.message
    );
  }
}

// 🔎 Verificar webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 🏠 Ruta principal
app.get("/", (req, res) => {
  res.json({
    status: "Bot activo ✅",
    message: "DucoChat funcionando correctamente",
    webhook: "/webhook",
    timestamp: new Date().toISOString(),
  });
});

// 📩 Webhook para recibir mensajes
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    if (body.object) {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      const messages = changes?.messages;

      if (messages) {
        const message = messages[0];
        const from = message.from;
        const text = (message.text?.body || "").trim();

        console.log("📩 Mensaje recibido de:", from, "Texto:", text);

        if (
          ["hi", "hola", "menu", "opciones", "inicio", "ayuda", "hola, necesito ayuda"].includes(text.toLowerCase())
          || text.toLowerCase().includes("duco")
        ) {
          userStates.set(from, { category: null });
          await sendMainMenu(from);
        } else {
          await handleNavigation(from, text);
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Error en webhook:", error);
    res.sendStatus(500);
  }
});

// 📚 Obtener preguntas por categoría desde Supabase
async function getQuestionsByCategory(categoryName) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, question, answer")
    .eq("category", categoryName)
    .order("id", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener preguntas:", error);
    return [];
  }

  return data;
}

// ------------------- MENÚ DINÁMICO -------------------
async function buildMenu() {
  const { data, error } = await supabase
    .from("questions")
    .select("category, id")
    .order("id", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener categorías:", error);
    return { menuText: "⚠️ Error al cargar el menú.", categories: [] };
  }

  const categories = [...new Set(data.map((q) => q.category))];
  


  let menuText =
    "¡Hola! 👋 Bienvenido a DucoChat.\nEstamos aquí para ayudarte 24/7.\n\n📋 *Opciones disponibles:*\n\n";

  const circleNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  categories.forEach((cat, index) => {
    const numberSymbol = circleNumbers[index] || `${index + 1}.`;
    menuText += `${numberSymbol} ${cat}\n`;
  });

  menuText += "\n💡 *Escribe el número de la opción que te interesa*";

  return { menuText, categories: categories };
}

async function sendMainMenu(to) {
  const { menuText } = await buildMenu();
  await sendMessage(to, menuText);
}


// ------------------- LÓGICA DE NAVEGACIÓN -------------------
async function handleNavigation(from, text) {
  const userState = userStates.get(from) || { category: null, questionIndex: null };

  // 👉 Retroceder a la pregunta anterior
  if (text.toLowerCase() === "volver" && userState.category !== null) {
    // Si estamos viendo una pregunta, mostrar nuevamente la lista de preguntas de la categoría
    await handleCategorySelection(from, userState.category);
    // Reiniciamos el índice de pregunta porque ya no estamos en ninguna pregunta
    userStates.set(from, { category: userState.category, questionIndex: null });
    return;
  }


  // 👉 Si ya está en categoría y escribe un número → es una pregunta
  if (userState.category && (text.match(/^[0-9]+$/) || text.match(/^[①②③④⑤⑥⑦⑧⑨⑩]$/))) {
    // Convertir número elegante a número normal si es necesario
    let questionNumber = text;
    if (text.match(/^[①②③④⑤⑥⑦⑧⑨⑩]$/)) {
      const circleNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
      questionNumber = (circleNumbers.indexOf(text) + 1).toString();
    }
    await handleQuestionInCategory(from, userState.category, questionNumber);
    return;
  }

  // 👉 Si no está en categoría y escribe un número → es una categoría
  if (!userState.category && (text.match(/^[0-9]+$/) || text.match(/^[①②③④⑤⑥⑦⑧⑨⑩]$/))) {
    const { categories } = await buildMenu();
    let index;
    if (text.match(/^[①②③④⑤⑥⑦⑧⑨⑩]$/)) {
      const circleNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
      index = circleNumbers.indexOf(text);
    } else {
      index = parseInt(text, 10) - 1;
    }

    if (!categories[index]) {
      await sendMessage(
        from,
        "❌ Número inválido. Escribe *menú* para ver las opciones."
      );
      return;
    }

    const categoryName = categories[index];
    await handleCategorySelection(from, categoryName);
    return;
  }

  // 👉 Volver al menú
  if (text.toLowerCase() === "menu" || text.toLowerCase() === "menú") {
    userStates.set(from, { category: null, questionIndex: null });
    await sendMainMenu(from);
    return;
  }

  await sendMessage(
    from,
    "❓ No entendí tu mensaje. Escribe *menú* para ver las opciones."
  );
}

// 📝 Responder una pregunta con su "answer"
async function handleQuestionInCategory(from, categoryName, questionNumber) {
  const questions = await getQuestionsByCategory(categoryName);
  const questionIndex = parseInt(questionNumber, 10) - 1;

  if (!questions[questionIndex]) {
    await sendMessage(
      from,
      "❌ Pregunta no encontrada. Escribe *menú* para volver."
    );
    return;
  }

  const question = questions[questionIndex];

  // 🔑 Guardamos el índice actual en el estado del usuario
  userStates.set(from, { category: categoryName, questionIndex });

  await sendMessage(
    from,
    `❓ *${question.question}*\n\n✅ ${question.answer}\n\n🔙 Escribe *menú* para volver al inicio.\n↩️ Escribe *volver* para regresar a la lista de preguntas.`
  );
}


// 📝 Mostrar preguntas de una categoría
async function handleCategorySelection(from, categoryName) {
  const questions = await getQuestionsByCategory(categoryName);

  if (questions.length === 0) {
    await sendMessage(
      from,
      "❌ No hay preguntas disponibles en esta categoría."
    );
    return;
  }

  let messageText = `📚 *${categoryName}*\n\nSelecciona una pregunta:\n\n`;
  const circleNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  questions.forEach((q, index) => {
    const numberSymbol = circleNumbers[index] || `${index + 1}.`;
    messageText += `${numberSymbol} ${q.question}\n`;
  });
  messageText += `\n💡 Escribe el número de la pregunta\n🔙 Escribe *volver* para regresar`;

  userStates.set(from, { category: categoryName });
  await sendMessage(from, messageText);
}




// 🚀 Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});

// Capturar errores no manejados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});

// Mantener el proceso activo
process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});
