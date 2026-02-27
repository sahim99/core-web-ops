import { useAuth } from '../context/AuthContext'

export function usePermissions() {
  const { user } = useAuth()

  const isOwner = user?.role === 'owner'

  const hasPermission = (module) => {
    if (!user) return false
    if (isOwner) return true // Owners have full access
    
    // Check permissions object for staff
    // Example: user.permissions.inbox
    return user?.permissions?.[module] === true
  }

  return { hasPermission, isOwner }
}
