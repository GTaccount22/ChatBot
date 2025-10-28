import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://exilic-unconditionally-channing.ngrok-free.dev";

// Configuración centralizada de axios con manejo de errores
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
