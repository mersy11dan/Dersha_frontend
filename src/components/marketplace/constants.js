import { CATEGORY_KEYS, categoryLabel } from '../../lib/format'

export const MARKET_TABS = [
  { id: 'assets', label: 'Individual Assets' },
  { id: 'baskets', label: 'Community Baskets' },
]

/** "All" plus every category the backend can return, in display form. */
export const CATEGORY_FILTERS = [
  { id: '', label: 'All' },
  ...CATEGORY_KEYS.map((key) => ({ id: key, label: categoryLabel(key) })),
]

export const SORT_OPTIONS = [
  { id: 'price-desc', label: 'Share price (high to low)' },
  { id: 'price-asc', label: 'Share price (low to high)' },
  { id: 'change-desc', label: '24h change' },
  { id: 'volume-desc', label: 'Most traded' },
]

export const BASKET_SORT_OPTIONS = [
  { id: 'price-desc', label: 'Unit price (high to low)' },
  { id: 'price-asc', label: 'Unit price (low to high)' },
  { id: 'premium-asc', label: 'Best value against NAV' },
]

/**
 * Category artwork.
 *
 * Assets carry no imagery of their own yet, so the marketplace falls back to a
 * representative photograph per sector rather than an empty grey panel.
 */
const CATEGORY_IMAGES = {
  LOGISTICS_VEHICLE:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCcy6lawloHv1AVEhFbfMX07pNcu6NqQKx1k4W4gvA13o43qbiDj8o6rzDsYGQaCilDCA_rXOeYu5v9Skzmwq-jwwg9iNOGypwe8GHXzBpBeTyx5GuM4hSFXH8Et_oC7xxHB52lo3duVF4pGvEXJE5C-GtQDgnkvmC2D9fjcFPc3QE0lYHSRvsxsYphOZMBZI6I1ACgPKl_sOFhW881YPGmTQwDDFwxv7zvjFSSc5hJOSXKGqbqFb3fgKVqiLajV_3ZIcNfTx0yvL4E',
  REAL_ESTATE:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCt2XGUc1r0n2Z1ked4leCsZ7OMfgkCRFHXKRoVA2YOa40FjNgxYtd_QFAcRAlr3zOVGK8btnUaeRlCyJnqiI5KfuhiB1zXyAiKlLayGf-9EHUuakJ-OV3Ilmon43hrLVwB3IflvQqaH_Qvtri9m7-r1IN9MzkOGx8oyPuOLR4qa-3e07Isu92MP5SUgT0i8Pe8raRshZaoxJ0_xAJPNur05bM9ehPwiVZZvVWZspw7VC7s180H7XHHQn9YGl1H-TWDV94oYG6BFBKX',
  AGRICULTURE:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCEOmyB-54fUdqbfrEKY5UUWQc9ujt1GMLmHEE244G3c7vOUXe2TCG5ioNjHjUaT5U4tQ3KDT0FQS0S9-D0ngdKE67sYclGLFhgMW2skeEWcR8oKJawS0wAv56ugAaAyCvOFhX8XRWBckloTFw1nxuKk2Vp6K0GvsHgXm_g4JwWNUurjB7MOyqsLtiHNguNqUJBmQHAXneAkCbAJSijDmPs7zf874_jNIytX3mCfYm3e_Y7ZVqreUgze7WvekmH-ZEVK4JIIftgRUGL',
  INFRASTRUCTURE:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBxWHW1RFPHr7273rLaOZ9przWhK1UN8wXw4FNZ68zdoABtej8rO6S6wpJ79h8RdrhWiRSakD74BmQbjLnTVZ2wvOZyO7x2e-UugqVF0oh1lDHCbYMyPXGdPvVSEfBG8eGQIK7-s0LOSQUuXnTSovIrejNCFgUg6nTNcLmflPyLrrhVXNZJU349V_nkrkwzGgg0Qyq0Gyjo8uLeGDBY0XlGB2tEp5wOoJyI0tp0hdO7kO9iiX3rRFnDkLhbgf4nV7MD2iuThm_c21yH',
}

export function categoryImage(category) {
  return CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES.REAL_ESTATE
}
