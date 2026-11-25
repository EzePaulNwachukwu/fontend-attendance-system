// src/components/StatCard.jsx
// A box with a label and a big number, e.g. "Present: 8".
// Props: label, value, color (one of slate, green, amber, red)

const COLORS = {
  slate: 'text-slate-900',
  green: 'text-green-700',
  amber: 'text-amber-700',
  red: 'text-red-700',
}

export default function StatCard({ label, value, color = 'slate' }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${COLORS[color]}`}>{value}</p>
    </div>
  )
}
