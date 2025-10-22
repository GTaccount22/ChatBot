import api from './api';

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

export const toggleQuestionState = async (id) => {
  try {
    const res = await api.put(`/api/questions/${id}/toggle`);
    return res.data;
  } catch (error) {
    console.error('Error toggling question state:', error);
    throw error;
  }
};
