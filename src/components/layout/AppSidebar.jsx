import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  PORTFOLIO_CHILDREN,
  PORTFOLIO_NAV,
  SIDEBAR_VARIANTS,
} from "./navConfig";

function SidebarLink({ item, isActive, nested = false, onNavigate }) {
  const shape = nested
    ? "block rounded-lg px-4 py-2 text-sm"
    : "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium";

  const tone = isActive
    ? "bg-primary/10 font-bold text-primary"
    : "text-on-surface-variant hover:bg-surface-container-highest";

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`${shape} ${tone} transition-colors duration-200`}
      onClick={onNavigate}
      to={item.href}
    >
      {!nested && (
        <span className="material-symbols-outlined" aria-hidden="true">
          {item.icon}
        </span>
      )}
      {item.label}
    </Link>
  );
}

function resolveActiveItem(activeItem, pathname) {
  if (activeItem) return activeItem;

  if (pathname.startsWith("/wallet")) return "wallet";
  if (pathname.startsWith("/portfolio/assets")) return "assets";
  if (pathname.startsWith("/marketplace")) return "marketplace";
  if (pathname.startsWith("/custom-baskets")) return "custom-baskets";

  return null;
}

export default function AppSidebar({
  variant = "exchange",
  activeItem,
  open = false,
  onClose,
  portfolioExpanded: portfolioExpandedProp,
}) {
  const location = useLocation();
  const config = SIDEBAR_VARIANTS[variant];

  const currentItem = resolveActiveItem(activeItem, location.pathname);
  const isPortfolioChildActive = PORTFOLIO_CHILDREN.has(currentItem);

  const [portfolioExpandedState, setPortfolioExpandedState] = useState(
    portfolioExpandedProp ?? isPortfolioChildActive,
  );

  const portfolioExpanded = portfolioExpandedProp ?? portfolioExpandedState;

  const togglePortfolio = () => {
    if (portfolioExpandedProp === undefined) {
      setPortfolioExpandedState((expanded) => !expanded);
    }
  };

  return (
    <aside
      aria-label="Main navigation"
      className={`app-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-outline-variant/30 lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      } ${variant === "exchange" ? "bg-surface-container-low" : "bg-surface-container-lowest"}`}
    >
      <div className="flex h-20 shrink-0 items-center justify-between gap-2 px-6">
        <Link aria-label="DERSHA home" onClick={onClose} to="/marketplace">
          <img alt="DERSHA" className="h-9 w-auto" src="/logo-light.svg" />
        </Link>
        <button
          aria-label="Close navigation"
          className="-mr-2 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-highest lg:hidden"
          onClick={onClose}
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            close
          </span>
        </button>
      </div>

      <nav
        aria-label="Primary"
        className="flex-1 space-y-1 overflow-y-auto px-4 py-4"
      >
        {config.mainNav.map((item) => (
          <SidebarLink
            key={item.id}
            isActive={currentItem === item.id}
            item={item}
            onNavigate={onClose}
          />
        ))}

        <div>
          <button
            aria-controls="portfolio-submenu"
            aria-expanded={portfolioExpanded}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${
              isPortfolioChildActive
                ? "text-primary"
                : "text-on-surface-variant hover:bg-surface-container-highest"
            }`}
            onClick={togglePortfolio}
            type="button"
          >
            <span className="flex items-center gap-3">
              <span className="material-symbols-outlined" aria-hidden="true">
                account_balance_wallet
              </span>
              Portfolio
            </span>
            <span
              aria-hidden="true"
              className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                portfolioExpanded ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </button>

          {portfolioExpanded && (
            <div className="mt-1 space-y-1 pl-5" id="portfolio-submenu">
              {PORTFOLIO_NAV.map((item) => (
                <SidebarLink
                  key={item.id}
                  isActive={currentItem === item.id}
                  item={item}
                  nested
                  onNavigate={onClose}
                />
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
