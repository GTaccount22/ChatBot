// Configuración simplificada para Socket.IO
// Cambia a true cuando tengas tu servidor Socket.IO ejecutándose
export const SOCKET_ENABLED = true;

// URL del servidor Socket.IO (cambia por tu IP local)
export const SOCKET_URL = 'http://192.168.1.20:3001';

// Configuración de conexión simplificada
export const SOCKET_OPTIONS = {
  transports: ['websocket', 'polling'],
  timeout: 5000,
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
  autoConnect: true,
};
