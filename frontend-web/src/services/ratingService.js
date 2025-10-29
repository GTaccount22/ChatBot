import api from './api';

export const getRatings = async () => {
  try {
    const res = await api.get('/api/ratings');
    console.log('📦 Data from backend (ratings):', res.data);
    console.log('📦 Type of res.data:', typeof res.data);
    console.log('📦 Is array?', Array.isArray(res.data));
    
    // Manejar diferentes formatos de respuesta de la API
    // Si res.data es directamente un array, devolverlo
    if (Array.isArray(res.data)) {
      console.log('✅ Devolviendo res.data directamente (array)');
      return res.data;
    }
    // Si res.data.ratings existe y es un array, devolverlo
    if (Array.isArray(res.data.ratings)) {
      console.log('✅ Devolviendo res.data.ratings (array)');
      return res.data.ratings;
    }
    // Si res.data.data existe y es un array, devolverlo
    if (Array.isArray(res.data.data)) {
      console.log('✅ Devolviendo res.data.data (array)');
      return res.data.data;
    }
    // Si no, devolver un array vacío
    console.warn('⚠️ Formato de respuesta inesperado, devolviendo array vacío');
    return [];
  } catch (error) {
    console.error('❌ Error fetching ratings:', error);
    console.error('❌ Error response:', error.response?.data);
    return []; // fallback seguro
  }
};

