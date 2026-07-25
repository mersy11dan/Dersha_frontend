import AppSidebar from './AppSidebar'
import AppHeader from './AppHeader'
import AppFooter from './AppFooter'

export default function DashboardLayout({
  sidebarVariant = 'exchange',
  brandName,
  activeNav,
  children,
}) {
  return (
    <div className="wallet-app">
      <AppSidebar activeItem={activeNav} brandName={brandName} variant={sidebarVariant} />
      <main className="ml-64 flex min-h-screen flex-col">
        <AppHeader />
        {children}
        <AppFooter />
      </main>
    </div>
  )
}

export { AppSidebar, AppHeader, AppFooter }
