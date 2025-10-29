import axios from "axios";

// Normalizar la URL: remover trailing slash
const normalizeUrl = (url) => {
  if (!url) return url;
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

/**
 * URL del backend API
 * 
 * En desarrollo: usa localhost (según .env)
 * En producción (Render): usa la URL de Render como fallback o variable de entorno REACT_APP_API_URL
 * 
 * Para configurar en Render (opcional, ya hay fallback):
 * 1. Ve a tu servicio de frontend en Render Dashboard
 * 2. Settings → Environment Variables
 * 3. Agrega: REACT_APP_API_URL = https://chatbot-f08a.onrender.com
 * 
 * IMPORTANTE: Esta debe ser la URL del BACKEND, no del frontend
 */
const API_URL = normalizeUrl(process.env.REACT_APP_API_URL || "https://chatbot-f08a.onrender.com");

// Log para verificar qué URL se está usando
console.log('🔗 API_URL configurada:', API_URL);
console.log('🔗 REACT_APP_API_URL:', process.env.REACT_APP_API_URL || 'No configurada (usando fallback Render)');
console.log('🔗 Modo:', process.env.REACT_APP_API_URL ? 'PRODUCCIÓN (variable de entorno)' : 'PRODUCCIÓN (fallback Render)');

// Validar que la URL no esté vacía
if (!API_URL) {
  console.error('❌ ERROR: API_URL está vacía. Configura REACT_APP_API_URL en Render.');
}

/**
 * Instancia de axios configurada con baseURL
 * 
 * Todas las rutas relativas (ej: '/api/categories') se combinan automáticamente
 * con baseURL para formar la URL completa:
 * 
 * baseURL = 'https://backend.onrender.com'
 * api.get('/api/categories') → 'https://backend.onrender.com/api/categories'
 */
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Exportar también API_URL por si se necesita en otros lugares
export { API_URL };

// Interceptor para requests: log de la URL completa
api.interceptors.request.use(
  (config) => {
    // Construir la URL completa manualmente para verificación
    const fullUrl = config.url?.startsWith('http') 
      ? config.url  // Si ya es URL absoluta
      : `${config.baseURL}${config.url}`; // Combinar baseURL + ruta relativa
    
    console.log(`🌐 Request: ${config.method?.toUpperCase()} ${fullUrl}`);
    console.log(`   baseURL: ${config.baseURL}`);
    console.log(`   url relativa: ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses: log de la respuesta
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
    });
    return response;
  },
  (error) => {
    const fullUrl = error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown';
    console.error('❌ API Error:', {
      url: fullUrl,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default api;
