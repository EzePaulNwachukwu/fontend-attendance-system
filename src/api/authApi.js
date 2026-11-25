// src/api/authApi.js
// One small function per auth endpoint. Each returns the response data.

import api from './axios'

// POST /api/auth/login -> { _id, name, username, staffId, role, token }
export const loginRequest = async (username, password) => {
  const { data } = await api.post('/api/auth/login', { username, password })
  return data
}

// GET /api/auth/me -> the logged-in user
export const getMe = async () => {
  const { data } = await api.get('/api/auth/me')
  return data
}

// POST /api/auth/register (admin only) -> the new user
export const registerUser = async (userData) => {
  const { data } = await api.post('/api/auth/register', userData)
  return data
}
