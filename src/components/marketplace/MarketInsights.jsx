import { categoryIcon, categoryLabel, formatEtbCompact } from '../../lib/format'

/**
 * Live market summary. Sector weights are computed from the listed sub-funds
 * themselves rather than a separate endpoint, so they can never disagree with
 * the grid beside them.
 */
export default function MarketInsights({ highlights, assets = [], loading }) {
  const sectors = sectorWeights(assets)
  const movers = [...assets]
    .filter((asset) => asset.price_change_24h_percentage !== null)
    .sort((a, b) => b.price_change_24h_percentage - a.price_change_24h_percentage)
    .slice(0, 3)

  const tiles = [
    {
      id: 'tvl',
      label: 'Total value locked',
      value: formatEtbCompact(highlights?.total_value_locked_etb),
      detail: `${highlights?.listed_sub_funds ?? 0} listed sub-funds`,
    },
    {
      id: 'volume',
      label: '24h volume',
      value: formatEtbCompact(highlights?.volume_24h_etb),
      detail: `${highlights?.trades_24h ?? 0} trades settled`,
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-outline">
          Market snapshot
        </h2>
        <div className="flex flex-col gap-3">
          {tiles.map((tile) => (
            <div key={tile.id} className="wallet-panel p-4">
              <p className="text-xs text-outline">{tile.label}</p>
              <p className="mt-1 text-2xl font-bold text-on-surface">
                {loading ? '—' : tile.value}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">{tile.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-outline">
          Today's movers
        </h2>
        {movers.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            No price moves yet. Changes appear once assets trade against a previous mark.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {movers.map((asset) => (
              <li key={asset.sub_fund_id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-on-surface">
                  {asset.asset_name}
                </span>
                <span
                  className={`shrink-0 text-sm font-bold ${
                    asset.price_change_24h_percentage >= 0 ? 'text-primary' : 'text-error'
                  }`}
                >
                  {asset.price_change_24h_percentage > 0 ? '+' : ''}
                  {asset.price_change_24h_percentage.toFixed(2)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-outline">
          Sector weight
        </h2>
        {sectors.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Nothing listed yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {sectors.map((sector) => (
              <li key={sector.category}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-on-surface">
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-[18px] text-primary"
                    >
                      {categoryIcon(sector.category)}
                    </span>
                    {categoryLabel(sector.category)}
                  </span>
                  <span className="font-semibold text-on-surface-variant">
                    {sector.share.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${sector.share}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/** Share of total market capitalisation held by each sector. */
function sectorWeights(assets) {
  const totals = new Map()
  let overall = 0

  for (const asset of assets) {
    const value = Number(asset.market_capitalisation_etb ?? 0)
    totals.set(asset.category, (totals.get(asset.category) ?? 0) + value)
    overall += value
  }

  if (overall <= 0) return []

  return [...totals.entries()]
    .map(([category, value]) => ({ category, share: (value / overall) * 100 }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 5)
}
