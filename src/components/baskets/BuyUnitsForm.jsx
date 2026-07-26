import { useState } from 'react'
import FormAlert from '../common/FormAlert'
import { basketService } from '../../lib/services'
import { formatEtb, formatShares } from '../../lib/format'

/** One open offer, with an inline buy control sized to what the buyer can afford. */
export default function BuyUnitsForm({ listing, navPerUnit, cashAvailable, onDone }) {
  const wholeOnly = listing.sale_mode === 'WHOLE_BASKET_ONLY'
  const [units, setUnits] = useState(
    wholeOnly ? String(listing.basket_shares_remaining) : '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const unitsNumber = wholeOnly ? listing.basket_shares_remaining : Number(units) || 0
  const cost = unitsNumber * listing.price_per_unit_etb
  const affordable = cost <= cashAvailable
  const premium =
    navPerUnit > 0 ? ((listing.price_per_unit_etb - navPerUnit) / navPerUnit) * 100 : 0

  const canSubmit =
    unitsNumber > 0 &&
    unitsNumber <= listing.basket_shares_remaining &&
    affordable &&
    !submitting

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await basketService.buy({ listingId: listing.listing_id, shares: unitsNumber })
      onDone(
        `Bought ${formatShares(unitsNumber)} units for ${formatEtb(cost, { decimals: 2 })}.`,
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="wallet-panel p-5" onSubmit={handleSubmit}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-on-surface">
            {formatShares(listing.basket_shares_remaining)} units available
          </p>
          <p className="text-sm text-on-surface-variant">
            {wholeOnly ? 'Whole offer only' : 'Buy any amount'} ·{' '}
            <span className={premium >= 0 ? 'text-error' : 'text-primary'}>
              {premium >= 0 ? '+' : ''}
              {premium.toFixed(2)}% vs NAV
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-outline">Price per unit</p>
          <p className="text-lg font-bold text-on-surface">
            {formatEtb(listing.price_per_unit_etb, { decimals: 2 })}
          </p>
        </div>
      </div>

      {error && <FormAlert className="mb-4" message={error} />}

      <div className="flex flex-wrap items-end gap-3">
        {!wholeOnly && (
          <label className="min-w-[8rem] flex-1">
            <span className="mb-1.5 block text-xs text-outline">Units</span>
            <input
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              inputMode="decimal"
              onChange={(event) => setUnits(event.target.value)}
              placeholder="0"
              value={units}
            />
          </label>
        )}

        <div className="min-w-[8rem] flex-1">
          <p className="mb-1.5 text-xs text-outline">Total cost</p>
          <p className="py-2.5 text-lg font-bold text-on-surface">
            {formatEtb(cost, { decimals: 2 })}
          </p>
        </div>

        <button
          className="h-11 shrink-0 rounded-xl bg-primary px-6 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canSubmit}
          type="submit"
        >
          {submitting ? 'Buying…' : 'Buy units'}
        </button>
      </div>

      <p className="mt-3 text-xs text-outline">
        {!affordable && unitsNumber > 0
          ? `Short by ${formatEtb(cost - cashAvailable, { decimals: 2 })}. Top up your wallet first.`
          : `${formatEtb(cashAvailable, { decimals: 2 })} available. The creator's royalty is deducted from the seller's proceeds, not added to your price.`}
      </p>
    </form>
  )
}
