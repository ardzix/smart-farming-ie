import axiosClient from './axiosClient';

export const getFinancialReport = async () => {
  try {
    // Attempt to fetch from real backend endpoint
    // Adjust the URL if the backend team uses a different path
    const response = await axiosClient.get('/api/reporting/financial/');
    
    // Some backend configurations wrap data in array. Adjust accordingly if so.
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    }
    return response.data;
  } catch (error) {
    console.warn("API Get Financial Report gagal atau belum siap. Menggunakan Mock Data.", error.message);
    
    // Mock Data based on dashboard data accessors: 
    // reportData?.ringkasan_dana?.total_pengeluaran
    // reportData?.ringkasan_dana?.sisa_dana
    // reportData?.laba_rugi?.Status 
    // reportData?.laba_rugi?.Jumlah
    return {
      ringkasan_dana: {
        total_pengeluaran: 5000000,
        sisa_dana: 12500000
      },
      laba_rugi: {
        Status: "Laba", 
        Jumlah: 4200000
      }
    };
  }
};
