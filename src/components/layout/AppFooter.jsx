export default function AppFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-transparent text-[#a0a0a0] font-body-md transition-colors duration-200">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-6 py-10 md:px-10 md:grid-cols-4 text-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-fixed text-black font-extrabold text-xs chart-glow">
              D
            </div>
            <h4 className="font-display-lg text-base text-white tracking-tight">DERSHA</h4>
          </div>
          <p className="font-body-md text-xs leading-relaxed text-[#a0a0a0]">
            © 2026 DERSHA DIGITAL EXCHANGE. Institutional Grade Fractional Real Asset Investing. Regulated CELL Platform for Ethiopia.
          </p>
        </div>
        <div>
          <h5 className="mb-3 font-label-sm text-[11px] font-bold uppercase tracking-wider text-white">RESOURCES</h5>
          <ul className="space-y-2.5 font-body-md text-xs text-[#a0a0a0]">
            <li><a className="hover:text-primary-fixed transition-colors" href="#">Sub-Fund Prospectus</a></li>
            <li><a className="hover:text-primary-fixed transition-colors" href="#">Valuation Methodology</a></li>
            <li><a className="hover:text-primary-fixed transition-colors" href="#">EthSwitch Settlement Guide</a></li>
          </ul>
        </div>
        <div>
          <h5 className="mb-3 font-label-sm text-[11px] font-bold uppercase tracking-wider text-white">REGULATION</h5>
          <ul className="space-y-2.5 font-body-md text-xs text-[#a0a0a0]">
            <li><a className="hover:text-primary-fixed transition-colors" href="#">ECMA Framework ET-2026</a></li>
            <li><a className="hover:text-primary-fixed transition-colors" href="#">Custodian Trustee Agreement</a></li>
            <li><a className="hover:text-primary-fixed transition-colors" href="#">Fayda ID Protocol</a></li>
          </ul>
        </div>
        <div>
          <h5 className="mb-3 font-label-sm text-[11px] font-bold uppercase tracking-wider text-primary-fixed">CUSTODY SECURITY</h5>
          <div className="glass-card flex items-center gap-3 rounded-2xl border border-white/15 p-3.5 text-white">
            <span className="material-symbols-outlined text-lg text-primary-fixed chart-glow" aria-hidden="true">
              verified_user
            </span>
            <span className="font-label-sm text-[11px] font-bold uppercase text-white">CBE CUSTODIAN BANK TRUSTEE</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
