const STEPS = [
  { icon: 'person', label: 'Account Info' },
  { icon: 'verified_user', label: 'Identity' },
  { icon: 'account_balance_wallet', label: 'Bank/Wallet' },
]

function stepProgress(currentStep, totalSteps) {
  if (currentStep >= totalSteps) return 1
  return (currentStep - 0.5) / (totalSteps - 1)
}

export default function OnboardingStepper({ currentStep, className = '' }) {
  const progress = stepProgress(currentStep, STEPS.length)

  return (
    <div
      className={`dersha-step-track ${className}`.trim()}
      style={{ '--step-progress': progress }}
    >
      <div className="dersha-step-progress" aria-hidden="true" />

      {STEPS.map((step, index) => {
        const stepNumber = index + 1
        const state =
          stepNumber < currentStep ? 'complete' : stepNumber === currentStep ? 'active' : 'pending'

        const labelClass =
          state === 'active'
            ? 'dersha-step-label-active'
            : state === 'pending'
              ? 'dersha-step-label-pending'
              : 'text-on-surface'

        return (
          <div key={step.label} className="dersha-step-item gap-3">
            <div
              className={`dersha-step-dot dersha-step-dot-${state}${state === 'active' ? ' ring-4 ring-primary/20' : ''}`}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                {step.icon}
              </span>
            </div>
            <span className={`font-label-caps text-label-caps ${labelClass}`}>{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}
