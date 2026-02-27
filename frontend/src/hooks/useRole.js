import { useAuth } from './useAuth'

export function useRole() {
  const { user } = useAuth()

  const isOwner = user?.role === 'owner'
  const isStaff = user?.role === 'staff'
  const isAuthenticated = !!user

  const hasRole = (...roles) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return { isOwner, isStaff, isAuthenticated, hasRole, role: user?.role }
}
