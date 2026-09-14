import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  // VITE_API_URL diisi saat API dipisah domain, mis. https://api.domain.com.
  // Kosong (default) = satu domain dengan API (atau lewat proxy Vite di dev).
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api/v1`,
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

// Handle 401 — redirect ke login. Handle 403 — toast akses ditolak.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const isLoginRequest = error.config?.url?.includes('/auth/login')

    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    } else if (status === 403) {
      const msg = error.response?.data?.message ?? 'Akses ditolak.'
      toast.error(msg)
    }
    return Promise.reject(error)
  },
)

export default api
