import { useMemo } from 'react'
import { categoryLabel, formatEtb, formatPercentage } from '../../lib/format'

const SLICE_COLORS = [
  'text-primary',
  'text-tertiary',
  'text-secondary',
  'text-error',
  'text-outline',
]
const DOT_COLORS = ['bg-primary', 'bg-tertiary', 'bg-secondary', 'bg-error', 'bg-outline']

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Allocation across sectors, plus baskets and idle cash, so the mix shown here
 * always adds up to the portfolio total on the summary tiles.
 */
export default function AllocationDonut({ holdings = [], basketValue = 0, cash = 0 }) {
  const slices = useMemo(() => {
    const bySector = new Map()

    for (const holding of holdings) {
      const key = categoryLabel(holding.category)
      bySector.set(key, (bySector.get(key) ?? 0) + holding.market_value_etb)
    }
    if (basketValue > 0) bySector.set('Baskets', basketValue)
    if (cash > 0) bySector.set('Cash', cash)

    const entries = [...bySector.entries()]
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])

    const total = entries.reduce((sum, [, value]) => sum + value, 0)
    if (total === 0) return { total: 0, items: [] }

    let offset = 0
    const items = entries.map(([label, value], index) => {
      const share = value / total
      const item = {
        label,
        value,
        percentage: share * 100,
        // Each arc is drawn as a full-circumference dash offset by the arcs
        // already placed, which avoids needing real path arithmetic.
        dashArray: `${share * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
        dashOffset: -offset * CIRCUMFERENCE,
        stroke: SLICE_COLORS[index % SLICE_COLORS.length],
        dot: DOT_COLORS[index % DOT_COLORS.length],
      }
      offset += share
      return item
    })

    return { total, items }
  }, [holdings, basketValue, cash])

  const largest = slices.items[0]

  return (
    <section className="wallet-panel p-6">
      <h2 className="mb-6 text-lg font-semibold text-on-surface">Allocation</h2>

      {slices.total === 0 ? (
        <p className="text-sm text-on-surface-variant">
          Fund your wallet or buy an asset and the mix appears here.
        </p>
      ) : (
        <>
          <div className="relative mx-auto mb-8 h-44 w-44">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-surface-container"
                cx="50"
                cy="50"
                fill="transparent"
                r={RADIUS}
                stroke="currentColor"
                strokeWidth="12"
              />
              {slices.items.map((item) => (
                <circle
                  key={item.label}
                  className={item.stroke}
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r={RADIUS}
                  stroke="currentColor"
                  strokeDasharray={item.dashArray}
                  strokeDashoffset={item.dashOffset}
                  strokeWidth="12"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-on-surface">
                {formatPercentage(largest.percentage, 0)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-outline">
                {largest.label}
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-3">
            {slices.items.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`h-3 w-3 shrink-0 rounded-full ${item.dot}`}
                  />
                  <span className="truncate text-sm text-on-surface-variant">
                    {item.label}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="text-sm font-bold text-on-surface">
                    {formatPercentage(item.percentage, 1)}
                  </span>
                  <span className="ml-2 text-xs text-outline">
                    {formatEtb(item.value)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
