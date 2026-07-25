import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function AccountInfo() {
  const [showPassword, setShowPassword] = useState(false)

  const togglePassword = () => {
    setShowPassword((prev) => !prev)
  }

  return (
    <div className="min-h-screen flex flex-col items-center overflow-x-hidden font-body-md">
      <header className="fixed top-0 w-full flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 z-50 bg-surface-dim/80 backdrop-blur-xl border-b border-outline-variant/30">
        <div className="font-display-lg text-display-lg-mobile tracking-tighter text-primary">
          ETHIOINVEST
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">
            help
          </span>
        </div>
      </header>

      <main className="flex-grow w-full max-w-container-max px-margin-mobile md:px-margin-desktop pt-32 pb-24 flex flex-col items-center">
        <div className="w-full max-w-2xl mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 w-full h-[2px] bg-outline-variant/30 -z-10" />
            <div className="absolute top-5 left-0 w-1/3 h-[2px] bg-primary -z-10 transition-all duration-700" />

            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary ring-4 ring-primary-container/20">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <span className="font-label-caps text-label-caps text-primary">Account Info</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/50 flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
              </div>
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Identity
              </span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/50 flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">
                  account_balance_wallet
                </span>
              </div>
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Bank/Wallet
              </span>
            </div>
          </div>
        </div>

        <section className="glass-card-onboarding w-full max-w-xl rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />

          <div className="text-center mb-10">
            <h1 className="font-display-lg text-display-lg-mobile text-on-surface mb-3">
              Create Your Wealth Account
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Set up your secure credentials to begin investing in alternative fractional
              assets in Ethiopia.
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase ml-1">
                Full Name
              </label>
              <div className="relative emerald-glow rounded-2xl bg-surface-container-low transition-all duration-200">
                <input
                  className="w-full bg-transparent border border-outline-variant/30 rounded-2xl py-4 px-5 text-on-surface placeholder:text-outline-variant focus:ring-0 focus:border-primary"
                  placeholder="Abebe Bikila"
                  type="text"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase ml-1">
                Email Address
              </label>
              <div className="relative emerald-glow rounded-2xl bg-surface-container-low transition-all duration-200">
                <input
                  className="w-full bg-transparent border border-outline-variant/30 rounded-2xl py-4 px-5 text-on-surface placeholder:text-outline-variant focus:ring-0 focus:border-primary"
                  placeholder="name@domain.com"
                  type="email"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase ml-1">
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="relative min-w-[100px] emerald-glow rounded-2xl bg-surface-container-low">
                  <select className="w-full bg-transparent border border-outline-variant/30 rounded-2xl py-4 pl-4 pr-8 text-on-surface focus:ring-0 focus:border-primary appearance-none">
                    <option>+251</option>
                    <option>+1</option>
                    <option>+44</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    expand_more
                  </span>
                </div>
                <div className="relative flex-grow emerald-glow rounded-2xl bg-surface-container-low transition-all duration-200">
                  <input
                    className="w-full bg-transparent border border-outline-variant/30 rounded-2xl py-4 px-5 text-on-surface placeholder:text-outline-variant focus:ring-0 focus:border-primary"
                    placeholder="911 234 567"
                    type="tel"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase ml-1">
                Password
              </label>
              <div className="relative emerald-glow rounded-2xl bg-surface-container-low transition-all duration-200 group">
                <input
                  className="w-full bg-transparent border border-outline-variant/30 rounded-2xl py-4 pl-5 pr-14 text-on-surface placeholder:text-outline-variant focus:ring-0 focus:border-primary"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  onClick={togglePassword}
                  type="button"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-outline ml-1">
                Minimum 8 characters with at least one number and symbol.
              </p>
            </div>

            <Link
              className="block w-full bg-[#059669] hover:bg-[#047857] text-white font-headline-md text-headline-md py-5 rounded-2xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-emerald-900/20 mt-4 text-center"
              to="/identity-verification"
            >
              Next: Verify Identity
            </Link>
          </form>

          <div className="mt-8 pt-8 border-t border-outline-variant/20 text-center">
            <Link
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
              to="/login"
            >
              Already have an account?{' '}
              <span className="text-primary font-semibold">Log In</span>
            </Link>
          </div>
        </section>
      </main>

      <div className="fixed inset-0 pointer-events-none -z-50">
        <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] bg-primary/3 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[30vw] h-[30vw] bg-secondary-container/5 rounded-full blur-[100px]" />
      </div>
    </div>
  )
}
