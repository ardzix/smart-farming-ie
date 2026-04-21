import axios from 'axios';
import Cookies from 'js-cookie';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Accept-Language'] =
      Cookies.get('app_locale') ||
      Cookies.get('django_language') ||
      'id';

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest.url?.includes('/login') ||
      originalRequest.url?.includes('/register') ||
      originalRequest.url?.includes('/sso') ||
      originalRequest.url?.includes('/verify-email') ||
      originalRequest.url?.includes('/resend-email-otp') ||
      originalRequest.url?.includes('/refresh/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        console.log('Access token expired, attempting cookie-based refresh...');

        await axios.post(
          `${baseURL}/api/auth/token/refresh/`,
          {},
          {
            withCredentials: true,
          }
        );

        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.error('Session refresh failed, redirecting to login...');
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
