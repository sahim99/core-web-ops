import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with every request
})

// Helper to get cookie by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// Add CSRF token to every request
api.interceptors.request.use((config) => {
  // We don't need to manually set Authorization header anymore (cookies handle it)
  // But we DO need to set CSRF token for unsafe methods
  const csrfToken = getCookie('csrf_token');
  if (csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
},
  (error) => Promise.reject(error)
)

import { toast } from 'react-hot-toast'

// Response interceptor – handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Demo Mode Read-Only Protection
    if (error.response?.status === 403 && error.response.data?.detail?.includes('Demo mode')) {
      toast.error('Action disabled in Live Demo mode', { duration: 4000 });
      return Promise.reject(error);
    }

    // Only redirect if NOT on login page to avoid infinite loops
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !error.config?._skipAuthRedirect) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
