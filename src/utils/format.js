// src/utils/format.js
// Helpers for showing dates, times and hours on screen.
// Every time is shown in Lagos time, whatever time zone the user's device uses.

import { TIMEZONE, NETWORK_ERROR } from './constants'

// "2026-10-05T07:42:10.000Z" -> "08:42 AM" (Lagos time). Missing -> "-"
export const formatTime = (iso) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  })
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "2026-09-14" -> "Mon, 14 Sep 2026"
// We split the string ourselves. new Date("2026-09-14") would be read as UTC
// midnight, which can show the previous day in some time zones.
export const formatDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return '-'
  const [year, month, day] = yyyyMmDd.split('-').map(Number)
  // Date.UTC + getUTCDay gives the weekday without any time zone shift.
  const weekday = DAY_NAMES[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${weekday}, ${day} ${MONTH_NAMES[month - 1]} ${year}`
}

// "2026-09" -> "September 2026"
export const formatMonth = (yyyyMm) => {
  const [year, month] = yyyyMm.split('-').map(Number)
  const longName = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    timeZone: 'UTC',
  })
  return `${longName} ${year}`
}

// 7.5 -> "7.5 h"
export const formatHours = (n) => {
  if (n === null || n === undefined) return '-'
  return `${Math.round(n * 100) / 100} h`
}

// Today's date in Lagos as "YYYY-MM-DD".
// The "en-CA" locale happens to format dates as YYYY-MM-DD.
export const getTodayLagosDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

// The current month in Lagos as "YYYY-MM".
export const getCurrentLagosMonth = () => getTodayLagosDate().slice(0, 7)

// Live clock text for the dashboard, e.g. "09:14:05 AM" and "Monday, 5 October 2026".
export const formatClockTime = (date) =>
  date.toLocaleTimeString('en-US', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', second: '2-digit' })

export const formatClockDate = (date) =>
  date.toLocaleDateString('en-GB', {
    timeZone: TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

// Turns an ISO time into the "YYYY-MM-DDTHH:MM" text a datetime-local input needs.
// NOTE: datetime-local inputs use the BROWSER's time zone, so this uses the
// device's local time. Corrections assume the admin's device is set to Lagos time.
export const toDateTimeLocal = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Reads the error message sent by the server ({ message: "..." }),
// or falls back to a friendly message if there was no response.
export const getErrorMessage = (error) => {
  return error?.response?.data?.message || (error?.response ? 'Something went wrong. Please try again.' : NETWORK_ERROR)
}
