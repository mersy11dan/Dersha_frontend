import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmTransferModal from './ConfirmTransferModal'
import FormAlert, { FieldError } from '../common/FormAlert'
import { useWallet, formatEtb } from '../../hooks/useWallet'
import { useAuth } from '../../context/AuthContext'
import { walletService } from '../../lib/services'

const DEPOSIT_CHANNELS = [
  { code: 'TELEBIRR', label: 'Telebirr Wallet', icon: 'smartphone' },
  { code: 'CBE_BIRR', label: 'CBE Birr Wallet', icon: 'smartphone' },
  { code: 'CBE_DIRECT', label: 'Commercial Bank of Ethiopia', icon: 'account_balance' },
  { code: 'AWASH_DIRECT', label: 'Awash Bank', icon: 'account_balance' },
]

const WITHDRAW_BANKS = [
  { code: 'CBEETET', label: 'Commercial Bank of Ethiopia' },
  { code: 'AWABETET', label: 'Awash Bank' },
  { code: 'DASBETET', label: 'Dashen Bank' },
  { code: 'WGBETET', label: 'Wegagen Bank' },
  { code: 'BOAETET', label: 'Bank of Abyssinia' },
]

const STATUS_TONE = {
  SETTLED: 'primary',
  PROCESSING: 'secondary',
  ESCROWED: 'secondary',
  PENDING_BANK_VERIFICATION: 'secondary',
  FAILED: 'error',
}

const MINIMUMS = { deposit: 10, withdraw: 100 }

function FundingOverview({ balance, loading }) {
  const available = balance?.available_balance_etb ?? 0
  const escrowed = balance?.escrowed_balance_etb ?? 0
  const total = available + escrowed
  const pct = (value) => (total > 0 ? `${Math.round((value / total) * 100)}%` : '0%')

  return (
    <div className="wallet-panel h-full p-6">
      <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-outline">
        Funding Overview
      </h3>
      {loading ? (
        <div className="space-y-4" aria-busy="true">
          <div className="h-4 w-2/3 animate-pulse rounded bg-outline-variant/20" />
          <div className="h-2 w-full animate-pulse rounded-full bg-outline-variant/20" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-outline-variant/20" />
          <div className="h-2 w-full animate-pulse rounded-full bg-outline-variant/20" />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex justify-between">
              <span className="text-sm text-on-surface">Available Balance</span>
              <span className="text-sm font-bold text-primary">{formatEtb(available)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-outline-variant/20">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: pct(available) }} />
            </div>
          </div>
          <div>
            <div className="mb-2 flex justify-between">
              <span className="text-sm text-on-surface">Escrowed Amount</span>
              <span className="text-sm font-bold text-secondary">{formatEtb(escrowed)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-outline-variant/20">
              <div className="h-full rounded-full bg-secondary transition-all" style={{ width: pct(escrowed) }} />
            </div>
          </div>
          <div className="border-t border-outline-variant/10 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-outline">Total Portfolio Cash</p>
              <p className="text-xl font-semibold text-primary">{formatEtb(total)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SecurityStatus({ escrowed, verified }) {
  return (
    <div className="wallet-panel flex h-full flex-col p-6">
      <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-outline">
        Security &amp; Status
      </h3>
      <div className="flex-1 space-y-4">
        <div
          className={`flex items-center gap-3 rounded-xl border p-3 ${
            verified
              ? 'border-primary/10 bg-primary/5'
              : 'border-secondary/10 bg-secondary/5'
          }`}
        >
          <span
            className={`material-symbols-outlined ${verified ? 'text-primary' : 'text-secondary'}`}
            aria-hidden="true"
          >
            {verified ? 'verified' : 'pending'}
          </span>
          <div>
            <p className="text-xs font-bold text-on-surface">
              {verified ? 'Fayda Identity Verified' : 'Identity check outstanding'}
            </p>
            <p className="text-[11px] text-outline">
              {verified ? 'Full transfer limits active' : 'Transfers stay blocked until Fayda clears'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-secondary/10 bg-secondary/5 p-3">
          <span className="material-symbols-outlined text-secondary" aria-hidden="true">lock_clock</span>
          <div>
            <p className="text-xs font-bold text-on-surface">{formatEtb(escrowed)} in escrow</p>
            <p className="text-[11px] text-outline">Held against pending settlements</p>
          </div>
        </div>
      </div>
      <div className="mt-6 border-t border-outline-variant/10 pt-4">
        <p className="text-[11px] italic text-outline">
          Funds settle through the EthSwitch national payment network.
        </p>
      </div>
    </div>
  )
}

function RecentActivity({ transactions, loading }) {
  return (
    <div className="mt-section-gap">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="text-3xl font-semibold text-on-surface">Recent Funding Activity</h3>
      </div>
      <div className="wallet-glass-card overflow-hidden rounded-[24px]">
        {loading ? (
          <p className="px-8 py-10 text-sm text-outline">Loading your transaction history…</p>
        ) : transactions.length === 0 ? (
          <div className="px-8 py-14 text-center">
            <span className="material-symbols-outlined mb-3 text-[32px] text-outline-variant" aria-hidden="true">
              receipt_long
            </span>
            <p className="text-sm text-on-surface-variant">
              No transfers yet. Your first deposit will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/30">
                {['Date', 'Method', 'Amount', 'Status'].map((col) => (
                  <th
                    key={col}
                    className={`px-8 py-5 text-xs font-bold uppercase tracking-wider text-outline ${
                      col === 'Amount' ? 'text-right' : col === 'Status' ? 'text-center' : ''
                    }`}
                    scope="col"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {transactions.map((tx) => {
                const recorded = new Date(tx.recorded_at)
                const isCredit = !['WITHDRAWAL'].includes(tx.type)
                const tone = STATUS_TONE[tx.status] ?? 'secondary'

                return (
                  <tr key={tx.transaction_id} className="transition-colors hover:bg-white/40">
                    <td className="px-8 py-6">
                      <p className="text-sm text-on-surface">
                        {recorded.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-[11px] text-outline">
                        {recorded.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isCredit ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                          <span
                            className={`material-symbols-outlined text-sm ${isCredit ? 'text-primary' : 'text-secondary'}`}
                            aria-hidden="true"
                          >
                            {isCredit ? 'south_west' : 'north_east'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-on-surface">
                            {tx.type.replaceAll('_', ' ').toLowerCase()}
                          </p>
                          <p className="text-[11px] text-outline">{tx.payment_network}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-on-surface">
                      {isCredit ? '+ ' : '- '}
                      {formatEtb(tx.net_amount_etb)}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                          tone === 'primary'
                            ? 'bg-primary/10 text-primary'
                            : tone === 'error'
                              ? 'bg-error/10 text-error'
                              : 'bg-secondary-container/30 text-secondary'
                        }`}
                      >
                        {tx.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function WalletFundingView({ activeTab }) {
  const navigate = useNavigate()
  const isDeposit = activeTab === 'deposit'
  const { isVerified } = useAuth()
  const { balance, transactions, loading, error, reload, trackPending } = useWallet()

  const [amount, setAmount] = useState('')
  const [channel, setChannel] = useState(DEPOSIT_CHANNELS[0].code)
  const [bankCode, setBankCode] = useState(WITHDRAW_BANKS[0].code)
  const [accountNumber, setAccountNumber] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [notice, setNotice] = useState(null)

  const available = balance?.available_balance_etb ?? 0
  const numericAmount = Number(amount)

  const selectedLabel = useMemo(() => {
    if (isDeposit) {
      return DEPOSIT_CHANNELS.find((c) => c.code === channel)?.label ?? ''
    }
    return WITHDRAW_BANKS.find((b) => b.code === bankCode)?.label ?? ''
  }, [isDeposit, channel, bankCode])

  const handleTabChange = (tab) => {
    navigate(tab === 'deposit' ? '/wallet/deposit' : '/wallet/withdrawal')
  }

  const validate = () => {
    const errors = {}
    const minimum = isDeposit ? MINIMUMS.deposit : MINIMUMS.withdraw

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      errors.amount = 'Enter an amount greater than zero.'
    } else if (numericAmount < minimum) {
      errors.amount = `The minimum ${isDeposit ? 'deposit' : 'withdrawal'} is ${minimum} ETB.`
    } else if (!isDeposit && numericAmount > available) {
      errors.amount = `You only have ${formatEtb(available)} available.`
    }

    if (!isDeposit && accountNumber.replace(/\D/g, '').length < 10) {
      errors.accountNumber = 'Enter the full destination account number.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const openConfirm = () => {
    setFormError(null)
    setNotice(null)
    if (validate()) setShowConfirm(true)
  }

  const handleConfirm = async () => {
    if (submitting) return
    setSubmitting(true)
    setFormError(null)

    try {
      if (isDeposit) {
        await walletService.deposit({ amountEtb: numericAmount, channel })
        setNotice(
          'Deposit initiated. Authorise the payment in your wallet app; your balance updates automatically once the network settles it.',
        )
      } else {
        await walletService.withdraw({
          amountEtb: numericAmount,
          bankCode,
          accountNumber: accountNumber.replace(/\s/g, ''),
        })
        setNotice(
          'Withdrawal submitted. The amount is held in escrow until your bank confirms the transfer.',
        )
      }

      setShowConfirm(false)
      setAmount('')
      await reload({ quiet: true })
      trackPending()
    } catch (err) {
      setShowConfirm(false)
      const mapped = err.fieldErrors ?? {}
      setFieldErrors({
        amount: mapped.amount_etb,
        accountNumber: mapped.destination_account_number,
      })
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-container-max flex-1 p-10">
      <div className="mb-10">
        <h2 className="text-3xl font-semibold text-on-surface">Wallet &amp; Funding</h2>
        <p className="mt-2 text-lg text-on-surface-variant">
          Manage your liquidity and institutional capital transfers.
        </p>
      </div>

      {(error || notice) && (
        <div className="mb-8">
          <FormAlert tone={error ? 'error' : 'success'} message={error ?? notice} />
        </div>
      )}

      <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <FundingOverview balance={balance} loading={loading} />
        </div>

        <div className="lg:col-span-4">
          <div className="wallet-panel h-full p-6">
            <div className="relative mb-6 flex items-center justify-between border-b border-outline-variant/10 pb-2">
              <div className="flex gap-6" role="tablist" aria-label="Transfer type">
                {['deposit', 'withdraw'].map((tab) => (
                  <button
                    key={tab}
                    aria-selected={activeTab === tab}
                    className={`relative pb-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === tab ? 'text-primary' : 'text-outline hover:text-on-surface-variant'
                    }`}
                    id={`${tab}-tab`}
                    onClick={() => handleTabChange(tab)}
                    role="tab"
                    type="button"
                  >
                    {tab === 'deposit' ? 'Deposit' : 'Withdraw'}
                    <div
                      className="absolute bottom-[-9px] left-0 h-0.5 bg-primary transition-all"
                      style={{ width: activeTab === tab ? '100%' : '0' }}
                    />
                  </button>
                ))}
              </div>
              <span className="material-symbols-outlined text-sm text-outline" aria-hidden="true">
                swap_vert
              </span>
            </div>

            {formError && (
              <div className="mb-4">
                <FormAlert tone="error" message={formError} />
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                openConfirm()
              }}
              noValidate
            >
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase text-outline" htmlFor="transfer-source">
                  {isDeposit ? 'Payment Channel' : 'Destination Bank'}
                </label>
                <div className="relative">
                  <select
                    className="wallet-input appearance-none pr-10"
                    id="transfer-source"
                    value={isDeposit ? channel : bankCode}
                    onChange={(e) =>
                      isDeposit ? setChannel(e.target.value) : setBankCode(e.target.value)
                    }
                  >
                    {(isDeposit ? DEPOSIT_CHANNELS : WITHDRAW_BANKS).map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-outline" aria-hidden="true">
                    <span className="material-symbols-outlined">expand_more</span>
                  </span>
                </div>
              </div>

              {!isDeposit && (
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase text-outline" htmlFor="destination-account">
                    Destination Account Number
                  </label>
                  <input
                    className="wallet-input wallet-input-plain"
                    id="destination-account"
                    inputMode="numeric"
                    placeholder="1000123456789"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                  <FieldError message={fieldErrors.accountNumber} />
                </div>
              )}

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase text-outline" htmlFor="transfer-amount">
                  {isDeposit ? 'Amount (ETB)' : 'Amount to Withdraw (ETB)'}
                </label>
                <input
                  className="wallet-input wallet-input-plain text-xl font-semibold"
                  id="transfer-amount"
                  inputMode="decimal"
                  min={isDeposit ? MINIMUMS.deposit : MINIMUMS.withdraw}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, amount: undefined }))
                  }}
                />
                <FieldError message={fieldErrors.amount} />
                {!isDeposit && (
                  <p className="mt-2 text-[11px] text-outline">
                    Available to withdraw: {formatEtb(available)}
                  </p>
                )}
              </div>

              <button className="wallet-btn-primary mt-2" disabled={submitting} type="submit">
                {isDeposit ? 'Initiate Transfer' : 'Initiate Withdrawal'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-4">
          <SecurityStatus escrowed={balance?.escrowed_balance_etb ?? 0} verified={isVerified} />
        </div>
      </div>

      <RecentActivity transactions={transactions} loading={loading} />

      {showConfirm && (
        <ConfirmTransferModal
          account={selectedLabel}
          amount={numericAmount}
          submitting={submitting}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
          type={isDeposit ? 'deposit' : 'withdraw'}
        />
      )}
    </div>
  )
}
