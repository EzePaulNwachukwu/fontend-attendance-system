// src/components/StatusBadge.jsx
// A small coloured label, e.g. "Present" in green or "Late" in amber.
// The text is always shown, so the meaning never depends on colour alone.
// Props: status — one of present, late, absent, active, inactive, admin, staff

const STYLES = {
  present: 'bg-green-100 text-green-800',
  late: 'bg-amber-100 text-amber-800',
  absent: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-200 text-slate-700',
  admin: 'bg-indigo-100 text-indigo-800',
  staff: 'bg-slate-100 text-slate-700',
}

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-slate-100 text-slate-700'
  // "present" -> "Present"
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '-'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}
