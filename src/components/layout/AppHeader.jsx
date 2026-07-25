import { AVATAR_URL } from '../wallet/constants'

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-outline-variant/30 bg-[#f7f9fb]/80 px-10 backdrop-blur-xl">
      <div className="flex w-96 items-center rounded-full border border-outline-variant/10 bg-surface-container-low px-4 py-2">
        <span className="material-symbols-outlined text-outline" aria-hidden="true">
          search
        </span>
        <input
          aria-label="Search assets, baskets, or history"
          className="ml-2 w-full border-none bg-transparent text-sm text-on-surface focus:outline-none focus:ring-0"
          placeholder="Search assets, baskets, or history…"
          type="search"
        />
      </div>

      <div className="flex items-center gap-6">
        {['help', 'settings'].map((icon) => (
          <button
            key={icon}
            aria-label={icon}
            className="rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container-high"
            type="button"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {icon}
            </span>
          </button>
        ))}
        <button
          aria-label="Notifications"
          className="relative rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container-high"
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            notifications
          </span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
        </button>
        <div className="flex items-center gap-3 border-l border-outline-variant/30 pl-6">
          <div className="text-right">
            <p className="text-sm font-medium text-on-surface">JD Investor</p>
            <p className="text-[12px] text-outline">Institutional Tier</p>
          </div>
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-[#006948]/20 bg-secondary-container">
            <img alt="" className="h-full w-full object-cover" height={40} src={AVATAR_URL} width={40} />
          </div>
        </div>
      </div>
    </header>
  )
}
