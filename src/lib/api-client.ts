import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1/admin';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: false,
});

// Request Interceptor: Attach JWT Bearer Token & normalize route paths
apiClient.interceptors.request.use(
  (config) => {
    if (config.url && config.url.startsWith('/admin/')) {
      config.url = config.url.substring(6);
    }
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('susrutha_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 / 403 & Auto Logout User
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        console.warn(`[Security Alert] Authentication error ${status}. Auto logging out user.`);
        localStorage.removeItem('susrutha_token');
        localStorage.removeItem('susrutha_user');
        
        // Prevent redirect loop if already on login page
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?reason=session_expired';
        }
      }
    }
    return Promise.reject(error);
  }
);
