import api from './api';

export const getCategories = async () => {
  try {
    const res = await api.get('/api/categories');
    // Manejar diferentes formatos de respuesta de la API
    // Si res.data es directamente un array, devolverlo
    if (Array.isArray(res.data)) {
      return res.data;
    }
    // Si res.data.categories existe y es un array, devolverlo
    if (Array.isArray(res.data.categories)) {
      return res.data.categories;
    }
    // Si no, devolver un array vacío
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
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
