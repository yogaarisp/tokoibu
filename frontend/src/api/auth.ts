import api from './axios'
import { AuthUser } from '@/types'

export const login = (email: string, password: string) =>
  api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password })

export const logout = () => api.post('/auth/logout')

export const getMe = () => api.get<AuthUser>('/auth/me')
