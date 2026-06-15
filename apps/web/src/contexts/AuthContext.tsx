import { createContext, useContext, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Member } from '@minton/types'
import { api } from '@/lib/api'

interface AuthState {
  user: Member | null
  loading: boolean
  isAdmin: boolean
  requestOtp: (email: string) => Promise<void>
  verifyOtp: (email: string, code: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    // 未ログインは 401 になるため null に倒す
    queryFn: () => api.me().catch(() => null),
    staleTime: Infinity,
  })
  const user = data ?? null

  const value: AuthState = {
    user,
    loading: isLoading,
    isAdmin: user?.role === 'admin',
    requestOtp: async (email) => {
      await api.requestOtp(email)
    },
    verifyOtp: async (email, code) => {
      qc.setQueryData(['me'], await api.verifyOtp(email, code))
    },
    logout: async () => {
      await api.logout()
      qc.clear()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
