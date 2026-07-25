export const DEMO_USER = {
  name: 'Abebe Kebede',
  initials: 'AK',
  tier: 'Institutional Tier',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA77FNU6-MEmGDE_ZC_ZTBs-IOUKn2oCeBeyyk-sEmY9C_rpuTvgEUErgIK5tVSBZw6u2Cfn-FmYP6_BiD_3oprNKMrAoKfSktS0Xw83JxyZup-9hvyklXsQTfMh9AFaTZJpjW80AohtoRVMh6NDlmipo7TEs5xkTd0CuLzo0DewtC0LWCLM6qOa3o3-RZwoKUh_nQIGhncG3-qFUJvj6kYKmfzaLDrS6VUbVKK-ImrYYAyrNOtktt_4VpqXems3nq_WLV8uliDU0I4',
}

export const SIDEBAR_VARIANTS = {
  exchange: {
    mainNav: [
      { id: 'marketplace', label: 'Marketplace', icon: 'storefront', href: '/marketplace' },
      { id: 'custom-baskets', label: 'Custom Baskets', icon: 'shopping_bag', href: '/custom-baskets' },
      { id: 'ai-advisor', label: 'AI Advisor', icon: 'psychology', href: '/ai-advisor' },
    ],
    footer: null,
  },
  adisa: {
    mainNav: [
      { id: 'marketplace', label: 'Explore Marketplace', icon: 'explore', href: '/marketplace' },
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
