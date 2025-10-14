import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// 🔑 Configurar Supabase con service role key (administrador)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Faltan variables de entorno para Supabase");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ------------------- ENDPOINTS CRUD -------------------

// GET /api/questions -> Listar todas las preguntas
app.get("/api/questions", async (req, res) => {
  try {
    const { data, error } = await supabase.from("questions").select("*").order("id", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener preguntas" });
  }
});

// GET /api/questions/:id -> Obtener una pregunta específica
app.get("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("questions").select("*").eq("id", id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener la pregunta" });
  }
});

// POST /api/questions -> Crear nueva pregunta
// POST /api/questions -> Crear nueva pregunta
app.post("/api/questions", async (req, res) => {
  const { category, question, answer } = req.body;

  // Validación básica
  if (!category || !question || !answer) {
    console.log("❌ Campos faltantes:", req.body);
    return res.status(400).json({ error: "Todos los campos (category, question, answer) son requeridos" });
  }

  try {
    console.log("Intentando crear pregunta:", { category, question, answer });
    const { data, error } = await supabase
      .from("questions")
      .insert([{ category, question, answer }])
      .select(); // select() para que devuelva los datos insertados

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
  const { category, question, answer } = req.body;
  try {
    const { data, error } = await supabase.from("questions").update({ category, question, answer }).eq("id", id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar la pregunta" });
  }
});

// DELETE /api/questions/:id -> Eliminar pregunta
app.delete("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("questions").delete().eq("id", id).select();
    if (error) throw error;
    res.json({ message: "Pregunta eliminada", deleted: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar la pregunta" });
  }
});

// ------------------- ENDPOINTS DE CALIFICACIONES -------------------

// GET /api/ratings -> Listar todas las calificaciones
app.get("/api/ratings", async (req, res) => {
  try {
    const { data, error } = await supabase.from("calificaciones").select("*").order("id", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener calificaciones" });
  }
});

// POST /api/ratings -> Crear nueva calificación
app.post("/api/ratings", async (req, res) => {
  const { nombre, correo, modalidad, calificacion, comentario } = req.body;

  // Validación básica
  if (!nombre || !correo || !calificacion) {
    console.log("❌ Campos faltantes:", req.body);
    return res.status(400).json({ error: "Los campos nombre, correo y calificacion son requeridos" });
  }

  try {
    console.log("Intentando crear calificación:", { nombre, correo, modalidad, calificacion, comentario });
    const { data, error } = await supabase
      .from("calificaciones")
      .insert([{ nombre, correo, modalidad, calificacion, comentario }])
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
  const { nombre, correo, modalidad, calificacion, comentario } = req.body;
  try {
    const { data, error } = await supabase.from("calificaciones").update({ nombre, correo, modalidad, calificacion, comentario }).eq("id", id).select();
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
    const { data, error } = await supabase.from("calificaciones").delete().eq("id", id).select();
    if (error) throw error;
    res.json({ message: "Calificación eliminada", deleted: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar la calificación" });
  }
});

// ------------------------------------------------------
// Ruta principal
app.get("/", (req, res) => {
  res.json({ status: "Backend preguntas activo ✅", timestamp: new Date().toISOString() });
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
