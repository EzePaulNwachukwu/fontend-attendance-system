// src/pages/MyAttendance.jsx
// The logged-in user's own attendance for one month.

import { useEffect, useState } from 'react'
import { getMyAttendance } from '../api/attendanceApi'
import { formatDate, formatHours, formatMonth, formatTime, getCurrentLagosMonth, getErrorMessage } from '../utils/format'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'

export default function MyAttendance() {
  const [month, setMonth] = useState(getCurrentLagosMonth()) // "YYYY-MM"
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadCount, setReloadCount] = useState(0) // bumped by Retry

  useEffect(() => {
    // The month picker can be cleared; wait until a month is chosen.
    if (!month) return
    let ignore = false // ignore this response if the month changed meanwhile
    setLoading(true)
    setError('')
    // A month has at most 23 working days, so one page of 100 is enough.
    getMyAttendance({ month, limit: 100 })
      .then((res) => {
        if (!ignore) setRecords(res.data)
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [month, reloadCount])

  // Summary numbers worked out from the records we already have.
  // Every record means the person came in; late ones are counted separately.
  const daysPresent = records.length
  const daysLate = records.filter((r) => r.status === 'late').length
  const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My attendance</h1>
          <p className="text-sm text-slate-500">Your clock-in history, month by month.</p>
        </div>
        <div className="sm:w-48">
          <label htmlFor="month" className="label">
            Month
          </label>
          <input
            id="month"
            type="month"
            className="input"
            value={month}
            max={getCurrentLagosMonth()}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 sm:p-4">
          <p className="text-xs text-slate-500 sm:text-sm">Days present</p>
          <p className="text-xl font-semibold text-slate-900 sm:text-2xl">{loading ? '–' : daysPresent}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-xs text-slate-500 sm:text-sm">Days late</p>
          <p className="text-xl font-semibold text-amber-700 sm:text-2xl">{loading ? '–' : daysLate}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-xs text-slate-500 sm:text-sm">Total hours</p>
          <p className="text-xl font-semibold text-slate-900 sm:text-2xl">{loading ? '–' : formatHours(totalHours)}</p>
        </div>
      </div>
      <p className="-mt-3 text-xs text-slate-500">Days present includes days you were late.</p>

      <div className="card">
        {loading ? (
          <Spinner label="Loading your attendance" />
        ) : error ? (
          <div className="p-4">
            <ErrorMessage message={error} onRetry={() => setReloadCount((n) => n + 1)} />
          </div>
        ) : records.length === 0 ? (
          <EmptyState title="No records for this month" message={month ? formatMonth(month) : ''} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Clock in</th>
                  <th scope="col">Clock out</th>
                  <th scope="col">Hours</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id}>
                    <td className="font-medium text-slate-900">{formatDate(r.date)}</td>
                    <td>{formatTime(r.clockIn)}</td>
                    <td>{formatTime(r.clockOut)}</td>
                    <td>{r.clockOut ? formatHours(r.hoursWorked) : '-'}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
