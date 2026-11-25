// src/components/EmptyState.jsx
// Shown when a list has nothing in it, e.g. "No records for this month".
// Props: title, message (optional extra line)

export default function EmptyState({ title, message }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {message && <p className="mt-1 text-sm text-slate-500">{message}</p>}
    </div>
  )
}
