import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AppSidebar from './AppSidebar'
import AppHeader from './AppHeader'
import AppFooter from './AppFooter'

export default function DashboardLayout({ sidebarVariant = 'exchange', activeNav, children }) {
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('dersha_sidebar_collapsed') === 'true'
  })

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

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('dersha_sidebar_collapsed', String(next))
      return next
    })
  }

  return (
    <div className="min-h-screen flex text-on-surface font-body-md bg-transparent selection:bg-primary-fixed selection:text-on-primary overflow-x-hidden">
      <AppSidebar
        activeItem={activeNav}
        onClose={() => setNavOpen(false)}
        open={navOpen}
        variant={sidebarVariant}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {navOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setNavOpen(false)}
          tabIndex={-1}
          type="button"
        />
      )}

      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[260px]'} flex flex-col min-h-screen min-w-0 w-full`}>
        <AppHeader
          onMenuClick={() => setNavOpen(true)}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
        <main className="flex-1 mt-20 p-4 sm:p-6 md:p-8 overflow-y-auto min-h-[calc(100vh-5rem)] min-w-0 w-full">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  )
}

export { AppSidebar, AppHeader, AppFooter }
