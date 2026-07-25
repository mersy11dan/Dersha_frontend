import { useMemo, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import AssetCard from '../components/marketplace/AssetCard'
import MarketInsights from '../components/marketplace/MarketInsights'
import {
  ASSETS,
  BASKETS,
  CATEGORY_FILTERS,
  MARKET_TABS,
  SORT_OPTIONS,
} from '../components/marketplace/constants'

function sortItems(items, sortId) {
  const sorted = [...items]

  if (sortId === 'entry-asc') return sorted.sort((a, b) => a.minEntry - b.minEntry)
  if (sortId === 'change-desc') return sorted.sort((a, b) => b.change - a.change)
  return sorted.sort((a, b) => b.minEntry - a.minEntry)
}

function EmptyState({ category, onReset }) {
  return (
    <div className="wallet-panel flex flex-col items-center px-8 py-16 text-center">
      <span
        aria-hidden="true"
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high text-outline"
      >
        <span className="material-symbols-outlined">search_off</span>
      </span>
      <h3 className="mb-2 text-lg font-semibold text-on-surface">
        Nothing listed under {category} yet
      </h3>
      <p className="mb-6 max-w-sm text-sm text-on-surface-variant">
        New sub-funds are added once valuation and custody checks clear. Try another sector in the
        meantime.
      </p>
      <button
        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
        onClick={onReset}
        type="button"
      >
        Show all sectors
      </button>
    </div>
  )
}

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState('assets')
  const [category, setCategory] = useState('All')
  const [sortId, setSortId] = useState('entry-desc')

  const visibleItems = useMemo(() => {
    const source = activeTab === 'assets' ? ASSETS : BASKETS
    const filtered =
      category === 'All' ? source : source.filter((item) => item.category === category)

    return sortItems(filtered, sortId)
  }, [activeTab, category, sortId])

  return (
    <DashboardLayout activeNav="marketplace" sidebarVariant="exchange">
      <div className="flex flex-1 flex-col gap-10 px-6 py-8 md:px-10 xl:flex-row xl:gap-8">
        <section className="min-w-0 flex-1">
          <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
                Marketplace
              </h1>
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
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </header>

          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              aria-label="Filter by sector"
              className="market-filter-row flex gap-3 overflow-x-auto pb-1"
              role="group"
            >
              {CATEGORY_FILTERS.map((filter) => {
                const isActive = category === filter
                return (
                  <button
                    key={filter}
                    aria-pressed={isActive}
                    className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary font-bold text-on-primary'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container'
                    }`}
                    onClick={() => setCategory(filter)}
                    type="button"
                  >
                    {filter}
                  </button>
                )
              })}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <label className="text-xs text-outline" htmlFor="marketplace-sort">
                Sort by
              </label>
              <select
                className="cursor-pointer rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                id="marketplace-sort"
                onChange={(event) => setSortId(event.target.value)}
                value={sortId}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {visibleItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
              {visibleItems.map((item) => (
                <AssetCard
                  key={item.id}
                  ctaLabel={activeTab === 'baskets' ? 'View basket' : 'View details'}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <EmptyState category={category} onReset={() => setCategory('All')} />
          )}
        </section>

        <aside
          aria-label="Market insights"
          className="w-full shrink-0 border-outline-variant/30 xl:w-80 xl:border-l xl:pl-8"
        >
          <MarketInsights />
        </aside>
      </div>
    </DashboardLayout>
  )
}
