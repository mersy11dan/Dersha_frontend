import { formatDateTime, formatEtb } from '../../lib/format'

const WIDTH = 600
const HEIGHT = 140

/** NAV per unit over the recorded snapshots, drawn as a plain area chart. */
export default function BasketNavChart({ history = [] }) {
  if (history.length < 2) {
    return (
      <section className="wallet-panel p-6">
        <h2 className="mb-2 text-lg font-semibold text-on-surface">NAV history</h2>
        <p className="text-sm text-on-surface-variant">
          {history.length === 0
            ? 'No snapshots yet. NAV is recorded whenever a constituent re-marks.'
            : `First mark at ${formatEtb(history[0].nav_per_basket_share_etb, {
                decimals: 2,
              })}. The chart appears once there is a second point to compare.`}
        </p>
      </section>
    )
  }

  const values = history.map((point) => point.nav_per_basket_share_etb)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * WIDTH
    // Padded 10% top and bottom so a flat series does not hug the edge.
    const y = HEIGHT - ((value - min) / span) * (HEIGHT * 0.8) - HEIGHT * 0.1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const first = values[0]
  const last = values[values.length - 1]
  const change = first > 0 ? ((last - first) / first) * 100 : 0
  const rising = last >= first

  return (
    <section className="wallet-panel p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-on-surface">NAV history</h2>
          <p className="text-sm text-on-surface-variant">
            {history.length} marks since {formatDateTime(history[0].calculated_at)}
          </p>
        </div>
        <p className={`text-sm font-bold ${rising ? 'text-primary' : 'text-error'}`}>
          {change > 0 ? '+' : ''}
          {change.toFixed(2)}% over the period
        </p>
      </div>

      <svg
        className="w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`NAV moved from ${formatEtb(first, { decimals: 2 })} to ${formatEtb(
          last,
          { decimals: 2 },
        )}`}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ height: HEIGHT }}
      >
        <polygon
          className={rising ? 'text-primary' : 'text-error'}
          fill="currentColor"
          fillOpacity="0.08"
          points={`0,${HEIGHT} ${points.join(' ')} ${WIDTH},${HEIGHT}`}
        />
        <polyline
          className={rising ? 'text-primary' : 'text-error'}
          fill="none"
          points={points.join(' ')}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>

      <div className="mt-3 flex justify-between text-xs text-outline">
        <span>Low {formatEtb(min, { decimals: 2 })}</span>
        <span>High {formatEtb(max, { decimals: 2 })}</span>
      </div>
    </section>
  )
}
