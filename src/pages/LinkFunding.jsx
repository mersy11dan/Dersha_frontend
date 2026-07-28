import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import OnboardingStepper from '../components/onboarding/OnboardingStepper'
import { api } from '../lib/apiClient'
import FormAlert, { FieldError } from '../components/common/FormAlert'

const TICKER_ITEMS = [
  'CBE COMMODITIES +1.2%',
  'REAL ESTATE FRACTIONS (ADDIS) -0.4%',
  'GOLD SPOT (ETH) +2.15%',
  'COFFEE FUTURES +0.8%',
  'SOLAR ENERGY PROJECT FUNDED 100%',
]

const PROVIDERS = {
  bank: [
    { code: 'CBEETET', name: 'Commercial Bank of Ethiopia (CBE)' },
    { code: 'AWABETET', name: 'Awash Bank' },
    { code: 'DASBETET', name: 'Dashen Bank' },
    { code: 'BOAETET', name: 'Bank of Abyssinia' },
    { code: 'WGBETET', name: 'Wegagen Bank' },
  ],
  mobile: [
    { code: 'TELEBIRR', name: 'Telebirr Wallet' },
    { code: 'CBE_BIRR', name: 'CBE Birr Wallet' },
  ],
}

export default function LinkFunding() {
  const navigate = useNavigate()

  const [fundingType, setFundingType] = useState('bank')
  const [providerCode, setProviderCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const providers = useMemo(() => PROVIDERS[fundingType], [fundingType])

  const chooseType = (type) => {
    setFundingType(type)
    setProviderCode('')
    setFieldErrors({})
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    if (!providerCode) {
      setFieldErrors({ provider: 'Choose your provider to continue.' })
      return
    }

    setSubmitting(true)
    setError(null)
    setFieldErrors({})

    try {
      await api.post('/funding-sources', {
        source_type: fundingType === 'bank' ? 'BANK' : 'MOBILE_MONEY',
        provider_code: providerCode,
        account_number: accountNumber.replace(/\s/g, ''),
        make_primary: true,
      })

      navigate('/marketplace', { replace: true })
    } catch (err) {
      const mapped = err.fieldErrors ?? {}
      setFieldErrors({
        provider: mapped.provider_code,
        accountNumber: mapped.account_number,
      })
      setError(err.message)
      setSubmitting(false)
    }
  }

  const skip = () => navigate('/marketplace', { replace: true })

  return (
    <div className="page-shell vortex-grid-bg flex min-h-screen flex-col bg-[#000000] text-[#ffffff]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-2 border-[#D4FF00] bg-[#000000] px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[2px] bg-[#D4FF00] font-mono text-base font-black text-[#000000]">
            D
          </div>
          <span className="font-mono text-sm font-black tracking-widest text-[#D4FF00]">DERSHA</span>
        </Link>
        <div className="font-mono text-xs text-[#2AFF0A]">
          ETHSWITCH FUNDING LINK
        </div>
      </header>

      <main className="flex-1 px-4 py-12 md:px-10 flex flex-col items-center pb-24">
        <div className="w-full max-w-2xl mb-8">
          <OnboardingStepper currentStep={3} />
        </div>

        <div className="vortex-panel w-full max-w-2xl p-8 bg-[#050505] shadow-[8px_8px_0px_#000000]">
          <header className="mb-6 border-b border-[#D4FF00]/30 pb-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#D4FF00]">
              STEP 03. BANK & WALLET LINKING
            </span>
            <h1 className="font-sans text-2xl font-bold uppercase tracking-tight text-[#ffffff]">
              CONNECT FUNDING SOURCE
            </h1>
            <p className="font-sans text-xs text-[#a0a0a0] mt-1">
              Link your Ethiopian bank account or mobile wallet for instant deposits and cash distributions via EthSwitch.
            </p>
          </header>

          {error && (
            <div className="mb-6">
              <FormAlert tone="error" message={error} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              className={`flex flex-col items-start p-5 rounded-[2px] border font-mono text-xs transition-all ${
                fundingType === 'mobile'
                  ? 'border-[#D4FF00] bg-[#D4FF00]/10 text-[#ffffff] shadow-[4px_4px_0px_#D4FF00]'
                  : 'border-white/20 bg-[#000000] text-[#a0a0a0] hover:border-[#D4FF00]'
              }`}
              onClick={() => chooseType('mobile')}
              type="button"
            >
              <div className="mb-2 flex items-center gap-2 text-[#D4FF00]">
                <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                <span className="font-bold uppercase tracking-wider">MOBILE MONEY</span>
              </div>
              <p className="text-[11px] text-[#8c8c8c]">Telebirr & CBE Birr integrated wallets.</p>
            </button>

            <button
              className={`flex flex-col items-start p-5 rounded-[2px] border font-mono text-xs transition-all ${
                fundingType === 'bank'
                  ? 'border-[#D4FF00] bg-[#D4FF00]/10 text-[#ffffff] shadow-[4px_4px_0px_#D4FF00]'
                  : 'border-white/20 bg-[#000000] text-[#a0a0a0] hover:border-[#D4FF00]'
              }`}
              onClick={() => chooseType('bank')}
              type="button"
            >
              <div className="mb-2 flex items-center gap-2 text-[#D4FF00]">
                <span className="material-symbols-outlined text-base">account_balance</span>
                <span className="font-bold uppercase tracking-wider">COMMERCIAL BANK</span>
              </div>
              <p className="text-[11px] text-[#8c8c8c]">CBE, Awash, Dashen via EthSwitch Network.</p>
            </button>
          </div>

          <form className="space-y-5" id="funding-form" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#D4FF00]" htmlFor="institution">
                SELECT FINANCIAL INSTITUTION
              </label>
              <select
                className="vortex-input font-mono text-xs"
                id="institution"
                name="institution"
                value={providerCode}
                onChange={(e) => setProviderCode(e.target.value)}
              >
                <option value="" className="bg-[#000000]">CHOOSE FINANCIAL PROVIDER...</option>
                {providers.map((provider) => (
                  <option key={provider.code} value={provider.code} className="bg-[#000000] text-[#ffffff]">
                    {provider.name}
                  </option>
                ))}
              </select>
              <FieldError message={fieldErrors.provider} />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#D4FF00]" htmlFor="account-number">
                ACCOUNT / WALLET NUMBER
              </label>
              <input
                className="vortex-input font-mono tracking-wider"
                id="account-number"
                inputMode="numeric"
                name="accountNumber"
                placeholder="e.g. 1000123456789 or 0911234567"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
              <FieldError message={fieldErrors.accountNumber} />
            </div>

            <div className="rounded-[2px] border border-[#2AFF0A]/40 bg-[#2AFF0A]/10 p-4 font-mono text-xs text-[#2AFF0A] flex items-start gap-3">
              <span className="material-symbols-outlined text-base">info</span>
              <span>ACCOUNT NAME MATCH REQUIRED: Bank account name must match your verified Fayda ID name.</span>
            </div>
          </form>

          <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6 font-mono text-xs">
            <Link className="text-[#a0a0a0] hover:text-[#ffffff]" to="/identity-verification">
              ← BACK
            </Link>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <button
                className="text-[#8c8c8c] hover:text-[#D4FF00]"
                onClick={skip}
                type="button"
              >
                SKIP FOR NOW
              </button>
              <button
                className="vortex-btn-primary py-3.5 px-6"
                disabled={submitting}
                form="funding-form"
                type="submit"
              >
                {submitting ? 'LINKING...' : 'COMPLETE & ENTER MARKETPLACE →'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Telemetry Ticker Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 h-8 border-t-2 border-[#D4FF00] bg-[#000000] font-mono text-[11px] text-[#D4FF00] flex items-center overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap gap-12 px-4">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
            <span key={index}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
