/** Display helpers shared across the market, portfolio and basket views. */

// Mirrors ASSET_CATEGORIES in the API's asset schema; a value the backend
// cannot return would produce a filter that never matches anything.
const CATEGORY_LABELS = {
  REAL_ESTATE: 'Real Estate',
  AGRICULTURE: 'Agriculture',
  INFRASTRUCTURE: 'Infrastructure',
  LOGISTICS_VEHICLE: 'Logistics',
  COMMODITY_GOLD: 'Gold & Metals',
  MICRO_BUSINESS: 'Micro Business',
  FINE_ART: 'Fine Art & Culture',
}

const CATEGORY_ICONS = {
  REAL_ESTATE: 'apartment',
  AGRICULTURE: 'agriculture',
  INFRASTRUCTURE: 'bolt',
  LOGISTICS_VEHICLE: 'local_shipping',
  COMMODITY_GOLD: 'diamond',
  MICRO_BUSINESS: 'storefront',
  FINE_ART: 'palette',
}

export const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS)

export const categoryLabel = (category) =>
  CATEGORY_LABELS[category] ?? titleCase(category ?? '')

export const categoryIcon = (category) => CATEGORY_ICONS[category] ?? 'token'

export function titleCase(value) {
  return String(value)
    .toLowerCase()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

export function formatEtb(amount, { decimals = 0 } = {}) {
  const value = Number(amount ?? 0)
  return `ETB ${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

/** Compact form for headline tiles: ETB 1.2M rather than ETB 1,240,000. */
export function formatEtbCompact(amount) {
  const value = Number(amount ?? 0)
  if (Math.abs(value) >= 1_000_000) return `ETB ${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `ETB ${(value / 1_000).toFixed(1)}K`
  return formatEtb(value)
}

export function formatShares(shares) {
  const value = Number(shares ?? 0)
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    // Fractional basket shares matter; whole share counts should stay clean.
    maximumFractionDigits: Number.isInteger(value) ? 0 : 4,
  })
}

/** Returns null-safe percentage text, or a dash when there is no comparison. */
export function formatChange(change) {
  if (change === null || change === undefined) return '—'
  const value = Number(change)
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function formatPercentage(value, decimals = 2) {
  return `${Number(value ?? 0).toFixed(decimals)}%`
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatRelative(value) {
  if (!value) return '—'
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return '—'

  const seconds = Math.round((Date.now() - then) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604_800) return `${Math.floor(seconds / 86_400)}d ago`
  return formatDate(value)
}

export const changeTone = (change) =>
  change === null || change === undefined
    ? 'text-on-surface-variant'
    : Number(change) >= 0
      ? 'text-primary'
      : 'text-error'
