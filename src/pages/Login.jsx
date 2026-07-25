import { useState } from 'react'
import { Link } from 'react-router-dom'

const GOOGLE_ICON_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAJBfuP4UlhLHxCG_9U--YQIN6mbhnulT6E5JZXPkFDIQRFSAsgb0UqLVJtuwZpqcqhCUxPjh2GF-sphnd6Uj7qF4ydr3TydAAKRxLwLNSmVMkNrX7qYNYDU0Z13Zdq_3g-f4c98dT05GDOLwXUtixz6sFxVVWMjZbe5Q6IhWlwPK2uo6QNAavdciEz2otsYejxfncK1kCBpTnhqVaWyxniNJJkMAW7DbMrRSr0PNtXZK_NoJfVZQRC8K1ai_6RwFLzJ1x-c8cZZdFm'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [submitState, setSubmitState] = useState('idle')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (submitState !== 'idle') return

    setSubmitState('loading')
    setTimeout(() => setSubmitState('success'), 1500)
  }

  return (
    <div className="page-shell font-body-md text-body-md flex items-center justify-center overflow-x-hidden">
      <div className="page-atmosphere">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/8 blur-[120px] rounded-full animate-pulse-slow" />
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary/8 blur-[100px] rounded-full animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <main className="page-content w-full max-w-[480px] px-margin-mobile md:px-0">
        <div className="text-center mb-10 dersha-animate-in">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-white font-bold" aria-hidden="true">
                account_balance
              </span>
            </div>
            <h1 className="font-headline-md text-headline-md font-bold tracking-tight text-primary">
              EQUITYBLOCK
            </h1>
          </div>
          <p className="dersha-eyebrow tracking-widest">Institutional Grade Assets</p>
        </div>

        <div className="dersha-card p-8 md:p-10 shadow-2xl dersha-animate-in" style={{ animationDelay: '80ms' }}>
          <header className="mb-8">
            <h2 className="dersha-heading font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg mb-2">
              Welcome Back
            </h2>
            <p className="dersha-subheading text-on-surface-variant">
              Securely access your fractional investment portfolio.
            </p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="dersha-label ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span
                    className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors"
                    aria-hidden="true"
                  >
                    mail
                  </span>
                </div>
                <input
                  className="dersha-input dersha-input-pill dersha-input-icon-left bg-surface-container-low"
                  id="email"
                  name="email"
                  autoComplete="email"
                  placeholder="name@institution.com…"
                  required
                  spellCheck={false}
                  type="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="dersha-label" htmlFor="password">
                  Password
                </label>
                <a className="dersha-link text-label-caps text-[12px]" href="#">
                  Forgot Password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span
                    className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors"
                    aria-hidden="true"
                  >
                    lock
                  </span>
                </div>
                <input
                  className="dersha-input dersha-input-pill dersha-input-icon-left dersha-input-icon-right bg-surface-container-low"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline-variant hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-full"
                  onClick={() => setShowPassword((prev) => !prev)}
                  type="button"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer group gap-3">
                <input className="sr-only peer" name="remember" type="checkbox" />
                <div className="w-5 h-5 bg-surface-container-low border border-outline-variant rounded peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-white opacity-0 peer-checked:opacity-100 font-bold" aria-hidden="true">
                    check
                  </span>
                </div>
                <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Keep me signed in for 30 days
                </span>
              </label>
            </div>

            <button
              className={`dersha-btn dersha-btn-pill w-full py-4 ${
                submitState === 'success'
                  ? 'bg-secondary text-on-primary-fixed'
                  : 'dersha-btn-primary'
              }`}
              disabled={submitState !== 'idle'}
              type="submit"
            >
              {submitState === 'loading' && (
                <>
                  <svg
                    aria-hidden="true"
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Authenticating…</span>
                </>
              )}
              {submitState === 'success' && (
                <>
                  <span className="material-symbols-outlined" aria-hidden="true">verified</span>
                  <span>Success</span>
                </>
              )}
              {submitState === 'idle' && (
                <>
                  <span>Login to EquityBlock</span>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="dersha-divider text-center">
            <span>Or continue with</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="dersha-btn dersha-btn-ghost dersha-btn-pill py-3" type="button">
              <img alt="" className="w-5 h-5" height={20} src={GOOGLE_ICON_URL} width={20} />
              <span className="text-sm font-semibold">Google</span>
            </button>
            <button className="dersha-btn dersha-btn-ghost dersha-btn-pill py-3" type="button">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
                file_download
              </span>
              <span className="text-sm font-semibold">Apple</span>
            </button>
          </div>

          <footer className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              Don&apos;t have an institutional account?
              <Link className="dersha-link underline-offset-4 hover:underline ml-1" to="/account-info">
                Sign up
              </Link>
            </p>
          </footer>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 opacity-60">
          <a className="dersha-eyebrow hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="dersha-eyebrow hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="dersha-eyebrow hover:text-primary transition-colors" href="#">Security Disclosure</a>
        </div>
      </main>
    </div>
  )
}
