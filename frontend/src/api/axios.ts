import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  // withCredentials hanya perlu untuk cookie/session auth
  // kita pakai Bearer token jadi tidak perlu
  withCredentials: false,
})

// Attach Bearer token dari localStorage
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Biarkan browser menyusun multipart boundary sendiri.
    delete config.headers['Content-Type']
  }

  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — redirect ke login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
