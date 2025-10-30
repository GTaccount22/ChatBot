// ========================================
// 📦 IMPORTS Y CONFIGURACIÓN INICIAL
// ========================================
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

dotenv.config();

// URL del backend en Render
const BACKEND_URL = process.env.BACKEND_URL || "https://chatbot-f08a.onrender.com";

// ========================================
// 🚀 CONFIGURACIÓN DEL SERVIDOR
// ========================================
const app = express();

// CORS - Middleware personalizado para debugging
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// También usar cors para redundancia
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

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
    origin: "*", // Permite todos los orígenes temporalmente
    methods: ["GET", "POST"],
    credentials: true
  },
});

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
// IMPORTANTE: Todos los endpoints GET que devuelven listas retornan arrays DIRECTAMENTE
// Formato de respuesta: [] (array directo, NO { success: true, data: [] })
// Los endpoints GET/:id devuelven objetos directos: {} (NO { success: true, data: {} })
// Los endpoints POST/PUT devuelven el objeto creado/actualizado: {} (NO { success: true, data: {} })

// ------------------- ENDPOINTS CRUD PARA QUESTIONS -------------------

// GET /api/questions -> Listar todas las preguntas
// Retorna: [] (array directo)
app.get("/api/questions", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Questions").select("*").order("id", { ascending: true });
    if (error) throw error;
    // Devolver array directo - el frontend hace .map(res.data) esperando un array
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json([]); // Devolver array vacío en caso de error
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
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json([]); // Devolver array vacío en caso de error
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
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json([]); // Devolver array vacío en caso de error
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
    const { data, error } = await supabase.from("User").select("*").order("rut", { ascending: true });
    if (error) throw error;
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json([]); // Devolver array vacío en caso de error
  }
});

// GET /api/users/:rut -> Obtener un usuario específico por RUT
app.get("/api/users/:rut", async (req, res) => {
  const { rut } = req.params;
  try {
    const { data, error } = await supabase.from("User").select("*").eq("rut", rut).single();
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

// PUT /api/users/:rut -> Editar usuario existente
app.put("/api/users/:rut", async (req, res) => {
  const { rut: rutParam } = req.params;
  const { rut, institutional_email, gender, first_name, last_name, phone, modality_id } = req.body;
  try {
    const { data, error } = await supabase.from("User").update({ rut, institutional_email, gender, first_name, last_name, phone, modality_id }).eq("rut", rutParam).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el usuario" });
  }
});

// DELETE /api/users/:rut -> Eliminar usuario
app.delete("/api/users/:rut", async (req, res) => {
  const { rut } = req.params;
  try {
    const { data, error } = await supabase.from("User").delete().eq("rut", rut).select();
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
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json([]); // Devolver array vacío en caso de error
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
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json([]); // Devolver array vacío en caso de error
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

// GET /api/tutorial-status/user/:rut -> Obtener estado de tutorial por usuario
app.get("/api/tutorial-status/user/:rut", async (req, res) => {
  const { rut } = req.params;
  try {
    const { data, error } = await supabase.from("Tutorial_status").select("*").eq("rut", rut).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el estado de tutorial del usuario" });
  }
});

// POST /api/tutorial-status -> Crear nuevo estado de tutorial
app.post("/api/tutorial-status", async (req, res) => {
  const { rut, seen } = req.body;

  // Validación básica
  if (!rut || seen === undefined) {
    console.log("❌ Campos faltantes:", req.body);
    return res.status(400).json({ error: "Los campos rut y seen son requeridos" });
  }

  try {
    console.log("Intentando crear estado de tutorial:", { rut, seen });
    const { data, error } = await supabase
      .from("Tutorial_status")
      .insert([{ rut, seen, date: new Date().toISOString() }])
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
  const { rut, seen } = req.body;
  try {
    const { data, error } = await supabase.from("Tutorial_status").update({ rut, seen }).eq("id", id).select();
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

// GET /api/usuarios-por-dia -> Conteo de usuarios (tutorial completado) por día
app.get("/api/usuarios-por-dia", async (req, res) => {
  try {
    // Parámetros: days (default 30) o rango from/to (YYYY-MM-DD)
    const { days, from, to } = req.query;

    let startDate;
    let endDate;

    if (from || to) {
      startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      endDate = to ? new Date(to) : new Date();
    } else {
      const lookbackDays = Number(days) > 0 ? Number(days) : 30;
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate = new Date(startDate.getTime() - (lookbackDays - 1) * 24 * 60 * 60 * 1000);
      endDate = new Date();
    }

    const startISO = new Date(startDate).toISOString();
    const endISO = new Date(endDate).toISOString();

    // Traer todos los registros del rango y agregarlos en memoria
    const { data, error } = await supabase
      .from("Tutorial_status")
      .select("id, date")
      .gte("date", startISO)
      .lte("date", endISO)
      .order("date", { ascending: true });

    if (error) throw error;

    // Construir mapa de fechas YYYY-MM-DD -> count
    const toYMD = (d) => {
      const dt = new Date(d);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const da = String(dt.getDate()).padStart(2, "0");
      return `${y}-${m}-${da}`;
    };

    const countsByDay = new Map();
    (Array.isArray(data) ? data : []).forEach((row) => {
      const key = toYMD(row.date);
      countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
    });

    // Generar salida ordenada y completa (rellenar días sin datos con 0)
    const result = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      const key = toYMD(cursor);
      result.push({ date: key, count: countsByDay.get(key) || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// POST /api/tutorial-completado -> Marcar tutorial como completado y contar como nuevo usuario
app.post("/api/tutorial-completado", async (req, res) => {
  const { rut } = req.body;

  // Validación básica
  if (!rut) {
    return res.status(400).json({ error: "El campo rut es requerido" });
  }

  try {
    // Verificar si ya existe un registro para este rut
    const { data: existingTutorial, error: fetchError } = await supabase
      .from("Tutorial_status")
      .select("*")
      .eq("rut", rut)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 es el error cuando no se encuentra ningún registro
      console.error("Error verificando tutorial:", fetchError);
      throw fetchError;
    }

    if (!existingTutorial) {
      // No existe, crear nuevo registro
      console.log(`📝 Creando nuevo registro de tutorial para rut: ${rut}`);
      const { data: newTutorial, error: insertError } = await supabase
        .from("Tutorial_status")
        .insert([{ rut, seen: true, date: new Date().toISOString() }])
        .select();

      if (insertError) {
        console.error("Error insertando tutorial:", insertError);
        throw insertError;
      }

      // Emitir evento a frontend para actualizar contador
      io.emit("nuevo-usuario", { rut });
      console.log(`✅ Usuario ${rut} contado como nuevo - evento emitido`);

      res.json({ mensaje: "Usuario contado como nuevo", data: newTutorial[0] });
    } else {
      // Ya existe el registro
      console.log(`ℹ️ Usuario ${rut} ya vio el tutorial anteriormente`);
      res.json({ mensaje: "Usuario ya vio el tutorial", data: existingTutorial });
    }
  } catch (err) {
    console.error("❌ Error al actualizar tutorial_status:", err);
    res.status(500).json({ error: "Error al actualizar tutorial_status", details: err.message });
  }
});

// ------------------- ENDPOINTS CRUD PARA RATINGS -------------------

// GET /api/ratings -> Listar todas las calificaciones
app.get("/api/ratings", async (req, res) => {
  try {
    console.log("📊 Solicitando calificaciones...");
    
    // Primero obtener los ratings
    const { data: ratingsData, error: ratingsError } = await supabase
      .from("Rating")
      .select("id, score, comment, date, rut")
      .order("date", { ascending: false });
    
    if (ratingsError) {
      console.error("❌ Error obteniendo ratings:", ratingsError);
      throw ratingsError;
    }
    
    // Luego obtener los usuarios para cada rating
    const transformedData = await Promise.all(
      ratingsData.map(async (r) => {
        let userData = null;
        let modalityData = null;
        
        if (r.rut) {
          const { data: user, error: userError } = await supabase
            .from("User")
            .select("rut, first_name, last_name, institutional_email, modality_id")
            .eq("rut", r.rut)
            .single();
          
          if (!userError && user) {
            userData = user;
            
            // Obtener modalidad si existe
            if (user.modality_id) {
              const { data: modality, error: modalityError } = await supabase
                .from("Modality")
                .select("id_modality, type")
                .eq("id_modality", user.modality_id)
                .single();
              
              if (!modalityError && modality) {
                modalityData = modality;
              }
            }
          }
        }
        
        return {
          id: r.id,
          score: r.score,
          comment: r.comment,
          date: r.date,
          rut: r.rut,
          nombre: userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Estudiante sin nombre' : 'Estudiante sin nombre',
          correo: userData?.institutional_email || 'Sin correo',
          rut_usuario: userData?.rut || 'Sin RUT',
          modalidad: modalityData?.type || 'Sin modalidad'
        };
      })
    );
    
    console.log(`✅ Calificaciones obtenidas: ${transformedData.length} registros`);
    res.json(Array.isArray(transformedData) ? transformedData : []);
  } catch (err) {
    console.error("❌ Error al obtener calificaciones:", err);
    res.status(500).json([]); // Devolver array vacío en caso de error
  }
});

// POST /api/ratings -> Crear nueva calificación
app.post("/api/ratings", async (req, res) => {
  const { rut, score, comment } = req.body;

  // Validación básica
  if (!rut || !score) {
    console.log("❌ Campos faltantes:", req.body);
    return res.status(400).json({ error: "Los campos rut y score son requeridos" });
  }

  try {
    console.log("Intentando crear calificación:", { rut, score, comment });
    const { data, error } = await supabase
      .from("Rating")
      .insert([{ rut, score, comment, date: new Date().toISOString() }])
      .select();

    if (error) {
      console.error("Error insertando en Supabase:", error);
      return res.status(500).json({ error: "Error al crear la calificación", details: error.message });
    }

    console.log("✅ Calificación creada:", data[0]);

    // Obtener datos completos del usuario para enviar en tiempo real
    let userData = null;
    let modalityData = null;
    
    if (data[0].rut) {
      const { data: user, error: userError } = await supabase
        .from("User")
        .select("rut, first_name, last_name, institutional_email, modality_id")
        .eq("rut", data[0].rut)
        .single();
      
      if (!userError && user) {
        userData = user;
        
        // Obtener modalidad si existe
        if (user.modality_id) {
          const { data: modality, error: modalityError } = await supabase
            .from("Modality")
            .select("id_modality, type")
            .eq("id_modality", user.modality_id)
            .single();
          
          if (!modalityError && modality) {
            modalityData = modality;
          }
        }
      }
    }

    // Crear objeto completo para enviar en tiempo real
    const ratingComplete = {
      id: data[0].id,
      score: data[0].score,
      comment: data[0].comment,
      date: data[0].date,
      rut: data[0].rut,
      nombre: userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Estudiante sin nombre' : 'Estudiante sin nombre',
      correo: userData?.institutional_email || 'Sin correo',
      rut_usuario: userData?.rut || 'Sin RUT',
      modalidad: modalityData?.type || 'Sin modalidad'
    };

    // Emitir evento de Socket.IO para actualizar en tiempo real
    io.emit("actualizar_calificaciones", ratingComplete);
    console.log("📢 Evento emitido para actualizar calificaciones en tiempo real");

    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Excepción al crear calificación:", err);
    res.status(500).json({ error: "Error interno al crear la calificación", details: err.message });
  }
});

// PUT /api/ratings/:id -> Editar calificación existente
app.put("/api/ratings/:id", async (req, res) => {
  const { id } = req.params;
  const { rut, score, comment } = req.body;
  try {
    const { data, error } = await supabase.from("Rating").update({ rut, score, comment }).eq("id", id).select();
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

// Endpoint para obtener la URL del webhook
app.get("/api/webhook-url", (req, res) => {
  try {
    res.json({ 
      backend_url: BACKEND_URL,
      webhook_url: `${BACKEND_URL}/webhook`,
      api_base: BACKEND_URL,
      status: "active"
    });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo URL del webhook" });
  }
});

// Endpoint para debug - ver estado del servidor
app.get("/api/debug", (req, res) => {
  res.json({
    conexiones_activas: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
    status: "Servidor funcionando correctamente",
    puerto: PORT,
    backend_url: BACKEND_URL,
    webhook_url: `${BACKEND_URL}/webhook`
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    server: "Backend ChatBot funcionando"
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
    `🔙 Escribe *Menú* para volver al inicio.\n\nEn caso de no estar conforme puedes acercarte al centro académico.`
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

  // Nuevo usuario (solo para logging)
  socket.on("nuevo_usuario", (data) => {
    console.log("👤 Nuevo usuario registrado:", data);
  });

  // Nueva calificación - obtener datos completos antes de emitir
  socket.on("nueva_calificacion", async (data) => {
    try {
      // Obtener datos completos del usuario si hay rut
      let userData = null;
      let modalityData = null;
      
      if (data.rut) {
        const { data: user, error: userError } = await supabase
          .from("User")
          .select("rut, first_name, last_name, institutional_email, modality_id")
          .eq("rut", data.rut)
          .single();
        
        if (!userError && user) {
          userData = user;
          
          // Obtener modalidad si existe
          if (user.modality_id) {
            const { data: modality, error: modalityError } = await supabase
              .from("Modality")
              .select("id_modality, type")
              .eq("id_modality", user.modality_id)
              .single();
            
            if (!modalityError && modality) {
              modalityData = modality;
            }
          }
        }
      }

      // Crear objeto completo para enviar
      const ratingComplete = {
        id: data.id,
        score: data.score,
        comment: data.comment,
        date: data.date,
        rut: data.rut,
        nombre: userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Estudiante sin nombre' : 'Estudiante sin nombre',
        correo: userData?.institutional_email || 'Sin correo',
        rut_usuario: userData?.rut || 'Sin RUT',
        modalidad: modalityData?.type || 'Sin modalidad'
      };

      // Emitir evento completo a todos los clientes
      io.emit("actualizar_calificaciones", ratingComplete);
      console.log("⭐ Nueva calificación emitida en tiempo real:", ratingComplete);
    } catch (err) {
      console.error("❌ Error procesando nueva calificación:", err);
    }
  });

  // Tutorial completado (solo para logging)
  socket.on("tutorial_completado", (data) => {
    console.log('🎓 Tutorial completado recibido:', data);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// ========================================
// 🚀 INICIO DEL SERVIDOR
// ========================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor unificado escuchando en http://localhost:${PORT}`);
  console.log(`🤖 Bot de WhatsApp: activo`);
  console.log(`🔌 Socket.IO: integrado`);
  console.log(`\n🎉 ¡Servidor listo!`);
  console.log(`🌐 Backend URL: ${BACKEND_URL}`);
  console.log(`📱 Webhook URL para WhatsApp: ${BACKEND_URL}/webhook`);
  console.log(`🔗 Usa esta URL en tu configuración de webhook de Meta/WhatsApp`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ El puerto ${PORT} ya está en uso.`);
    console.log('💡 Soluciones:');
    console.log(`   1. Cierra la otra aplicación que usa el puerto ${PORT}`);
    console.log(`   2. O cambia el puerto en tu archivo .env: PORT=5001`);
    console.log(`   3. O ejecuta: netstat -ano | findstr :${PORT} para ver qué proceso lo usa`);
    console.log('   4. Luego mata el proceso con: taskkill /PID <PID> /F');
  } else {
    console.error('❌ Error al iniciar el servidor:', err.message);
  }
  process.exit(1);
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
