import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

// 🗂️ Estado de usuarios (en producción usar base de datos)
const userStates = new Map();

// 🔑 Variables de Meta (usa .env en producción)
const ACCESS_TOKEN = "EAA5JMpk0TAMBPpPmKC1L6cg94P6aMkopaSjNEwyuMDu4R510N2jbpf1wEUrsTZCHD2SijmjdSkvJqBPgLDbMmrZBEhsuzfswg5TcIshg3M60ui06GJCMLdA5LJuXRnXOzZB8x2IyMcddDOMu282jIZB68zxfTXvlTeZBR6wjevhZCZC6jw5qcEXsxpoLPHRGv1oMwZDZD"; 
const PHONE_NUMBER_ID = "839140125945010";
const VERIFY_TOKEN = "12345"; // mismo que configuraste en Meta

const API_URL = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

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
        const from = message.from; // número del usuario (con código país)
        const text = (message.text?.body || "").trim();

        console.log("📩 Mensaje recibido de:", from, "Texto:", text);

        if (["hi", "hola", "menu", "opciones", "inicio", "ayuda"].includes(text.toLowerCase()) || 
            text.toLowerCase().includes("quiero hablar") || 
            text.toLowerCase().includes("duochat") || 
            text.toLowerCase().includes("ducobot")) {
          // 🧹 Limpiar estado del usuario
          userStates.set(from, { category: null });
          
          // 📤 Enviar mensaje automático de bienvenida + menú
          await sendMessage(
            from,
            "¡Hola! 👋 Bienvenido a DuoChat.\nEstamos aquí para ayudarte las 24 horas del día.\n\n📋 *Opciones disponibles:*\n\n" +
            "1️⃣ Suspensión Académica\n" +
            "2️⃣ Renuncia\n" +
            "3️⃣ Inscripción de Asignaturas\n" +
            "4️⃣ Justificaciones a evaluaciones\n" +
            "5️⃣ Reintegros\n" +
            "6️⃣ Movimientos internos\n" +
            "7️⃣ Problemas de acceso\n" +
            "8️⃣ Prácticas y realización\n" +
            "9️⃣ Convalidación\n\n" +
            "💡 *Escribe el número de la opción que te interesa*"
          );
        } else {
          // 📌 Manejar navegación y opciones
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

// 🧭 Función para manejar navegación
async function handleNavigation(from, text) {
  const userState = userStates.get(from) || { category: null };
  
  // Si está en una respuesta específica (formato X.Y)
  if (text.match(/^[1-9]\.[1-9]$/)) {
    await handleSpecificAnswer(from, text);
    return;
  }
  
  // Si está seleccionando una pregunta dentro de una categoría (formato X)
  if (text.match(/^[1-9]$/) && userState.category) {
    await handleQuestionInCategory(from, userState.category, text);
    return;
  }
  
  // Si está seleccionando una categoría principal (formato X)
  if (text.match(/^[1-9]$/)) {
    userStates.set(from, { category: text });
    await handleCategorySelection(from, text);
    return;
  }
  
  // Si escribe "volver" y está en una categoría específica
  if (text.toLowerCase() === "volver" && userState.category) {
    await handleCategorySelection(from, userState.category);
    return;
  }
  
  // Si escribe "menu" desde cualquier lugar, va al menú principal
  if (text.toLowerCase() === "menu") {
    userStates.set(from, { category: null });
    await sendMessage(
      from,
      "¡Hola! 👋 Bienvenido a DuoChat.\nEstamos aquí para ayudarte las 24 horas del día.\n\n📋 *Opciones disponibles:*\n\n" +
      "1️⃣ Suspensión Académica\n" +
      "2️⃣ Renuncia\n" +
      "3️⃣ Inscripción de Asignaturas\n" +
      "4️⃣ Justificaciones a evaluaciones\n" +
      "5️⃣ Reintegros\n" +
      "6️⃣ Movimientos internos\n" +
      "7️⃣ Problemas de acceso\n" +
      "8️⃣ Prácticas y realización\n" +
      "9️⃣ Convalidación\n\n" +
      "💡 *Escribe el número de la opción que te interesa*"
    );
    return;
  }
  
  // Mensaje de fallback
  await sendMessage(from, "❓ No entendí tu mensaje. Escribe *menu* para ver las opciones.");
}

// 📚 Función para manejar selección de categoría
async function handleCategorySelection(from, text) {
  switch (text) {
    case "1":
      await sendMessage(from, "📚 *Suspensión Académica*\n\n" +
        "Selecciona una pregunta:\n\n" +
        "1️⃣ ¿Qué es la Suspensión académica?\n" +
        "2️⃣ ¿Cuáles son los requisitos para la suspensión académica?\n" +
        "3️⃣ ¿Hasta cuando puedo suspender el semestre 2025-2?\n" +
        "4️⃣ ¿Cómo puedo solicitar la suspensión del semestre?\n\n" +
        "💡 *Escribe el número de la pregunta*\n" +
        "🔙 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "2":
      await sendMessage(from, "📝 *Renuncia*\n\n" +
        "Selecciona una pregunta:\n\n" +
        "1️⃣ ¿Qué es la Renuncia a mi carrera?\n" +
        "2️⃣ ¿Hasta cuando puedo Renunciar a mi carrera?\n" +
        "3️⃣ ¿Cómo puedo solicitar la renuncia a mi carrera?\n\n" +
        "💡 *Escribe el número de la pregunta*\n" +
        "🔙 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "3":
      await sendMessage(from, "📖 *Inscripción de Asignaturas*\n\n" +
        "Selecciona una pregunta:\n\n" +
        "1️⃣ ¿Qué es la inscripción de asignaturas?\n" +
        "2️⃣ ¿Hasta cuando puedo pagar la matrícula para poder inscribir mis asignaturas?\n" +
        "3️⃣ ¿Si soy estudiante con gratuidad, debo pagar matrícula para Inscribir Asignaturas?\n" +
        "4️⃣ ¿Cuándo son las ventanas de Inscripción de Asignaturas de San Bernardo?\n" +
        "5️⃣ ¿Dónde debo inscribir mis asignaturas?\n" +
        "6️⃣ Si no alcancé a inscribir en las ventanas de mi sede ¿Cómo puedo inscribir mis asignaturas?\n\n" +
        "💡 *Escribe el número de la pregunta*\n" +
        "🔙 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "4":
      await sendMessage(from, "📋 *Justificaciones a evaluaciones*\n\n" +
        "Selecciona una pregunta:\n\n" +
        "1️⃣ ¿Qué es la Justificación académica?\n" +
        "2️⃣ ¿Cómo puedo justificar la inasistencia a mis evaluaciones?\n" +
        "3️⃣ ¿Qué debo adjuntar cuando justifique mi inasistencia a evaluaciones?\n" +
        "4️⃣ ¿Qué porcentaje de asistencia debo tener durante el semestre, para no Reprobar la asignatura?\n\n" +
        "💡 *Escribe el número de la pregunta*\n" +
        "🔙 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "5":
      await sendMessage(from, "🔄 *Reintegros*\n\n" +
        "Selecciona una pregunta:\n\n" +
        "1️⃣ ¿Qué es el reintegro?\n" +
        "2️⃣ ¿En qué fecha puedo solicitar el reintegro a mi carrera?\n" +
        "3️⃣ ¿Dónde puedo solicitar el reintegro a mi carrera?\n\n" +
        "💡 *Escribe el número de la pregunta*\n" +
        "🔙 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "6":
      await sendMessage(from, "🏫 *Movimientos internos*\n\n" +
        "Selecciona una pregunta:\n\n" +
        "1️⃣ ¿Qué es el Movimiento Interno?\n" +
        "2️⃣ ¿Cuáles son los requisitos para solicitar cambio de sede y/o jornada?\n" +
        "3️⃣ ¿Dónde puedo solicitar un cambio de sede y/o jornada?\n\n" +
        "💡 *Escribe el número de la pregunta*\n" +
        "🔙 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "7":
      await sendMessage(from, "🔐 *Problemas de acceso*\n\n" +
        "Selecciona una pregunta:\n\n" +
        "1️⃣ ¿Qué debo hacer si tengo problemas de acceso con el autentificador o plataforma?\n\n" +
        "💡 *Escribe el número de la pregunta*\n" +
        "🔙 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "8":
      await sendMessage(from, "💼 *Prácticas y realización*\n\n" +
        "Selecciona una pregunta:\n\n" +
        "1️⃣ ¿Cuántas horas debo hacer en práctica laboral?\n" +
        "2️⃣ ¿Cuántas horas debo hacer en práctica profesional?\n" +
        "3️⃣ ¿Puedo hacer mi práctica si no la tengo inscrita?\n" +
        "4️⃣ ¿Cómo obtengo la carta de seguro?\n" +
        "5️⃣ ¿Cuántos días se demoran en validar el centro de práctica?\n" +
        "6️⃣ ¿Puedo hacer mi práctica y después subir el documento?\n" +
        "7️⃣ ¿Debo llevar mi documentación a sede para validar?\n" +
        "8️⃣ ¿Cómo sé las funciones que debo realizar en mi proceso de práctica?\n" +
        "9️⃣ ¿Cómo convalido?\n\n" +
        "💡 *Escribe el número de la pregunta*\n" +
        "🔙 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "9":
      await sendMessage(from, "📄 *Convalidación*\n\n" +
        "Selecciona una pregunta:\n\n" +
        "1️⃣ ¿Qué documentos necesito para convalidar mi práctica LABORAL?\n" +
        "2️⃣ ¿Qué documentos necesito para convalidar mi práctica PROFESIONAL?\n\n" +
        "💡 *Escribe el número de la pregunta*\n" +
        "🔙 *Escribe 'menu' para regresar al menú principal*");
      break;
    default:
      await sendMessage(from, "❓ No entendí tu mensaje. Escribe *menu* para ver las opciones.");
      break;
  }
}

// 📝 Función para manejar respuestas específicas
async function handleSpecificAnswer(from, text) {
  switch (text) {
    // Suspensión Académica
    case "1.1":
      await sendMessage(from, "📚 *¿Qué es la Suspensión académica?*\n\n" +
        "La suspensión académica corresponde a la pérdida transitoria de la calidad de alumno regular, solicitada expresamente por el estudiante a través de solicitudes.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Suspensión Académica*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "1.2":
      await sendMessage(from, "📋 *¿Cuáles son los requisitos para la suspensión académica?*\n\n" +
        "• Tener al menos un semestre cursado\n" +
        "• No estar afecto a causales de eliminación (asignatura reprobada 3 veces)\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Suspensión Académica*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "1.3":
      await sendMessage(from, "📅 *¿Hasta cuando puedo suspender el semestre 2025-2?*\n\n" +
        "Esta fecha está establecida en calendario académico.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Suspensión Académica*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "1.4":
      await sendMessage(from, "📝 *¿Cómo puedo solicitar la suspensión del semestre?*\n\n" +
        "Solicitud en línea /suspensión /e indicar motivos de la decisión (en una breve descripción)\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Suspensión Académica*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    
    // Renuncia
    case "2.1":
      await sendMessage(from, "📝 *¿Qué es la Renuncia a mi carrera?*\n\n" +
        "La renuncia corresponde a la pérdida DEFINITIVA de la calidad de alumno regular.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Renuncia*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "2.2":
      await sendMessage(from, "📅 *¿Hasta cuando puedo Renunciar a mi carrera?*\n\n" +
        "Puedes renunciar durante todo el año, pero esto NO lo exime del pago.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Renuncia*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "2.3":
      await sendMessage(from, "📝 *¿Cómo puedo solicitar la renuncia a mi carrera?*\n\n" +
        "Debes realizar una solicitud en línea / Renuncia\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Renuncia*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    
    // Inscripción de Asignaturas
    case "3.1":
      await sendMessage(from, "📖 *¿Qué es la inscripción de asignaturas?*\n\n" +
        "La inscripción de asignatura corresponde a los ramos que debes inscribir en el semestre que estás cursando.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Inscripción de Asignaturas*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "3.2":
      await sendMessage(from, "📅 *¿Hasta cuando puedo pagar la matrícula para poder inscribir mis asignaturas?*\n\n" +
        "Debes revisar calendario académico.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Inscripción de Asignaturas*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "3.3":
      await sendMessage(from, "💰 *¿Si soy estudiante con gratuidad, debo pagar matrícula para Inscribir Asignaturas?*\n\n" +
        "No, esto se genera de forma automática.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Inscripción de Asignaturas*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "3.4":
      await sendMessage(from, "📧 *¿Cuándo son las ventanas de Inscripción de Asignaturas de San Bernardo?*\n\n" +
        "Debes estar atento a tu mail institucional ya que por ese medio se indicarán las fechas.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Inscripción de Asignaturas*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "3.5":
      await sendMessage(from, "🌐 *¿Dónde debo inscribir mis asignaturas?*\n\n" +
        "Página de Duoc inscripciones https://www.duoc.cl/portal-de-pago/\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Inscripción de Asignaturas*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "3.6":
      await sendMessage(from, "⏰ *Si no alcancé a inscribir en las ventanas de mi sede ¿Cómo puedo inscribir mis asignaturas?*\n\n" +
        "Debes estar atento a tu mail institucional ya que por ese medio se indicarán las fechas.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Inscripción de Asignaturas*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    
    // Justificaciones a evaluaciones
    case "4.1":
      await sendMessage(from, "📋 *¿Qué es la Justificación académica?*\n\n" +
        "Es la justificación a la inasistencia de evaluación.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Justificaciones a evaluaciones*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "4.2":
      await sendMessage(from, "📝 *¿Cómo puedo justificar la inasistencia a mis evaluaciones?*\n\n" +
        "Solicitud en línea /justificación/adjuntar documento esto puede ser certificado médico, laboral o una carta al DDCC.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Justificaciones a evaluaciones*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "4.3":
      await sendMessage(from, "📎 *¿Qué debo adjuntar cuando justifique mi inasistencia a evaluaciones?*\n\n" +
        "Adjuntar documento esto puede ser certificado médico, laboral o una carta al DDCC.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Justificaciones a evaluaciones*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "4.4":
      await sendMessage(from, "📊 *¿Qué porcentaje de asistencia debo tener durante el semestre, para no Reprobar la asignatura?*\n\n" +
        "Tu porcentaje debe ser de 70%.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Justificaciones a evaluaciones*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    
    // Reintegros
    case "5.1":
      await sendMessage(from, "🔄 *¿Qué es el reintegro?*\n\n" +
        "Es tener nuevamente la calidad de alumno regular en nuestra institución, esta puede ser de tu carrera u otra nueva.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Reintegros*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "5.2":
      await sendMessage(from, "📅 *¿En qué fecha puedo solicitar el reintegro a mi carrera?*\n\n" +
        "Debes revisar calendario académico o llamar directamente a mesa central +56 442 201 098/+56 227 120 245\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Reintegros*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "5.3":
      await sendMessage(from, "🌐 *¿Dónde puedo solicitar el reintegro a mi carrera?*\n\n" +
        "Debes hacerlo a través del siguiente link https://www.duoc.cl/reintegros/\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Reintegros*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    
    // Movimientos internos
    case "6.1":
      await sendMessage(from, "🏫 *¿Qué es el Movimiento Interno?*\n\n" +
        "Corresponde a cambios, estos pueden ser de: Jornada, sede, de carrera.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Movimientos internos*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "6.2":
      await sendMessage(from, "📋 *¿Cuáles son los requisitos para solicitar cambio de sede y/o jornada?*\n\n" +
        "Debes tener al menos un semestre cursado y sin bloqueo académico.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Movimientos internos*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "6.3":
      await sendMessage(from, "🌐 *¿Dónde puedo solicitar un cambio de sede y/o jornada?*\n\n" +
        "https://www.duoc.cl/admision/proceso/especial/movimientos-internos/\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Movimientos internos*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    
    // Problemas de acceso
    case "7.1":
      await sendMessage(from, "🔐 *¿Qué debo hacer si tengo problemas de acceso con el autentificador o plataforma?*\n\n" +
        "Debes llamar a la mesa de servicio +56 442 201 098/+56 227 120 245\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Problemas de acceso*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    
    // Prácticas y realización
    case "8.1":
      await sendMessage(from, "⏰ *¿Cuántas horas debo hacer en práctica laboral?*\n\n" +
        "La práctica laboral tiene una duración de 180 horas o 216 horas (escuela de administración mallas nuevas).\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Prácticas y realización*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "8.2":
      await sendMessage(from, "⏰ *¿Cuántas horas debo hacer en práctica profesional?*\n\n" +
        "La práctica profesional tiene una duración de 360 horas.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Prácticas y realización*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "8.3":
      await sendMessage(from, "❌ *¿Puedo hacer mi práctica si no la tengo inscrita?*\n\n" +
        "No, ya que esta debe estar inscrita para que tengas acceso al portal de prácticas.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Prácticas y realización*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "8.4":
      await sendMessage(from, "📄 *¿Cómo obtengo la carta de seguro?*\n\n" +
        "La carta de seguro se obtiene una vez validado el formulario en plataforma y esta se envía de manera automática a su centro de práctica.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Prácticas y realización*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "8.5":
      await sendMessage(from, "⏳ *¿Cuántos días se demoran en validar el centro de práctica?*\n\n" +
        "Director de carrera tiene 5 días hábiles para validar.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Prácticas y realización*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "8.6":
      await sendMessage(from, "❌ *¿Puedo hacer mi práctica y después subir el documento?*\n\n" +
        "No, debes subir tu documentación al menos 1 semana antes de comenzar con tu proceso.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Prácticas y realización*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "8.7":
      await sendMessage(from, "📁 *¿Debo llevar mi documentación a sede para validar?*\n\n" +
        "No, esto debes realizarlo todo a través de portal de práctica https://www2.duoc.cl/practica/login/select\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Prácticas y realización*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "8.8":
      await sendMessage(from, "📋 *¿Cómo sé las funciones que debo realizar en mi proceso de práctica?*\n\n" +
        "Para esto debes revisar tu perfil de egreso en página de Duoc o en el mismo portal de práctica.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Prácticas y realización*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "8.9":
      await sendMessage(from, "📝 *¿Cómo convalido?*\n\n" +
        "Debes hacer una solicitud en línea https://experienciavivo.duoc.cl/ Debes clasificar : Académico / convalidación de asignatura/práctica profesional y adjuntas los documentos señalados según sea tu caso.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Prácticas y realización*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    
    // Convalidación
    case "9.1":
      await sendMessage(from, "📄 *¿Qué documentos necesito para convalidar mi práctica LABORAL?*\n\n" +
        "1️⃣ TRABAJADOR DEPENDIENTE: Contrato de trabajo + cotizaciones previsionales (AFP)\n" +
        "2️⃣ TRABAJADOR INDEPENDIENTE: Contrato de prestación de servicios + boletas de honorario\n" +
        "3️⃣ Si trabajaste y tienes finiquito y cotizaciones también puedes convalidar, esto con una antigüedad hasta de 2 años hacia atrás\n" +
        "4️⃣ Práctica realizada Liceo Técnico máximo hace 3 años realizada práctica (Documentos requeridos)\n" +
        "Concentración de notas o Licencia de enseñanza media además, debes solicitar en tu Liceo documento o certificado que indique: Cantidad de horas realizadas, lugar y fecha en la que realizaste tu proceso, esto debe ser firmado y timbrado por Liceo.\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Convalidación*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    case "9.2":
      await sendMessage(from, "📄 *¿Qué documentos necesito para convalidar mi práctica PROFESIONAL?*\n\n" +
        "1️⃣ TRABAJADOR DEPENDIENTE: Contrato de trabajo + cotizaciones previsionales (AFP)+Perfil de cargo o documento similar. Donde se indique el cargo y descripción detallada de las funciones asociadas, con firma y timbre de la empresa.\n" +
        "2️⃣ TRABAJADOR INDEPENDIENTE: Contrato de prestación de servicios que detalle las labores realizadas + boletas de honorario\n\n" +
        "🔙 *Escribe 'volver' para ver otras preguntas de Convalidación*\n" +
        "🏠 *Escribe 'menu' para regresar al menú principal*");
      break;
    
    default:
      await sendMessage(from, "❓ No entendí tu mensaje. Escribe *menu* para ver las opciones.");
      break;
  }
}

// 🔄 Función para manejar selección de pregunta específica
async function handleQuestionSelection(from, text) {
  // Esta función maneja cuando el usuario selecciona una pregunta específica
  // Por ejemplo: "1.2" para la segunda pregunta de la primera categoría
  await handleSpecificAnswer(from, text);
}

// 📝 Función para manejar cuando el usuario está en una categoría y selecciona una pregunta
async function handleQuestionInCategory(from, categoryNumber, questionNumber) {
  const questionId = `${categoryNumber}.${questionNumber}`;
  await handleSpecificAnswer(from, questionId);
}

// 📤 Función para enviar mensajes
async function sendMessage(to, text) {
  try {
    const response = await axios.post(
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
    console.log("✅ Mensaje enviado:", response.data);
  } catch (error) {
    console.error("❌ Error enviando mensaje:", error.response?.data || error);
  }
}

// 🔎 Verificación del Webhook (Meta la hace al inicio)
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
    message: "DuoChat funcionando correctamente",
    webhook: "/webhook",
    timestamp: new Date().toISOString(),
  });
});

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
