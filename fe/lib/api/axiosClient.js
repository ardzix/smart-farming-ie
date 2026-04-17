import axios from 'axios';
import Cookies from 'js-cookie';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const axiosClient = axios.create({
  baseURL: baseURL,
  withCredentials: true, // Wajib: agar cookie dikirim otomatis
  // [FIX] JANGAN SET DEFAULT CONTENT-TYPE DI SINI
  // Biarkan Axios otomatis mendeteksi apakah itu JSON atau FormData
});

// REQUEST INTERCEPTOR
axiosClient.interceptors.request.use(
  (config) => {
    // Baca access_token dari cookie yang bisa dibaca JS (non-HTTPOnly copy)
    const token = Cookies.get('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Hindari interceptor refresh untuk request ke endpoint auth atau refresh itu sendiri
    const isAuthEndpoint = originalRequest.url?.includes('/login') || originalRequest.url?.includes('/register') || originalRequest.url?.includes('/sso') || originalRequest.url?.includes('/verify-email') || originalRequest.url?.includes('/resend-email-otp') || originalRequest.url?.includes('/refresh/');

    // Jika error 401 (Unauthorized) dan belum retry, DAN bukan request ke auth
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        console.log('🔄 Token kedaluwarsa, refresh otomatis via Cookie...');
        
        // Panggil endpoint refresh. Cookie 'refresh_token' akan dikirim otomatis oleh browser.
        await axios.post(`${baseURL}/api/auth/token/refresh/`, {}, {
          withCredentials: true
        });

        // Jika sukses, cookie access_token baru sudah diset oleh backend.
        // Ulangi request awal.
        return axiosClient(originalRequest);

      } catch (refreshError) {
        console.error('❌ Session habis, logout...');
        Cookies.remove('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;