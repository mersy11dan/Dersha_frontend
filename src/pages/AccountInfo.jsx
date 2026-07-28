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
    <div className="min-h-screen bg-[#000000] text-[#ffffff] grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT COLUMN: 4K HIGH-RES VISUAL PANEL */}
      <div className="hidden lg:relative lg:flex flex-col justify-between p-12 border-r-2 border-[#D4FF00] overflow-hidden bg-[#050505]">
        <img
          src="/Assets/vortex_register_onboarding.png"
          alt="Dersha Register Exchange Headquarters Visual"
          className="absolute inset-0 h-full w-full object-cover opacity-85 transition-all duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/40 to-[#000000]/20" />

        {/* Top Floating Badge */}
        <div className="relative z-10 flex justify-start">
          <div className="vortex-badge vortex-badge-cyber text-xs px-3 py-1">
            ECMA REGULATED FRAMEWORK
          </div>
        </div>

        {/* Bottom Floating Telemetry Panel */}
        <div className="relative z-10 vortex-panel bg-[#000000]/85 backdrop-blur-md p-6 border-2 border-[#D4FF00] font-mono text-xs">
          <div className="flex items-center gap-3 mb-3 text-[#D4FF00]">
            <span className="h-2 w-2 rounded-full bg-[#D4FF00] animate-pulse" />
            <span className="font-bold uppercase tracking-wider">150M+ ETB DEPLOYED CAPITAL</span>
          </div>
          <h3 className="font-sans text-xl font-black uppercase text-[#ffffff] mb-2">
            JOIN ETHIOPIA'S FRACTIONAL MARKETPLACE
          </h3>
          <p className="font-sans text-xs text-[#a0a0a0] leading-relaxed">
            Direct access to appraised real estate, logistics fleets, and agricultural sub-funds with custodian bank trustee security and monthly cash flow distributions.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: REGISTER FORM & STEPPER */}
      <div className="flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-14 vortex-grid-bg overflow-y-auto">
        <div>
          {/* Header Branding */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[2px] bg-[#D4FF00] font-mono text-lg font-black text-[#000000]">
                D
              </div>
              <span className="font-mono text-lg font-black tracking-widest text-[#D4FF00]">DERSHA</span>
            </Link>
            <Link to="/login" className="font-mono text-xs font-bold text-[#D4FF00] hover:underline">
              LOG IN →
            </Link>
          </div>

          <div className="w-full max-w-lg">
            <div className="mb-6">
              <OnboardingStepper currentStep={1} />
            </div>

            <header className="mb-6 border-b border-[#D4FF00]/30 pb-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#D4FF00]">
                STEP 01. ONBOARDING CREDENTIALS
              </span>
              <h1 className="font-sans text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#ffffff] mt-1">
                CREATE INVESTOR ACCOUNT
              </h1>
              <p className="font-sans text-xs text-[#a0a0a0] mt-1">
                Register to access fractional asset telemetry and sub-fund marketplace opportunities.
              </p>
            </header>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {error && <FormAlert tone="error" message={error} />}

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#D4FF00]" htmlFor="full-name">
                  FULL NAME (LEGAL IDENTIFIER)
                </label>
                <input
                  autoComplete="name"
                  className="vortex-input"
                  id="full-name"
                  name="fullName"
                  placeholder="Abebe Bikila"
                  type="text"
                  value={form.fullName}
                  onChange={update('fullName')}
                />
                <FieldError message={fieldErrors.fullName} />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#D4FF00]" htmlFor="email">
                  EMAIL ADDRESS
                </label>
                <input
                  autoComplete="email"
                  className="vortex-input"
                  id="email"
                  name="email"
                  placeholder="name@domain.com"
                  spellCheck={false}
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                />
                <FieldError message={fieldErrors.email} />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#D4FF00]" htmlFor="phone">
                  ETHIOPIAN PHONE NUMBER
                </label>
                <div className="flex gap-2">
                  <select
                    aria-label="Country code"
                    className="vortex-input w-28 text-center font-mono font-bold"
                    name="countryCode"
                    value={form.countryCode}
                    onChange={update('countryCode')}
                  >
                    {COUNTRY_CODES.map((code) => (
                      <option key={code} value={code} className="bg-[#000000] text-[#ffffff]">{code}</option>
                    ))}
                  </select>
                  <input
                    autoComplete="tel"
                    className="vortex-input flex-1"
                    id="phone"
                    inputMode="tel"
                    maxLength={11}
                    name="phone"
                    placeholder="911234567"
                    type="tel"
                    value={form.phone}
                    onChange={update('phone')}
                  />
                </div>
                <FieldError message={fieldErrors.phone} />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#D4FF00]" htmlFor="password">
                  SECURITY PASSWORD
                </label>
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    className="vortex-input pr-12"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={update('password')}
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] hover:text-[#D4FF00]"
                    onClick={() => setShowPassword((prev) => !prev)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <FieldError message={fieldErrors.password} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer font-mono text-xs text-[#a0a0a0] hover:text-[#ffffff] pt-1">
                <input
                  checked={form.isDiaspora}
                  className="h-4 w-4 rounded-[2px] border border-[#D4FF00] bg-[#000000] accent-[#D4FF00]"
                  name="isDiaspora"
                  onChange={update('isDiaspora')}
                  type="checkbox"
                />
                <span>REGISTER AS DIASPORA INVESTOR (INTERNATIONAL)</span>
              </label>

              <button
                className="vortex-btn-primary w-full py-4 mt-3"
                disabled={submitting}
                type="submit"
              >
                {submitting ? 'PROCESSING REGISTRATION...' : 'PROCEED TO IDENTITY VERIFICATION →'}
              </button>
            </form>
          </div>
        </div>

        <footer className="mt-8 border-t border-white/10 pt-4 font-mono text-xs text-[#8c8c8c]">
          ALREADY REGISTERED?{' '}
          <Link className="font-bold text-[#D4FF00] hover:underline ml-1" to="/login">
            LOG IN TO TERMINAL →
          </Link>
        </footer>
      </div>
    </div>
  )
}
