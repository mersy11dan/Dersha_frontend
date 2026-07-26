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
    { code: 'TELEBIRR', name: 'Telebirr' },
    { code: 'CBE_BIRR', name: 'CBE Birr' },
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

  /** Linking is optional; deposits pick a channel at payment time regardless. */
  const skip = () => navigate('/marketplace', { replace: true })

  return (
    <div className="page-shell min-h-screen flex flex-col overflow-x-hidden font-body-md">
      <header className="dersha-header px-margin-mobile md:px-margin-desktop">
        <img alt="DERSHA" className="dersha-brand-logo" src="/logo.svg" />
        <div className="flex items-center gap-4">
          <button
            aria-label="Help"
            className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
            type="button"
          >
            help
          </button>
          <button
            aria-label="Wallet"
            className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
            type="button"
          >
            account_balance_wallet
          </button>
        </div>
      </header>

      <main className="page-content flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-28 pb-32 flex flex-col items-center">
        <div className="w-full max-w-2xl mb-12 dersha-animate-in">
          <OnboardingStepper currentStep={3} />
        </div>

        <div className="dersha-card w-full max-w-2xl p-8 md:p-12 dersha-animate-in" style={{ animationDelay: '100ms' }}>
          <header className="text-center mb-10">
            <h1 className="dersha-heading font-headline-md text-headline-md mb-3">
              Connect Your Funding Source
            </h1>
            <p className="dersha-subheading text-on-surface-variant max-w-md mx-auto">
              Link your local Ethiopian bank account or mobile money wallet to enable instant deposits and payouts via EthSwitch.
            </p>
          </header>

          {error && (
            <div className="mb-8">
              <FormAlert tone="error" message={error} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              className={`dersha-select-card flex flex-col items-start p-6 text-left group ${
                fundingType === 'mobile' ? 'dersha-select-card-active' : ''
              }`}
              onClick={() => chooseType('mobile')}
              type="button"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-primary" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
                  account_balance_wallet
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1 text-on-surface">Mobile Money</h3>
              <p className="text-sm text-on-surface-variant">Supports Telebirr and CBE Birr wallets.</p>
            </button>

            <button
              className={`dersha-select-card flex flex-col items-start p-6 text-left group ${
                fundingType === 'bank' ? 'dersha-select-card-active' : ''
              }`}
              onClick={() => chooseType('bank')}
              type="button"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-primary" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
                  account_balance
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1 text-on-surface">Commercial Bank</h3>
              <p className="text-sm text-on-surface-variant">Powered by EthSwitch network.</p>
            </button>
          </div>

          <form className="space-y-6" id="funding-form" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="dersha-label mb-2 block" htmlFor="institution">
                Select Financial Institution
              </label>
              <div className="relative">
                <select
                  className="dersha-input appearance-none pr-12 bg-surface-container-high"
                  id="institution"
                  name="institution"
                  value={providerCode}
                  onChange={(e) => setProviderCode(e.target.value)}
                >
                  <option value="">Choose your provider</option>
                  {providers.map((provider) => (
                    <option key={provider.code} value={provider.code}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" aria-hidden="true">
                  expand_more
                </span>
              </div>
              <FieldError message={fieldErrors.provider} />
            </div>

            <div>
              <label className="dersha-label mb-2 block" htmlFor="account-number">
                Account or Mobile Wallet Number
              </label>
              <input
                className="dersha-input bg-surface-container-high"
                id="account-number"
                inputMode="numeric"
                name="accountNumber"
                placeholder="e.g. 1000123456789 or 0911…"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
              <FieldError message={fieldErrors.accountNumber} />
            </div>

            <div className="dersha-info-box">
              <span className="material-symbols-outlined shrink-0" aria-hidden="true">info</span>
              <p className="text-sm leading-relaxed">
                For your security, the name on your bank/wallet account must exactly match your verified Fayda ID name.
              </p>
            </div>
          </form>

          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <Link className="text-outline hover:text-on-surface transition-colors flex items-center gap-2 font-semibold" to="/identity-verification">
              <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
              Back
            </Link>

            <div className="flex flex-col-reverse md:flex-row items-center gap-4 w-full md:w-auto">
              <button
                className="text-outline hover:text-on-surface transition-colors font-semibold"
                onClick={skip}
                type="button"
              >
                Skip for now
              </button>
              <button
                className="dersha-btn dersha-btn-primary px-8 py-4 text-lg w-full md:w-auto text-center"
                disabled={submitting}
                form="funding-form"
                type="submit"
              >
                {submitting ? 'Linking…' : 'Complete Onboarding & Enter Marketplace'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-8 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">security</span>
            <span className="dersha-eyebrow text-[10px]">PCI-DSS Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">lock</span>
            <span className="dersha-eyebrow text-[10px]">ECMA Regulated</span>
          </div>
        </div>
      </main>

      <div className="page-atmosphere -z-20" />

      <div className="dersha-ticker">
        <div className="flex animate-marquee whitespace-nowrap gap-12 text-[10px] font-mono text-outline uppercase tracking-widest h-full items-center">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
            <span key={index}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
