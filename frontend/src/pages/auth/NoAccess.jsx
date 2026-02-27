import { Link } from 'react-router-dom'
import './NoAccess.css'

function NoAccess() {
  return (
    <div className="no-access-container">
      <div className="no-access-card">
        <div className="no-access-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this module.</p>
        <p className="no-access-sub">
          Please contact your workspace owner if you believe this is an error.
        </p>
        <Link to="/dashboard" className="no-access-btn">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default NoAccess
