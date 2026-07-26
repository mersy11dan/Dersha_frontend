import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import FullPageSpinner from '../common/FullPageSpinner'

/**
 * Route guard.
 *
 * `requireVerified` mirrors the API's own gate: endpoints that move money
 * reject anything short of ACTIVE_VERIFIED, so those routes send an unverified
 * user back into onboarding rather than letting them load a page that can only
 * fail.
 */
export default function ProtectedRoute({ children, requireVerified = true }) {
  const { isAuthenticated, isVerified, initialising } = useAuth()
  const location = useLocation()

  if (initialising) {
    return <FullPageSpinner label="Restoring your session…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requireVerified && !isVerified) {
    return <Navigate to="/identity-verification" replace />
  }

  return children
}
