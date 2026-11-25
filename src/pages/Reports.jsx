// src/pages/Reports.jsx
// Admin page: monthly attendance report for every staff member, with CSV export.

import { useEffect, useState } from 'react'
import { useToast } from '../context/ToastContext'
import { exportMonthlyCsv, getMonthlyReport } from '../api/attendanceApi'
import { formatHours, formatMonth, getCurrentLagosMonth, getErrorMessage } from '../utils/format'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'

export default function Reports() {
  const toast = useToast()
  const [month, setMonth] = useState(getCurrentLagosMonth())
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!month) return
    let ignore = false
    setLoading(true)
    setError('')
    getMonthlyReport(month)
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
  }, [month, reloadCount])

  // Download the CSV.
  // A plain <a href> can't send the login token, so we fetch the file with
  // axios as a Blob, turn it into a temporary URL, and click a hidden link.
  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportMonthlyCsv(month)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance-${month}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url) // free the memory used by the temporary URL
    } catch {
      // With responseType 'blob' the server's JSON error arrives as a Blob,
      // so we show a general message instead of reading it.
      toast.error("Couldn't export the CSV. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  // Totals for the bottom row.
  const employees = report?.employees || []
  const totals = employees.reduce(
    (sum, e) => ({
      present: sum.present + e.daysPresent,
      late: sum.late + e.daysLate,
      absent: sum.absent + e.daysAbsent,
      hours: sum.hours + e.totalHours,
    }),
    { present: 0, late: 0, absent: 0, hours: 0 }
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Monthly report</h1>
          <p className="text-sm text-slate-500">Attendance totals for every active staff member.</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="w-44">
            <label htmlFor="report-month" className="label">
              Month
            </label>
            <input
              id="report-month"
              type="month"
              className="input"
              value={month}
              max={getCurrentLagosMonth()}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting || !month || employees.length === 0}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <Spinner label="Loading report" />
        ) : error ? (
          <div className="p-4">
            <ErrorMessage message={error} onRetry={() => setReloadCount((n) => n + 1)} />
          </div>
        ) : employees.length === 0 ? (
          <EmptyState title="No active staff to report on" />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-sm">
              <span className="font-medium text-slate-900">{formatMonth(report.month)}</span>
              <span className="text-slate-600">
                Working days: <strong className="text-slate-900">{report.workingDays}</strong>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Staff ID</th>
                    <th scope="col">Department</th>
                    <th scope="col" className="text-right">Present</th>
                    <th scope="col" className="text-right">Late</th>
                    <th scope="col" className="text-right">Absent</th>
                    <th scope="col" className="text-right">Total hours</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.userId}>
                      <td className="font-medium text-slate-900">{e.name}</td>
                      <td>{e.staffId}</td>
                      <td>{e.department || '-'}</td>
                      <td className="text-right">{e.daysPresent}</td>
                      <td className="text-right text-amber-700">{e.daysLate}</td>
                      <td className="text-right text-red-700">{e.daysAbsent}</td>
                      <td className="text-right">{formatHours(e.totalHours)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                  <tr>
                    <td className="px-4 py-3" colSpan={3}>
                      Total ({employees.length} staff)
                    </td>
                    <td className="px-4 py-3 text-right">{totals.present}</td>
                    <td className="px-4 py-3 text-right">{totals.late}</td>
                    <td className="px-4 py-3 text-right">{totals.absent}</td>
                    <td className="px-4 py-3 text-right">{formatHours(totals.hours)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
              "Present" includes late days. "Absent" counts working days with no clock-in.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
