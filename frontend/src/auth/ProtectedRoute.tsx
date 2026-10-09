import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { UserRole } from '../api/types'

interface ProtectedRouteProps {
  allowedRoles: UserRole[]
  children: ReactNode
  unauthenticatedFallback?: ReactNode
}

export function ProtectedRoute({ allowedRoles, children, unauthenticatedFallback }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !role) {
    return unauthenticatedFallback ?? <Navigate to="/" replace state={{ from: location.pathname, openAdminLogin: true }} />
  }
  if (!allowedRoles.includes(role)) {
    return <Navigate to={role === 'verifier' ? '/budget' : '/'} replace />
  }
  return children
}
