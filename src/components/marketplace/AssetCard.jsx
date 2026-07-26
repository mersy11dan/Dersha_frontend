import { Link } from 'react-router-dom'
import { categoryImage } from './constants'
import {
  categoryIcon,
  categoryLabel,
  changeTone,
  formatChange,
  formatEtb,
  formatShares,
} from '../../lib/format'

export default function AssetCard({ asset }) {
  const isOffering = asset.sub_fund_status === 'PRIMARY_CROWDFUNDING'

  return (
    <article className="market-card group flex flex-col">
      <div className="relative h-48 w-full overflow-hidden bg-surface-container-high">
        <img
          alt={`${categoryLabel(asset.category)} asset in ${asset.location}`}
          className="h-full w-full object-cover"
          loading="lazy"
          src={categoryImage(asset.category)}
        />
        {isOffering && (
          <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-on-primary">
            Primary offering
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary">
          {categoryLabel(asset.category)}
        </p>

        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="mb-1 truncate text-xl font-semibold text-on-surface">
              {asset.asset_name}
            </h3>
            <p className="flex items-center gap-1 truncate text-sm text-on-surface-variant">
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                {categoryIcon(asset.category)}
              </span>
              {asset.location}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-outline">Per share</p>
            <p className="text-lg font-bold text-primary">
              {formatEtb(asset.price_per_share_etb, { decimals: 2 })}
            </p>
          </div>
        </div>

        <dl className="mb-5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-outline">Best bid</dt>
            <dd className="font-semibold text-on-surface">
              {asset.best_bid_etb ? formatEtb(asset.best_bid_etb, { decimals: 2 }) : 'No bids'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-outline">Best ask</dt>
            <dd className="font-semibold text-on-surface">
              {asset.best_ask_etb ? formatEtb(asset.best_ask_etb, { decimals: 2 }) : 'No asks'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-outline">24h volume</dt>
            <dd className="font-semibold text-on-surface">
              {formatEtb(asset.volume_24h_etb)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-outline">
              {isOffering ? 'Unsold shares' : 'Issued shares'}
            </dt>
            <dd className="font-semibold text-on-surface">
              {formatShares(
                isOffering ? asset.offering_shares_remaining : asset.total_issued_shares,
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between border-t border-outline-variant/30 pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-outline">
              24h change
            </p>
            <p className={`text-sm font-bold ${changeTone(asset.price_change_24h_percentage)}`}>
              {asset.price_change_24h_percentage === null
                ? 'Newly listed'
                : formatChange(asset.price_change_24h_percentage)}
            </p>
          </div>
          <Link
            className="rounded-xl bg-primary-container px-6 py-2.5 text-sm font-bold text-on-primary-container transition-colors group-hover:bg-primary group-hover:text-on-primary"
            to={`/marketplace/assets/${asset.sub_fund_id}`}
          >
            Trade
          </Link>
        </div>
      </div>
    </article>
  )
}
