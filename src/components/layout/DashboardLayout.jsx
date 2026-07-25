import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AppSidebar from './AppSidebar'
import AppHeader from './AppHeader'
import AppFooter from './AppFooter'

export default function DashboardLayout({ sidebarVariant = 'exchange', activeNav, children }) {
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!navOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setNavOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [navOpen])

  return (
    <div className="wallet-app">
      <AppSidebar
        activeItem={activeNav}
        onClose={() => setNavOpen(false)}
        open={navOpen}
        variant={sidebarVariant}
      />

      {navOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-on-surface/40 lg:hidden"
          onClick={() => setNavOpen(false)}
          tabIndex={-1}
          type="button"
        />
      )}

      <main className="flex min-h-screen flex-col lg:ml-64">
        <AppHeader onMenuClick={() => setNavOpen(true)} />
        {children}
        <AppFooter />
      </main>
    </div>
  )
}

export { AppSidebar, AppHeader, AppFooter }
