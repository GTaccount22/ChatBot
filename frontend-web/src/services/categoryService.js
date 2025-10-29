import api from './api';

export const getCategories = async () => {
  try {
    const res = await api.get('/api/categories');
    console.log('📦 Data from backend (categories):', res.data);
    console.log('📦 Type of res.data:', typeof res.data);
    console.log('📦 Is array?', Array.isArray(res.data));
    
    // Manejar diferentes formatos de respuesta de la API
    // Si res.data es directamente un array, devolverlo
    if (Array.isArray(res.data)) {
      console.log('✅ Devolviendo res.data directamente (array)');
      return res.data;
    }
    // Si res.data.categories existe y es un array, devolverlo
    if (Array.isArray(res.data.categories)) {
      console.log('✅ Devolviendo res.data.categories (array)');
      return res.data.categories;
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
    console.error('❌ Error fetching categories:', error);
    console.error('❌ Error response:', error.response?.data);
    return []; // fallback seguro
  }
};


export const createCategory = async (category) => {
  try {
    const res = await api.post('/api/categories', category);
    return res.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id, category) => {
  try {
    const res = await api.put(`/api/categories/${id}`, category);
    return res.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const res = await api.delete(`/api/categories/${id}`);
    return res.data;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};
