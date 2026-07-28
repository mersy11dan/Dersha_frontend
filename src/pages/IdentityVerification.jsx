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
    <div className="page-shell vortex-grid-bg flex min-h-screen flex-col bg-[#000000] text-[#ffffff]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-2 border-[#D4FF00] bg-[#000000] px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[2px] bg-[#D4FF00] font-mono text-base font-black text-[#000000]">
            D
          </div>
          <span className="font-mono text-sm font-black tracking-widest text-[#D4FF00]">DERSHA</span>
        </Link>
        <div className="font-mono text-xs text-[#2AFF0A]">
          ECMA IDENTITY VERIFICATION
        </div>
      </header>

      <main className="flex-1 px-4 py-12 md:px-10 flex flex-col items-center">
        <div className="w-full max-w-2xl mb-8">
          <OnboardingStepper currentStep={2} />
        </div>

        <form
          className="vortex-panel w-full max-w-2xl p-8 bg-[#050505] shadow-[8px_8px_0px_#000000]"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="mb-6 border-b border-[#D4FF00]/30 pb-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#D4FF00]">
              STEP 02. FAYDA NATIONAL ID & BIOMETRICS
            </span>
            <h1 className="font-sans text-2xl font-bold uppercase tracking-tight text-[#ffffff]">
              VERIFY YOUR IDENTITY
            </h1>
            <p className="font-sans text-xs text-[#a0a0a0] mt-1">
              Link your 12-digit Fayda ID to unlock institutional marketplace participation.
            </p>
            {user && (
              <p className="mt-2 font-mono text-xs text-[#2AFF0A]">
                APPLICANT: {user.full_name_raw}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-6">
              <FormAlert tone="error" message={error} />
            </div>
          )}

          <div className="mb-8 space-y-1.5">
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#D4FF00]" htmlFor="national-id">
              FAYDA NATIONAL ID NUMBER (12 DIGITS)
            </label>
            <input
              className="vortex-input font-mono text-lg tracking-widest"
              id="national-id"
              name="nationalId"
              placeholder="1234-5678-9012"
              spellCheck={false}
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(formatNationalId(e.target.value))}
            />
            <FieldError message={fieldErrors.nationalId} />
          </div>

          {/* Biometric Capture Panel */}
          <div className="mb-8 space-y-3">
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#D4FF00]">
              BIOMETRIC LIVENESS SCAN
            </label>
            <div className="rounded-[2px] border border-[#D4FF00]/40 bg-[#000000] p-6 flex flex-col items-center text-center">
              <div className="mb-4 font-mono text-xs text-[#2AFF0A]">
                STATUS: {camera.status === 'live' ? 'WEBCAM ACTIVE' : camera.status === 'captured' ? 'PHOTO CAPTURED' : 'CAMERA IDLE'}
              </div>

              <div className="relative w-48 h-48 border-2 border-[#D4FF00] rounded-full overflow-hidden bg-[#0a0a0a]">
                {camera.capture ? (
                  <img
                    alt="Captured selfie"
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
              </div>

              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                {camera.status === 'idle' && (
                  <button
                    className="vortex-btn-secondary py-2 text-xs"
                    onClick={camera.start}
                    type="button"
                  >
                    START CAMERA
                  </button>
                )}

                {camera.status === 'live' && (
                  <button
                    className="vortex-btn-primary py-2 text-xs"
                    onClick={camera.takePhoto}
                    type="button"
                  >
                    CAPTURE PHOTO
                  </button>
                )}

                {camera.status === 'captured' && (
                  <button
                    className="vortex-btn-ghost py-2 text-xs"
                    onClick={camera.reset}
                    type="button"
                  >
                    RETAKE PHOTO
                  </button>
                )}

                {(camera.status === 'denied' || camera.status === 'idle') && (
                  <button
                    className="vortex-btn-ghost py-2 text-xs"
                    onClick={camera.useSimulatedCapture}
                    type="button"
                  >
                    SIMULATE BIOMETRICS
                  </button>
                )}
              </div>

              <FieldError message={fieldErrors.selfie} />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <Link className="font-mono text-xs text-[#a0a0a0] hover:text-[#ffffff]" to="/account-info">
              ← BACK
            </Link>
            <button
              className="vortex-btn-primary py-3.5 px-8 disabled:opacity-50"
              disabled={!canSubmit}
              type="submit"
            >
              {submitting ? 'VERIFYING WITH FAYDA...' : 'VERIFY & CONTINUE →'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
