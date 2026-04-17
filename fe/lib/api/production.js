import axiosClient from './axiosClient';

// ==========================================
// 1. MANAJEMEN PRODUKSI (Riwayat Panen)
// ==========================================

export const getProductions = async (params) => {
  // Mengambil daftar riwayat produksi (support filtering)
  const response = await axiosClient.get('/api/production/productions/', { params });
  return response.data;
};

export const getProduction = async (id) => {
  // [BARU] Mengambil detail satu produksi berdasarkan ID
  const response = await axiosClient.get(`/api/production/productions/${id}/`);
  return response.data;
};

export const createProduction = async (data) => {
  // Mencatat produksi baru
  const response = await axiosClient.post('/api/production/productions/', data);
  return response.data;
};

export const patchProduction = async (id, data) => {
  // Mengupdate sebagian data produksi (misal: edit notes atau jumlah)
  const response = await axiosClient.patch(`/api/production/productions/${id}/`, data);
  return response.data;
};

export const deleteProduction = async (id) => {
  // Menghapus riwayat produksi
  const response = await axiosClient.delete(`/api/production/productions/${id}/`);
  return response.data;
};

// ==========================================
// 2. MANAJEMEN PRODUK (Data Master)
// ==========================================

export const getProducts = async () => {
  // Mengambil list produk untuk dropdown
  const response = await axiosClient.get('/api/production/products/'); 
  return response.data;
};

export const createProduct = async (data) => {
  // Membuat produk baru (jika ada fitur tambah produk langsung)
  const response = await axiosClient.post('/api/production/products/', data);
  return response.data;
};

// ==========================================
// 3. STOCK ADJUSTMENT (Koreksi Stok)
// ==========================================

export const getAdjustments = async () => {
  // [BARU] Mengambil riwayat adjustment
  const response = await axiosClient.get('/api/production/stock-adjustments/');
  return response.data;
};

export const createStockAdjustment = async (data) => {
  // Mencatat penyesuaian stok (rusak/salah hitung)
  const response = await axiosClient.post('/api/production/stock-adjustments/', data);
  return response.data;
};

export const deleteAdjustment = async (id) => {
  // [BARU] Menghapus data adjustment
  const response = await axiosClient.delete(`/api/production/stock-adjustments/${id}/`);
  return response.data;
};