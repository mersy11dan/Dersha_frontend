import { useEffect, useMemo, useState } from 'react'
import FormAlert, { FieldError } from '../common/FormAlert'
import { formatEtb, formatShares } from '../../lib/format'
import { ordersService, assetService } from '../../lib/services'

const DIRECTIONS = [
  { id: 'BUY', label: 'Buy' },
  { id: 'SELL', label: 'Sell' },
]

/**
 * Buy and sell ticket for one sub-fund.
 *
 * While an asset is still in its primary offering, buying means subscribing
 * from the crowdfunding pool at the fixed nominal price; only afterwards does
 * the order book apply. Presenting both as one control keeps the investor from
 * having to know which phase the asset is in.
 */
export default function TradeTicket({
  asset,
  holding,
  cashAvailable,
  suggestedPrice,
  suggestedDirection,
  onTraded,
}) {
  const isOffering = asset.sub_fund_status === 'PRIMARY_CROWDFUNDING'

  const [direction, setDirection] = useState('BUY')
  const [orderType, setOrderType] = useState('LIMIT')
  const [shares, setShares] = useState('')
  const [price, setPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (suggestedPrice) setPrice(String(suggestedPrice))
    if (suggestedDirection) setDirection(suggestedDirection)
  }, [suggestedPrice, suggestedDirection])

  const usePrimaryFlow = isOffering && direction === 'BUY'
  const effectivePrice = usePrimaryFlow
    ? asset.nominal_price_per_share_etb
    : Number(price || 0)

  const estimate = useMemo(
    () => Number(shares || 0) * effectivePrice,
    [shares, effectivePrice],
  )

  const tradableShares = holding?.tradable_shares ?? 0
  const maxBuyable =
    effectivePrice > 0 ? Math.floor((cashAvailable ?? 0) / effectivePrice) : 0

  function validate() {
    const errors = {}
    const shareCount = Number(shares)

    if (!shares || shareCount <= 0) {
      errors.shares = 'Enter how many shares you want to trade.'
    } else if (direction === 'SELL' && shareCount > tradableShares) {
      errors.shares = `You can sell at most ${formatShares(tradableShares)} shares.`
    } else if (direction === 'BUY' && estimate > (cashAvailable ?? 0)) {
      errors.shares = `That costs ${formatEtb(estimate, { decimals: 2 })}, more than your available balance.`
    }

    if (!usePrimaryFlow && (!price || Number(price) <= 0)) {
      errors.price = 'Set a price per share.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      if (usePrimaryFlow) {
        const result = await assetService.subscribe({
          subFundId: asset.sub_fund_id,
          shares: Number(shares),
        })
        setNotice(
          `Subscribed to ${formatShares(result.shares)} shares for ${formatEtb(
            result.total_cost_etb ?? estimate,
            { decimals: 2 },
          )}.`,
        )
      } else {
        const order = await ordersService.place({
          subFundId: asset.sub_fund_id,
          direction,
          orderType,
          shares: Number(shares),
          pricePerShare: Number(price),
        })

        setNotice(
          order.status === 'FILLED'
            ? `Filled ${formatShares(order.filled_shares)} shares.`
            : order.filled_shares > 0
              ? `Filled ${formatShares(order.filled_shares)} shares; ${formatShares(
                  order.remaining_shares,
                )} resting on the book.`
              : `Order placed for ${formatShares(order.remaining_shares)} shares.`,
        )
      }

      setShares('')
      onTraded?.()
    } catch (caught) {
      setError(caught)
      setFieldErrors(caught.fieldErrors ?? {})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="wallet-panel p-6" noValidate onSubmit={handleSubmit}>
      <h2 className="mb-5 text-lg font-semibold text-on-surface">
        {usePrimaryFlow ? 'Subscribe' : 'Place an order'}
      </h2>

      <div
        aria-label="Order direction"
        className="mb-5 flex rounded-xl bg-surface-container-low p-1"
        role="group"
      >
        {DIRECTIONS.map((option) => {
          const isActive = direction === option.id
          return (
            <button
              key={option.id}
              aria-pressed={isActive}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                isActive
                  ? option.id === 'BUY'
                    ? 'bg-primary text-on-primary'
                    : 'bg-error text-on-error'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setDirection(option.id)}
              type="button"
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {usePrimaryFlow && (
        <FormAlert
          className="mb-5"
          message={`This asset is still in its primary offering. Shares are sold from the crowdfunding pool at ${formatEtb(
            asset.nominal_price_per_share_etb,
            { decimals: 2 },
          )}, with ${formatShares(asset.offering_shares_remaining)} remaining.`}
          tone="info"
        />
      )}

      {!usePrimaryFlow && (
        <div className="mb-5">
          <span className="mb-2 block text-sm font-medium text-on-surface">Order type</span>
          <div className="flex gap-2">
            {['LIMIT', 'MARKET'].map((type) => (
              <button
                key={type}
                aria-pressed={orderType === type}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  orderType === type
                    ? 'border-primary bg-primary-container text-on-primary-container'
                    : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/50'
                }`}
                onClick={() => setOrderType(type)}
                type="button"
              >
                {type === 'LIMIT' ? 'Limit' : 'Market'}
              </button>
            ))}
          </div>
          {orderType === 'MARKET' && direction === 'SELL' && (
            <p className="mt-2 text-xs text-on-surface-variant">
              If nothing matches, the platform's liquidity buffer buys the remainder at a 12%
              discount to the mark.
            </p>
          )}
        </div>
      )}

      <label className="mb-4 block">
        <span className="mb-1.5 block text-sm font-medium text-on-surface">Shares</span>
        <input
          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          inputMode="decimal"
          min="0"
          onChange={(event) => setShares(event.target.value)}
          placeholder="0"
          step="any"
          type="number"
          value={shares}
        />
        <FieldError message={fieldErrors.shares} />
        <span className="mt-1.5 block text-xs text-outline">
          {direction === 'SELL'
            ? `You hold ${formatShares(tradableShares)} tradable shares`
            : `Your balance covers about ${formatShares(maxBuyable)} shares`}
        </span>
      </label>

      {!usePrimaryFlow && (
        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium text-on-surface">
            {orderType === 'MARKET' ? 'Limit guard (ETB)' : 'Price per share (ETB)'}
          </span>
          <input
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            inputMode="decimal"
            min="0"
            onChange={(event) => setPrice(event.target.value)}
            placeholder={String(asset.price_per_share_etb ?? '')}
            step="any"
            type="number"
            value={price}
          />
          <FieldError message={fieldErrors.price} />
        </label>
      )}

      <div className="mb-5 flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
        <span className="text-sm text-on-surface-variant">
          {direction === 'BUY' ? 'Maximum cost' : 'Estimated proceeds'}
        </span>
        <span className="text-lg font-bold text-on-surface">
          {formatEtb(estimate, { decimals: 2 })}
        </span>
      </div>

      {error && <FormAlert className="mb-4" message={error.message} tone="error" />}
      {notice && <FormAlert className="mb-4" message={notice} tone="success" />}

      <button
        className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
        disabled={submitting}
        type="submit"
      >
        {submitting
          ? 'Submitting…'
          : usePrimaryFlow
            ? 'Subscribe'
            : `${direction === 'BUY' ? 'Buy' : 'Sell'} ${asset.asset_name}`}
      </button>
    </form>
  )
}
