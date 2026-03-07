import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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

// Request interceptor: CSRF token + GET-only trailing slash normalisation
// NOTE: Only GET requests get a trailing slash appended.
// POST/PUT/DELETE/PATCH paths (e.g. /auth/demo-login) are never modified,
// preventing FastAPI 307 redirects that strip cookies and cause mixed-content blocks.
api.interceptors.request.use((config) => {
  // Append trailing slash ONLY for GET requests to avoid 307 redirect on list endpoints
  if (
    config.method === 'get' &&
    config.url &&
    !config.url.endsWith('/') &&
    !config.url.includes('?')
  ) {
    config.url += '/'
  }

  // Set CSRF token for unsafe (mutating) methods
  const csrfToken = getCookie('csrf_token')
  if (csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = csrfToken
  }
  return config
},
  (error) => Promise.reject(error)
)

import { toast } from 'react-hot-toast'

// Response interceptor – handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Demo Mode Read-Only Protection — simulate success instead of erroring
    if (error.response?.status === 403 && error.response.data?.detail?.includes('Demo mode')) {
      toast('This action is simulated in demo mode.', {
        icon: '🎯',
        duration: 3000,
        style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
      });
      // Return a fake successful response so the UI doesn't break
      return Promise.resolve({ data: {}, status: 200, simulated: true });
    }

    // Only redirect if NOT on login page to avoid infinite loops
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !error.config?._skipAuthRedirect) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
