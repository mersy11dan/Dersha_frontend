import { formatEtb, formatRelative } from '../../lib/format'

/**
 * Hand-drawn price line from the recent fills.
 *
 * The API returns trades newest-first, so they are reversed here to read left
 * to right. With fewer than two points there is no line to draw, and the
 * component says so rather than rendering a misleading flat trace.
 */
export default function PriceSparkline({ trades, nominalPrice }) {
  const points = [...trades].reverse()

  if (points.length < 2) {
    return (
      <section className="wallet-panel p-6">
        <h2 className="mb-2 text-lg font-semibold text-on-surface">Price history</h2>
        <p className="text-sm text-on-surface-variant">
          {points.length === 0
            ? `Not traded yet. The issue price was ${formatEtb(nominalPrice, { decimals: 2 })}.`
            : 'One trade so far. A price line appears once there are at least two.'}
        </p>
      </section>
    )
  }

  const prices = points.map((point) => point.price_per_share_etb)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  // A flat series would divide by zero; pad it so the line sits mid-height.
  const range = max - min || Math.max(max * 0.1, 1)

  const width = 600
  const height = 160
  const step = width / (points.length - 1)

  const coords = points.map((point, index) => {
    const x = index * step
    const y = height - ((point.price_per_share_etb - min) / range) * (height - 20) - 10
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  const line = `M ${coords.join(' L ')}`
  const area = `${line} L ${width},${height} L 0,${height} Z`
  const rising = prices[prices.length - 1] >= prices[0]
  const stroke = rising ? 'var(--color-primary, #1f8a4c)' : 'var(--color-error, #b3261e)'

  return (
    <section className="wallet-panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-on-surface">Price history</h2>
        <span className="text-xs text-on-surface-variant">
          {points.length} trades · {formatRelative(points[0].executed_at)} to now
        </span>
      </div>

      <svg
        className="h-40 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Price moved between ${formatEtb(min, { decimals: 2 })} and ${formatEtb(max, { decimals: 2 })}`}
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient id="price-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#price-fill)" />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
      </svg>

      <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
        <span>Low {formatEtb(min, { decimals: 2 })}</span>
        <span>High {formatEtb(max, { decimals: 2 })}</span>
      </div>
    </section>
  )
}
