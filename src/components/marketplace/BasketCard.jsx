import { Link } from 'react-router-dom'
import { formatEtb, formatShares } from '../../lib/format'

export default function BasketCard({ listing }) {
  const premium = listing.premium_to_nav_percentage
  const isDiscount = premium <= 0

  return (
    <article className="group glass-card rounded-[26px] sm:rounded-[30px] p-3.5 sm:p-5 flex flex-col h-[460px] sm:h-[500px] hover:-translate-y-2 hover:border-primary-fixed/50 hover:shadow-[0_12px_30px_rgba(213,251,69,0.15)] transition-all duration-300 justify-between">
      <div>
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 mb-2 bg-primary-fixed/10 text-primary-fixed border border-primary-fixed/20 px-2.5 sm:px-3 py-1 rounded-full font-label-sm text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[13px]">shopping_basket</span>
            <span>{listing.sale_mode === 'WHOLE_BASKET_ONLY' ? 'Whole Basket' : 'Fractional Pool'}</span>
          </span>
          <h3 className="truncate font-title-md text-[14px] sm:text-[18px] font-extrabold text-white group-hover:text-primary-fixed transition-colors">
            {listing.basket_name}
          </h3>
          <p className="flex items-center gap-1 truncate font-body-md text-[11px] sm:text-[12px] text-white/60 mt-1">
            <span className="material-symbols-outlined text-[13px] text-primary-fixed shrink-0">view_cozy</span>
            <span className="truncate">{listing.constituent_count} sub-funds · {listing.seller_name}</span>
          </p>
        </div>

        <dl className="my-3 grid grid-cols-2 gap-2.5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 p-3 sm:p-4 font-body-md">
          <div>
            <dt className="font-label-sm text-[8px] sm:text-[9px] text-white/50 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px] text-primary-fixed">payments</span>
              PRICE / UNIT
            </dt>
            <dd className="font-title-md text-[12px] sm:text-[14px] text-white font-extrabold mt-0.5 truncate">
              {formatEtb(listing.price_per_unit_etb, { decimals: 0 })}
            </dd>
          </div>
          <div>
            <dt className="font-label-sm text-[8px] sm:text-[9px] text-white/50 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px] text-sky-400">account_balance</span>
              NAV / UNIT
            </dt>
            <dd className="font-title-md text-[11px] sm:text-[13px] text-white font-medium mt-0.5 truncate">
              {formatEtb(listing.nav_per_basket_share_etb, { decimals: 0 })}
            </dd>
          </div>
          <div>
            <dt className="font-label-sm text-[8px] sm:text-[9px] text-white/50 uppercase tracking-wider">AVAILABLE</dt>
            <dd className="font-title-md text-[10px] sm:text-[12px] text-white/80 font-medium mt-0.5 truncate">
              {formatShares(listing.basket_shares_remaining)}
            </dd>
          </div>
          <div>
            <dt className="font-label-sm text-[8px] sm:text-[9px] text-white/50 uppercase tracking-wider">ROYALTY</dt>
            <dd className="font-title-md text-[10px] sm:text-[12px] text-white/80 font-medium mt-0.5 truncate">
              {listing.creator_royalty_percentage}%
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-2.5 gap-2">
        <div className="min-w-0">
          <p className="font-label-sm text-[8px] sm:text-[9px] text-white/50 uppercase tracking-wider truncate flex items-center gap-1">
            <span className="material-symbols-outlined text-[10px]">analytics</span>
            {isDiscount ? 'Discount' : 'Premium'}
          </p>
          <p className={`font-title-md text-[11px] sm:text-[13px] font-bold truncate ${isDiscount ? 'text-primary-fixed' : 'text-[#FF3B30]'}`}>
            {premium > 0 ? '+' : ''}
            {Number(premium).toFixed(2)}%
          </p>
        </div>
        <Link
          className="px-3 sm:px-4 py-2 bg-primary-fixed text-on-primary rounded-xl font-title-md text-[11px] sm:text-[12px] font-extrabold shadow-[0_0_12px_rgba(213,251,69,0.3)] hover:brightness-110 transition-all flex items-center gap-1 shrink-0"
          to={`/custom-baskets/${listing.basket_id}`}
        >
          <span>VIEW</span>
          <span className="material-symbols-outlined text-[13px] sm:text-[15px] leading-none">arrow_forward</span>
        </Link>
      </div>
    </article>
  )
}
