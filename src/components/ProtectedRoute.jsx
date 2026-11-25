// src/components/ProtectedRoute.jsx
// Wraps pages that need a logged-in user.
// No token -> send the user to the login page.

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { token } = useAuth()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  // <Outlet /> shows the child route (the actual page).
  return <Outlet />
}
