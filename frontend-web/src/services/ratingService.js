import api from './api';

export const getRatings = async () => {
  try {
    const res = await api.get('/api/ratings');
    return res.data;
  } catch (error) {
    console.error('Error fetching ratings:', error);
    throw error;
  }
};

