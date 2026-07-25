import { useEffect, useRef } from 'react'

export default function ConfirmTransferModal({ type, account, amount, onClose, onConfirm }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const isDeposit = type === 'deposit'

  useEffect(() => {
    closeRef.current?.focus()
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const formattedAmount = `${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`

  return (
    <div
      aria-labelledby="confirm-modal-title"
      aria-modal="true"
      className="wallet-modal-overlay"
      onClick={onClose}
      role="dialog"
    >
      <div
        ref={dialogRef}
        className="wallet-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/10 px-8 py-6">
          <h3 className="text-xl font-semibold text-on-surface" id="confirm-modal-title">
            {isDeposit ? 'Confirm Deposit' : 'Confirm Withdrawal'}
          </h3>
          <button
            ref={closeRef}
            aria-label="Close dialog"
            className="rounded-full p-2 transition-colors hover:bg-surface-container-high"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="space-y-6 p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-outline">
                {isDeposit ? 'Source Account' : 'Destination Account'}
              </span>
              <span className="text-sm font-bold text-on-surface">{account}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-outline">Amount</span>
              <span className="text-sm font-bold text-on-surface">{formattedAmount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-outline">Fee</span>
              <span className="text-sm font-bold text-primary">0.00 ETB</span>
            </div>
            <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4">
              <span className="text-sm font-bold text-on-surface">
                {isDeposit ? 'Total Credit' : 'Total Debit'}
              </span>
              <span className="text-xl font-semibold text-primary">{formattedAmount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-outline">Est. Arrival</span>
              <span className="text-xs font-bold text-secondary">
                {isDeposit ? 'Instant' : '15-30 Minutes'}
              </span>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
            <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">
              shield
            </span>
            <p className="text-[12px] leading-relaxed text-on-surface-variant">
              {isDeposit
                ? 'Deposits are processed securely via institutional gateways. Please ensure your source account details are correct.'
                : 'Withdrawals are processed securely via institutional gateways. Please ensure your destination details are correct.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button className="wallet-btn-primary" onClick={onConfirm} type="button">
              {isDeposit ? 'Confirm & Deposit' : 'Confirm & Withdraw'}
            </button>
            <button className="wallet-btn-ghost" onClick={onClose} type="button">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
