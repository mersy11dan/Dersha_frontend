const TONE_STYLES = {
  error: {
    wrapper: 'border-error/30 bg-error/5 text-error',
    icon: 'error',
  },
  success: {
    wrapper: 'border-primary/30 bg-primary/5 text-primary',
    icon: 'check_circle',
  },
  info: {
    wrapper: 'border-outline-variant/40 bg-surface-container-low text-on-surface-variant',
    icon: 'info',
  },
}

/** Banner for server-level messages that are not tied to a single field. */
export default function FormAlert({
  tone = 'error',
  title,
  message,
  children,
  className = '',
}) {
  if (!message && !children) return null

  const style = TONE_STYLES[tone] ?? TONE_STYLES.info

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${style.wrapper} ${className}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className="material-symbols-outlined shrink-0 text-[20px]" aria-hidden="true">
        {style.icon}
      </span>
      <div className="text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {message && <p>{message}</p>}
        {children}
      </div>
    </div>
  )
}

/** Inline validation message rendered under an input. */
export function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="ml-1 mt-1 flex items-center gap-1 text-[12px] text-error">
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
        error
      </span>
      {message}
    </p>
  )
}
