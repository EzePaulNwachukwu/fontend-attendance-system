// src/components/ErrorMessage.jsx
// A red box showing an error message, with an optional Retry button.
// Props: message, onRetry (function; if missing, no button is shown)

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-secondary btn-sm">
          Retry
        </button>
      )}
    </div>
  )
}
