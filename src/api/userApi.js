// src/api/userApi.js
// One small function per user endpoint (all admin only).

import api, { cleanParams } from './axios'

// GET /api/users -> { data: [...], pagination: {...} }
// params example: { page: 1, department: 'Sales', 'name[regex]': 'ade' }
export const getUsers = async (params = {}) => {
  const { data } = await api.get('/api/users', { params: cleanParams(params) })
  return data
}

// GET /api/users/:id
export const getUser = async (id) => {
  const { data } = await api.get(`/api/users/${id}`)
  return data
}

// PUT /api/users/:id  { name, department, position, role, isActive, password? }
export const updateUser = async (id, updates) => {
  const { data } = await api.put(`/api/users/${id}`, updates)
  return data
}

// DELETE /api/users/:id -> { message: "User deactivated" }
export const deactivateUser = async (id) => {
  const { data } = await api.delete(`/api/users/${id}`)
  return data
}
