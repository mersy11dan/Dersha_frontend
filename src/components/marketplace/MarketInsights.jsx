import { MARKET_HIGHLIGHTS, TRENDING_SECTORS } from './constants'

export default function MarketInsights() {
  return (
    <div className="space-y-10">
      <section aria-labelledby="market-insights-heading">
        <h2
          className="mb-4 flex items-center gap-2 text-lg font-semibold text-on-surface"
          id="market-insights-heading"
        >
          <span className="material-symbols-outlined text-primary" aria-hidden="true">
            query_stats
          </span>
          Market insights
        </h2>

        <div className="space-y-4">
          {MARKET_HIGHLIGHTS.map((highlight) => (
            <div key={highlight.id} className="wallet-panel p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wide text-outline">
                  {highlight.label}
                </span>
                <span className="text-sm font-bold text-primary">{highlight.value}</span>
              </div>
              <p className="font-semibold text-on-surface">{highlight.name}</p>
              <p className="text-xs text-outline">{highlight.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="trending-sectors-heading">
        <h2
          className="mb-4 text-xs font-bold uppercase tracking-widest text-outline"
          id="trending-sectors-heading"
        >
          Trending sectors
        </h2>

        <ul className="space-y-4">
          {TRENDING_SECTORS.map((sector) => (
            <li key={sector.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">{sector.icon}</span>
                </span>
                <span className="text-sm font-medium text-on-surface">{sector.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="sr-only">{sector.share}% of this week&apos;s trade volume</span>
                <div
                  aria-hidden="true"
                  className="h-1.5 w-16 overflow-hidden rounded-full bg-outline-variant/30"
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${sector.share}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
