import axiosClient from './axiosClient';

export const getDistributions = async () => {
  const response = await axiosClient.get('/api/profit-distribution/');
  return response.data;
};

export const previewDistribution = async (amount) => {
  const payload = {
    total_distributed: amount,
    date: new Date().toISOString().split('T')[0] 
  };
  
  const response = await axiosClient.post('/api/profit-distribution/preview/', payload);
  return response.data;
};

export const createDistribution = async (data) => {
  const response = await axiosClient.post('/api/profit-distribution/', data);
  return response.data;
};

export const deleteDistribution = async (id) => {
  const response = await axiosClient.delete(`/api/profit-distribution/${id}/`);
  return response.data;
};