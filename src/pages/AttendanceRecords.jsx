// src/pages/AttendanceRecords.jsx
// Admin page: every attendance record, with filters and manual corrections.

import { useEffect, useState } from 'react'
import { useToast } from '../context/ToastContext'
import { getAllAttendance, updateAttendance } from '../api/attendanceApi'
import { getUsers } from '../api/userApi'
import { formatDate, formatHours, formatTime, getErrorMessage, toDateTimeLocal } from '../utils/format'
import { DEPARTMENTS } from '../utils/constants'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'

// Starting values for the filters (also used by the Reset button).
const EMPTY_FILTERS = { user: '', department: '', status: '', from: '', to: '' }

export default function AttendanceRecords() {
  const toast = useToast()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)

  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  const [employees, setEmployees] = useState([]) // for the employee drop-down
  const [editRecord, setEditRecord] = useState(null) // record being corrected

  // Load the employee list once, for the filter drop-down.
  // limit=100 is the API maximum; inactive employees are included on purpose
  // so their old records can still be found.
  useEffect(() => {
    getUsers({ limit: 100, sort: 'name' })
      .then((res) => setEmployees(res.data))
      .catch(() => setEmployees([])) // the page still works without it
  }, [])

  // Load records whenever the filters or page change.
  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')
    getAllAttendance({
      page,
      limit: 10,
      user: filters.user,
      department: filters.department,
      status: filters.status,
      'date[gte]': filters.from,
      'date[lte]': filters.to,
    })
      .then((res) => {
        if (ignore) return
        setRecords(res.data)
        setPagination(res.pagination)
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
  }, [filters, page, reloadCount])

  // Update one filter and go back to page 1.
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Attendance records</h1>
        <p className="text-sm text-slate-500">Search all clock-ins and correct mistakes.</p>
      </div>

      {/* Filters */}
      <div className="card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label htmlFor="f-user" className="label">
            Employee
          </label>
          <select id="f-user" name="user" className="input" value={filters.user} onChange={handleFilterChange}>
            <option value="">All employees</option>
            {employees.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.staffId}){u.isActive ? '' : ' – inactive'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-department" className="label">
            Department
          </label>
          <select id="f-department" name="department" className="input" value={filters.department} onChange={handleFilterChange}>
            <option value="">All</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-status" className="label">
            Status
          </label>
          <select id="f-status" name="status" className="input" value={filters.status} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
          </select>
        </div>
        <div>
          <label htmlFor="f-from" className="label">
            From
          </label>
          <input id="f-from" name="from" type="date" className="input" value={filters.from} onChange={handleFilterChange} />
        </div>
        <div>
          <label htmlFor="f-to" className="label">
            To
          </label>
          <input id="f-to" name="to" type="date" className="input" value={filters.to} onChange={handleFilterChange} />
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-6 lg:justify-end">
          <button type="button" className="btn btn-secondary" onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading && records.length === 0 ? (
          <Spinner label="Loading records" />
        ) : error ? (
          <div className="p-4">
            <ErrorMessage message={error} onRetry={() => setReloadCount((n) => n + 1)} />
          </div>
        ) : records.length === 0 ? (
          <EmptyState title="No records found" message="Try changing or resetting the filters." />
        ) : (
          <>
            <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Employee</th>
                    <th scope="col">Staff ID</th>
                    <th scope="col">Department</th>
                    <th scope="col">Clock in</th>
                    <th scope="col">Clock out</th>
                    <th scope="col">Hours</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id}>
                      <td className="font-medium text-slate-900">{formatDate(r.date)}</td>
                      <td>{r.user?.name || 'Unknown'}</td>
                      <td>{r.user?.staffId || '-'}</td>
                      <td>{r.user?.department || '-'}</td>
                      <td>{formatTime(r.clockIn)}</td>
                      <td>{formatTime(r.clockOut)}</td>
                      <td>{r.clockOut ? formatHours(r.hoursWorked) : '-'}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={r.status} />
                          {/* A note means an admin corrected this record. */}
                          {r.note && (
                            <span className="text-xs text-slate-500 underline decoration-dotted" title={r.note}>
                              edited
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditRecord(r)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <Modal open={Boolean(editRecord)} title="Correct attendance" onClose={() => setEditRecord(null)}>
        {editRecord && (
          <CorrectionForm
            key={editRecord._id}
            record={editRecord}
            onCancel={() => setEditRecord(null)}
            onSaved={() => {
              toast.success('Attendance record updated')
              setEditRecord(null)
              setReloadCount((n) => n + 1)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Correction form (calls PUT /api/attendance/:id)
//
// IMPORTANT: <input type="datetime-local"> uses the time zone of the BROWSER.
// So these corrections assume the admin's device is set to Lagos time.
// new Date(value).toISOString() converts the local time to UTC for the server.
// ---------------------------------------------------------------------------
function CorrectionForm({ record, onCancel, onSaved }) {
  const [clockIn, setClockIn] = useState(toDateTimeLocal(record.clockIn))
  const [clockOut, setClockOut] = useState(toDateTimeLocal(record.clockOut))
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!note.trim()) {
      setError('Please explain why this record is being corrected.')
      return
    }
    if (!clockIn) {
      setError('Clock in time is required.')
      return
    }
    if (clockOut && new Date(clockOut) <= new Date(clockIn)) {
      setError('Clock out must be after clock in.')
      return
    }

    const updates = { clockIn: new Date(clockIn).toISOString(), note: note.trim() }
    if (clockOut) updates.clockOut = new Date(clockOut).toISOString()

    setSaving(true)
    try {
      await updateAttendance(record._id, updates)
      onSaved()
    } catch (err) {
      // e.g. the server rejects a clock-in that isn't on the record's date
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-600">
        <strong className="text-slate-900">{record.user?.name}</strong> · {formatDate(record.date)}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-in" className="label">
            Clock in
          </label>
          <input
            id="c-in"
            type="datetime-local"
            className="input"
            value={clockIn}
            onChange={(e) => setClockIn(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="c-out" className="label">
            Clock out
          </label>
          <input
            id="c-out"
            type="datetime-local"
            className="input"
            value={clockOut}
            onChange={(e) => setClockOut(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-slate-500">Times use this device's time zone, which should be set to Lagos time.</p>

      <div>
        <label htmlFor="c-note" className="label">
          Why is this being corrected?
        </label>
        <textarea
          id="c-note"
          rows={3}
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Staff forgot to clock out; confirmed by supervisor"
          required
        />
        {record.note && <p className="mt-1 text-xs text-slate-500">Previous note: {record.note}</p>}
      </div>

      <p className="text-xs text-slate-500">Status and hours will be recalculated by the server.</p>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save correction'}
        </button>
      </div>
    </form>
  )
}
