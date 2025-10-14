import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

// Configuración de axios con manejo de errores
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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

export const getRatings = async () => {
  try {
    const res = await api.get('/api/ratings');
    return res.data;
  } catch (error) {
    console.error('Error fetching ratings:', error);
    throw error;
  }
};

