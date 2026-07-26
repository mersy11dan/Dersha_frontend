import { formatEtb, formatShares } from '../../lib/format'

/**
 * Aggregated depth. Bars are scaled against the largest level on either side so
 * the two halves of the book stay visually comparable.
 */
export default function OrderBook({ book, onPickPrice }) {
  const levels = [...(book?.bids ?? []), ...(book?.asks ?? [])]
  const peak = Math.max(1, ...levels.map((level) => level.shares))

  return (
    <div className="wallet-panel p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-on-surface">Order book</h2>
        {book?.spread_etb !== null && book?.spread_etb !== undefined && (
          <span className="text-xs text-on-surface-variant">
            Spread {formatEtb(book.spread_etb, { decimals: 2 })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Side
          emptyLabel="No bids"
          levels={book?.asks ?? []}
          onPickPrice={onPickPrice}
          peak={peak}
          title="Asks"
          tone="error"
        />
        <Side
          emptyLabel="No asks"
          levels={book?.bids ?? []}
          onPickPrice={onPickPrice}
          peak={peak}
          title="Bids"
          tone="primary"
        />
      </div>
    </div>
  )
}

function Side({ title, levels, peak, tone, emptyLabel, onPickPrice }) {
  const isBid = tone === 'primary'

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-outline">
        <span>{title}</span>
        <span>Shares</span>
      </div>

      {levels.length === 0 ? (
        <p className="py-4 text-sm text-on-surface-variant">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {levels.map((level) => (
            <li key={`${title}-${level.price_etb}`}>
              <button
                className="relative flex w-full items-center justify-between overflow-hidden rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface-container-high"
                onClick={() => onPickPrice?.(level.price_etb, isBid ? 'SELL' : 'BUY')}
                title={`Use ${formatEtb(level.price_etb, { decimals: 2 })} in the trade ticket`}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 ${
                    isBid ? 'bg-primary/10' : 'bg-error/10'
                  }`}
                  style={{ width: `${(level.shares / peak) * 100}%` }}
                />
                <span
                  className={`relative font-semibold ${
                    isBid ? 'text-primary' : 'text-error'
                  }`}
                >
                  {formatEtb(level.price_etb, { decimals: 2 })}
                </span>
                <span className="relative text-on-surface-variant">
                  {formatShares(level.shares)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
