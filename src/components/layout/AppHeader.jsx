import { DEMO_USER } from './navConfig'

export default function AppHeader({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-outline-variant/30 bg-[#f7f9fb]/80 px-4 backdrop-blur-xl md:px-10">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          aria-label="Open navigation"
          className="-ml-1 shrink-0 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            menu
          </span>
        </button>

        <div className="flex min-w-0 max-w-96 flex-1 items-center rounded-full border border-outline-variant/10 bg-surface-container-low px-4 py-2">
          <span className="material-symbols-outlined text-outline" aria-hidden="true">
            search
          </span>
          <input
            aria-label="Search assets, baskets, or history"
            className="ml-2 w-full min-w-0 border-none bg-transparent text-sm text-on-surface focus:outline-none focus:ring-0"
            placeholder="Search assets, baskets, or history"
            type="search"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-6">
        {['help', 'settings'].map((icon) => (
          <button
            key={icon}
            aria-label={icon}
            className="hidden rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container-high md:block"
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
        <div className="flex items-center gap-3 border-outline-variant/30 md:border-l md:pl-6">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-on-surface">{DEMO_USER.name}</p>
            <p className="text-[12px] text-outline">{DEMO_USER.tier}</p>
          </div>
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-secondary-container">
            <img
              alt=""
              className="h-full w-full object-cover"
              height={40}
              src={DEMO_USER.avatarUrl}
              width={40}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
