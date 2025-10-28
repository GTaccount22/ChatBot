// Configuración simplificada para Socket.IO
export const SOCKET_ENABLED = true;

// URLs del servidor - Configuración con fallback
const PRODUCTION_URL = "https://chatbot-4gaq.onrender.com";
const LOCAL_URL = "http://localhost:5000";

// Función para detectar qué URL usar
const detectarURLActiva = async (): Promise<string> => {
  try {
    console.log('🔍 Probando conexión con servidor de producción...');
    
    // Crear AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${PRODUCTION_URL}/api/usuarios-por-dia`, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Servidor de producción disponible');
      return PRODUCTION_URL;
    }
  } catch (error) {
    console.log('❌ Servidor de producción no disponible:', error);
  }
  
  console.log('🔄 Usando localhost como fallback');
  return LOCAL_URL;
};

// URLs dinámicas
export const getSocketURL = async (): Promise<string> => {
  return await detectarURLActiva();
};

export const getAPIURL = async (): Promise<string> => {
  const baseURL = await detectarURLActiva();
  return `${baseURL}/api/usuarios-por-dia`;
};

// URLs por defecto (para casos síncronos)
export const SOCKET_URL = PRODUCTION_URL;
export const API_URL = `${PRODUCTION_URL}/api/usuarios-por-dia`;

// Configuración de conexión optimizada para Render con límites de reconexión
export const SOCKET_OPTIONS = {
  transports: ["websocket"], // Forzar WebSocket
  timeout: 20000,
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 3, // Limitar reconexiones para evitar bucles
  reconnectionDelay: 2000, // 2 segundos entre intentos
  reconnectionDelayMax: 5000,
  autoConnect: true,
  upgrade: true,
  rememberUpgrade: false,
  pingTimeout: 60000,
  pingInterval: 25000,
  withCredentials: false,
  extraHeaders: {}
};
