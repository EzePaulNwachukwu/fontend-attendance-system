// src/components/Modal.jsx
// A pop-up dialog shown on top of the page.
// - Closes when you press Escape, click the dark background, or click ✕
// - Puts the cursor in the first field (or button) when it opens
//
// Props: open (show or hide), title, onClose, children (the content)

import { useEffect, useRef } from 'react'

export default function Modal({ open, title, onClose, children }) {
  const panelRef = useRef(null)

  // Close on Escape while the modal is open.
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Focus the first field when the modal opens.
  // If there is no input, focus the first button inside the content area.
  useEffect(() => {
    if (!open || !panelRef.current) return
    const first =
      panelRef.current.querySelector('input:not([disabled]):not([readonly]), select:not([disabled]), textarea') ||
      panelRef.current.querySelector('[data-modal-body] button')
    first?.focus()
  }, [open])

  if (!open) return null

  return (
    // The dark background. Clicking it closes the modal.
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-xl bg-white shadow-xl sm:max-w-lg sm:rounded-xl"
        // Stop clicks inside the panel from reaching the background.
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            ✕
          </button>
        </div>
        <div data-modal-body className="px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
