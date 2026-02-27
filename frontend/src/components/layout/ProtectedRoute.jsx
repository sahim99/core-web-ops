import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { usePermissions } from '../../hooks/usePermissions'

function ProtectedRoute({ children, allowedRoles = [], requiredPermission = null, requireActive = true }) {
  const { user, loading } = useAuth()
  const { hasRole } = useRole()
  const { hasPermission } = usePermissions()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 1. Role Check (legacy/owner check)
  if (allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  // 2. Permission Check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/no-access" replace />
  }

  // 3. Workspace Status Check
  // If route requires active workspace but user's workspace is not active -> Redirect to onboarding
  // Note: Onboarding routes themselves should set requireActive={false}
  if (requireActive && user?.workspace_status !== 'active') {
    return <Navigate to="/onboarding/email" replace />
  }

  return children
}

export default ProtectedRoute
