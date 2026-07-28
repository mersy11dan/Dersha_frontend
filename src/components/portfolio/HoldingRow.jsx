import { Link } from 'react-router-dom'
import {
  categoryIcon,
  categoryLabel,
  formatEtb,
  formatPercentage,
  formatShares,
} from '../../lib/format'

export default function HoldingRow({ holding }) {
  const isPositive = (holding.unrealised_gain_etb ?? 0) >= 0

  return (
    <article className="group glass-card rounded-[24px] sm:rounded-[28px] p-3.5 sm:p-5 flex flex-col justify-between hover:border-primary-fixed/50 hover:shadow-[0_12px_30px_rgba(213,251,69,0.12)] transition-all duration-300 min-w-0">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary-fixed/15 border border-primary-fixed/30 flex items-center justify-center text-primary-fixed shrink-0 shadow-md">
            <span className="material-symbols-outlined text-[18px] sm:text-[22px]">
              {categoryIcon(holding.category)}
            </span>
          </div>
          <span className="bg-white/10 text-white/90 border border-white/15 px-2.5 py-0.5 rounded-full font-label-sm text-[8px] sm:text-[9px] font-bold uppercase truncate max-w-[120px]">
            {categoryLabel(holding.category)}
          </span>
        </div>

        <div className="mb-3">
          <h3 className="truncate font-title-md text-[14px] sm:text-[17px] font-extrabold text-white group-hover:text-primary-fixed transition-colors">
            {holding.asset_name}
          </h3>
          <p className="flex items-center gap-1 truncate font-body-md text-[11px] sm:text-[12px] text-slate-300 mt-0.5">
            <span className="material-symbols-outlined text-[13px] text-primary-fixed shrink-0">location_on</span>
            <span className="truncate">{holding.location || 'Ethiopia Main Exchange'}</span>
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 p-2.5 sm:p-3 font-body-md mb-3">
          <div className="min-w-0">
            <dt className="font-label-sm text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider truncate">HOLDINGS</dt>
            <dd className="font-title-md text-[12px] sm:text-[13px] text-white font-extrabold mt-0.5 truncate">
              {formatShares(holding.shares_owned)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-label-sm text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider truncate">SHARE OF FUND</dt>
            <dd className="font-title-md text-[11px] sm:text-[12px] text-sky-400 font-bold mt-0.5 truncate">
              {formatPercentage(holding.ownership_percentage, 2)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-1.5 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="font-label-sm text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider truncate">
            MARKET VALUE
          </p>
          <p className="font-display-lg text-[13px] sm:text-[16px] font-black text-white truncate">
            {formatEtb(holding.market_value_etb, { decimals: 0 })}
          </p>
          <p className={`font-title-md text-[10px] sm:text-[12px] font-bold truncate ${isPositive ? 'text-primary-fixed' : 'text-[#FF3B30]'}`}>
            {holding.unrealised_gain_etb >= 0 ? '+' : ''}
            {formatEtb(holding.unrealised_gain_etb, { decimals: 0 })} ({holding.unrealised_gain_percentage >= 0 ? '+' : ''}{formatPercentage(holding.unrealised_gain_percentage)})
          </p>
        </div>

        <Link
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-fixed text-on-primary rounded-xl font-title-md text-[11px] sm:text-[12px] font-black shadow-[0_0_12px_rgba(213,251,69,0.3)] hover:brightness-110 transition-all flex items-center gap-1 shrink-0"
          to={`/marketplace/assets/${holding.sub_fund_id}`}
        >
          <span>TRADE</span>
          <span className="material-symbols-outlined text-[13px] sm:text-[15px] leading-none">arrow_forward</span>
        </Link>
      </div>
    </article>
  )
}
