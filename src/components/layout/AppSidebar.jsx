import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ACCOUNT_NAV,
  PORTFOLIO_CHILDREN,
  PORTFOLIO_NAV,
  SIDEBAR_VARIANTS,
} from "./navConfig";

function DershaLogo({ isCollapsed }) {
  return (
    <div className="flex items-center gap-3">
      {/* Premium Geometric "D" Shield Emblem */}
      <div className={`relative ${isCollapsed ? 'w-9 h-9' : 'w-8 h-8'} rounded-xl bg-gradient-to-br from-[#d5fb45] via-[#a3e635] to-[#457000] flex items-center justify-center text-black font-black shadow-[0_0_20px_rgba(213,251,69,0.4)] shrink-0 transition-all`}>
        <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 3H12C16.4183 3 20 6.58172 20 11V13C20 17.4183 16.4183 21 12 21H4V3Z"
            fill="currentColor"
            fillOpacity="0.9"
          />
          <path
            d="M8 7H11.5C13.9853 7 16 9.01472 16 11.5C16 13.9853 13.9853 16 11.5 16H8V7Z"
            fill="#050505"
          />
          <circle cx="11.5" cy="11.5" r="2" fill="#d5fb45" />
        </svg>
      </div>
      {!isCollapsed && (
        <div>
          <h1 className="font-display-lg text-[20px] font-extrabold text-white leading-none tracking-tight">
            DERSHA
          </h1>
          <span className="font-label-sm text-[9px] text-primary-fixed tracking-widest uppercase block mt-0.5">
            DIGITAL EXCHANGE
          </span>
        </div>
      )}
    </div>
  );
}

function SidebarLink({ item, isActive, isCollapsed, onNavigate }) {
  const shape = isCollapsed
    ? "flex items-center justify-center p-2 rounded-full font-title-md text-[14px] transition-all group relative"
    : "flex items-center gap-3.5 px-3.5 py-2.5 rounded-full font-title-md text-[14px] transition-all group relative";
  
  const tone = isActive
    ? "bg-white/10 backdrop-blur-md text-white font-semibold border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
    : "text-on-surface-variant hover:bg-white/5 hover:text-white";

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`${shape} ${tone}`}
      onClick={onNavigate}
      to={item.href}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isActive
            ? "bg-primary-fixed text-on-primary font-bold shadow-[0_0_10px_rgba(213,251,69,0.4)]"
            : "bg-white/10 text-white"
        }`}
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {item.icon}
        </span>
      </div>

      {!isCollapsed && <span className="truncate">{item.label}</span>}

      {/* Floating Hover Tooltip in Collapsed Mode */}
      {isCollapsed && (
        <span className="absolute left-full ml-3.5 hidden group-hover:block z-50 bg-[#121414]/95 text-white font-title-md text-xs px-3 py-1.5 rounded-xl shadow-2xl border border-white/20 whitespace-nowrap pointer-events-none">
          {item.label}
        </span>
      )}
    </Link>
  );
}

function resolveActiveItem(activeItem, pathname) {
  if (activeItem) return activeItem;

  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/wallet/deposit")) return "deposit";
  if (pathname.startsWith("/wallet/withdrawal")) return "withdrawal";
  if (pathname.startsWith("/portfolio/assets")) return "assets";
  if (pathname.startsWith("/marketplace")) return "marketplace";
  if (pathname.startsWith("/custom-baskets")) return "custom-baskets";
  if (pathname.startsWith("/stock-comparison")) return "stock-comparison";
  if (pathname.startsWith("/account-info")) return "account-info";
  if (pathname.startsWith("/identity-verification")) return "identity-verification";
  if (pathname.startsWith("/link-funding")) return "link-funding";

  return null;
}

export default function AppSidebar({
  variant = "exchange",
  activeItem,
  open = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
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
      className={`glass-nav fixed inset-y-0 left-0 z-50 flex flex-col py-5 px-3 transition-all duration-300 ${
        isCollapsed ? "lg:w-[80px]" : "lg:w-[260px]"
      } w-[260px] ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      {/* HEADER WITH DERSHA LOGO & COLLAPSE TOGGLE */}
      <div className={`mb-5 flex items-center justify-between ${isCollapsed ? "px-1 justify-center" : "px-3"}`}>
        <Link
          aria-label="Dersha home"
          onClick={onClose}
          to="/dashboard"
          className="flex items-center gap-3"
        >
          <DershaLogo isCollapsed={isCollapsed} />
        </Link>

        {/* Desktop Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex w-7 h-7 rounded-full bg-white/10 border border-white/15 items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-base">
              {isCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        )}

        {/* Mobile Close Button */}
        <button
          aria-label="Close navigation"
          className="rounded-full p-1.5 text-on-surface-variant hover:bg-white/10 transition-colors lg:hidden"
          onClick={onClose}
          type="button"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            close
          </span>
        </button>
      </div>

      <nav
        aria-label="Primary"
        className="flex-1 overflow-y-auto pr-1 space-y-5 overflow-x-hidden"
      >
        {/* MARKET NAVIGATION */}
        <div>
          {!isCollapsed && (
            <p className="font-label-sm text-[11px] text-on-surface-variant mb-2.5 ml-4 tracking-wider uppercase">
              Market Navigation
            </p>
          )}
          <ul className="space-y-1.5">
            {config.mainNav.map((item) => (
              <li key={item.id}>
                <SidebarLink
                  isActive={currentItem === item.id}
                  isCollapsed={isCollapsed}
                  item={item}
                  onNavigate={onClose}
                />
              </li>
            ))}
          </ul>
        </div>

        {/* PORTFOLIO & CASH SECTION */}
        <div>
          {!isCollapsed && (
            <p className="font-label-sm text-[11px] text-on-surface-variant mb-2.5 ml-4 tracking-wider uppercase">
              Portfolio & Cash
            </p>
          )}
          <button
            aria-controls="portfolio-submenu"
            aria-expanded={portfolioExpanded}
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center p-2" : "justify-between px-3.5 py-2.5"
            } rounded-full font-title-md text-[14px] transition-all group relative ${
              isPortfolioChildActive
                ? "bg-white/10 text-white font-semibold border border-white/15"
                : "text-on-surface-variant hover:bg-white/5 hover:text-white"
            }`}
            onClick={togglePortfolio}
            type="button"
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isPortfolioChildActive
                    ? "bg-primary-fixed text-on-primary font-bold"
                    : "bg-white/10 text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  account_balance_wallet
                </span>
              </div>
              {!isCollapsed && <span>Portfolio</span>}
            </div>
            {!isCollapsed && (
              <span
                className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                  portfolioExpanded ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            )}
            {isCollapsed && (
              <span className="absolute left-full ml-3.5 hidden group-hover:block z-50 bg-[#121414]/95 text-white font-title-md text-xs px-3 py-1.5 rounded-xl shadow-2xl border border-white/20 whitespace-nowrap pointer-events-none">
                Portfolio
              </span>
            )}
          </button>

          {portfolioExpanded && !isCollapsed && (
            <ul
              className="mt-2 space-y-1.5 pl-3 ml-4 border-l border-white/10"
              id="portfolio-submenu"
            >
              {PORTFOLIO_NAV.map((item) => (
                <li key={item.id}>
                  <Link
                    aria-current={currentItem === item.id ? "page" : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-full font-title-md text-[13px] transition-colors ${
                      currentItem === item.id
                        ? "text-primary-fixed font-bold bg-primary-fixed/10"
                        : "text-on-surface-variant hover:text-white hover:bg-white/5"
                    }`}
                    onClick={onClose}
                    to={item.href}
                  >
                    <span className="material-symbols-outlined text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ACCOUNT & VERIFICATION SECTION */}
        <div>
          {!isCollapsed && (
            <p className="font-label-sm text-[11px] text-on-surface-variant mb-2.5 ml-4 tracking-wider uppercase">
              Account & Verification
            </p>
          )}
          <ul className="space-y-1.5">
            {ACCOUNT_NAV.map((item) => (
              <li key={item.id}>
                <SidebarLink
                  isActive={currentItem === item.id}
                  isCollapsed={isCollapsed}
                  item={item}
                  onNavigate={onClose}
                />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* FOOTER PILL */}
      <div className="mt-auto pt-3 border-t border-white/10">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2 px-2"} text-primary-fixed mb-1`}>
          <span className="h-2 w-2 rounded-full bg-primary-fixed animate-pulse shrink-0" />
          {!isCollapsed && <span className="font-label-sm text-[11px] font-bold tracking-wider">ECMA LICENSED</span>}
        </div>
        {!isCollapsed && (
          <p className="text-on-surface-variant text-[10px] px-2 font-body-md">
            CBE Custodian Trustee Active
          </p>
        )}
      </div>
    </aside>
  );
}
