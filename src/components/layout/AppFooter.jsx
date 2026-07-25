export default function AppFooter() {
  return (
    <footer className="mt-auto border-t border-outline-variant/20 bg-surface-container-lowest">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-10 py-12 md:grid-cols-4">
        <div>
          <h4 className="mb-4 text-xl font-semibold text-[#006948]">Adisa Capital</h4>
          <p className="text-xs leading-relaxed text-outline">
            © 2024 Adisa Capital. Institutional Grade Fractional Investing. Regulated digital asset
            exchange services for Ethiopia.
          </p>
        </div>
        <div>
          <h5 className="mb-6 text-xs font-bold uppercase text-on-surface">Resources</h5>
          <ul className="space-y-3 text-sm text-on-surface-variant">
            <li><a className="hover:text-[#006948]" href="#">Help Center</a></li>
            <li><a className="hover:text-[#006948]" href="#">Contact Support</a></li>
            <li><a className="hover:text-[#006948]" href="#">Risk Factors</a></li>
          </ul>
        </div>
        <div>
          <h5 className="mb-6 text-xs font-bold uppercase text-on-surface">Legal</h5>
          <ul className="space-y-3 text-sm text-on-surface-variant">
            <li><a className="hover:text-[#006948]" href="#">Legal Disclosures</a></li>
            <li><a className="hover:text-[#006948]" href="#">Privacy Policy</a></li>
            <li><a className="hover:text-[#006948]" href="#">Terms of Service</a></li>
          </ul>
        </div>
        <div>
          <h5 className="mb-6 text-xs font-bold uppercase text-on-surface">Security</h5>
          <div className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
            <span className="material-symbols-outlined text-[#006948]" aria-hidden="true">
              verified_user
            </span>
            <span className="text-[12px] font-bold text-on-surface">SOC2 Compliant Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
