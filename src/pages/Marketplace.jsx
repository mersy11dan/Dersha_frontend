import { useCallback, useMemo, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import AssetCard from '../components/marketplace/AssetCard'
import BasketCard from '../components/marketplace/BasketCard'
import MarketInsights from '../components/marketplace/MarketInsights'
import {
  BASKET_SORT_OPTIONS,
  CATEGORY_FILTERS,
  MARKET_TABS,
  SORT_OPTIONS,
} from '../components/marketplace/constants'
import {
  EmptyPanel,
  ErrorPanel,
  LiveBadge,
  LoadingPanel,
} from '../components/common/DataStates'
import { useAsyncData } from '../hooks/useAsyncData'
import { basketService, marketService } from '../lib/services'
import { useRealtime, useRealtimeStatus } from '../lib/realtime'
import { categoryLabel } from '../lib/format'

function sortAssets(assets, sortId) {
  const sorted = [...assets]

  if (sortId === 'price-asc')
    return sorted.sort((a, b) => a.price_per_share_etb - b.price_per_share_etb)
  if (sortId === 'change-desc')
    return sorted.sort(
      (a, b) => (b.price_change_24h_percentage ?? -Infinity) - (a.price_change_24h_percentage ?? -Infinity),
    )
  if (sortId === 'volume-desc')
    return sorted.sort((a, b) => b.volume_24h_etb - a.volume_24h_etb)
  return sorted.sort((a, b) => b.price_per_share_etb - a.price_per_share_etb)
}

function sortListings(listings, sortId) {
  const sorted = [...listings]

  if (sortId === 'price-asc')
    return sorted.sort((a, b) => a.price_per_unit_etb - b.price_per_unit_etb)
  if (sortId === 'premium-asc')
    return sorted.sort(
      (a, b) => a.premium_to_nav_percentage - b.premium_to_nav_percentage,
    )
  return sorted.sort((a, b) => b.price_per_unit_etb - a.price_per_unit_etb)
}

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState('assets')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sortId, setSortId] = useState('price-desc')

  const realtimeStatus = useRealtimeStatus()

  const assets = useAsyncData(
    () => marketService.listAssets({ category, search }),
    [category, search],
  )
  const highlights = useAsyncData(() => marketService.highlights(), [])
  const baskets = useAsyncData(() => basketService.listed(), [])

  // A fill anywhere on the platform moves a mark, so the grid refreshes on any
  // market event rather than trying to patch a single row in place.
  const onMarketEvent = useCallback(() => {
    void assets.reload()
    void highlights.reload()
    void baskets.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useRealtime('market', onMarketEvent)

  const visibleAssets = useMemo(
    () => sortAssets(assets.data ?? [], sortId),
    [assets.data, sortId],
  )
  const visibleBaskets = useMemo(
    () => sortListings(baskets.data ?? [], sortId),
    [baskets.data, sortId],
  )

  const isAssets = activeTab === 'assets'
  const active = isAssets ? assets : baskets
  const sortOptions = isAssets ? SORT_OPTIONS : BASKET_SORT_OPTIONS

  return (
    <DashboardLayout activeNav="marketplace" sidebarVariant="exchange">
      <div className="flex flex-1 flex-col gap-10 px-6 py-8 md:px-10 xl:flex-row xl:gap-8">
        <section className="min-w-0 flex-1">
          <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
                  Marketplace
                </h1>
                <LiveBadge status={realtimeStatus} />
              </div>
              <p className="mt-2 max-w-xl text-on-surface-variant">
                Buy fractional units of appraised Ethiopian assets, held in trust by a custodian
                bank.
              </p>
            </div>

            <div
              aria-label="Market type"
              className="flex w-fit shrink-0 rounded-xl bg-surface-container-low p-1"
              role="group"
            >
              {MARKET_TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    aria-pressed={isActive}
                    className={`rounded-lg px-5 py-2 text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setSortId('price-desc')
                    }}
                    type="button"
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </header>

          <div className="mb-8 flex flex-col gap-4">
            {isAssets && (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div
                  aria-label="Filter by sector"
                  className="market-filter-row flex gap-3 overflow-x-auto pb-1"
                  role="group"
                >
                  {CATEGORY_FILTERS.map((filter) => {
                    const isActive = category === filter.id
                    return (
                      <button
                        key={filter.id || 'all'}
                        aria-pressed={isActive}
                        className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary font-bold text-on-primary'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container'
                        }`}
                        onClick={() => setCategory(filter.id)}
                        type="button"
                      >
                        {filter.label}
                      </button>
                    )
                  })}
                </div>

                <label className="relative shrink-0">
                  <span className="sr-only">Search assets</span>
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline"
                  >
                    search
                  </span>
                  <input
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-2 pl-10 pr-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 lg:w-64"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name or location"
                    type="search"
                    value={search}
                  />
                </label>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <label className="text-xs text-outline" htmlFor="marketplace-sort">
                Sort by
              </label>
              <select
                className="cursor-pointer rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                id="marketplace-sort"
                onChange={(event) => setSortId(event.target.value)}
                value={sortId}
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {active.loading && !active.data ? (
            <LoadingPanel label="Loading the market" rows={4} />
          ) : active.error ? (
            <ErrorPanel error={active.error} onRetry={active.refetch} />
          ) : isAssets ? (
            visibleAssets.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
                {visibleAssets.map((asset) => (
                  <AssetCard key={asset.sub_fund_id} asset={asset} />
                ))}
              </div>
            ) : (
              <EmptyPanel
                description="New sub-funds are listed once valuation and custody checks clear. Try another sector in the meantime."
                icon="search_off"
                title={
                  category
                    ? `Nothing listed under ${categoryLabel(category)} yet`
                    : 'No assets listed yet'
                }
                action={
                  category ? (
                    <button
                      className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
                      onClick={() => setCategory('')}
                      type="button"
                    >
                      Show all sectors
                    </button>
                  ) : null
                }
              />
            )
          ) : visibleBaskets.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
              {visibleBaskets.map((listing) => (
                <BasketCard key={listing.listing_id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyPanel
              description="Baskets appear here once an investor assembles one and offers units for sale."
              icon="shopping_basket"
              title="No baskets on the market"
            />
          )}
        </section>

        <aside
          aria-label="Market insights"
          className="w-full shrink-0 border-outline-variant/30 xl:w-80 xl:border-l xl:pl-8"
        >
          <MarketInsights
            assets={assets.data ?? []}
            highlights={highlights.data}
            loading={highlights.loading}
          />
        </aside>
      </div>
    </DashboardLayout>
  )
}
