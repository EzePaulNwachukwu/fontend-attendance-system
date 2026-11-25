// src/components/Spinner.jsx
// A spinning circle shown while data is loading.
// Props: label (text read by screen readers), small (smaller size, for buttons)

export default function Spinner({ label = 'Loading...', small = false }) {
  const size = small ? 'h-4 w-4 border-2' : 'h-8 w-8 border-4'

  return (
    <div role="status" className={`flex items-center justify-center ${small ? '' : 'py-10'}`}>
      <span
        className={`${size} animate-spin rounded-full border-slate-200 border-t-indigo-600`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
