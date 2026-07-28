import { Link } from 'react-router-dom'
import { categoryImage } from './constants'
import {
  categoryIcon,
  categoryLabel,
  formatChange,
  formatEtb,
  formatShares,
} from '../../lib/format'

export default function AssetCard({ asset }) {
  const isOffering = asset.sub_fund_status === 'PRIMARY_CROWDFUNDING'
  const isPositive = (asset.price_change_24h_percentage ?? 0) >= 0

  return (
    <article className="group glass-card rounded-[26px] sm:rounded-[30px] overflow-hidden flex flex-col h-[490px] sm:h-[540px] hover:-translate-y-2 hover:border-primary-fixed/50 hover:shadow-[0_15px_35px_rgba(213,251,69,0.15)] transition-all duration-300 w-full min-w-0">
      {/* Taller Image Preview for Laptop View */}
      <div className="relative h-52 sm:h-64 w-full overflow-hidden bg-black/40 shrink-0">
        <img
          alt={`${categoryLabel(asset.category)} asset in ${asset.location}`}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          loading="lazy"
          src={categoryImage(asset.category)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f0f] via-transparent to-black/40" />

        {/* Status Pill */}
        <div className="absolute left-2.5 sm:left-3.5 top-2.5 sm:top-3.5 flex items-center gap-1.5 z-10">
          {isOffering ? (
            <span className="bg-black/85 text-primary-fixed border border-primary-fixed/50 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full font-label-sm text-[8px] sm:text-[9px] font-extrabold tracking-wider flex items-center gap-1 shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-fixed animate-pulse shrink-0" />
              OFFERING
            </span>
          ) : (
            <span className="bg-black/85 text-primary-fixed border border-primary-fixed/40 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full font-label-sm text-[8px] sm:text-[9px] font-extrabold tracking-wider flex items-center gap-1 shadow-lg">
              <span className="material-symbols-outlined text-[11px] text-primary-fixed">verified</span>
              TRADING
            </span>
          )}
        </div>

        {/* Sector Pill */}
        <div className="absolute right-2.5 sm:right-3.5 top-2.5 sm:top-3.5 z-10">
          <span className="bg-black/70 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full font-label-sm text-[8px] sm:text-[9px] text-white/90 border border-white/20 tracking-wider flex items-center gap-1 shadow-md">
            <span aria-hidden="true" className="material-symbols-outlined text-[12px] text-primary-fixed">
              {categoryIcon(asset.category)}
            </span>
            <span className="truncate">{categoryLabel(asset.category)}</span>
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-5 justify-between min-w-0">
        <div>
          <h3 className="truncate font-title-md text-[14px] sm:text-[17px] font-extrabold text-white group-hover:text-primary-fixed transition-colors">
            {asset.asset_name}
          </h3>
          <p className="flex items-center gap-1 truncate font-body-md text-[11px] sm:text-[12px] text-slate-300 mt-1 font-medium">
            <span aria-hidden="true" className="material-symbols-outlined text-[13px] sm:text-[15px] text-primary-fixed shrink-0">
              location_on
            </span>
            <span className="truncate">{asset.location}</span>
          </p>
        </div>

        {/* Spacious Telemetry Block */}
        <dl className="grid grid-cols-2 gap-2 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 p-2.5 sm:p-3.5 font-body-md my-2">
          <div className="min-w-0">
            <dt className="font-label-sm text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1 truncate font-bold">
              <span className="material-symbols-outlined text-[10px] text-primary-fixed shrink-0">payments</span>
              PRICE
            </dt>
            <dd className="font-title-md text-[12px] sm:text-[14px] text-primary-fixed font-black mt-0.5 truncate">
              {formatEtb(asset.price_per_share_etb, { decimals: 0 })}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-label-sm text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1 truncate font-bold">
              <span className="material-symbols-outlined text-[10px] text-sky-400 shrink-0">monitoring</span>
              VOLUME
            </dt>
            <dd className="font-title-md text-[11px] sm:text-[13px] text-sky-300 font-bold mt-0.5 truncate">
              {formatEtb(asset.volume_24h_etb)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-label-sm text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider truncate font-bold">BID</dt>
            <dd className="font-title-md text-[10px] sm:text-[12px] text-amber-300 font-bold mt-0.5 truncate">
              {asset.best_bid_etb ? formatEtb(asset.best_bid_etb, { decimals: 0 }) : '—'}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-label-sm text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider truncate font-bold">
              {isOffering ? 'REMAINING' : 'SHARES'}
            </dt>
            <dd className="font-title-md text-[10px] sm:text-[12px] text-slate-200 font-bold mt-0.5 truncate">
              {formatShares(
                isOffering ? asset.offering_shares_remaining : asset.total_issued_shares,
              )}
            </dd>
          </div>
        </dl>

        <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-1.5 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="font-label-sm text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider truncate flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-[10px] shrink-0 text-emerald-400">show_chart</span>
              24H RETURN
            </p>
            <p className={`font-title-md text-[11px] sm:text-[13px] font-black truncate ${isPositive ? 'text-primary-fixed' : 'text-[#FF3B30]'}`}>
              {asset.price_change_24h_percentage === null
                ? 'NEW'
                : `${isPositive ? '+' : ''}${formatChange(asset.price_change_24h_percentage)}`}
            </p>
          </div>

          <Link
            className="px-3 sm:px-4 py-2 bg-primary-fixed text-on-primary rounded-xl font-title-md text-[11px] sm:text-[12px] font-black shadow-[0_0_15px_rgba(213,251,69,0.35)] hover:brightness-110 transition-all flex items-center gap-1 shrink-0"
            to={`/marketplace/assets/${asset.sub_fund_id}`}
          >
            <span>TRADE</span>
            <span className="material-symbols-outlined text-[13px] sm:text-[15px] leading-none">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
