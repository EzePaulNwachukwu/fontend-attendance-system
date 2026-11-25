// src/components/Layout.jsx
// The frame around every logged-in page:
// - Desktop: a sidebar on the left with links and the user's details
// - Mobile:  a top bar with a menu button that opens the same links
// The current page is shown on the right through <Outlet />.

import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StatusBadge from './StatusBadge'

// Links everyone sees, and links only admins see.
const STAFF_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/my-attendance', label: 'My attendance' },
]
const ADMIN_LINKS = [
  { to: '/employees', label: 'Employees' },
  { to: '/records', label: 'Attendance records' },
  { to: '/reports', label: 'Reports' },
]

export default function Layout() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false) // mobile menu

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const links = isAdmin ? [...STAFF_LINKS, ...ADMIN_LINKS] : STAFF_LINKS

  // NavLink gives us isActive, so the current page can be highlighted.
  const linkClass = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  // The links + user box. Used in both the sidebar and the mobile menu.
  const navContent = (
    <>
      <nav className="flex-1 space-y-1" aria-label="Main">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'} // "/" should only be active on the dashboard itself
            className={linkClass}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <span>{user?.staffId}</span>
          <StatusBadge status={user?.role} />
        </div>
        <button type="button" onClick={handleLogout} className="btn btn-secondary mt-3 w-full">
          Log out
        </button>
      </div>
    </>
  )

  const brand = (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
        SP
      </span>
      <span className="text-sm font-semibold leading-tight text-slate-900">
        Saddle Prime
        <span className="block text-xs font-normal text-slate-500">Attendance</span>
      </span>
    </div>
  )

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar (hidden on small screens) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:sticky md:top-0 md:flex md:h-screen">
        <div className="mb-6">{brand}</div>
        {navContent}
      </aside>

      {/* Mobile top bar (hidden on medium screens and up) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {brand}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {/* Simple "hamburger" / "close" icon drawn with text */}
            <span aria-hidden="true" className="text-xl leading-none">
              {menuOpen ? '✕' : '☰'}
            </span>
          </button>
        </div>
        {menuOpen && <div className="flex flex-col border-t border-slate-200 p-4">{navContent}</div>}
      </header>

      {/* The current page */}
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
