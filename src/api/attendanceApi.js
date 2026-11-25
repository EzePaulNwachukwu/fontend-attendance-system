// src/api/attendanceApi.js
// One small function per attendance endpoint.

import api, { cleanParams } from './axios'

// ---- Any logged-in user ----

// POST /api/attendance/clock-in (no body: the server sets the time)
export const clockIn = async () => {
  const { data } = await api.post('/api/attendance/clock-in')
  return data
}

// POST /api/attendance/clock-out (no body: the server sets the time)
export const clockOut = async () => {
  const { data } = await api.post('/api/attendance/clock-out')
  return data
}

// GET /api/attendance/today
// The server returns either
//   { clockedIn: false, date, isWorkingDay }
// or the record itself with extra fields:
//   { _id, date, clockIn, clockOut, status, ..., clockedIn: true, isWorkingDay }
// We turn both into one simple shape here, so pages only deal with:
//   { isWorkingDay: boolean, record: object | null }
export const getToday = async () => {
  const { data } = await api.get('/api/attendance/today')
  const { clockedIn, isWorkingDay, ...rest } = data
  return {
    isWorkingDay: Boolean(isWorkingDay),
    record: clockedIn ? rest : null,
  }
}

// GET /api/attendance/me -> { data, pagination }
// params example: { month: '2026-10', limit: 100 }
export const getMyAttendance = async (params = {}) => {
  const { data } = await api.get('/api/attendance/me', { params: cleanParams(params) })
  return data
}

// ---- Admin only ----

// GET /api/attendance -> { data, pagination }, each record has user populated
export const getAllAttendance = async (params = {}) => {
  const { data } = await api.get('/api/attendance', { params: cleanParams(params) })
  return data
}

// PUT /api/attendance/:id  { clockIn, clockOut, note }
export const updateAttendance = async (id, updates) => {
  const { data } = await api.put(`/api/attendance/${id}`, updates)
  return data
}

// GET /api/attendance/reports/today
export const getTodayReport = async () => {
  const { data } = await api.get('/api/attendance/reports/today')
  return data
}

// GET /api/attendance/reports/monthly?month=YYYY-MM
export const getMonthlyReport = async (month) => {
  const { data } = await api.get('/api/attendance/reports/monthly', { params: { month } })
  return data
}

// GET /api/attendance/reports/export?month=YYYY-MM -> CSV file as a Blob.
// We use axios (not a plain <a href>) because a link can't send the Bearer token.
export const exportMonthlyCsv = async (month) => {
  const { data } = await api.get('/api/attendance/reports/export', {
    params: { month },
    responseType: 'blob',
  })
  return data
}
