import { create } from 'zustand'
import api from '@/lib/api'

interface User {
  id: number
  name: string
  nickname: string | null
  email: string
  phone: string | null
  credits: number
  role: string
  is_distributor: boolean
  invite_code: string | null
  avatar: string | null
  avatar_url: string | null
  created_at: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  hydrate: () => void
  fetchMe: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; password_confirmation: string; invite_code?: string }) => Promise<void>
  logout: () => Promise<void>
}

const readLocal = () => {
  if (typeof window === 'undefined') return { user: null, token: null }
  try {
    return {
      user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
      token: localStorage.getItem('auth_token'),
    }
  } catch { return { user: null, token: null } }
}

let _hydrated = false

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,

  setAuth: (token, user) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
    set({ token, user })
  },

  clearAuth: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    set({ token: null, user: null })
  },

  hydrate: () => {
    if (_hydrated) return
    _hydrated = true
    const local = readLocal()
    if (local.token && local.user) {
      const u = local.user
      set({ token: local.token, user: { ...u, avatar_url: u.avatar_url || u.avatar || null } })
    }
  },

  fetchMe: async () => {
    get().hydrate()
    try {
      set({ loading: true })
      const { data } = await api.get('/me')
      const raw = data.user || data
      const user = { ...raw, avatar_url: raw.avatar_url || raw.avatar || null }
      localStorage.setItem('auth_user', JSON.stringify(user))
      set({ user, loading: false })
    } catch {
      get().clearAuth()
      set({ loading: false })
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/login', { email, password })
    const u = data.user
    get().setAuth(data.token, { ...u, avatar_url: u.avatar_url || u.avatar || null })
  },

  register: async (formData) => {
    const { data } = await api.post('/register', formData)
    const u = data.user
    get().setAuth(data.token, { ...u, avatar_url: u.avatar_url || u.avatar || null })
  },

  logout: async () => {
    try {
      await api.post('/logout')
    } finally {
      get().clearAuth()
    }
  },
}))
