import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'
import { authApi } from '../api/client'
import type { LoginCredentials, UserRole } from '../api/types'

const TOKEN_KEY = 'acc_access_token'
const ROLE_KEY = 'acc_user_role'

interface TokenClaims {
  sub?: string
  role?: UserRole
  exp?: number
}

interface AuthSession {
  token: string
  role: UserRole
  expiresAt: number
}

interface AuthContextValue {
  token: string | null
  role: UserRole | null
  isAuthenticated: boolean
  authenticate: (role: UserRole, credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getSession(token: string | null, storedRole: string | null): AuthSession | null {
  if (!token || (storedRole !== 'admin' && storedRole !== 'verifier')) return null
  try {
    const claims = jwtDecode<TokenClaims>(token)
    if (claims.role !== storedRole || !claims.exp || claims.exp * 1000 <= Date.now()) return null
    return { token, role: claims.role, expiresAt: claims.exp * 1000 }
  } catch {
    return null
  }
}

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  const session = getSession(window.localStorage.getItem(TOKEN_KEY), window.localStorage.getItem(ROLE_KEY))
  if (!session) {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(ROLE_KEY)
  }
  return session
}

function getLoginError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    return error.message || 'Unable to sign in. Please try again.'
  }
  return error instanceof Error ? error.message : 'Unable to sign in. Please try again.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readStoredSession)

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY)
      window.localStorage.removeItem(ROLE_KEY)
    }
    setSession(null)
  }, [])

  const authenticate = useCallback(async (role: UserRole, credentials: LoginCredentials) => {
    try {
      const response = await authApi.login(role, credentials)
      const nextSession = getSession(response.access_token, response.role)
      if (response.role !== role || !nextSession) throw new Error('The server returned an invalid or expired login token.')
      window.localStorage.setItem(TOKEN_KEY, response.access_token)
      window.localStorage.setItem(ROLE_KEY, response.role)
      setSession(nextSession)
    } catch (error) {
      throw new Error(getLoginError(error))
    }
  }, [])

  useEffect(() => {
    const handleExpiredSession = () => setSession(null)
    window.addEventListener('acc:auth-expired', handleExpiredSession)
    return () => window.removeEventListener('acc:auth-expired', handleExpiredSession)
  }, [])

  useEffect(() => {
    if (!session) return
    const timeout = window.setTimeout(logout, Math.max(0, session.expiresAt - Date.now()))
    return () => window.clearTimeout(timeout)
  }, [session, logout])

  const value = useMemo<AuthContextValue>(() => ({
    token: session?.token ?? null,
    role: session?.role ?? null,
    isAuthenticated: session !== null,
    authenticate,
    logout,
  }), [session, authenticate, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export function getSignInError(error: unknown): string {
  return getLoginError(error)
}
