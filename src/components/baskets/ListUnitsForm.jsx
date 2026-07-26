import { useState } from 'react'
import FormAlert, { FieldError } from '../common/FormAlert'
import { basketService } from '../../lib/services'
import { formatEtb, formatShares } from '../../lib/format'

const SALE_MODES = [
  {
    id: 'FRACTIONAL_POOL',
    label: 'Fractional',
    hint: 'Buyers can take any slice of the units you offer.',
  },
  {
    id: 'WHOLE_BASKET_ONLY',
    label: 'All or nothing',
    hint: 'A buyer must take the entire offer in one trade.',
  },
]

/** Offers units the investor holds for sale, locking them until sold or withdrawn. */
export default function ListUnitsForm({ basketId, freeUnits, navPerUnit, onDone }) {
  const [saleMode, setSaleMode] = useState('FRACTIONAL_POOL')
  const [units, setUnits] = useState('')
  const [price, setPrice] = useState(navPerUnit ? navPerUnit.toFixed(2) : '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const unitsNumber = Number(units) || 0
  const priceNumber = Number(price) || 0
  const proceeds = unitsNumber * priceNumber
  const premium =
    navPerUnit > 0 && priceNumber > 0 ? ((priceNumber - navPerUnit) / navPerUnit) * 100 : 0

  const canSubmit =
    unitsNumber > 0 && unitsNumber <= freeUnits && priceNumber > 0 && !submitting

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)

    try {
      await basketService.list({
        basketId,
        saleMode,
        shares: unitsNumber,
        pricePerUnit: priceNumber,
      })
      setUnits('')
      onDone(`${formatShares(unitsNumber)} units listed at ${formatEtb(priceNumber, {
        decimals: 2,
      })} each.`)
    } catch (requestError) {
      setError(requestError.message)
      setFieldErrors(requestError.fieldErrors ?? {})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="wallet-panel p-6" onSubmit={handleSubmit}>
      <h2 className="mb-1 text-lg font-semibold text-on-surface">Sell units</h2>
      <p className="mb-5 text-sm text-on-surface-variant">
        {formatShares(freeUnits)} units free to list.
      </p>

      {error && <FormAlert className="mb-4" message={error} />}

      <div className="mb-4 flex rounded-xl bg-surface-container-low p-1" role="group">
        {SALE_MODES.map((mode) => (
          <button
            key={mode.id}
            aria-pressed={saleMode === mode.id}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              saleMode === mode.id
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
            onClick={() => setSaleMode(mode.id)}
            type="button"
          >
            {mode.label}
          </button>
        ))}
      </div>
      <p className="mb-4 text-xs text-outline">
        {SALE_MODES.find((mode) => mode.id === saleMode).hint}
      </p>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-sm font-medium text-on-surface-variant">
          Units to sell
        </span>
        <div className="relative">
          <input
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-2.5 pl-4 pr-16 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            inputMode="decimal"
            onChange={(event) => setUnits(event.target.value)}
            placeholder="0"
            value={units}
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-primary hover:underline"
            onClick={() => setUnits(String(freeUnits))}
            type="button"
          >
            Max
          </button>
        </div>
        <FieldError message={fieldErrors.total_basket_shares_listed} />
      </label>

      <label className="mb-5 block">
        <span className="mb-1.5 block text-sm font-medium text-on-surface-variant">
          Price per unit
        </span>
        <input
          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          inputMode="decimal"
          onChange={(event) => setPrice(event.target.value)}
          placeholder={navPerUnit ? navPerUnit.toFixed(2) : '0.00'}
          value={price}
        />
        <FieldError message={fieldErrors.price_per_unit_etb} />
        {priceNumber > 0 && navPerUnit > 0 && (
          <span
            className={`ml-1 mt-1 block text-xs ${
              premium >= 0 ? 'text-primary' : 'text-error'
            }`}
          >
            {premium >= 0 ? 'Premium' : 'Discount'} of {Math.abs(premium).toFixed(2)}% to NAV
          </span>
        )}
      </label>

      <dl className="mb-5 flex flex-col gap-2 rounded-xl bg-surface-container-low p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-on-surface-variant">Gross proceeds</dt>
          <dd className="font-bold text-on-surface">
            {formatEtb(proceeds, { decimals: 2 })}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-on-surface-variant">Units locked while listed</dt>
          <dd className="font-semibold text-on-surface">{formatShares(unitsNumber)}</dd>
        </div>
      </dl>

      <button
        className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!canSubmit}
        type="submit"
      >
        {submitting ? 'Listing…' : 'List units'}
      </button>
    </form>
  )
}
