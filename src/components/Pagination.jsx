// src/components/Pagination.jsx
// Previous / Next buttons with "Page X of Y" and the number of results.
// Props: page, totalPages, totalCount, onPageChange(newPage)

export default function Pagination({ page, totalPages, totalCount, onPageChange }) {
  // Nothing to show when there are no results.
  if (!totalCount) return null

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row">
      <span>
        {totalCount} {totalCount === 1 ? 'result' : 'results'}
      </span>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}
