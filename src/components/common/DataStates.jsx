/** Shared loading, error and empty panels for API-backed views. */

export function LoadingPanel({ label = 'Loading…', rows = 3 }) {
  return (
    <div aria-busy="true" aria-label={label} className="flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-2xl bg-surface-container-high"
        />
      ))}
    </div>
  )
}

export function ErrorPanel({ error, onRetry }) {
  return (
    <div className="wallet-panel flex flex-col items-center px-8 py-12 text-center">
      <span
        aria-hidden="true"
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-on-error-container"
      >
        <span className="material-symbols-outlined">error</span>
      </span>
      <h3 className="mb-2 text-lg font-semibold text-on-surface">Could not load this view</h3>
      <p className="mb-6 max-w-sm text-sm text-on-surface-variant">
        {error?.message ?? 'Something went wrong. Please try again.'}
      </p>
      {onRetry && (
        <button
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyPanel({ icon = 'inbox', title, description, action }) {
  return (
    <div className="wallet-panel flex flex-col items-center px-8 py-16 text-center">
      <span
        aria-hidden="true"
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high text-outline"
      >
        <span className="material-symbols-outlined">{icon}</span>
      </span>
      <h3 className="mb-2 text-lg font-semibold text-on-surface">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-on-surface-variant">{description}</p>
      )}
      {action}
    </div>
  )
}

/** Small pill showing whether the live feed is connected. */
export function LiveBadge({ status }) {
  const connected = status === 'open'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
        connected
          ? 'bg-primary-container text-on-primary-container'
          : 'bg-surface-container-high text-outline'
      }`}
      title={connected ? 'Streaming live prices' : 'Live feed reconnecting'}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-primary' : 'bg-outline'}`}
      />
      {connected ? 'Live' : 'Offline'}
    </span>
  )
}
