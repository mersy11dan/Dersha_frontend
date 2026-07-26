export const SIDEBAR_VARIANTS = {
  exchange: {
    mainNav: [
      { id: 'marketplace', label: 'Marketplace', icon: 'storefront', href: '/marketplace' },
      { id: 'custom-baskets', label: 'Custom Baskets', icon: 'shopping_bag', href: '/custom-baskets' },
    ],
    footer: null,
  },
  adisa: {
    mainNav: [
      { id: 'marketplace', label: 'Explore Marketplace', icon: 'explore', href: '/marketplace' },
      { id: 'custom-baskets', label: 'Custom Baskets', icon: 'shopping_basket', href: '/custom-baskets' },
    ],
    footer: null,
  },
}

export const PORTFOLIO_NAV = [
  { id: 'assets', label: 'Assets', href: '/portfolio/assets' },
  { id: 'wallet', label: 'Wallet', href: '/wallet/deposit' },
]

export const PORTFOLIO_CHILDREN = new Set(['assets', 'wallet'])
