// src/context/AuthContext.jsx
// Keeps track of who is logged in and shares it with every component.
// The session is also saved in localStorage so a page refresh keeps you logged in.
//
// Usage in a component:
//   const { user, isAdmin, login, logout } = useAuth()

import { createContext, useContext, useState } from 'react'
import { loginRequest } from '../api/authApi'
import { TOKEN_KEY, USER_KEY } from '../api/axios'

const AuthContext = createContext(null)

// Reads the saved user from localStorage (or null if nothing valid is saved).
const loadSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  // The initial values come from localStorage, so a refresh keeps the session.
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(loadSavedUser)

  // Calls the API. If the password is wrong, the error is thrown
  // so the Login page can show the message.
  const login = async (username, password) => {
    const data = await loginRequest(username, password)
    const { token: newToken, ...userData } = data

    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setToken(newToken)
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    isAdmin: user?.role === 'admin',
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// A shortcut hook so components can write useAuth() instead of useContext(AuthContext).
// Exporting a hook next to a component is the usual pattern for a context, so we
// silence the linter's "fast refresh" hint for this line.
// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
