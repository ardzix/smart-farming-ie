import axiosClient from './axiosClient';

// GET List Pendanaan
// Endpoint: /api/funding/
export const getFundings = async (params) => {
  const response = await axiosClient.get('/api/funding/', { params });
  return response.data;
};

// GET Detail Pendanaan
// Endpoint: /api/funding/{id}/
export const getFunding = async (id) => {
  const response = await axiosClient.get(`/api/funding/${id}/`);
  return response.data;
};

// POST Create (Wajib FormData dari UI)
// [FIX] Arahkan ke endpoint tambah/
export const createFunding = async (data) => {
  // Axios otomatis set header multipart/form-data jika data adalah FormData
  const response = await axiosClient.post('/api/funding/tambah/', data);
  return response.data;
};

// PUT Update (Wajib FormData dari UI)
// Endpoint: /api/funding/{id}/
export const updateFunding = async ({ id, data }) => {
  const response = await axiosClient.put(`/api/funding/${id}/`, data);
  return response.data;
};

// DELETE
// Endpoint: /api/funding/{id}/
export const deleteFunding = async (id) => {
  const response = await axiosClient.delete(`/api/funding/${id}/`);
  return response.data;
};