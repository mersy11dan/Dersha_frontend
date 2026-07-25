import { useState } from 'react'
import { Link } from 'react-router-dom'

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
    <div className="bg-background text-on-background min-h-screen selection:bg-primary/30 font-body-md">
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center h-16 px-margin-mobile md:px-margin-desktop">
        <div className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">
          EthioWealth
        </div>
        <div className="hidden md:flex items-center gap-6">
          <span className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">security</span>
            SECURE VERIFICATION
          </span>
          <div className="w-px h-4 bg-outline-variant/50" />
          <button
            className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
            type="button"
          >
            help_outline
          </button>
        </div>
      </header>

      <main className="pt-24 pb-20 px-margin-mobile flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-2xl mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-highest -translate-y-1/2 z-0" />
            <div className="absolute top-1/2 left-0 w-1/2 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-700" />

            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-[20px]">check</span>
              </div>
              <span className="font-label-caps text-label-caps text-primary hidden md:block">
                1. Account Info
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container border-2 border-primary flex items-center justify-center font-bold emerald-glow-static">
                2
              </div>
              <span className="font-label-caps text-label-caps text-on-surface font-bold hidden md:block">
                2. Identity Verification
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant border-2 border-outline-variant flex items-center justify-center font-bold">
                3
              </div>
              <span className="font-label-caps text-label-caps text-on-surface-variant hidden md:block">
                3. Link Bank/Wallet
              </span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl glass-card rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/5 blur-[100px] rounded-full" />

          <div className="relative z-10">
            <div className="mb-8">
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface mb-3 tracking-tight">
                Verify Your Identity Instantly
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                In compliance with the{' '}
                <span className="text-primary font-semibold">
                  Capital Market Authority (ECMA)
                </span>{' '}
                regulations, please link your National ID to unlock instant deposits and
                marketplace access.
              </p>
            </div>

            <div className="mb-10">
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2 uppercase tracking-widest">
                Enter Your Fayda National ID Number
              </label>
              <div className="relative group">
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-2xl px-6 py-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 placeholder:text-outline/50 font-body-lg text-body-lg"
                  placeholder="e.g., 1234-5678-9012"
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(formatNationalId(e.target.value))}
                />
                <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-outline/40 group-focus-within:text-primary transition-colors">
                  fingerprint
                </span>
              </div>
            </div>

            <div className="mb-10">
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-4 uppercase tracking-widest">
                Biometric Validation
              </label>
              <div className="bg-surface-container-highest/50 border border-outline-variant/50 rounded-2xl p-6 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-6">
                  <span className="font-label-caps text-label-caps text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    LIVE SELFIE WEBCAM
                  </span>
                  <span className="text-on-surface-variant text-[12px] font-medium">
                    Align face within frame
                  </span>
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

                <p className="mt-6 font-label-caps text-[11px] text-outline text-center">
                  BY CLICKING CONTINUE, YOU AGREE TO AI BIOMETRIC MATCHING WITH THE NATIONAL
                  ID DATABASE.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 mb-10">
              <span
                className="material-symbols-outlined text-primary shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lock
              </span>
              <p className="font-label-caps text-[12px] leading-tight text-on-surface-variant">
                Your identity data is fully <span className="text-on-surface">encrypted</span>{' '}
                and securely validated via the{' '}
                <span className="text-on-surface">National ID Program API</span>. No manual
                paper documentation required.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <Link
                className="text-outline hover:text-on-surface transition-colors flex items-center gap-2 font-semibold"
                to="/account-info"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back
              </Link>
              <Link
                className="w-full md:min-w-[240px] px-8 py-4 rounded-2xl bg-primary text-on-primary font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                to="/link-funding"
              >
                Verify &amp; Continue
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-12 text-on-surface-variant font-label-caps text-label-caps opacity-50">
          FRACTIONAL WEALTH LTD. • AUTHORIZED BY ECMA • DATA PROTECTION ACT COMPLIANT
        </p>
      </main>

      <nav className="md:hidden fixed bottom-0 w-full bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant/30 flex justify-around p-2 z-50 rounded-t-xl shadow-lg">
        <div className="flex flex-col items-center justify-center text-on-surface-variant p-2">
          <span className="material-symbols-outlined">support_agent</span>
          <span className="font-label-caps text-[10px]">Support</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-2xl p-2 px-4">
          <span className="material-symbols-outlined">lock</span>
          <span className="font-label-caps text-[10px]">Security</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant p-2">
          <span className="material-symbols-outlined">close</span>
          <span className="font-label-caps text-[10px]">Exit</span>
        </div>
      </nav>
    </div>
  )
}
