// src/context/ToastContext.jsx
// Small pop-up messages ("toasts") in the corner of the screen.
// They disappear on their own after about 3 seconds.
//
// Usage in a component:
//   const toast = useToast()
//   toast.success('Clocked in')
//   toast.error('Something went wrong')

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

// Each toast gets a unique id so we can remove the right one later.
let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (type, message) => {
      const id = nextId++
      setToasts((current) => [...current, { id, type, message }])
      // Remove it automatically after 3 seconds.
      setTimeout(() => removeToast(id), 3000)
    },
    [removeToast]
  )

  // useMemo keeps the same object between renders, so components that use
  // the toast in a useEffect don't re-run that effect for no reason.
  const value = useMemo(
    () => ({
      success: (message) => showToast('success', message),
      error: (message) => showToast('error', message),
    }),
    [showToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* The toasts themselves. aria-live makes screen readers announce them. */}
      <div
        aria-live="polite"
        className="fixed bottom-4 left-4 right-4 z-50 flex flex-col items-center gap-2 sm:left-auto sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`flex w-full max-w-sm items-start gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
              t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss message"
              className="rounded leading-none opacity-80 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Exporting a hook next to a component is the usual pattern for a context, so we
// silence the linter's "fast refresh" hint for this line.
// oxlint-disable-next-line react/only-export-components
export function useToast() {
  return useContext(ToastContext)
}
