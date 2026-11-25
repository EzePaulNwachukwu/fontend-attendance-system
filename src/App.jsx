// src/App.jsx
// All the app's pages and who can see them.
//
//   /login          public
//   /               Dashboard            (any logged-in user)
//   /my-attendance  My attendance        (any logged-in user)
//   /employees      Employees            (admin)
//   /records        Attendance records   (admin)
//   /reports        Reports              (admin)
//   *               Not found

import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MyAttendance from './pages/MyAttendance'
import Employees from './pages/Employees'
import AttendanceRecords from './pages/AttendanceRecords'
import Reports from './pages/Reports'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Everything inside needs a logged-in user, and uses the sidebar layout. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/my-attendance" element={<MyAttendance />} />

          {/* Admins only */}
          <Route element={<AdminRoute />}>
            <Route path="/employees" element={<Employees />} />
            <Route path="/records" element={<AttendanceRecords />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
