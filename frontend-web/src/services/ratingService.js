import api from './api';

export const getRatings = async () => {
  try {
    const res = await api.get('/api/ratings');
    // Manejar diferentes formatos de respuesta de la API
    // Si res.data es directamente un array, devolverlo
    if (Array.isArray(res.data)) {
      return res.data;
    }
    // Si res.data.ratings existe y es un array, devolverlo
    if (Array.isArray(res.data.ratings)) {
      return res.data.ratings;
    }
    // Si res.data.data existe y es un array, devolverlo
    if (Array.isArray(res.data.data)) {
      return res.data.data;
    }
    // Si no, devolver un array vacío
    return [];
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return []; // fallback seguro
  }
};

