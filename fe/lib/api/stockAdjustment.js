import axiosClient from './axiosClient';

// Ambil Daftar Stock Adjustments
export const getAdjustments = async (params) => {
  const response = await axiosClient.get('/api/production/adjustments/', { params });
  return response.data;
};

// Ambil Detail Stock Adjustment
export const getAdjustment = async (id) => {
  const response = await axiosClient.get(`/api/production/adjustments/${id}/`);
  return response.data;
};

// Buat Stock Adjustment Baru (Support Upload Gambar)
export const createAdjustment = async (data) => {
  // Data harus FormData dari UI
  const response = await axiosClient.post('/api/production/adjustments/', data);
  return response.data;
};

// Hapus Stock Adjustment (Stok akan di-restore)
export const deleteAdjustment = async (id) => {
  const response = await axiosClient.delete(`/api/production/adjustments/${id}/`);
  return response.data;
};