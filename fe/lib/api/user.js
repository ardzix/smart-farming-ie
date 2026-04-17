import axiosClient from './axiosClient';

// Ambil semua user
export const getUsers = async () => {
  // [FIX] Tambahkan /api di depan
  const response = await axiosClient.get('/api/auth/users/');
  return response.data;
};

// Buat user baru
export const createUser = async (userData) => {
  // [FIX] Tambahkan /api di depan
  const response = await axiosClient.post('/api/auth/users/', userData);
  return response.data;
};

// Update user (termasuk ganti role/password)
export const updateUser = async (id, userData) => {
  // [FIX] Tambahkan /api di depan
  const response = await axiosClient.put(`/api/auth/users/${id}/`, userData);
  return response.data;
};

// Hapus user
export const deleteUser = async (id) => {
  // [FIX] Tambahkan /api di depan
  const response = await axiosClient.delete(`/api/auth/users/${id}/`);
  return response.data;
};

// Ambil user yang tersedia untuk investor
export const getAvailableUsersForInvestor = async () => {
  // [FIX] Tambahkan /api di depan
  const response = await axiosClient.get('/api/auth/users/available-for-investor/');
  return response.data;
};