import { formatChange, formatEtb } from './constants'

export default function AssetCard({ item, ctaLabel = 'View details' }) {
  const isPositive = item.change >= 0

  return (
    <article className="market-card group flex flex-col">
      <div className="relative h-48 w-full overflow-hidden bg-surface-container-high">
        <img
          alt={item.imageAlt}
          className="h-full w-full object-cover"
          loading="lazy"
          src={item.image}
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary">
          {item.category}
        </p>

        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="mb-1 truncate text-xl font-semibold text-on-surface">{item.name}</h3>
            <p className="flex items-center gap-1 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                {item.metaIcon}
              </span>
              {item.meta}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-outline">Min. entry</p>
            <p className="text-lg font-bold text-primary">{formatEtb(item.minEntry)}</p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-outline-variant/30 pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-outline">24h change</p>
            <p className={`text-sm font-bold ${isPositive ? 'text-primary' : 'text-error'}`}>
              {formatChange(item.change)}
            </p>
          </div>
          <button
            className="rounded-xl bg-primary-container px-6 py-2.5 text-sm font-bold text-on-primary-container transition-colors group-hover:bg-primary group-hover:text-on-primary"
            type="button"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </article>
  )
}
