import { useState } from 'react'
import { Link } from 'react-router-dom'

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
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col overflow-x-hidden">
      <header className="fixed top-0 w-full bg-surface-dim/80 backdrop-blur-xl border-b border-outline-variant/30 h-16 flex justify-between items-center px-margin-mobile md:px-margin-desktop z-50">
        <div className="font-display-lg text-display-lg-mobile tracking-tighter text-[#059669]">
          ETHIOINVEST
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
            help
          </span>
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
            account_balance_wallet
          </span>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-32 px-margin-mobile md:px-margin-desktop flex flex-col items-center">
        <div className="w-full max-w-3xl mb-12">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-outline-variant -z-10 -translate-y-1/2" />

            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined">check</span>
              </div>
              <span className="font-label-caps text-label-caps text-on-surface">
                ACCOUNT INFO
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined">check</span>
              </div>
              <span className="font-label-caps text-label-caps text-on-surface">IDENTITY</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center shadow-[0_0_15px_rgba(5,150,105,0.5)] ring-4 ring-[#059669]/20">
                <span className="font-bold">3</span>
              </div>
              <span className="font-label-caps text-label-caps text-[#059669]">
                LINK FUNDING
              </span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl glass-card rounded-2xl p-8 md:p-12">
          <header className="text-center mb-10">
            <h1 className="font-headline-md text-headline-md mb-3">
              Connect Your Funding Source
            </h1>
            <p className="text-on-surface-variant max-w-md mx-auto">
              Link your local Ethiopian bank account or mobile money wallet to enable instant
              deposits and payouts via EthSwitch.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              className={`flex flex-col items-start p-6 rounded-2xl border transition-all text-left bg-surface-container-low group ${
                fundingType === 'mobile'
                  ? 'active-selection'
                  : 'border-outline-variant hover:border-primary/50'
              }`}
              onClick={() => setFundingType('mobile')}
              type="button"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <span
                  className="material-symbols-outlined text-[#059669]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_balance_wallet
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">Mobile Money</h3>
              <p className="text-sm text-on-surface-variant">
                Supports Telebirr and CBE Birr wallets.
              </p>
            </button>

            <button
              className={`flex flex-col items-start p-6 rounded-2xl border transition-all text-left bg-surface-container-low group ${
                fundingType === 'bank'
                  ? 'active-selection'
                  : 'border-outline-variant hover:border-primary/50'
              }`}
              onClick={() => setFundingType('bank')}
              type="button"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <span
                  className="material-symbols-outlined text-[#059669]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_balance
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">Commercial Bank</h3>
              <p className="text-sm text-on-surface-variant">Powered by EthSwitch network.</p>
            </button>
          </div>

          <form className="space-y-6">
            <div>
              <label className="font-label-caps text-label-caps mb-2 block text-on-surface-variant">
                SELECT FINANCIAL INSTITUTION
              </label>
              <div className="relative">
                <select className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-4 py-3 appearance-none text-on-surface transition-all focus:border-primary">
                  <option disabled value="">
                    Choose your provider
                  </option>
                  <option>Commercial Bank of Ethiopia (CBE)</option>
                  <option>Awash Bank</option>
                  <option>Dashen Bank</option>
                  <option>Abyssinia Bank</option>
                  <option>Telebirr</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  expand_more
                </span>
              </div>
            </div>

            <div>
              <label className="font-label-caps text-label-caps mb-2 block text-on-surface-variant">
                ACCOUNT OR MOBILE WALLET NUMBER
              </label>
              <input
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-4 py-3 text-on-surface placeholder:text-outline-variant focus:border-primary transition-all"
                placeholder="e.g. 1000123456789 or 0911..."
                type="text"
              />
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-tertiary-container/10 border border-tertiary-container/20 text-tertiary">
              <span className="material-symbols-outlined shrink-0">info</span>
              <p className="text-sm leading-relaxed">
                For your security, the name on your bank/wallet account must exactly match your
                verified Fayda ID name.
              </p>
            </div>
          </form>

          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <Link
              className="text-outline hover:text-on-surface transition-colors flex items-center gap-2 font-semibold"
              to="/identity-verification"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back
            </Link>
            <Link
              className="w-full md:w-auto bg-[#059669] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:scale-105 active:scale-95 transition-all inline-block text-center"
              to="/dashboard"
            >
              Complete Onboarding &amp; Enter Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-8 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">security</span>
            <span className="font-label-caps text-[10px]">PCI-DSS COMPLIANT</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="font-label-caps text-[10px]">
              ETHIOPIAN CAPITAL MARKET AUTHORITY REGULATED
            </span>
          </div>
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full -z-20 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <div className="fixed bottom-0 w-full h-8 bg-surface-container-lowest border-t border-outline-variant/20 flex items-center overflow-hidden z-50">
        <div className="flex animate-marquee whitespace-nowrap gap-12 text-[10px] font-mono text-outline uppercase tracking-widest">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
            <span key={index}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
