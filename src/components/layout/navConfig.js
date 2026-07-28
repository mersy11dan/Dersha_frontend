export const SIDEBAR_VARIANTS = {
  exchange: {
    mainNav: [
      { id: 'dashboard', label: 'Dashboard', icon: 'home', href: '/dashboard' },
      { id: 'marketplace', label: 'Marketplace', icon: 'storefront', href: '/marketplace' },
      { id: 'custom-baskets', label: 'Custom Baskets', icon: 'shopping_bag', href: '/custom-baskets' },
      { id: 'stock-comparison', label: 'Stock Comparison', icon: 'compare_arrows', href: '/stock-comparison' },
    ],
    footer: null,
  },
  adisa: {
    mainNav: [
      { id: 'dashboard', label: 'Dashboard', icon: 'home', href: '/dashboard' },
      { id: 'marketplace', label: 'Explore Marketplace', icon: 'explore', href: '/marketplace' },
      { id: 'custom-baskets', label: 'Custom Baskets', icon: 'shopping_basket', href: '/custom-baskets' },
      { id: 'stock-comparison', label: 'Stock Comparison', icon: 'compare_arrows', href: '/stock-comparison' },
    ],
    footer: null,
  },
}

export const PORTFOLIO_NAV = [
  { id: 'assets', label: 'My Assets', href: '/portfolio/assets', icon: 'pie_chart' },
  { id: 'deposit', label: 'Deposit Cash', href: '/wallet/deposit', icon: 'add_circle' },
  { id: 'withdrawal', label: 'Withdraw Cash', href: '/wallet/withdrawal', icon: 'do_not_disturb_on' },
]

export const ACCOUNT_NAV = [
  { id: 'account-info', label: 'Account Info', href: '/account-info', icon: 'manage_accounts' },
  { id: 'identity-verification', label: 'KYC Verification', href: '/identity-verification', icon: 'badge' },
  { id: 'link-funding', label: 'Bank Funding', href: '/link-funding', icon: 'account_balance' },
]

export const PORTFOLIO_CHILDREN = new Set(['assets', 'deposit', 'withdrawal', 'account-info', 'identity-verification', 'link-funding'])
