import { Link } from 'react-router-dom'
import {
  categoryIcon,
  categoryLabel,
  changeTone,
  formatDate,
  formatEtb,
  formatPercentage,
  formatShares,
} from '../../lib/format'

export default function HoldingRow({ holding }) {
  const locked = holding.vesting_locked_shares > 0

  return (
    <article className="wallet-panel p-5 transition-colors hover:border-primary/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          >
            <span className="material-symbols-outlined text-[22px]">
              {categoryIcon(holding.category)}
            </span>
          </span>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                {categoryLabel(holding.category)}
              </span>
              {holding.location && (
                <span className="truncate text-xs text-outline">{holding.location}</span>
              )}
            </div>
            <h3 className="truncate text-lg font-semibold text-on-surface">
              {holding.asset_name}
            </h3>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              {formatShares(holding.shares_owned)} shares ·{' '}
              {formatPercentage(holding.ownership_percentage, 4)} of the sub-fund
            </p>
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="text-xs text-outline">Market value</p>
          <p className="text-xl font-bold text-on-surface">
            {formatEtb(holding.market_value_etb, { decimals: 2 })}
          </p>
          <p
            className={`text-sm font-semibold ${changeTone(holding.unrealised_gain_etb)}`}
          >
            {holding.unrealised_gain_etb >= 0 ? '+' : ''}
            {formatEtb(holding.unrealised_gain_etb, { decimals: 2 })} (
            {holding.unrealised_gain_percentage >= 0 ? '+' : ''}
            {formatPercentage(holding.unrealised_gain_percentage)})
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-outline-variant/20 pt-4">
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          <Stat
            label="Mark price"
            value={formatEtb(holding.price_per_share_etb, { decimals: 2 })}
          />
          <Stat
            label="Issue price"
            value={formatEtb(holding.nominal_price_per_share_etb, { decimals: 2 })}
          />
          <Stat label="Tradable" value={formatShares(holding.tradable_shares)} />
          {locked && (
            <Stat
              label="Vesting"
              tone="text-secondary"
              value={`${formatShares(holding.vesting_locked_shares)} until ${formatDate(
                holding.vesting_unlock_at,
              )}`}
            />
          )}
        </dl>

        <Link
          className="h-10 shrink-0 rounded-xl border border-primary px-6 text-sm font-bold leading-10 text-primary transition-colors hover:bg-primary hover:text-on-primary"
          to={`/marketplace/assets/${holding.sub_fund_id}`}
        >
          Trade
        </Link>
      </div>
    </article>
  )
}

function Stat({ label, value, tone = 'text-on-surface' }) {
  return (
    <div>
      <dt className="text-xs text-outline">{label}</dt>
      <dd className={`text-sm font-bold ${tone}`}>{value}</dd>
    </div>
  )
}
