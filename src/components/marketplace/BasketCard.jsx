import { Link } from 'react-router-dom'
import { changeTone, formatEtb, formatShares } from '../../lib/format'

/**
 * A basket listing on the hybrid market. The premium to NAV is the headline
 * number: it says whether the seller is asking above or below what the
 * underlying assets are currently worth.
 */
export default function BasketCard({ listing }) {
  const premium = listing.premium_to_nav_percentage
  const isDiscount = premium <= 0

  return (
    <article className="market-card group flex flex-col p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-primary">
            {listing.sale_mode === 'WHOLE_BASKET_ONLY' ? 'Whole basket' : 'Fractional pool'}
          </p>
          <h3 className="mb-1 truncate text-xl font-semibold text-on-surface">
            {listing.basket_name}
          </h3>
          <p className="truncate text-sm text-on-surface-variant">
            {listing.constituent_count} underlying sub-funds · listed by {listing.seller_name}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-outline">Per unit</p>
          <p className="text-lg font-bold text-primary">
            {formatEtb(listing.price_per_unit_etb, { decimals: 2 })}
          </p>
        </div>
      </div>

      <dl className="mb-5 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-outline">NAV per unit</dt>
          <dd className="font-semibold text-on-surface">
            {formatEtb(listing.nav_per_basket_share_etb, { decimals: 2 })}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-outline">Available</dt>
          <dd className="font-semibold text-on-surface">
            {formatShares(listing.basket_shares_remaining)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-outline">Creator royalty</dt>
          <dd className="font-semibold text-on-surface">
            {listing.creator_royalty_percentage}%
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between border-t border-outline-variant/30 pt-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-outline">
            {isDiscount ? 'Discount to NAV' : 'Premium to NAV'}
          </p>
          <p className={`text-sm font-bold ${changeTone(-premium)}`}>
            {premium > 0 ? '+' : ''}
            {Number(premium).toFixed(2)}%
          </p>
        </div>
        <Link
          className="rounded-xl bg-primary-container px-6 py-2.5 text-sm font-bold text-on-primary-container transition-colors group-hover:bg-primary group-hover:text-on-primary"
          to={`/custom-baskets/${listing.basket_id}`}
        >
          View basket
        </Link>
      </div>
    </article>
  )
}
