// src/api/axios.js
// One shared axios instance for every API call.
// - baseURL comes from the .env file (VITE_API_URL)
// - a request interceptor adds the login token to every request
// - a response interceptor logs the user out if the server says 401

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
})

// Keys used to save the session in the browser's localStorage.
export const TOKEN_KEY = 'sp_token'
export const USER_KEY = 'sp_user'

// Before each request: attach "Authorization: Bearer <token>" if we have one.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// After each response: if the token is missing, expired or the account was
// deactivated, the server replies 401. Clear the session and go to /login.
// We skip the login request itself: a wrong password should only show an
// error on the form, not reload the page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/api/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      // A full page load resets all React state, which is the simplest way
      // to make sure nothing from the old session is left behind.
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Removes empty filter values so we don't send things like "?status=".
// Bracket keys such as 'date[gte]' are sent exactly as written.
export const cleanParams = (params) => {
  const cleaned = {}
  Object.keys(params).forEach((key) => {
    const value = params[key]
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value
    }
  })
  return cleaned
}

export default api
