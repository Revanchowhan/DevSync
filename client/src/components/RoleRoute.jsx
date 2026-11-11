import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { PageSpinner } from './ProtectedRoute.jsx'

/**
 * RoleRoute — requires login AND the given role ('student' | 'host').
 * Wrong role is redirected to the user's own home.
 */
export default function RoleRoute({ role, children }) {
  const { user, isAuthed, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageSpinner />
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user?.role !== role) {
    return <Navigate to={user?.role === 'host' ? '/host' : '/hackathons'} replace />
  }
  return children
}
