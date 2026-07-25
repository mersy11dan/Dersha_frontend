import { useState } from 'react'
import { Link } from 'react-router-dom'
import OnboardingStepper from '../components/onboarding/OnboardingStepper'

const FACE_SCAN_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCfai2eWtVjbutkVi0r3o31PtfaUj8giK-nNQYe6xvo-thiVu9Pe8y8oGpitofjuuo025cJQ2E2-a3wFCBMRg_nBZcl1_IkAlT_jlJd9Lt7k_KcnpjWYXb7rInRWX_qbyg-LCfQPXe8wMvf2o0o2xZcfIFn3PSUgSvYMC-Wbudmgur_Kz_XwhDuzawMfTIARWwHep2gzbfio7AWDrtFziTNKnNfPVCKZiTIj46siI1whpUzv0YxSoEQ9CEJK7sDT0eRlYG4o4VzGMqQ'

function formatNationalId(value) {
  const digits = value.replace(/\D/g, '').slice(0, 12)
  let formatted = ''
  for (let i = 0; i < digits.length; i++) {
    if (i === 4 || i === 8) formatted += '-'
    formatted += digits[i]
  }
  return formatted
}

export default function IdentityVerification() {
  const [nationalId, setNationalId] = useState('')

  return (
    <div className="page-shell min-h-screen selection:bg-primary/30 font-body-md">
      <header className="dersha-header px-margin-mobile md:px-margin-desktop">
        <img alt="DERSHA" className="dersha-brand-logo" src="/logo.svg" />
        <div className="hidden md:flex items-center gap-6">
          <span className="dersha-eyebrow flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">security</span>
            Secure Verification
          </span>
          <div className="w-px h-4 bg-outline-variant/50" />
          <button
            aria-label="Help"
            className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
            type="button"
          >
            help_outline
          </button>
        </div>
      </header>

      <main className="page-content pt-24 pb-20 px-margin-mobile flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl mb-10 dersha-animate-in">
          <OnboardingStepper currentStep={2} />
        </div>

        <div className="dersha-card w-full max-w-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden dersha-animate-in" style={{ animationDelay: '100ms' }}>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/8 blur-[100px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/8 blur-[100px] rounded-full" />

          <div className="relative z-10">
            <div className="mb-8">
              <h1 className="dersha-heading font-headline-md text-headline-md font-bold mb-3">
                Verify Your Identity Instantly
              </h1>
              <p className="dersha-subheading font-body-md text-body-md text-on-surface-variant">
                In compliance with the{' '}
                <span className="text-primary font-semibold">Capital Market Authority (ECMA)</span>{' '}
                regulations, please link your National ID to unlock instant deposits and marketplace access.
              </p>
            </div>

            <div className="mb-10">
              <label className="dersha-label mb-2 block tracking-widest" htmlFor="national-id">
                Enter Your Fayda National ID Number
              </label>
              <div className="relative group">
                <input
                  className="dersha-input font-body-lg text-body-lg pr-14"
                  id="national-id"
                  name="nationalId"
                  placeholder="e.g., 1234-5678-9012"
                  spellCheck={false}
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(formatNationalId(e.target.value))}
                />
                <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-outline/40 group-focus-within:text-primary transition-colors" aria-hidden="true">
                  fingerprint
                </span>
              </div>
            </div>

            <div className="mb-10">
              <label className="dersha-label mb-4 block tracking-widest">Biometric Validation</label>
              <div className="bg-surface-container-highest/50 border border-outline-variant/50 rounded-xl p-6 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-6">
                  <span className="dersha-eyebrow text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Live Selfie Webcam
                  </span>
                  <span className="text-on-surface-variant text-[12px] font-medium">Align face within frame</span>
                </div>

                <div className="relative w-48 h-48 md:w-56 md:h-56">
                  <div className="absolute inset-0 face-scan-overlay z-20" />
                  <div className="absolute inset-0 rounded-full overflow-hidden bg-surface-container-lowest">
                    <div
                      className="w-full h-full bg-cover bg-center opacity-70 grayscale contrast-125"
                      style={{ backgroundImage: `url('${FACE_SCAN_IMAGE}')` }}
                    />
                    <div className="shimmer absolute inset-0 z-10" />
                  </div>
                </div>

                <p className="mt-6 dersha-eyebrow text-[11px] text-outline text-center max-w-sm">
                  By clicking continue, you agree to AI biometric matching with the National ID database.
                </p>
              </div>
            </div>

            <div className="dersha-trust-box mb-10">
              <span className="material-symbols-outlined text-primary shrink-0" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
              <p className="text-[12px] leading-relaxed text-on-surface-variant">
                Your identity data is fully <span className="text-on-surface">encrypted</span> and securely validated via the{' '}
                <span className="text-on-surface">National ID Program API</span>. No manual paper documentation required.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <Link className="text-outline hover:text-on-surface transition-colors flex items-center gap-2 font-semibold" to="/account-info">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
                Back
              </Link>
              <Link className="dersha-btn dersha-btn-primary w-full md:min-w-[240px] px-8 py-4" to="/link-funding">
                Verify &amp; Continue
                <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-12 text-on-surface-variant dersha-eyebrow opacity-50 text-center">
          Fractional Wealth Ltd. · Authorized by ECMA · Data Protection Act Compliant
        </p>
      </main>

      <nav className="md:hidden fixed bottom-0 w-full bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant/30 flex justify-around p-2 z-50 rounded-t-xl shadow-lg">
        <div className="flex flex-col items-center justify-center text-on-surface-variant p-2">
          <span className="material-symbols-outlined" aria-hidden="true">support_agent</span>
          <span className="font-label-caps text-[10px]">Support</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-2xl p-2 px-4">
          <span className="material-symbols-outlined" aria-hidden="true">lock</span>
          <span className="font-label-caps text-[10px]">Security</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant p-2">
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
          <span className="font-label-caps text-[10px]">Exit</span>
        </div>
      </nav>
    </div>
  )
}
