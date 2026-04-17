import axiosClient from './axiosClient';

// Ambil Daftar Penjualan (Bisa filter by date/product nanti)
export const getSales = async (params) => {
  const response = await axiosClient.get('/api/sales/sales/', { params });
  return response.data;
};

// Buat Penjualan Baru (Mengurangi Stok Global)
export const createSale = async (data) => {
  const response = await axiosClient.post('/api/sales/sales/', data);
  return response.data;
};

// Ambil Detail
export const getSale = async (id) => {
  const response = await axiosClient.get(`/api/sales/sales/${id}/`);
  return response.data;
};

// Update
export const updateSale = async (id, data) => {
  const response = await axiosClient.put(`/api/sales/sales/${id}/`, data);
  return response.data;
};

// Hapus
export const deleteSale = async (id) => {
  const response = await axiosClient.delete(`/api/sales/sales/${id}/`);
  return response.data;
};