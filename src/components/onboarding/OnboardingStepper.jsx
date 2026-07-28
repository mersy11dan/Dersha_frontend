const STEPS = [
  { icon: 'person', label: '01. ACCOUNT INFO' },
  { icon: 'verified_user', label: '02. IDENTITY' },
  { icon: 'account_balance_wallet', label: '03. FUNDING LINK' },
]

export default function OnboardingStepper({ currentStep, className = '' }) {
  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`.trim()}>
      {STEPS.map((step, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === currentStep
        const isComplete = stepNumber < currentStep

        return (
          <div
            key={step.label}
            className={`flex items-center gap-3 p-3 rounded-[2px] border font-mono text-xs font-bold transition-all ${
              isActive
                ? 'border-[#D4FF00] bg-[#D4FF00] text-[#000000] shadow-[2px_2px_0px_#ffffff]'
                : isComplete
                  ? 'border-[#2AFF0A] bg-[#2AFF0A]/10 text-[#2AFF0A]'
                  : 'border-white/10 bg-[#050505] text-[#8c8c8c]'
            }`}
          >
            <span className="material-symbols-outlined text-base">{step.icon}</span>
            <span className="truncate">{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}
