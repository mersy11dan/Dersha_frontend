import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PORTFOLIO_CHILDREN, PORTFOLIO_NAV, SIDEBAR_VARIANTS } from './navConfig'

function BrandHeader({ variant, brandName }) {
  const config = SIDEBAR_VARIANTS[variant]
  const lines = brandName ? [brandName] : config.brandLines
  const isExchange = variant === 'exchange'

  if (isExchange && !brandName) {
    return (
      <div className="mb-8 mt-4 px-6">
        <div className="flex items-stretch gap-3">
          <span aria-hidden="true" className="w-0.5 shrink-0 rounded-full bg-[#006948]" />
          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[#006948]">
              {lines[0]}
              <br />
              {lines[1]}
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-outline opacity-80">
              Institutional Grade
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={isExchange ? 'mb-8 mt-4 px-6' : 'p-8'}>
      <h1
        className={`font-bold tracking-tight text-[#006948] ${
          isExchange ? 'text-[28px] leading-tight' : 'text-headline-md'
        }`}
      >
        {lines.join(' ')}
      </h1>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-outline opacity-80">
        Institutional Grade
      </p>
    </div>
  )
}

function SidebarLink({ item, isActive, variant, nested = false }) {
  const isExchange = variant === 'exchange'

  const baseClass = nested
    ? 'block rounded-lg px-4 py-2 text-sm transition-colors duration-200'
    : 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200'

  const inactiveClass = nested
    ? 'text-on-surface-variant hover:bg-surface-container-high'
    : 'text-on-surface-variant hover:bg-surface-container-highest'

  const activeClass = nested
    ? isExchange
      ? 'border-r-2 border-[#006948] bg-secondary-container/10 font-bold text-[#006948]'
      : 'bg-[#006948]/10 font-bold text-[#006948]'
    : 'bg-surface-container-highest font-bold text-[#006948]'

  const className = `${baseClass} ${isActive ? activeClass : inactiveClass}`

  if (item.href.startsWith('/')) {
    return (
      <Link aria-current={isActive ? 'page' : undefined} className={className} to={item.href}>
        {!nested && (
          <span className="material-symbols-outlined" aria-hidden="true">
            {item.icon}
          </span>
        )}
        {item.label}
      </Link>
    )
  }

  return (
    <a aria-current={isActive ? 'page' : undefined} className={className} href={item.href}>
      {!nested && (
        <span className="material-symbols-outlined" aria-hidden="true">
          {item.icon}
        </span>
      )}
      {item.label}
    </a>
  )
}

function resolveActiveItem(activeItem, pathname) {
  if (activeItem) return activeItem

  if (pathname.startsWith('/wallet')) return 'wallet'
  if (pathname.startsWith('/portfolio/assets')) return 'assets'
  if (pathname.startsWith('/marketplace')) return 'marketplace'
  if (pathname.startsWith('/how-it-works')) return 'how-it-works'
  if (pathname.startsWith('/custom-baskets')) return 'custom-baskets'
  if (pathname.startsWith('/ai-advisor')) return 'ai-advisor'

  return null
}

export default function AppSidebar({
  variant = 'exchange',
  brandName,
  activeItem,
  userName = 'John Doe',
  userInitials = 'JD',
  portfolioExpanded: portfolioExpandedProp,
}) {
  const location = useLocation()
  const config = SIDEBAR_VARIANTS[variant]
  const isExchange = variant === 'exchange'

  const currentItem = resolveActiveItem(activeItem, location.pathname)
  const isPortfolioChildActive = PORTFOLIO_CHILDREN.has(currentItem)

  const [portfolioExpandedState, setPortfolioExpandedState] = useState(
    portfolioExpandedProp ?? isPortfolioChildActive,
  )

  const portfolioExpanded = portfolioExpandedProp ?? portfolioExpandedState

  const togglePortfolio = () => {
    if (portfolioExpandedProp === undefined) {
      setPortfolioExpandedState((open) => !open)
    }
  }

  return (
    <aside
      aria-label="Main navigation"
      className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-outline-variant/30 ${
        isExchange ? 'bg-surface-container-low' : 'bg-surface-container-lowest'
      }`}
    >
      <BrandHeader brandName={brandName} variant={variant} />

      <nav aria-label="Primary" className="flex-1 space-y-1 px-4">
        {config.mainNav.map((item) => (
          <SidebarLink
            key={item.id}
            isActive={currentItem === item.id}
            item={item}
            variant={variant}
          />
        ))}

        <div className="space-y-1 pt-1">
          <button
            aria-controls="portfolio-submenu"
            aria-expanded={portfolioExpanded}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 font-bold transition-all duration-200 ${
              isExchange
                ? isPortfolioChildActive
                  ? 'text-on-surface-variant'
                  : 'text-on-surface-variant hover:bg-surface-container-highest'
                : 'bg-[#006948]/5 text-[#006948]'
            }`}
            onClick={togglePortfolio}
            type="button"
          >
            <div className="flex items-center gap-3">
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
                style={!isExchange ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                account_balance_wallet
              </span>
              <span className="text-sm font-medium">Portfolio</span>
            </div>
            <span
              className={`material-symbols-outlined text-sm transition-transform duration-200 ${
                portfolioExpanded ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            >
              expand_more
            </span>
          </button>

          {portfolioExpanded && (
            <div
              className={isExchange ? 'flex flex-col pl-6' : 'space-y-1 pl-12'}
              id="portfolio-submenu"
            >
              {PORTFOLIO_NAV.map((item) => (
                <SidebarLink
                  key={item.id}
                  isActive={currentItem === item.id}
                  item={item}
                  nested
                  variant={variant}
                />
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="mt-auto p-4 pb-6">
        {config.footer === 'user' ? (
          <div className="flex items-center gap-3 border-t border-outline-variant px-4 py-4 pt-6">
            <div
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00855d] text-xs font-bold text-white"
            >
              {userInitials}
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-on-surface">
              {userName}
            </span>
          </div>
        ) : (
          <div className="wallet-panel p-4">
            <p className="mb-2 text-xs font-semibold text-outline">Portfolio Health</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-outline-variant/30">
              <div className="h-full w-[85%] rounded-full bg-[#006948]" />
            </div>
            <p className="mt-2 text-right text-[11px] font-bold text-[#006948]">Excellent</p>
          </div>
        )}
      </div>
    </aside>
  )
}
