import api from './api';

export const getCategories = async () => {
  try {
    const res = await api.get('/api/categories');
    return res.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
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
