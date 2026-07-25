const IMAGES = {
  boleTower:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCt2XGUc1r0n2Z1ked4leCsZ7OMfgkCRFHXKRoVA2YOa40FjNgxYtd_QFAcRAlr3zOVGK8btnUaeRlCyJnqiI5KfuhiB1zXyAiKlLayGf-9EHUuakJ-OV3Ilmon43hrLVwB3IflvQqaH_Qvtri9m7-r1IN9MzkOGx8oyPuOLR4qa-3e07Isu92MP5SUgT0i8Pe8raRshZaoxJ0_xAJPNur05bM9ehPwiVZZvVWZspw7VC7s180H7XHHQn9YGl1H-TWDV94oYG6BFBKX',
  coffeeEstate:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCEOmyB-54fUdqbfrEKY5UUWQc9ujt1GMLmHEE244G3c7vOUXe2TCG5ioNjHjUaT5U4tQ3KDT0FQS0S9-D0ngdKE67sYclGLFhgMW2skeEWcR8oKJawS0wAv56ugAaAyCvOFhX8XRWBckloTFw1nxuKk2Vp6K0GvsHgXm_g4JwWNUurjB7MOyqsLtiHNguNqUJBmQHAXneAkCbAJSijDmPs7zf874_jNIytX3mCfYm3e_Y7ZVqreUgze7WvekmH-ZEVK4JIIftgRUGL',
  industrialPark:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCcy6lawloHv1AVEhFbfMX07pNcu6NqQKx1k4W4gvA13o43qbiDj8o6rzDsYGQaCilDCA_rXOeYu5v9Skzmwq-jwwg9iNOGypwe8GHXzBpBeTyx5GuM4hSFXH8Et_oC7xxHB52lo3duVF4pGvEXJE5C-GtQDgnkvmC2D9fjcFPc3QE0lYHSRvsxsYphOZMBZI6I1ACgPKl_sOFhW881YPGmTQwDDFwxv7zvjFSSc5hJOSXKGqbqFb3fgKVqiLajV_3ZIcNfTx0yvL4E',
  energyGrid:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBxWHW1RFPHr7273rLaOZ9przWhK1UN8wXw4FNZ68zdoABtej8rO6S6wpJ79h8RdrhWiRSakD74BmQbjLnTVZ2wvOZyO7x2e-UugqVF0oh1lDHCbYMyPXGdPvVSEfBG8eGQIK7-s0LOSQUuXnTSovIrejNCFgUg6nTNcLmflPyLrrhVXNZJU349V_nkrkwzGgg0Qyq0Gyjo8uLeGDBY0XlGB2tEp5wOoJyI0tp0hdO7kO9iiX3rRFnDkLhbgf4nV7MD2iuThm_c21yH',
}

export const MARKET_TABS = [
  { id: 'assets', label: 'Individual Assets' },
  { id: 'baskets', label: 'Community Baskets' },
]

export const CATEGORY_FILTERS = [
  'All',
  'Real Estate',
  'Land',
  'Industrial',
  'Agriculture',
  'Infrastructure',
]

export const SORT_OPTIONS = [
  { id: 'entry-desc', label: 'Minimum entry (high to low)' },
  { id: 'entry-asc', label: 'Minimum entry (low to high)' },
  { id: 'change-desc', label: '24h change' },
]

export const ASSETS = [
  {
    id: 'bole-high-rise-alpha',
    name: 'Bole High-Rise Alpha',
    category: 'Real Estate',
    meta: 'Addis Ababa, Ethiopia',
    metaIcon: 'location_on',
    image: IMAGES.boleTower,
    imageAlt: 'Aerial view of the Bole district skyline in Addis Ababa at dusk',
    minEntry: 15000,
    change: 2.45,
  },
  {
    id: 'sidama-coffee-estate',
    name: 'Sidama Coffee Estate',
    category: 'Agriculture',
    meta: 'Sidama Region',
    metaIcon: 'location_on',
    image: IMAGES.coffeeEstate,
    imageAlt: 'Rows of coffee plants on a highland estate in the Sidama region',
    minEntry: 8500,
    change: -0.12,
  },
  {
    id: 'dukem-industrial-park-vi',
    name: 'Dukem Industrial Park VI',
    category: 'Industrial',
    meta: 'Oromia Region',
    metaIcon: 'location_on',
    image: IMAGES.industrialPark,
    imageAlt: 'Logistics warehouses and cargo bays at an industrial park',
    minEntry: 45000,
    change: 1.18,
  },
  {
    id: 'blue-nile-energy-bonds',
    name: 'Blue Nile Energy Bonds',
    category: 'Infrastructure',
    meta: 'National Network',
    metaIcon: 'bolt',
    image: IMAGES.energyGrid,
    imageAlt: 'Hydroelectric infrastructure under construction',
    minEntry: 1200,
    change: 0.85,
  },
]

export const BASKETS = [
  {
    id: 'agri-tech-premium',
    name: 'Agri-Tech Premium',
    category: 'Agriculture',
    meta: '6 underlying assets',
    metaIcon: 'inventory_2',
    image: IMAGES.coffeeEstate,
    imageAlt: 'Highland farmland grouped into a diversified agriculture basket',
    minEntry: 5000,
    change: 12.4,
  },
  {
    id: 'addis-yield-core',
    name: 'Addis Yield Core',
    category: 'Real Estate',
    meta: '4 underlying assets',
    metaIcon: 'inventory_2',
    image: IMAGES.boleTower,
    imageAlt: 'Commercial towers grouped into a leased real estate basket',
    minEntry: 22000,
    change: 3.06,
  },
  {
    id: 'highland-power-index',
    name: 'Highland Power Index',
    category: 'Infrastructure',
    meta: '9 underlying assets',
    metaIcon: 'inventory_2',
    image: IMAGES.energyGrid,
    imageAlt: 'Energy infrastructure grouped into a national index basket',
    minEntry: 3400,
    change: -0.74,
  },
]

export const MARKET_HIGHLIGHTS = [
  {
    id: 'top-performer',
    label: 'Top performer',
    value: '+12.4%',
    name: 'Agri-Tech Premium',
    detail: 'Basket, Agriculture',
  },
  {
    id: 'most-liquid',
    label: 'Most traded today',
    value: '318 trades',
    name: 'Bole High-Rise Alpha',
    detail: 'Asset, Real Estate',
  },
]

export const TRENDING_SECTORS = [
  { id: 'industrial', label: 'Industrial', icon: 'factory', share: 82 },
  { id: 'agriculture', label: 'Agriculture', icon: 'agriculture', share: 67 },
  { id: 'energy', label: 'Energy', icon: 'bolt', share: 49 },
]

export function formatEtb(amount) {
  return `ETB ${amount.toLocaleString('en-US')}`
}

export function formatChange(change) {
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
}
