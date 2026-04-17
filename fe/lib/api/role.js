import axiosClient from './axiosClient';

export const getRoles = async () => {
  // [FIX] Tambahkan /api di depan path
  const response = await axiosClient.get('/api/auth/roles/');
  return response.data;
};