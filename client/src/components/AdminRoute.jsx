import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { PageSpinner } from './ProtectedRoute.jsx'

/** Restricts the admin workspace to accounts flagged as admins by the API. */
export default function AdminRoute({ children }) {
  const { user, isAuthed, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageSpinner />
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />
  return children
}
