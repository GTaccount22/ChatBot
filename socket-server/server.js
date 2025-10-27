import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);


// ✅ DESPUÉS
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

// Ruta del archivo
const conteoFile = path.join(__dirname, 'conteo_usuarios.json');

// Contador de usuarios nuevos por día
let usuariosPorDia = {};

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

// Socket.IO
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

server.listen(3001, () => {
  console.log("✅ Servidor Socket.IO corriendo en http://localhost:3001");
});
