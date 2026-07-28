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
      <div className="flex flex-1 flex-col font-body-md text-on-surface">
        <section className="min-w-0 flex-1">
          <header className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display-lg text-[32px] sm:text-[40px] font-extrabold text-white leading-tight">
                  Marketplace
                </h1>
                <LiveBadge status={realtimeStatus} />
              </div>
              <p className="mt-1 font-body-md text-[14px] text-white/60">
                Trade fractional book-entry real assets custodied with Commercial Bank of Ethiopia.
              </p>
            </div>

            {/* Pill Market Tabs */}
            <div
              aria-label="Market type"
              className="flex w-fit shrink-0 rounded-full border border-white/10 bg-black/40 p-1 font-title-md text-[13px] backdrop-blur-md"
              role="group"
            >
              {MARKET_TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    aria-pressed={isActive}
                    className={`rounded-full px-6 py-2 uppercase transition-all ${
                      isActive
                        ? 'bg-primary-fixed text-on-primary font-bold shadow-[0_0_12px_rgba(213,251,69,0.4)]'
                        : 'text-white/60 hover:text-white'
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

          {/* MARKET SNAPSHOT CARDS DIRECLTY BELOW HEADER */}
          <MarketInsights
            assets={assets.data ?? []}
            highlights={highlights.data}
            loading={highlights.loading}
          />

          <div className="mb-8 flex flex-col gap-4 font-body-md">
            {isAssets && (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Category Pill Filters */}
                <div
                  aria-label="Filter by sector"
                  className="market-filter-row flex gap-2 overflow-x-auto pb-1"
                  role="group"
                >
                  {CATEGORY_FILTERS.map((filter) => {
                    const isActive = category === filter.id
                    return (
                      <button
                        key={filter.id || 'all'}
                        aria-pressed={isActive}
                        className={`whitespace-nowrap rounded-full px-4 py-2 font-title-md text-[13px] transition-all ${
                          isActive
                            ? 'bg-white text-black font-bold shadow-md'
                            : 'glass-card border border-white/10 text-white/70 hover:text-white hover:border-primary-fixed/50'
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
                    className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-primary-fixed"
                  >
                    search
                  </span>
                  <input
                    className="w-full rounded-full glass-card border border-white/10 bg-transparent py-2 pl-10 pr-4 font-body-md text-[13px] text-white placeholder-white/40 focus:border-primary-fixed/50 focus:outline-none lg:w-64"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search asset or location..."
                    type="search"
                    value={search}
                  />
                </label>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 font-body-md text-[13px]">
              <label className="font-label-sm text-[11px] text-white/50 uppercase tracking-wider" htmlFor="marketplace-sort">
                Sort By:
              </label>
              <select
                className="cursor-pointer rounded-full glass-card border border-white/10 bg-black/40 px-4 py-1.5 font-title-md text-[13px] text-white focus:border-primary-fixed/50 focus:outline-none"
                id="marketplace-sort"
                onChange={(event) => setSortId(event.target.value)}
                value={sortId}
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id} className="bg-[#050505] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {active.loading && !active.data ? (
            <LoadingPanel label="Loading market telemetry..." rows={4} />
          ) : active.error ? (
            <ErrorPanel error={active.error} onRetry={active.refetch} />
          ) : isAssets ? (
            visibleAssets.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4.5">
                {visibleAssets.map((asset) => (
                  <AssetCard key={asset.sub_fund_id} asset={asset} />
                ))}
              </div>
            ) : (
              <EmptyPanel
                description="Sub-funds appear here once valuation and custody checks clear."
                icon="search_off"
                title={
                  category
                    ? `Nothing listed under ${categoryLabel(category)} yet`
                    : 'No assets listed yet'
                }
                action={
                  category ? (
                    <button
                      className="px-6 py-2.5 bg-primary-fixed text-on-primary rounded-xl font-title-md text-[13px] font-bold shadow-[0_0_15px_rgba(213,251,69,0.4)] hover:brightness-110 transition-all"
                      onClick={() => setCategory('')}
                      type="button"
                    >
                      SHOW ALL SECTORS
                    </button>
                  ) : null
                }
              />
            )
          ) : visibleBaskets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
              {visibleBaskets.map((listing) => (
                <BasketCard key={listing.listing_id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyPanel
              description="Custom index baskets will appear here when listed."
              icon="shopping_basket"
              title="No baskets on the market"
            />
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
