import axiosClient from './axiosClient';

// Ambil Daftar Aset (GET)
export const getAssets = async (params) => {
  const response = await axiosClient.get('/api/asset/aset/', { params });
  return response.data;
};

// Buat Aset Baru (POST)
export const createAsset = async (data) => {
  // [FIX] Langsung kirim 'data' (FormData). 
  // Axios akan otomatis set header 'multipart/form-data; boundary=...'
  const response = await axiosClient.post('/api/asset/aset/tambah/', data);
  return response.data;
};

// Update Aset (PUT)
export const updateAsset = async (id, data) => {
  const response = await axiosClient.put(`/api/asset/aset/${id}/`, data);
  return response.data;
};

// Hapus Aset (DELETE)
export const deleteAsset = async (id) => {
  const response = await axiosClient.delete(`/api/asset/aset/${id}/`);
  return response.data;
};

// Detail Aset
export const getAsset = async (id) => {
  const response = await axiosClient.get(`/api/asset/aset/${id}/`);
  return response.data;
};