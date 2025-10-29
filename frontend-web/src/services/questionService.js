import api from './api';

export const getQuestions = async () => {
  try {
    const res = await api.get('/api/questions');
    // Manejar diferentes formatos de respuesta de la API
    // Si res.data es directamente un array, devolverlo
    if (Array.isArray(res.data)) {
      return res.data;
    }
    // Si res.data.questions existe y es un array, devolverlo
    if (Array.isArray(res.data.questions)) {
      return res.data.questions;
    }
    // Si res.data.data existe y es un array, devolverlo
    if (Array.isArray(res.data.data)) {
      return res.data.data;
    }
    // Si no, devolver un array vacío
    return [];
  } catch (error) {
    console.error('Error fetching questions:', error);
    return []; // fallback seguro
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

export const toggleQuestionState = async (id) => {
  try {
    const res = await api.put(`/api/questions/${id}/toggle`);
    return res.data;
  } catch (error) {
    console.error('Error toggling question state:', error);
    throw error;
  }
};
