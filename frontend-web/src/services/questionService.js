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

export const getQuestions = async () => {
  try {
    const res = await api.get('/api/questions');
    return res.data;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

export const createQuestion = async (question) => {
  try {
    const res = await api.post('/api/questions', question);
    return res.data;
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

export const updateQuestion = async (id, question) => {
  try {
    const res = await api.put(`/api/questions/${id}`, question);
    return res.data;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

export const deleteQuestion = async (id) => {
  try {
    const res = await api.delete(`/api/questions/${id}`);
    return res.data;
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};
