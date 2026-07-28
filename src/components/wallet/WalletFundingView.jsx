import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmTransferModal from './ConfirmTransferModal'
import FormAlert, { FieldError } from '../common/FormAlert'
import { useWallet, formatEtb } from '../../hooks/useWallet'
import { useAuth } from '../../context/AuthContext'
import { walletService } from '../../lib/services'

const DEPOSIT_CHANNELS = [
  { code: 'TELEBIRR', label: 'Telebirr Mobile Wallet', icon: 'smartphone' },
  { code: 'CBE_BIRR', label: 'CBE Birr Mobile Wallet', icon: 'smartphone' },
  { code: 'CBE_DIRECT', label: 'Commercial Bank of Ethiopia', icon: 'account_balance' },
  { code: 'AWASH_DIRECT', label: 'Awash Bank Direct', icon: 'account_balance' },
]

const WITHDRAW_BANKS = [
  { code: 'CBEETET', label: 'Commercial Bank of Ethiopia' },
  { code: 'AWABETET', label: 'Awash Bank' },
  { code: 'DASBETET', label: 'Dashen Bank' },
  { code: 'WGBETET', label: 'Wegagen Bank' },
  { code: 'BOAETET', label: 'Bank of Abyssinia' },
]

const MINIMUMS = { deposit: 10, withdraw: 100 }

function FundingOverview({ balance, loading }) {
  const available = balance?.available_balance_etb ?? 0
  const escrowed = balance?.escrowed_balance_etb ?? 0
  const total = available + escrowed
  const pct = (value) => (total > 0 ? `${Math.round((value / total) * 100)}%` : '0%')

  return (
    <div className="glass-card rounded-[24px] h-full p-7 flex flex-col justify-between">
      <div>
        <h3 className="mb-6 font-label-sm text-[11px] font-bold uppercase tracking-wider text-white/50">
          CASH & LIQUIDITY OVERVIEW
        </h3>
        {loading ? (
          <div className="space-y-4" aria-busy="true">
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-2 w-full animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
            <div className="h-2 w-full animate-pulse rounded-full bg-white/10" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex justify-between font-body-md text-[13px]">
                <span className="font-title-md font-bold text-white">Available Buying Power</span>
                <span className="font-title-md font-bold text-primary-fixed">{formatEtb(available)}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary-fixed chart-glow transition-all duration-500"
                  style={{ width: pct(available) }}
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between font-body-md text-[13px]">
                <span className="font-title-md font-bold text-white">Escrowed Balance</span>
                <span className="font-title-md font-bold text-white/70">{formatEtb(escrowed)}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white/40 transition-all duration-500"
                  style={{ width: pct(escrowed) }}
                />
              </div>
            </div>
            <div className="border-t border-white/10 pt-5">
              <div className="flex items-center justify-between">
                <p className="font-label-sm text-[11px] text-white/50 uppercase tracking-wider">TOTAL CASH</p>
                <p className="font-display-lg text-[24px] font-extrabold text-white">{formatEtb(total)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SecurityStatus({ escrowed, verified }) {
  return (
    <div className="glass-card rounded-[24px] flex h-full flex-col p-7">
      <h3 className="mb-6 font-label-sm text-[11px] font-bold uppercase tracking-wider text-white/50">
        SECURITY & BANK TRUST
      </h3>
      <div className="flex-1 space-y-4">
        <div
          className={`flex items-center gap-3.5 rounded-2xl border p-4 ${
            verified
              ? 'border-primary-fixed/30 bg-primary-fixed/10 text-primary-fixed'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            {verified ? 'verified' : 'pending'}
          </span>
          <div>
            <p className="font-title-md text-[13px] font-bold text-white">
              {verified ? 'Fayda ID Verified' : 'Identity check outstanding'}
            </p>
            <p className="font-body-md text-[11px] text-white/60 mt-0.5">
              {verified ? 'Instant transfer limits enabled' : 'Transfers pending Fayda verification'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">lock_clock</span>
          <div>
            <p className="font-title-md text-[13px] font-bold text-white">{formatEtb(escrowed)} in escrow</p>
            <p className="font-body-md text-[11px] text-white/60 mt-0.5">Committed against pending market orders</p>
          </div>
        </div>
      </div>
      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="font-body-md text-[11px] text-white/50">
          Funds settle securely via EthSwitch inter-bank network.
        </p>
      </div>
    </div>
  )
}

export default function WalletFundingView({ activeTab }) {
  const navigate = useNavigate()
  const isDeposit = activeTab === 'deposit'
  const { isVerified } = useAuth()
  const { balance, loading, error, reload, trackPending } = useWallet()

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
      errors.amount = `Minimum ${isDeposit ? 'deposit' : 'withdrawal'} is ${minimum} ETB.`
    } else if (!isDeposit && numericAmount > available) {
      errors.amount = `You only have ${formatEtb(available)} available.`
    }

    if (!isDeposit && accountNumber.replace(/\D/g, '').length < 10) {
      errors.accountNumber = 'Enter destination bank account number.'
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
        setNotice('Deposit initiated. Authorize transfer in your wallet app.')
      } else {
        await walletService.withdraw({
          amountEtb: numericAmount,
          bankCode,
          accountNumber: accountNumber.replace(/\s/g, ''),
        })
        setNotice('Withdrawal submitted. Amount escrowed until bank clears.')
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
    <div className="flex flex-1 flex-col gap-8 font-body-md text-on-surface">
      <div className="border-b border-white/10 pb-6">
        <h2 className="font-display-lg text-[32px] sm:text-[40px] font-extrabold text-white leading-tight">
          Wallet & Liquidity
        </h2>
        <p className="mt-1 font-body-md text-[14px] text-white/60">
          Manage your cash transfers, bank deposits, and withdrawals.
        </p>
      </div>

      {(error || notice) && (
        <div>
          <FormAlert tone={error ? 'error' : 'success'} message={error ?? notice} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <FundingOverview balance={balance} loading={loading} />
        </div>

        <div className="lg:col-span-4">
          <div className="glass-card rounded-[24px] h-full p-7">
            {/* Tab Switch */}
            <div className="relative mb-6 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex gap-6" role="tablist" aria-label="Transfer type">
                {['deposit', 'withdraw'].map((tab) => (
                  <button
                    key={tab}
                    aria-selected={activeTab === tab}
                    className={`relative font-title-md text-[13px] font-bold uppercase tracking-wider transition-all ${
                      activeTab === tab ? 'text-primary-fixed' : 'text-white/60 hover:text-white'
                    }`}
                    id={`${tab}-tab`}
                    onClick={() => handleTabChange(tab)}
                    role="tab"
                    type="button"
                  >
                    {tab === 'deposit' ? 'Deposit Cash' : 'Withdraw Cash'}
                    <div
                      className="absolute bottom-[-13px] left-0 h-0.5 bg-primary-fixed chart-glow transition-all"
                      style={{ width: activeTab === tab ? '100%' : '0' }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {formError && (
              <div className="mb-4">
                <FormAlert tone="error" message={formError} />
              </div>
            )}

            <form
              className="space-y-4 font-body-md text-[13px]"
              onSubmit={(e) => {
                e.preventDefault()
                openConfirm()
              }}
              noValidate
            >
              <div>
                <label className="mb-2 block font-label-sm text-[10px] uppercase text-white/50" htmlFor="transfer-source">
                  {isDeposit ? 'Payment Channel' : 'Destination Bank'}
                </label>
                <div className="relative">
                  <select
                    className="w-full rounded-2xl glass-card border border-white/10 bg-black/40 p-3.5 font-title-md text-[13px] text-white focus:border-primary-fixed/50 focus:outline-none"
                    id="transfer-source"
                    value={isDeposit ? channel : bankCode}
                    onChange={(e) =>
                      isDeposit ? setChannel(e.target.value) : setBankCode(e.target.value)
                    }
                  >
                    {(isDeposit ? DEPOSIT_CHANNELS : WITHDRAW_BANKS).map((option) => (
                      <option key={option.code} value={option.code} className="bg-[#050505] text-white">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!isDeposit && (
                <div>
                  <label className="mb-2 block font-label-sm text-[10px] uppercase text-white/50" htmlFor="destination-account">
                    Destination Bank Account
                  </label>
                  <input
                    className="w-full rounded-2xl glass-card border border-white/10 bg-transparent p-3.5 font-title-md text-[13px] text-white placeholder-white/40 focus:border-primary-fixed/50 focus:outline-none"
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
                <label className="mb-2 block font-label-sm text-[10px] uppercase text-white/50" htmlFor="transfer-amount">
                  {isDeposit ? 'Deposit Amount (ETB)' : 'Withdrawal Amount (ETB)'}
                </label>
                <input
                  className="w-full rounded-2xl glass-card border border-white/10 bg-transparent p-4 font-display-lg text-[22px] font-bold text-white placeholder-white/40 focus:border-primary-fixed/50 focus:outline-none"
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

                {/* Quick Preset Buttons */}
                <div className="flex gap-2 mt-3">
                  {[500, 1000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(preset))}
                      className="rounded-full glass-card border border-white/10 px-3 py-1 font-title-md text-[11px] text-white/80 hover:text-black hover:bg-primary-fixed transition-colors"
                    >
                      +{preset} ETB
                    </button>
                  ))}
                </div>

                <FieldError message={fieldErrors.amount} />
                {!isDeposit && (
                  <p className="mt-2 font-label-sm text-[10px] text-white/50">
                    Available balance: {formatEtb(available)}
                  </p>
                )}
              </div>

              <button
                className="w-full py-4 mt-2 bg-primary-fixed text-on-primary rounded-xl font-title-md text-[13px] font-bold shadow-[0_0_15px_rgba(213,251,69,0.4)] hover:brightness-110 transition-all"
                disabled={submitting}
                type="submit"
              >
                {isDeposit ? 'CONFIRM DEPOSIT →' : 'CONFIRM WITHDRAWAL →'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-4">
          <SecurityStatus escrowed={balance?.escrowed_balance_etb ?? 0} verified={isVerified} />
        </div>
      </div>

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
