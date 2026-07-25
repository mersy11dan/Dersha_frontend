export const SIDEBAR_VARIANTS = {
  exchange: {
    brandLines: ['Dirsha', 'Exchange'],
    mainNav: [
      { id: 'marketplace', label: 'Marketplace', icon: 'storefront', href: '/marketplace' },
      { id: 'how-it-works', label: 'How It Works', icon: 'info', href: '/how-it-works' },
      { id: 'custom-baskets', label: 'Custom Baskets', icon: 'shopping_bag', href: '/custom-baskets' },
      { id: 'ai-advisor', label: 'AI Advisor', icon: 'psychology', href: '/ai-advisor' },
    ],
    footer: 'user',
  },
  adisa: {
    brandLines: ['Adisa Capital'],
    mainNav: [
      { id: 'marketplace', label: 'Explore Marketplace', icon: 'explore', href: '/marketplace' },
      { id: 'how-it-works', label: 'How It Works', icon: 'info', href: '/how-it-works' },
      { id: 'custom-baskets', label: 'Custom Baskets', icon: 'shopping_basket', href: '/custom-baskets' },
      { id: 'ai-advisor', label: 'AI Advisor', icon: 'psychology', href: '/ai-advisor' },
    ],
    footer: 'health',
  },
}

export const PORTFOLIO_NAV = [
  { id: 'assets', label: 'Assets', href: '/portfolio/assets' },
  { id: 'wallet', label: 'Wallet', href: '/wallet/deposit' },
]

export const PORTFOLIO_CHILDREN = new Set(['assets', 'wallet'])
