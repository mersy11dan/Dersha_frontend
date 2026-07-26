import { useMemo, useState } from 'react'
import FormAlert, { FieldError } from '../common/FormAlert'
import { basketService } from '../../lib/services'
import {
  categoryLabel,
  formatEtb,
  formatPercentage,
  formatShares,
} from '../../lib/format'

const MIN_CONSTITUENTS = 2
const MAX_CONSTITUENTS = 20

/**
 * Assembles a basket out of shares the investor already holds. Allocated shares
 * move into the custody pool on mint, so the builder only ever offers what is
 * tradable right now.
 */
export default function BasketBuilder({ holdings, onClose, onMinted }) {
  const [name, setName] = useState('')
  const [totalShares, setTotalShares] = useState('100')
  const [allocations, setAllocations] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const eligible = useMemo(
    () => holdings.filter((holding) => holding.tradable_shares > 0),
    [holdings],
  )

  const selected = useMemo(
    () =>
      eligible
        .map((holding) => ({
          holding,
          shares: Number(allocations[holding.sub_fund_id] ?? 0),
        }))
        .filter((entry) => entry.shares > 0),
    [eligible, allocations],
  )

  const navTotal = selected.reduce(
    (sum, entry) => sum + entry.shares * entry.holding.price_per_share_etb,
    0,
  )
  const supply = Number(totalShares) || 0
  const navPerUnit = supply > 0 ? navTotal / supply : 0

  const overAllocated = selected.some(
    (entry) => entry.shares > entry.holding.tradable_shares,
  )
  const canSubmit =
    name.trim().length >= 3 &&
    selected.length >= MIN_CONSTITUENTS &&
    selected.length <= MAX_CONSTITUENTS &&
    supply > 0 &&
    !overAllocated &&
    !submitting

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)

    try {
      const basket = await basketService.create({
        name: name.trim(),
        totalBasketShares: supply,
        constituents: selected.map((entry) => ({
          sub_fund_id: entry.holding.sub_fund_id,
          shares_allocated: entry.shares,
        })),
      })
      onMinted(basket)
    } catch (requestError) {
      setError(requestError.message)
      setFieldErrors(requestError.fieldErrors ?? {})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      aria-labelledby="basket-builder-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
    >
      <form
        className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-surface-container-lowest sm:rounded-3xl"
        onSubmit={handleSubmit}
      >
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/20 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-on-surface" id="basket-builder-title">
              Build a basket
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Pool shares you already own into one tradable instrument. You earn a 0.5%
              royalty every time a unit of it changes hands.
            </p>
          </div>
          <button
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && <FormAlert className="mb-5" message={error} />}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-on-surface-variant">
                Basket name
              </span>
              <input
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                onChange={(event) => setName(event.target.value)}
                placeholder="Addis Growth Mix"
                value={name}
              />
              <FieldError message={fieldErrors.basket_name} />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-on-surface-variant">
                Units to issue
              </span>
              <input
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                inputMode="numeric"
                onChange={(event) => setTotalShares(event.target.value)}
                value={totalShares}
              />
              <FieldError message={fieldErrors.total_basket_shares} />
              <span className="ml-1 mt-1 block text-xs text-outline">
                More units means a cheaper entry price per unit.
              </span>
            </label>
          </div>

          <h3 className="mb-3 text-sm font-semibold text-on-surface">
            Choose constituents
            <span className="ml-2 font-normal text-outline">
              {selected.length} of {MAX_CONSTITUENTS} selected, at least{' '}
              {MIN_CONSTITUENTS} required
            </span>
          </h3>

          {eligible.length === 0 ? (
            <p className="rounded-xl border border-outline-variant/30 px-4 py-6 text-center text-sm text-on-surface-variant">
              You have no tradable shares to allocate. Buy an asset first, or wait for a
              vesting lock to release.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {eligible.map((holding) => {
                const value = allocations[holding.sub_fund_id] ?? ''
                const shares = Number(value) || 0
                const tooMany = shares > holding.tradable_shares

                return (
                  <li
                    key={holding.sub_fund_id}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                      shares > 0
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-outline-variant/30'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-on-surface">
                        {holding.asset_name}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {categoryLabel(holding.category)} ·{' '}
                        {formatShares(holding.tradable_shares)} tradable ·{' '}
                        {formatEtb(holding.price_per_share_etb, { decimals: 2 })}/share
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        aria-label={`Shares of ${holding.asset_name} to allocate`}
                        className={`w-24 rounded-lg border px-3 py-2 text-right text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                          tooMany ? 'border-error' : 'border-outline-variant/40'
                        }`}
                        inputMode="decimal"
                        onChange={(event) =>
                          setAllocations((current) => ({
                            ...current,
                            [holding.sub_fund_id]: event.target.value,
                          }))
                        }
                        placeholder="0"
                        value={value}
                      />
                      <button
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:underline"
                        onClick={() =>
                          setAllocations((current) => ({
                            ...current,
                            [holding.sub_fund_id]: String(holding.tradable_shares),
                          }))
                        }
                        type="button"
                      >
                        Max
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {selected.length > 0 && (
            <div className="mt-6 rounded-2xl bg-surface-container-low p-5">
              <h3 className="mb-4 text-sm font-semibold text-on-surface">
                Resulting basket
              </h3>
              <dl className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Stat label="Basket NAV" value={formatEtb(navTotal, { decimals: 2 })} />
                <Stat label="Units issued" value={formatShares(supply)} />
                <Stat
                  label="NAV per unit"
                  tone="text-primary"
                  value={formatEtb(navPerUnit, { decimals: 2 })}
                />
              </dl>
              <ul className="flex flex-col gap-1.5">
                {selected.map((entry) => {
                  const value = entry.shares * entry.holding.price_per_share_etb
                  return (
                    <li
                      key={entry.holding.sub_fund_id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="truncate text-on-surface-variant">
                        {entry.holding.asset_name}
                      </span>
                      <span className="shrink-0 font-semibold text-on-surface">
                        {formatPercentage(navTotal > 0 ? (value / navTotal) * 100 : 0, 1)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/20 px-6 py-4">
          <p className="text-xs text-on-surface-variant">
            {overAllocated
              ? 'One allocation exceeds the shares you hold.'
              : 'Allocated shares are locked in custody until the basket is dissolved.'}
          </p>
          <div className="flex gap-3">
            <button
              className="rounded-xl border border-outline-variant/40 px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canSubmit}
              type="submit"
            >
              {submitting ? 'Minting…' : 'Mint basket'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  )
}

function Stat({ label, value, tone = 'text-on-surface' }) {
  return (
    <div>
      <dt className="text-xs text-outline">{label}</dt>
      <dd className={`text-lg font-bold ${tone}`}>{value}</dd>
    </div>
  )
}
