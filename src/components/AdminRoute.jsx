// src/components/AdminRoute.jsx
// Wraps admin-only pages. A staff member who opens one is sent back to the
// dashboard with an error message.
// (This only hides pages. The real protection is on the server, which
// rejects admin requests from staff with 403.)

import { useEffect, useRef } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function AdminRoute() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  // Remembers that we already showed the message. In development, React's
  // StrictMode runs effects twice, which would otherwise show two toasts.
  const warned = useRef(false)

  // Show the message once, after rendering (not during it).
  useEffect(() => {
    if (!isAdmin && !warned.current) {
      warned.current = true
      toast.error('That page is for admins only.')
    }
  }, [isAdmin, toast])

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
