import { useState } from 'react'
import { Link } from 'react-router-dom'
import OnboardingStepper from '../components/onboarding/OnboardingStepper'

const TICKER_ITEMS = [
  'CBE COMMODITIES +1.2%',
  'REAL ESTATE FRACTIONS (ADDIS) -0.4%',
  'GOLD SPOT (ETH) +2.15%',
  'COFFEE FUTURES +0.8%',
  'SOLAR ENERGY PROJECT FUNDED 100%',
]

export default function LinkFunding() {
  const [fundingType, setFundingType] = useState('bank')

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

      <main className="page-content flex-grow pt-24 pb-32 px-margin-mobile md:px-margin-desktop flex flex-col items-center">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              className={`dersha-select-card flex flex-col items-start p-6 text-left group ${
                fundingType === 'mobile' ? 'dersha-select-card-active' : ''
              }`}
              onClick={() => setFundingType('mobile')}
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
              onClick={() => setFundingType('bank')}
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

          <form className="space-y-6">
            <div>
              <label className="dersha-label mb-2 block" htmlFor="institution">
                Select Financial Institution
              </label>
              <div className="relative">
                <select
                  className="dersha-input appearance-none pr-12 bg-surface-container-high"
                  id="institution"
                  name="institution"
                >
                  <option disabled value="">Choose your provider</option>
                  <option>Commercial Bank of Ethiopia (CBE)</option>
                  <option>Awash Bank</option>
                  <option>Dashen Bank</option>
                  <option>Abyssinia Bank</option>
                  <option>Telebirr</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" aria-hidden="true">
                  expand_more
                </span>
              </div>
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
              />
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
            <Link className="dersha-btn dersha-btn-primary px-8 py-4 text-lg w-full md:w-auto text-center" to="/dashboard">
              Complete Onboarding &amp; Enter Dashboard
            </Link>
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
