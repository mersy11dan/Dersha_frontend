import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import OnboardingStepper from '../components/onboarding/OnboardingStepper'
import { useAuth } from '../context/AuthContext'
import { useCameraCapture } from '../hooks/useCameraCapture'
import { kycService } from '../lib/services'
import FormAlert, { FieldError } from '../components/common/FormAlert'

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
  const navigate = useNavigate()
  const { applySession, user } = useAuth()
  const camera = useCameraCapture()

  const [nationalId, setNationalId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const idIsComplete = nationalId.replace(/\D/g, '').length === 12
  const canSubmit = idIsComplete && Boolean(camera.capture) && !submitting

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    setFieldErrors({})

    try {
      const result = await kycService.verifyFayda({
        fayda_id_number: nationalId,
        live_selfie_base64: camera.capture,
        liveness_passed: true,
      })

      // The account status inside the old token is stale now that the account
      // is verified, so the server issues a fresh one.
      applySession(result.token, result.user)
      navigate('/link-funding', { replace: true })
    } catch (err) {
      const mapped = err.fieldErrors ?? {}
      setFieldErrors({
        nationalId: mapped.fayda_id_number,
        selfie: mapped.live_selfie_base64 ?? mapped.liveness_passed,
      })
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell min-h-screen flex flex-col overflow-x-hidden selection:bg-primary/30 font-body-md">
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

      <main className="page-content flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-28 pb-20 flex flex-col items-center">
        <div className="w-full max-w-2xl mb-12 dersha-animate-in">
          <OnboardingStepper currentStep={2} />
        </div>

        <form
          className="dersha-card w-full max-w-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden dersha-animate-in"
          onSubmit={handleSubmit}
          style={{ animationDelay: '100ms' }}
          noValidate
        >
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
              {user && (
                <p className="mt-3 text-sm text-outline">
                  Verifying as <span className="text-on-surface font-semibold">{user.full_name_raw}</span>
                </p>
              )}
            </div>

            {error && (
              <div className="mb-8">
                <FormAlert tone="error" message={error} />
              </div>
            )}

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
              <FieldError message={fieldErrors.nationalId} />
            </div>

            <div className="mb-10">
              <label className="dersha-label mb-4 block tracking-widest">Biometric Validation</label>
              <div className="bg-surface-container-highest/50 border border-outline-variant/50 rounded-xl p-6 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-6">
                  <span className="dersha-eyebrow text-primary flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        camera.status === 'live' ? 'bg-primary animate-pulse' : 'bg-outline'
                      }`}
                    />
                    {camera.status === 'live'
                      ? 'Live Selfie Webcam'
                      : camera.status === 'captured'
                        ? 'Capture Ready'
                        : 'Camera Idle'}
                  </span>
                  <span className="text-on-surface-variant text-[12px] font-medium">
                    Align face within frame
                  </span>
                </div>

                <div className="relative w-48 h-48 md:w-56 md:h-56">
                  <div className="absolute inset-0 face-scan-overlay z-20" />
                  <div className="absolute inset-0 rounded-full overflow-hidden bg-surface-container-lowest">
                    {camera.capture ? (
                      <img
                        alt="Your captured selfie"
                        className="w-full h-full object-cover"
                        src={camera.capture}
                      />
                    ) : (
                      <video
                        aria-label="Live camera preview"
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        ref={camera.videoRef}
                      />
                    )}
                    {camera.status === 'live' && <div className="shimmer absolute inset-0 z-10" />}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {camera.status === 'idle' && (
                    <button
                      className="dersha-btn dersha-btn-primary px-6 py-3"
                      onClick={camera.start}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                        photo_camera
                      </span>
                      Start Camera
                    </button>
                  )}

                  {camera.status === 'starting' && (
                    <p className="text-sm text-on-surface-variant">Requesting camera access…</p>
                  )}

                  {camera.status === 'live' && (
                    <button
                      className="dersha-btn dersha-btn-primary px-6 py-3"
                      onClick={camera.takePhoto}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                        center_focus_strong
                      </span>
                      Capture Photo
                    </button>
                  )}

                  {camera.status === 'captured' && (
                    <button
                      className="dersha-btn dersha-btn-ghost px-6 py-3"
                      onClick={camera.reset}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                        refresh
                      </span>
                      Retake
                    </button>
                  )}

                  {(camera.status === 'denied' || camera.status === 'idle') && (
                    <button
                      className="dersha-btn dersha-btn-ghost px-6 py-3"
                      onClick={camera.useSimulatedCapture}
                      type="button"
                    >
                      Use simulated capture
                    </button>
                  )}
                </div>

                {camera.error && (
                  <p className="mt-4 max-w-sm text-center text-[12px] text-on-surface-variant">
                    {camera.error}
                  </p>
                )}

                {camera.usedFallback && (
                  <p className="mt-4 max-w-sm text-center text-[12px] text-secondary">
                    Using a simulated capture. Real biometric matching requires a live camera.
                  </p>
                )}

                <p className="mt-6 dersha-eyebrow text-[11px] text-outline text-center max-w-sm">
                  By clicking continue, you agree to AI biometric matching with the National ID database.
                </p>
                <FieldError message={fieldErrors.selfie} />
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
              <button
                className="dersha-btn dersha-btn-primary w-full md:min-w-[240px] px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canSubmit}
                type="submit"
              >
                {submitting ? 'Verifying with Fayda…' : 'Verify & Continue'}
                {!submitting && (
                  <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                )}
              </button>
            </div>

            {!canSubmit && !submitting && (
              <p className="mt-4 text-center text-[12px] text-outline">
                {!idIsComplete
                  ? 'Enter all 12 digits of your Fayda ID to continue.'
                  : 'Capture a photo to continue.'}
              </p>
            )}
          </div>
        </form>

        <p className="mt-12 text-on-surface-variant dersha-eyebrow opacity-50 text-center">
          Fractional Wealth Ltd. · Authorized by ECMA · Data Protection Act Compliant
        </p>
      </main>
    </div>
  )
}
