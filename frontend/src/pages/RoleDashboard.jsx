import { useRole } from '../hooks/useRole'
import Dashboard from './owner/Dashboard'
import StaffDashboard from './staff/StaffDashboard'

/**
 * Role-based dashboard wrapper.
 * Routes to the correct dashboard based on user role.
 */
function RoleDashboard() {
  const { isOwner } = useRole()

  if (isOwner) return <Dashboard />
  return <StaffDashboard />
}

export default RoleDashboard
