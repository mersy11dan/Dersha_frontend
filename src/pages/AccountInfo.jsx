import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import OnboardingStepper from '../components/onboarding/OnboardingStepper'
import { useAuth } from '../context/AuthContext'
import FormAlert, { FieldError } from '../components/common/FormAlert'

const COUNTRY_CODES = ['+251']

export default function AccountInfo() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    countryCode: '+251',
    phone: '',
    password: '',
    isDiaspora: false,
  })

  const update = (field) => (event) => {
    const value =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)
    setFieldErrors({})

    // The API expects a single E.164 string; the UI collects the code and the
    // subscriber number separately.
    const localNumber = form.phone.replace(/\D/g, '')
    const phoneNumber = `${form.countryCode}${localNumber}`

    try {
      await register({
        full_name_raw: form.fullName.trim(),
        email_address: form.email.trim(),
        phone_number_eth: phoneNumber,
        password_plain: form.password,
        is_diaspora_account: form.isDiaspora,
      })

      navigate('/identity-verification', { replace: true })
    } catch (err) {
      const mapped = err.fieldErrors ?? {}
      setFieldErrors({
        fullName: mapped.full_name_raw,
        email: mapped.email_address,
        phone: mapped.phone_number_eth,
        password: mapped.password_plain,
      })
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell min-h-screen flex flex-col overflow-x-hidden font-body-md">
      <header className="dersha-header px-margin-mobile md:px-margin-desktop">
        <img alt="DERSHA" className="dersha-brand-logo" src="/logo.svg" />
        <button
          aria-label="Help"
          className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg p-1"
          type="button"
        >
          help
        </button>
      </header>

      <main className="page-content flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-28 pb-24 flex flex-col items-center">
        <div className="w-full max-w-2xl mb-12 dersha-animate-in">
          <OnboardingStepper currentStep={1} />
        </div>

        <section className="dersha-card-elevated w-full max-w-xl p-8 md:p-12 shadow-2xl relative overflow-hidden dersha-animate-in" style={{ animationDelay: '100ms' }}>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/8 rounded-full blur-[80px]" />

          <div className="text-center mb-10 relative">
            <h1 className="dersha-heading font-display-lg text-display-lg-mobile mb-3">
              Create Your Wealth Account
            </h1>
            <p className="dersha-subheading font-body-md text-body-md text-on-surface-variant">
              Set up your secure credentials to begin investing in alternative fractional assets in Ethiopia.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {error && <FormAlert tone="error" message={error} />}

            <div className="flex flex-col gap-2">
              <label className="dersha-label ml-1" htmlFor="full-name">Full Name</label>
              <div className="emerald-glow rounded-xl bg-surface-container-low transition-all duration-200">
                <input
                  autoComplete="name"
                  className="dersha-input border-0 bg-transparent"
                  id="full-name"
                  name="fullName"
                  placeholder="Abebe Bikila"
                  type="text"
                  value={form.fullName}
                  onChange={update('fullName')}
                />
              </div>
              <FieldError message={fieldErrors.fullName} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="dersha-label ml-1" htmlFor="email">Email Address</label>
              <div className="emerald-glow rounded-xl bg-surface-container-low transition-all duration-200">
                <input
                  autoComplete="email"
                  className="dersha-input border-0 bg-transparent"
                  id="email"
                  name="email"
                  placeholder="name@domain.com…"
                  spellCheck={false}
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                />
              </div>
              <FieldError message={fieldErrors.email} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="dersha-label ml-1" htmlFor="phone">Phone Number</label>
              <div className="flex gap-2">
                <div className="relative min-w-[100px] emerald-glow rounded-xl bg-surface-container-low">
                  <select
                    aria-label="Country code"
                    className="w-full bg-transparent border-0 rounded-xl py-4 pl-4 pr-8 text-on-surface focus:ring-0 appearance-none"
                    name="countryCode"
                    value={form.countryCode}
                    onChange={update('countryCode')}
                  >
                    {COUNTRY_CODES.map((code) => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" aria-hidden="true">
                    expand_more
                  </span>
                </div>
                <div className="relative flex-grow emerald-glow rounded-xl bg-surface-container-low">
                  <input
                    autoComplete="tel"
                    className="dersha-input border-0 bg-transparent"
                    id="phone"
                    inputMode="tel"
                    maxLength={11}
                    name="phone"
                    placeholder="911 234 567"
                    type="tel"
                    value={form.phone}
                    onChange={update('phone')}
                  />
                </div>
              </div>
              <p className="text-[11px] text-outline ml-1">
                Ethiopian mobile number without the leading zero, for example 911234567.
              </p>
              <FieldError message={fieldErrors.phone} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="dersha-label ml-1" htmlFor="password">Password</label>
              <div className="relative emerald-glow rounded-xl bg-surface-container-low group">
                <input
                  autoComplete="new-password"
                  className="dersha-input border-0 bg-transparent pr-14"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  onClick={() => setShowPassword((prev) => !prev)}
                  type="button"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-outline ml-1">Minimum 8 characters.</p>
              <FieldError message={fieldErrors.password} />
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                checked={form.isDiaspora}
                className="mt-1 h-4 w-4 accent-primary"
                name="isDiaspora"
                onChange={update('isDiaspora')}
                type="checkbox"
              />
              <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                I am investing from abroad (diaspora account)
              </span>
            </label>

            <button
              className="dersha-btn dersha-btn-primary w-full py-5 text-headline-md mt-4"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Creating your account…' : 'Next: Verify Identity'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-outline-variant/20 text-center">
            <Link className="text-on-surface-variant hover:text-primary transition-colors" to="/login">
              Already have an account? <span className="dersha-link">Log In</span>
            </Link>
          </div>
        </section>
      </main>

      <div className="page-atmosphere -z-50" />
    </div>
  )
}
