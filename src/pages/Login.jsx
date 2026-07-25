import { useState } from 'react'
import { Link } from 'react-router-dom'

const GOOGLE_ICON_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAJBfuP4UlhLHxCG_9U--YQIN6mbhnulT6E5JZXPkFDIQRFSAsgb0UqLVJtuwZpqcqhCUxPjh2GF-sphnd6Uj7qF4ydr3TydAAKRxLwLNSmVMkNrX7qYNYDU0Z13Zdq_3g-f4c98dT05GDOLwXUtixz6sFxVVWMjZbe5Q6IhWlwPK2uo6QNAavdciEz2otsYejxfncK1kCBpTnhqVaWyxniNJJkMAW7DbMrRSr0PNtXZK_NoJfVZQRC8K1ai_6RwFLzJ1x-c8cZZdFm'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [submitState, setSubmitState] = useState('idle')

  const togglePassword = () => {
    setShowPassword((prev) => !prev)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (submitState !== 'idle') return

    setSubmitState('loading')

    setTimeout(() => {
      setSubmitState('success')
    }, 1500)
  }

  return (
    <div className="font-body-md text-body-md min-h-screen flex items-center justify-center overflow-x-hidden relative">
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <main className="relative z-10 w-full max-w-[480px] px-margin-mobile md:px-0">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-on-primary font-bold">
                account_balance
              </span>
            </div>
            <h1 className="font-headline-md text-headline-md font-bold tracking-tight text-primary">
              EQUITYBLOCK
            </h1>
          </div>
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
            Institutional Grade Assets
          </p>
        </div>

        <div className="glass-card p-8 md:p-10 rounded-lg shadow-2xl">
          <header className="mb-8">
            <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-2">
              Welcome Back
            </h2>
            <p className="text-on-surface-variant">
              Securely access your fractional investment portfolio.
            </p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="font-label-caps text-label-caps text-on-surface-variant ml-1"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                    mail
                  </span>
                </div>
                <input
                  className="w-full bg-surface-container-low border border-outline-variant rounded-full py-4 pl-12 pr-4 text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all duration-300"
                  id="email"
                  name="email"
                  placeholder="name@institution.com"
                  required
                  type="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label
                  className="font-label-caps text-label-caps text-on-surface-variant"
                  htmlFor="password"
                >
                  Password
                </label>
                <a
                  className="font-label-caps text-label-caps text-primary hover:text-secondary transition-colors"
                  href="#"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                    lock
                  </span>
                </div>
                <input
                  className="w-full bg-surface-container-low border border-outline-variant rounded-full py-4 pl-12 pr-12 text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all duration-300"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline-variant hover:text-on-surface transition-colors"
                  onClick={togglePassword}
                  type="button"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input className="sr-only peer" type="checkbox" />
                  <div className="w-5 h-5 bg-surface-container-low border border-outline-variant rounded peer-checked:bg-primary peer-checked:border-primary transition-all" />
                  <span className="material-symbols-outlined absolute inset-0 text-[16px] text-on-primary opacity-0 peer-checked:opacity-100 flex items-center justify-center font-bold">
                    check
                  </span>
                </div>
                <span className="ml-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Keep me signed in for 30 days
                </span>
              </label>
            </div>

            <button
              className={`w-full font-bold py-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group ${
                submitState === 'success'
                  ? 'bg-secondary shadow-primary/20'
                  : 'bg-primary text-on-primary-fixed shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02] active:scale-95'
              }`}
              disabled={submitState !== 'idle'}
              type="submit"
            >
              {submitState === 'loading' && (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-on-primary-fixed"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Authenticating...</span>
                </>
              )}
              {submitState === 'success' && (
                <>
                  <span className="material-symbols-outlined">verified</span>
                  <span>Success</span>
                </>
              )}
              {submitState === 'idle' && (
                <>
                  <span>Login to EquityBlock</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center text-label-caps">
              <span className="bg-surface-container px-4 text-on-surface-variant text-[10px] uppercase tracking-widest">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              className="flex items-center justify-center gap-3 py-3 border border-outline-variant rounded-full hover:bg-surface-bright/50 transition-all duration-300 active:scale-95"
              type="button"
            >
              <img alt="Google" className="w-5 h-5" src={GOOGLE_ICON_URL} />
              <span className="text-sm font-semibold">Google</span>
            </button>
            <button
              className="flex items-center justify-center gap-3 py-3 border border-outline-variant rounded-full hover:bg-surface-bright/50 transition-all duration-300 active:scale-95"
              type="button"
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                file_download
              </span>
              <span className="text-sm font-semibold">Apple</span>
            </button>
          </div>

          <footer className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              Don&apos;t have an institutional account?
              <Link
                className="text-primary font-semibold hover:underline underline-offset-4 ml-1"
                to="/account-info"
              >
                Sign up
              </Link>
            </p>
          </footer>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 opacity-50">
          <a
            className="font-label-caps text-label-caps text-on-surface hover:text-primary transition-colors"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className="font-label-caps text-label-caps text-on-surface hover:text-primary transition-colors"
            href="#"
          >
            Terms of Service
          </a>
          <a
            className="font-label-caps text-label-caps text-on-surface hover:text-primary transition-colors"
            href="#"
          >
            Security Disclosure
          </a>
        </div>
      </main>
    </div>
  )
}
