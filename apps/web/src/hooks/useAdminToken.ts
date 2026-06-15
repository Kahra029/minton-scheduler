import { useEffect, useState } from 'react'
import { getAdminToken } from '@/lib/auth'

/** localStorage の admin トークンをリアクティブに購読する */
export function useAdminToken(): string {
  const [token, setToken] = useState(getAdminToken)

  useEffect(() => {
    const handler = () => setToken(getAdminToken())
    window.addEventListener('admin-token-changed', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('admin-token-changed', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  return token
}
