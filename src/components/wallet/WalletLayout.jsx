import DashboardLayout from '../layout/DashboardLayout'

/** @deprecated Prefer DashboardLayout directly for new pages */
export default function WalletLayout({ sidebarVariant = 'exchange', children }) {
  return (
    <DashboardLayout activeNav="wallet" sidebarVariant={sidebarVariant}>
      {children}
    </DashboardLayout>
  )
}

export { default as AppSidebar } from '../layout/AppSidebar'
export { default as DashboardLayout } from '../layout/DashboardLayout'
export { SIDEBAR_VARIANTS, PORTFOLIO_NAV } from '../layout/navConfig'
