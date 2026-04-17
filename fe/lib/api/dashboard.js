import axiosClient from './axiosClient';

export const getDashboardData = async () => {
  const response = await axiosClient.get('/api/dashboard/dashboard-config/');
  
  if (Array.isArray(response.data) && response.data.length > 0) {
    return response.data[0];
  }
  return response.data;
};