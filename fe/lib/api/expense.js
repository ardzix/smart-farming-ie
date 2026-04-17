import axiosClient from './axiosClient';

// Base URL sesuai struktur folder Django Anda: /api/expense/

// Ambil Daftar Pengeluaran
export const getExpenses = async (params) => {
  // URL: /api/expense/ (bukan /api/expense/expenses/)
  const response = await axiosClient.get('/api/expense/', { params });
  return response.data;
};

// Ambil Detail 1 Pengeluaran
export const getExpense = async (id) => {
  // URL: /api/expense/1/
  const response = await axiosClient.get(`/api/expense/${id}/`);
  return response.data;
};

// Buat Pengeluaran (Support Upload Gambar)
export const createExpense = async (data) => {
  const response = await axiosClient.post('/api/expense/', data); 
  return response.data;
};

// Update Pengeluaran
export const updateExpense = async (id, data) => {
  const response = await axiosClient.put(`/api/expense/${id}/`, data);
  return response.data;
};

// Hapus Pengeluaran
export const deleteExpense = async (id) => {
  const response = await axiosClient.delete(`/api/expense/${id}/`);
  return response.data;
};