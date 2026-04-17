import axiosClient from './axiosClient';

// Ambil List Produk (GET)
export const getProducts = async () => {
  // Sesuaikan endpoint dengan prefix modul production
  const response = await axiosClient.get('/api/production/products/');
  return response.data;
};

// Buat Produk Baru (POST)
export const createProduct = async (data) => {
  const response = await axiosClient.post('/api/production/products/', data);
  return response.data;
};

// Update Produk (PUT)
export const updateProduct = async (id, data) => {
  const response = await axiosClient.put(`/api/production/products/${id}/`, data);
  return response.data;
};

// Hapus Produk (DELETE)
export const deleteProduct = async (id) => {
  const response = await axiosClient.delete(`/api/production/products/${id}/`);
  return response.data;
};