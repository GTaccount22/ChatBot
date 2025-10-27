// ========================================
// 📦 IMPORTS Y CONFIGURACIÓN INICIAL
// ========================================
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import { createServer } from "http";
import ngrok from "ngrok";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ========================================
// 🚀 CONFIGURACIÓN DEL SERVIDOR
// ========================================
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Crear servidor HTTP
const server = createServer(app);

// ========================================
// 🔑 VARIABLES DE ENTORNO Y CONFIGURACIÓN
// ========================================
// Variables de Meta desde .env
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Conexión a Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Estado de usuarios del bot
const userStates = new Map();

// ========================================
// 🔌 CONFIGURACIÓN DE SOCKET.IO
// ========================================
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",  // Web React
      "http://localhost:8081",  // App Móvil Expo
      "exp://2w08npi-victorz14-8081.exp.direct" //app expo link
    ],
    methods: ["GET", "POST"],
  },
});

// ========================================
// 📊 SISTEMA DE CONTEO DE USUARIOS
// ========================================
// Ruta del archivo para conteo de usuarios
const conteoFile = path.join(__dirname, 'conteo_usuarios.json');

// Contador de usuarios nuevos por día
let usuariosPorDia = {};

// ========================================
// 📁 FUNCIONES DE ARCHIVO Y FECHA
// ========================================
// Función para cargar datos
function cargarDatos() {
  try {
    if (fs.existsSync(conteoFile)) {
      const data = fs.readFileSync(conteoFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error cargando datos:', error);
  }
  return {};
}

// Función para guardar datos
function guardarDatos() {
  try {
    fs.writeFileSync(conteoFile, JSON.stringify(usuariosPorDia, null, 2));
  } catch (error) {
    console.error('Error guardando datos:', error);
  }
}

// Cargar datos al iniciar
usuariosPorDia = cargarDatos();

// Set para evitar duplicados (debounce)
const usuariosProcesados = new Set();

// Obtener fecha actual YYYY-MM-DD en zona horaria de Chile
function getFechaHoy() {
  const ahora = new Date();
  // Chile está en UTC-3 (o UTC-4 en horario de verano)
  const chileTime = new Date(ahora.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
  return chileTime.toISOString().split('T')[0]; // YYYY-MM-DD
}

function verificarReinicioDiario() {
  const hoy = getFechaHoy();
  const ultimaFecha = Object.keys(usuariosPorDia).sort().pop();
  
  // Solo mostrar log si hay un cambio o si es la primera vez
  if (!ultimaFecha || ultimaFecha !== hoy) {
    console.log(`🕐 Verificando fecha: Hoy=${hoy}, Última=${ultimaFecha}`);
  }
  
  // Si la última fecha no es hoy, reiniciar contadores
  if (ultimaFecha && ultimaFecha !== hoy) {
    console.log('🔄 Nuevo día detectado, reiniciando contadores...');
    usuariosPorDia = {}; // Reiniciar contadores
    guardarDatos();
  }
}

// Ejecutar verificación cada 30 segundos para detectar cambio de fecha casi inmediatamente
setInterval(verificarReinicioDiario, 30 * 1000); // 30 segundos

// Verificación inicial al arrancar el servidor
verificarReinicioDiario();

// ========================================
// ✅ VALIDACIÓN DE VARIABLES
// ========================================
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

// ========================================
// 📤 FUNCIONES DE WHATSAPP
// ========================================
// Función para enviar mensajes a WhatsApp
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

// ========================================
// 📋 ENDPOINTS CRUD PARA BASE DE DATOS
// ========================================

// ------------------- ENDPOINTS CRUD PARA QUESTIONS -------------------

// GET /api/questions -> Listar todas las preguntas
app.get("/api/questions", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Questions").select("*").order("id", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener preguntas" });
  }
});

// GET /api/questions/active -> Listar solo preguntas activas (para el bot)
app.get("/api/questions/active", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("Questions")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener preguntas activas" });
  }
});

// GET /api/questions/:id -> Obtener una pregunta específica
app.get("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("Questions").select("*").eq("id", id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener la pregunta" });
  }
});

// POST /api/questions -> Crear nueva pregunta
app.post("/api/questions", async (req, res) => {
  const { category_id, question, answer } = req.body;

  // Validación básica
  if (!category_id || !question || !answer) {
    console.log("❌ Campos faltantes:", req.body);
    return res.status(400).json({ error: "Todos los campos (category_id, question, answer) son requeridos" });
  }

  try {
    console.log("Intentando crear pregunta:", { category_id, question, answer });
    const { data, error } = await supabase
      .from("Questions")
      .insert([{ category_id, question, answer, is_active: true }])
      .select();

    if (error) {
      console.error("Error insertando en Supabase:", error);
      return res.status(500).json({ error: "Error al crear la pregunta", details: error.message });
    }

    console.log("✅ Pregunta creada:", data[0]);
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Excepción al crear pregunta:", err);
    res.status(500).json({ error: "Error interno al crear la pregunta", details: err.message });
  }
});

// PUT /api/questions/:id -> Editar pregunta existente
app.put("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  const { category_id, question, answer, is_active } = req.body;
  try {
    const updateData = { category_id, question, answer };
    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }
    const { data, error } = await supabase.from("Questions").update(updateData).eq("id", id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar la pregunta" });
  }
});

// PUT /api/questions/:id/toggle -> Activar/desactivar pregunta
app.put("/api/questions/:id/toggle", async (req, res) => {
  const { id } = req.params;
  try {
    // Primero obtener el estado actual
    const { data: currentData, error: fetchError } = await supabase
      .from("Questions")
      .select("is_active")
      .eq("id", id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Cambiar el estado
    const newState = !currentData.is_active;
    const { data, error } = await supabase
      .from("Questions")
      .update({ is_active: newState })
      .eq("id", id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al cambiar estado de la pregunta" });
  }
});

// DELETE /api/questions/:id -> Eliminar pregunta
app.delete("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("Questions").delete().eq("id", id).select();
    if (error) throw error;
    res.json({ message: "Pregunta eliminada", deleted: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar la pregunta" });
  }
});

// ------------------- ENDPOINTS CRUD PARA CATEGORIES -------------------

// GET /api/categories -> Listar todas las categorías
app.get("/api/categories", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Category").select("*").order("id", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

// GET /api/categories/:id -> Obtener una categoría específica
app.get("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("Category").select("*").eq("id", id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener la categoría" });
  }
});

// POST /api/categories -> Crear nueva categoría
app.post("/api/categories", async (req, res) => {
  const { name_category } = req.body;

  // Validación básica
  if (!name_category) {
    console.log("❌ Campo faltante:", req.body);
    return res.status(400).json({ error: "El campo name_category es requerido" });
  }

  try {
    console.log("Intentando crear categoría:", { name_category });
    const { data, error } = await supabase
      .from("Category")
      .insert([{ name_category }])
      .select();

    if (error) {
      console.error("Error insertando en Supabase:", error);
      return res.status(500).json({ error: "Error al crear la categoría", details: error.message });
    }

    console.log("✅ Categoría creada:", data[0]);
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Excepción al crear categoría:", err);
    res.status(500).json({ error: "Error interno al crear la categoría", details: err.message });
  }
});

// PUT /api/categories/:id -> Editar categoría existente
app.put("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  const { name_category } = req.body;
  try {
    const { data, error } = await supabase.from("Category").update({ name_category }).eq("id", id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar la categoría" });
  }
});

// DELETE /api/categories/:id -> Eliminar categoría
app.delete("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("Category").delete().eq("id", id).select();
    if (error) throw error;
    res.json({ message: "Categoría eliminada", deleted: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar la categoría" });
  }
});

// ------------------- ENDPOINTS CRUD PARA USERS -------------------

// GET /api/users -> Listar todos los usuarios
app.get("/api/users", async (req, res) => {
  try {
    const { data, error } = await supabase.from("User").select("*").order("id", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// GET /api/users/:id -> Obtener un usuario específico
app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("User").select("*").eq("id", id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el usuario" });
  }
});

// POST /api/users -> Crear nuevo usuario
app.post("/api/users", async (req, res) => {
  const { rut, institutional_email, gender, first_name, last_name, phone, modality_id } = req.body;

  // Validación básica
  if (!rut || !institutional_email || !first_name || !last_name || !modality_id) {
    console.log("❌ Campos faltantes:", req.body);
    return res.status(400).json({ error: "Los campos rut, institutional_email, first_name, last_name y modality_id son requeridos" });
  }

  try {
    console.log("Intentando crear usuario:", { rut, institutional_email, gender, first_name, last_name, phone, modality_id });
    const { data, error } = await supabase
      .from("User")
      .insert([{ rut, institutional_email, gender, first_name, last_name, phone, modality_id, created_at: new Date().toISOString() }])
      .select();

    if (error) {
      console.error("Error insertando en Supabase:", error);
      return res.status(500).json({ error: "Error al crear el usuario", details: error.message });
    }

    console.log("✅ Usuario creado:", data[0]);
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Excepción al crear usuario:", err);
    res.status(500).json({ error: "Error interno al crear el usuario", details: err.message });
  }
});

// PUT /api/users/:id -> Editar usuario existente
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { rut, institutional_email, gender, first_name, last_name, phone, modality_id } = req.body;
  try {
    const { data, error } = await supabase.from("User").update({ rut, institutional_email, gender, first_name, last_name, phone, modality_id }).eq("id", id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el usuario" });
  }
});

// DELETE /api/users/:id -> Eliminar usuario
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("User").delete().eq("id", id).select();
    if (error) throw error;
    res.json({ message: "Usuario eliminado", deleted: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar el usuario" });
  }
});

// ------------------- ENDPOINTS CRUD PARA MODALITIES -------------------

// GET /api/modalities -> Listar todas las modalidades
app.get("/api/modalities", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Modality").select("*").order("id_modality", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener modalidades" });
  }
});

// GET /api/modalities/:id -> Obtener una modalidad específica
app.get("/api/modalities/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("Modality").select("*").eq("id_modality", id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener la modalidad" });
  }
});

// POST /api/modalities -> Crear nueva modalidad
app.post("/api/modalities", async (req, res) => {
  const { type } = req.body;

  // Validación básica
  if (!type) {
    console.log("❌ Campo faltante:", req.body);
    return res.status(400).json({ error: "El campo type es requerido" });
  }

  try {
    console.log("Intentando crear modalidad:", { type });
    const { data, error } = await supabase
      .from("Modality")
      .insert([{ type }])
      .select();

    if (error) {
      console.error("Error insertando en Supabase:", error);
      return res.status(500).json({ error: "Error al crear la modalidad", details: error.message });
    }

    console.log("✅ Modalidad creada:", data[0]);
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Excepción al crear modalidad:", err);
    res.status(500).json({ error: "Error interno al crear la modalidad", details: err.message });
  }
});

// PUT /api/modalities/:id -> Editar modalidad existente
app.put("/api/modalities/:id", async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  try {
    const { data, error } = await supabase.from("Modality").update({ type }).eq("id_modality", id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar la modalidad" });
  }
});

// DELETE /api/modalities/:id -> Eliminar modalidad
app.delete("/api/modalities/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("Modality").delete().eq("id_modality", id).select();
    if (error) throw error;
    res.json({ message: "Modalidad eliminada", deleted: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar la modalidad" });
  }
});

// ------------------- ENDPOINTS CRUD PARA TUTORIAL STATUS -------------------

// GET /api/tutorial-status -> Listar todos los estados de tutorial
app.get("/api/tutorial-status", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Tutorial_status").select("*").order("id", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener estados de tutorial" });
  }
});

// GET /api/tutorial-status/:id -> Obtener un estado de tutorial específico
app.get("/api/tutorial-status/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("Tutorial_status").select("*").eq("id", id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el estado de tutorial" });
  }
});

// GET /api/tutorial-status/user/:user_id -> Obtener estado de tutorial por usuario
app.get("/api/tutorial-status/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const { data, error } = await supabase.from("Tutorial_status").select("*").eq("user_id", user_id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el estado de tutorial del usuario" });
  }
});

// POST /api/tutorial-status -> Crear nuevo estado de tutorial
app.post("/api/tutorial-status", async (req, res) => {
  const { user_id, seen } = req.body;

  // Validación básica
  if (!user_id || seen === undefined) {
    console.log("❌ Campos faltantes:", req.body);
    return res.status(400).json({ error: "Los campos user_id y seen son requeridos" });
  }

  try {
    console.log("Intentando crear estado de tutorial:", { user_id, seen });
    const { data, error } = await supabase
      .from("Tutorial_status")
      .insert([{ user_id, seen, date: new Date().toISOString() }])
      .select();

    if (error) {
      console.error("Error insertando en Supabase:", error);
      return res.status(500).json({ error: "Error al crear el estado de tutorial", details: error.message });
    }

    console.log("✅ Estado de tutorial creado:", data[0]);
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Excepción al crear estado de tutorial:", err);
    res.status(500).json({ error: "Error interno al crear el estado de tutorial", details: err.message });
  }
});

// PUT /api/tutorial-status/:id -> Editar estado de tutorial existente
app.put("/api/tutorial-status/:id", async (req, res) => {
  const { id } = req.params;
  const { user_id, seen } = req.body;
  try {
    const { data, error } = await supabase.from("Tutorial_status").update({ user_id, seen }).eq("id", id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el estado de tutorial" });
  }
});

// DELETE /api/tutorial-status/:id -> Eliminar estado de tutorial
app.delete("/api/tutorial-status/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("Tutorial_status").delete().eq("id", id).select();
    if (error) throw error;
    res.json({ message: "Estado de tutorial eliminado", deleted: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar el estado de tutorial" });
  }
});

// ------------------- ENDPOINTS CRUD PARA RATINGS -------------------

// GET /api/ratings -> Listar todas las calificaciones
app.get("/api/ratings", async (req, res) => {
  try {
    console.log("📊 Solicitando calificaciones...");
    const { data, error } = await supabase
      .from("Rating")
      .select(`
        id,
        score,
        comment,
        date,
        user_id,
        User(
          id,
          first_name,
          last_name,
          institutional_email,
          rut,
          modality_id,
          Modality(
            id_modality,
            type
          )
        )
      `)
      .order("date", { ascending: false });
    
    if (error) {
      console.error("❌ Error de Supabase:", error);
      throw error;
    }
    
    // Transformar los datos para que coincidan con el frontend
    const transformedData = data.map(r => ({
      id: r.id,
      score: r.score,          
      comment: r.comment,        
      date: r.date,            
      user_id: r.user_id,
      nombre: r.User ? `${r.User.first_name || ''} ${r.User.last_name || ''}`.trim() || 'Estudiante sin nombre' : 'Estudiante sin nombre',
      correo: r.User?.institutional_email || 'Sin correo',
      rut: r.User?.rut || 'Sin RUT',
      modalidad: r.User?.Modality?.type || 'Sin modalidad'
    }));
    
    console.log(`✅ Calificaciones obtenidas: ${transformedData.length} registros`);
    res.json(transformedData);
  } catch (err) {
    console.error("❌ Error al obtener calificaciones:", err);
    res.status(500).json({ error: "Error al obtener calificaciones", details: err.message });
  }
});

// POST /api/ratings -> Crear nueva calificación
app.post("/api/ratings", async (req, res) => {
  const { user_id, score, comment } = req.body;

  // Validación básica
  if (!user_id || !score) {
    console.log("❌ Campos faltantes:", req.body);
    return res.status(400).json({ error: "Los campos user_id y score son requeridos" });
  }

  try {
    console.log("Intentando crear calificación:", { user_id, score, comment });
    const { data, error } = await supabase
      .from("Rating")
      .insert([{ user_id, score, comment, date: new Date().toISOString() }])
      .select();

    if (error) {
      console.error("Error insertando en Supabase:", error);
      return res.status(500).json({ error: "Error al crear la calificación", details: error.message });
    }

    console.log("✅ Calificación creada:", data[0]);
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Excepción al crear calificación:", err);
    res.status(500).json({ error: "Error interno al crear la calificación", details: err.message });
  }
});

// PUT /api/ratings/:id -> Editar calificación existente
app.put("/api/ratings/:id", async (req, res) => {
  const { id } = req.params;
  const { user_id, score, comment } = req.body;
  try {
    const { data, error } = await supabase.from("Rating").update({ user_id, score, comment }).eq("id", id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar la calificación" });
  }
});

// DELETE /api/ratings/:id -> Eliminar calificación
app.delete("/api/ratings/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("Rating").delete().eq("id", id).select();
    if (error) throw error;
    res.json({ message: "Calificación eliminada", deleted: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar la calificación" });
  }
});

// ========================================
// 🌐 RUTAS Y WEBHOOKS
// ========================================
// Verificar webhook
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

// Ruta principal
app.get("/", (req, res) => {
  res.json({
    status: "Bot activo ✅",
    message: "DucoChat funcionando correctamente",
    webhook: "/webhook",
    socketio: "Socket.IO integrado",
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// 📊 ENDPOINTS DE SOCKET.IO
// ========================================
// Endpoint para consultar conteos
app.get("/api/usuarios-por-dia", (req, res) => {
  res.json(usuariosPorDia);
});

// Endpoint para verificar fecha actual
app.get("/api/fecha-actual", (req, res) => {
  const hoy = getFechaHoy();
  const ultimaFecha = Object.keys(usuariosPorDia).sort().pop();
  const ahoraUTC = new Date().toISOString();
  const ahoraChile = new Date(new Date().getTime() - (3 * 60 * 60 * 1000)).toISOString();
  
  res.json({
    fecha_hoy_chile: hoy,
    ultima_fecha_registrada: ultimaFecha,
    necesita_reinicio: ultimaFecha !== hoy,
    hora_utc: ahoraUTC,
    hora_chile: ahoraChile,
    contadores_actuales: usuariosPorDia
  });
});

// Endpoint para resetear contador del día actual (solo para desarrollo)
app.post("/api/reset-hoy", (req, res) => {
  const hoy = getFechaHoy();
  usuariosPorDia[hoy] = 0;
  guardarDatos();
  
  // Limpiar usuarios procesados del día
  const keysToDelete = Array.from(usuariosProcesados).filter(key => 
    key.includes(hoy) || key.includes(`nuevo_`) && key.includes(hoy)
  );
  keysToDelete.forEach(key => usuariosProcesados.delete(key));
  
  res.json({ 
    mensaje: `Contador del ${hoy} reseteado a 0`,
    fecha: hoy,
    total: usuariosPorDia[hoy]
  });
});

// Endpoint para obtener la URL de ngrok
app.get("/api/ngrok-url", (req, res) => {
  try {
    if (fs.existsSync('ngrok-url.txt')) {
      const url = fs.readFileSync('ngrok-url.txt', 'utf8').trim();
      res.json({ 
        ngrok_url: url,
        webhook_url: `${url}/webhook`,
        api_base: url,
        status: "active"
      });
    } else {
      res.json({ 
        ngrok_url: null,
        webhook_url: null,
        api_base: `http://localhost:${PORT}`,
        status: "local_only"
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo URL de ngrok" });
  }
});

// Endpoint para debug - ver estado del servidor
app.get("/api/debug", (req, res) => {
  const hoy = getFechaHoy();
  res.json({
    fecha_actual: hoy,
    contadores: usuariosPorDia,
    usuarios_procesados: Array.from(usuariosProcesados),
    conexiones_activas: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

// Webhook para recibir mensajes
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

// ========================================
// 🤖 CÓDIGO DEL BOT DE WHATSAPP
// ========================================
// ---------------------- BOT WHATSAPP ----------------------
// Obtener preguntas por categoría desde Supabase (solo activas)
async function getQuestionsByCategory(categoryId) {
  const { data, error } = await supabase
    .from("Questions")
    .select("id, question, answer")
    .eq("category_id", categoryId)
    .eq("is_active", true) // Solo preguntas activas
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
    .from("Category")
    .select("id, name_category")
    .order("id", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener categorías:", error);
    return { menuText: "⚠️ Error al cargar el menú.", categories: [] };
  }

  let menuText =
    "¡Hola! 👋 Bienvenido a DucoChat.\nEstamos aquí para ayudarte 24/7.\n\n📋 *Opciones disponibles:*\n\n";

  const circleNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  data.forEach((cat, index) => {
    const numberSymbol = circleNumbers[index] || `${index + 1}.`;
    menuText += `${numberSymbol} ${cat.name_category}\n`;
  });

  menuText += "\n💡 *Escribe el número de la opción que te interesa*";

  return { menuText, categories: data };
}

async function sendMainMenu(to) {
  const { menuText } = await buildMenu();
  await sendMessage(to, menuText);
}

// ---------------------- NAVEGACIÓN BOT ----------------------
async function handleNavigation(from, text) {
  const userState = userStates.get(from) || { category: null, questionIndex: null };

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

    const categoryData = categories[index];
    await handleCategorySelection(from, categoryData);
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
      "No entendí tu mensaje. Escribe *Menú* para ver las opciones."
  );
}

// Responder una pregunta con su "answer"
async function handleQuestionInCategory(from, categoryData, questionNumber) {
  const questions = await getQuestionsByCategory(categoryData.id);
  const questionIndex = parseInt(questionNumber, 10) - 1;

  if (!questions[questionIndex]) {
    await sendMessage(
      from,
      "Pregunta no encontrada. Escribe *Menú* para volver."
    );
    return;
  }

  const question = questions[questionIndex];

  // 🔑 Guardamos el índice actual en el estado del usuario
  userStates.set(from, { category: categoryData, questionIndex });

  await sendMessage(
    from,
    `*${question.question}*\n\n✅ ${question.answer}`
  );

  // Enviar mensaje separado con opciones de navegación
  await sendMessage(
    from,
    `🔙 Escribe *Menú* para volver al inicio.\n\nEn caso de que no estés conforme con esta respuesta haz click acá https://experienciavivo.duoc.cl/alumnos/solicitudes`
  );
}


// Mostrar preguntas de una categoría
async function handleCategorySelection(from, categoryData) {
  const questions = await getQuestionsByCategory(categoryData.id);

  if (questions.length === 0) {
    await sendMessage(
      from,
      "❌ No hay preguntas disponibles en esta categoría."
    );
    return;
  }

  let messageText = `📚 *${categoryData.name_category}*\n\nSelecciona una pregunta:\n\n`;
  const circleNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  questions.forEach((q, index) => {
    const numberSymbol = circleNumbers[index] || `${index + 1}.`;
    messageText += `${numberSymbol} ${q.question}\n`;
  });
  messageText += `\n💡 Escribe el número de la pregunta\n🔙 Escribe *Menú* para volver al inicio.`;

  userStates.set(from, { category: categoryData });
  await sendMessage(from, messageText);
}




// ========================================
// 🔌 CÓDIGO DE SOCKET.IO
// ========================================
// ---------------------- SOCKET.IO ----------------------
io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado:", socket.id);
  console.log("🌐 Origen de conexión:", socket.handshake.headers.origin);

  // Nuevo usuario (solo para logging, NO cuenta)
  socket.on("nuevo_usuario", (data) => {
    console.log("👤 Nuevo usuario registrado:", data);
    // NO contamos aquí para evitar duplicados
    // El conteo real se hace en tutorial_completado
  });

  // Nueva calificación (solo notificar)
  socket.on("nueva_calificacion", (data) => {
    io.emit("actualizar_calificaciones", data);
    console.log("⭐ Nueva calificación automática:", data);
  });

  // Modificar el evento tutorial_completado
  socket.on("tutorial_completado", (data) => {
    console.log('🎓 Tutorial completado recibido:', data);
    console.log('🔍 Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Usar siempre la fecha actual para la clave única
    const hoy = getFechaHoy();
    const key = `${data.usuario_id}_${hoy}`;
    
    console.log('🔑 Clave generada:', key);
    console.log('📅 Fecha actual:', hoy);
    console.log('👥 Usuarios ya procesados:', Array.from(usuariosProcesados));
    
    if (usuariosProcesados.has(key)) {
      console.log('⚠️ Usuario ya procesado, ignorando:', key);
      return;
    }
    
    // Solo contar si es el primer tutorial del usuario
    if (data.es_primer_tutorial) {
      // Marcar como procesado ANTES de contar
      usuariosProcesados.add(key);
      console.log('✅ Procesando usuario nuevo:', key);
      
      if (!usuariosPorDia[hoy]) usuariosPorDia[hoy] = 0;
      usuariosPorDia[hoy]++;
      guardarDatos();
      
      console.log('📊 Nuevo conteo:', { fecha: hoy, total: usuariosPorDia[hoy] });
      
      // Emitir actualización
      io.emit("actualizar_conteo", { fecha: hoy, total: usuariosPorDia[hoy] });
    } else {
      console.log('ℹ️ Tutorial repetido, no se cuenta:', key);
      console.log('❌ es_primer_tutorial es false:', data.es_primer_tutorial);
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// ========================================
// 🚀 INICIO DEL SERVIDOR
// ========================================
const PORT = process.env.PORT || 5000;

// Función para iniciar ngrok
async function startNgrok() {
  try {
    console.log('🔄 Iniciando ngrok...');
    const url = await ngrok.connect({
      addr: PORT,
      // Remover configuraciones opcionales que pueden causar problemas
    });
    
    console.log(`🌐 Ngrok URL: ${url}`);
    console.log(`📱 Webhook URL para WhatsApp: ${url}/webhook`);
    
    // Guardar la URL en un archivo para fácil acceso
    fs.writeFileSync('ngrok-url.txt', url);
    console.log(`💾 URL guardada en ngrok-url.txt`);
    
    return url;
  } catch (error) {
    console.error('❌ Error iniciando ngrok:', error.message);
    console.log('💡 Ngrok no disponible, servidor funcionará solo localmente');
    console.log('💡 Para usar ngrok:');
    console.log('   1. Regístrate en https://ngrok.com');
    console.log('   2. Descarga ngrok y ejecuta: ngrok http 5000');
    console.log('   3. O agrega NGROK_AUTHTOKEN a tu .env');
    return null;
  }
}

server.listen(PORT, async () => {
  console.log(`🚀 Servidor unificado escuchando en http://localhost:${PORT}`);
  console.log(`🤖 Bot de WhatsApp: activo`);
  console.log(`🔌 Socket.IO: integrado`);
  
  // Iniciar ngrok
  const ngrokUrl = await startNgrok();
  
  if (ngrokUrl) {
    console.log(`\n🎉 ¡Servidor listo!`);
    console.log(`📱 Usa esta URL para configurar tu webhook de WhatsApp: ${ngrokUrl}/webhook`);
    console.log(`🌐 Accede a tu API desde: ${ngrokUrl}`);
  } else {
    console.log(`\n⚠️ Servidor funcionando solo localmente en http://localhost:${PORT}`);
  }
});

// ========================================
// ⚠️ MANEJO DE ERRORES
// ========================================
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
