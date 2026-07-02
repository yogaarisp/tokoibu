import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, token: string) => void
  clearAuth: () => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },

      clearAuth: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      hasPermission: (permission) => {
        const { user } = get()
        return user?.permissions?.includes(permission) ?? false
      },

      hasRole: (role) => {
        const { user } = get()
        return user?.roles?.includes(role) ?? false
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) }
  )
)
