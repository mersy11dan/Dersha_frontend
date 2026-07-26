export default function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <svg
          aria-hidden="true"
          className="h-8 w-8 animate-spin text-primary"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            fill="currentColor"
          />
        </svg>
        <p className="text-sm text-on-surface-variant">{label}</p>
      </div>
    </div>
  )
}
