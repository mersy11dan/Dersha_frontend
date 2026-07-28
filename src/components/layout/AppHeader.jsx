import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { titleCase } from '../../lib/format'

function initialsOf(name) {
  return String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export default function AppHeader({ onMenuClick, isCollapsed, onToggleCollapse }) {
  const { user, logout } = useAuth()
  const { isDark, isPearl, toggleTheme } = useTheme()
  const name = user?.full_name_raw ?? 'David Owner'
  const status = user?.account_status
    ? titleCase(user.account_status.replace(/_/g, ' '))
    : 'VERIFIED INVESTOR'

  return (
    <header className={`fixed top-0 right-0 z-40 flex h-20 w-full transition-all duration-300 ${
      isCollapsed ? 'lg:w-[calc(100%-80px)]' : 'lg:w-[calc(100%-260px)]'
    } items-center justify-between gap-4 px-4 sm:px-6 md:px-8 py-3 bg-transparent backdrop-blur-md`}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Mobile menu button */}
        <button
          aria-label="Open navigation"
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-on-surface-variant hover:text-white transition-colors lg:hidden shrink-0"
          onClick={onMenuClick}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            menu
          </span>
        </button>

        {/* Desktop sidebar toggle button */}
        {onToggleCollapse && (
          <button
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex w-10 h-10 rounded-full glass-card items-center justify-center text-on-surface-variant hover:text-white transition-all shrink-0"
            onClick={onToggleCollapse}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isCollapsed ? 'menu_open' : 'menu'}
            </span>
          </button>
        )}

        {/* Search Bar */}
        <div className="relative flex items-center w-full max-w-xl h-12 rounded-full glass-card overflow-hidden focus-within:border-primary-fixed/50 transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant pl-4 text-[20px]">
            search
          </span>
          <input
            className="w-full bg-transparent border-none text-white focus:ring-0 px-3 font-body-md text-[14px] placeholder-on-surface-variant/50 outline-none"
            placeholder="Search Here..."
            type="text"
          />
          <div className="mr-2 px-2.5 py-1 bg-white/10 rounded-md shrink-0">
            <span className="font-label-sm text-[10px] text-on-surface-variant">⌘K</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {/* Theme switch button: 3-state cycle dark → light → pearl → dark */}
        <button
          onClick={toggleTheme}
          aria-label={
            isDark ? 'Switch to Graphite Light' : isPearl ? 'Switch to Dark Mode' : 'Switch to Pearl Light'
          }
          title={
            isDark ? 'Switch to Graphite Light' : isPearl ? 'Switch to Dark Mode' : 'Switch to Pearl Light'
          }
          className={`h-10 px-3 rounded-full glass-card flex items-center gap-1.5 hover:scale-105 transition-all shadow-md shrink-0 ${
            isPearl
              ? 'text-[#2563eb] border border-[#2563eb]/30'
              : 'text-primary-fixed'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isDark ? 'light_mode' : isPearl ? 'dark_mode' : 'wb_sunny'}
          </span>
          <span className={`font-label-sm text-[9px] font-bold uppercase tracking-wider hidden sm:inline ${isPearl ? 'text-[#2563eb]' : 'text-primary-fixed'}`}>
            {isDark ? 'GRAPHITE' : isPearl ? 'OBSIDIAN' : 'PEARL'}
          </span>
        </button>

        {/* Notification & Chat action buttons */}
        <button
          aria-label="Chat"
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-on-surface-variant hover:text-white transition-colors hidden sm:flex"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
        </button>

        <button
          aria-label="Notifications"
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-on-surface-variant hover:text-white transition-colors relative"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-fixed chart-glow" />
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full glass-card">
          <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary flex items-center justify-center font-title-md text-[13px] font-bold shadow-[0_0_10px_rgba(213,251,69,0.4)] shrink-0">
            {initialsOf(name)}
          </div>
          <div className="text-left leading-tight hidden md:block">
            <div className="font-title-md text-[13px] text-white font-medium">{name}</div>
            <div className="font-label-sm text-[10px] text-primary-fixed uppercase tracking-wider">{status}</div>
          </div>
          <button
            aria-label="Log out"
            className="rounded-full p-1 text-on-surface-variant hover:text-white hover:bg-white/10 transition-colors"
            onClick={logout}
            type="button"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              logout
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
