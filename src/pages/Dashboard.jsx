// src/pages/Dashboard.jsx
// The home page.
// - Everyone sees the clock card (clock in / clock out for today).
// - Admins also see today's summary for the whole office.

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { clockIn, clockOut, getToday, getTodayReport } from '../api/attendanceApi'
import {
  formatClockDate,
  formatClockTime,
  formatDate,
  formatHours,
  formatTime,
  getErrorMessage,
} from '../utils/format'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import StatCard from '../components/StatCard'
import Modal from '../components/Modal'

// ---------------------------------------------------------------------------
// Live office clock: shows Lagos time, updated every second.
// ---------------------------------------------------------------------------
function OfficeClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    // Stop the timer when the component is removed from the page.
    return () => clearInterval(timer)
  }, [])

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Office time (Lagos)</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900 sm:text-4xl">{formatClockTime(now)}</p>
      <p className="text-sm text-slate-600">{formatClockDate(now)}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Clock card: clock in / clock out for the logged-in user.
// onChange is called after a successful clock in or out (so the admin
// summary below can refresh too).
// ---------------------------------------------------------------------------
function ClockCard({ onChange }) {
  const toast = useToast()
  const [today, setToday] = useState(null) // { isWorkingDay, record }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false) // a request is in flight
  const [confirmOpen, setConfirmOpen] = useState(false) // clock-out confirmation

  const loadToday = useCallback(async () => {
    setError('')
    try {
      setToday(await getToday())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadToday()
  }, [loadToday])

  const handleClockIn = async () => {
    setSubmitting(true)
    try {
      const record = await clockIn()
      toast.success(`Clocked in at ${formatTime(record.clockIn)}`)
      await loadToday()
      onChange?.()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleClockOut = async () => {
    setConfirmOpen(false)
    setSubmitting(true)
    try {
      const record = await clockOut()
      toast.success(`Clocked out at ${formatTime(record.clockOut)}`)
      await loadToday()
      onChange?.()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Decide which of the states to show. Exactly one is rendered.
  let content
  if (loading) {
    content = <Spinner label="Loading today's attendance" />
  } else if (error) {
    content = <ErrorMessage message={error} onRetry={loadToday} />
  } else if (!today.isWorkingDay) {
    content = (
      <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
        Today isn't a working day. Attendance runs Monday to Friday.
      </p>
    )
  } else if (!today.record) {
    // Working day, not clocked in yet
    content = (
      <button
        type="button"
        onClick={handleClockIn}
        disabled={submitting}
        className="btn btn-primary w-full py-4 text-lg sm:w-auto sm:px-12"
      >
        {submitting ? 'Clocking in...' : 'Clock in'}
      </button>
    )
  } else if (!today.record.clockOut) {
    // Clocked in, not out yet
    content = (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span>
            Clocked in at <strong className="text-slate-900">{formatTime(today.record.clockIn)}</strong>
          </span>
          <StatusBadge status={today.record.status} />
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={submitting}
          className="btn btn-danger w-full py-4 text-lg sm:w-auto sm:px-12"
        >
          {submitting ? 'Clocking out...' : 'Clock out'}
        </button>
      </div>
    )
  } else {
    // Clocked in and out: done for the day
    content = (
      <div className="space-y-3">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">Clock in</dt>
            <dd className="font-medium text-slate-900">{formatTime(today.record.clockIn)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Clock out</dt>
            <dd className="font-medium text-slate-900">{formatTime(today.record.clockOut)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Hours worked</dt>
            <dd className="font-medium text-slate-900">{formatHours(today.record.hoursWorked)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd>
              <StatusBadge status={today.record.status} />
            </dd>
          </div>
        </dl>
        <p className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-800">You're done for today.</p>
      </div>
    )
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="clock-heading">
      <h2 id="clock-heading" className="sr-only">
        Clock in and out
      </h2>
      <div className="flex flex-col gap-6">
        <OfficeClock />
        <div>{content}</div>
        <p className="text-xs text-slate-500">Your clock-in time is recorded by the server.</p>
      </div>

      <Modal open={confirmOpen} title="Clock out" onClose={() => setConfirmOpen(false)}>
        <p className="text-sm text-slate-700">Clock out now? You can't clock in again today.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleClockOut}>
            Clock out
          </button>
        </div>
      </Modal>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Admin summary: today's numbers for the whole office.
// refreshKey changes whenever the admin clocks in or out, which reloads it.
// ---------------------------------------------------------------------------
function AdminSummary({ refreshKey }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadCount, setReloadCount] = useState(0) // bumped by Refresh/Retry

  useEffect(() => {
    let ignore = false // set to true if this effect is replaced by a newer one
    setLoading(true)
    setError('')
    getTodayReport()
      .then((data) => {
        if (!ignore) setReport(data)
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
  }, [refreshKey, reloadCount])

  const refresh = () => setReloadCount((n) => n + 1)

  return (
    <section className="space-y-4" aria-labelledby="summary-heading">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="summary-heading" className="text-lg font-semibold text-slate-900">
            Today's summary
          </h2>
          {report && <p className="text-sm text-slate-500">{formatDate(report.date)}</p>}
        </div>
        <button type="button" onClick={refresh} disabled={loading} className="btn btn-secondary">
          Refresh
        </button>
      </div>

      {loading && !report ? (
        <Spinner label="Loading today's summary" />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refresh} />
      ) : !report.isWorkingDay ? (
        <p className="card p-4 text-sm text-slate-700">
          Today isn't a working day, so there are no attendance figures. {report.totalStaff} active staff on record.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total staff" value={report.totalStaff} />
            <StatCard label="Present" value={report.present} color="green" />
            <StatCard label="Late" value={report.late} color="amber" />
            <StatCard label="Absent" value={report.absent} color="red" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Today's records */}
            <div className="card lg:col-span-2">
              <h3 className="border-b border-slate-200 px-4 py-3 font-medium text-slate-900">Today's attendance</h3>
              {report.records.length === 0 ? (
                <EmptyState title="No one has clocked in yet" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Staff ID</th>
                        <th scope="col">Department</th>
                        <th scope="col">Clock in</th>
                        <th scope="col">Clock out</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.records.map((r) => (
                        <tr key={r._id}>
                          <td className="font-medium text-slate-900">{r.user?.name}</td>
                          <td>{r.user?.staffId}</td>
                          <td>{r.user?.department || '-'}</td>
                          <td>{formatTime(r.clockIn)}</td>
                          <td>{formatTime(r.clockOut)}</td>
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

            {/* Staff who haven't clocked in */}
            <div className="card">
              <h3 className="border-b border-slate-200 px-4 py-3 font-medium text-slate-900">
                Not clocked in yet ({report.absentees.length})
              </h3>
              {report.absentees.length === 0 ? (
                <EmptyState title="Everyone has clocked in" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {report.absentees.map((u) => (
                    <li key={u._id} className="px-4 py-2.5 text-sm">
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">
                        {u.staffId} · {u.department || 'No department'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// The page itself
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  // Increased after the admin clocks in/out, so the summary reloads.
  const [summaryKey, setSummaryKey] = useState(0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500">Here's your attendance for today.</p>
      </div>

      <ClockCard onChange={() => setSummaryKey((k) => k + 1)} />

      {isAdmin && <AdminSummary refreshKey={summaryKey} />}
    </div>
  )
}
