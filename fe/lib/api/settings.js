import axiosClient from './axiosClient';

// GET Settings
export const getSettings = async () => {
  const response = await axiosClient.get('/api/settings/');
  return response.data;
};

// UPDATE Settings
export const updateSettings = async (data) => {
  const response = await axiosClient.post('/api/settings/', data);
  return response.data;
};