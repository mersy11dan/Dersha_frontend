import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import AllocationDonut from '../components/portfolio/AllocationDonut'
import HoldingRow from '../components/portfolio/HoldingRow'
import {
  EmptyPanel,
  ErrorPanel,
  LiveBadge,
  LoadingPanel,
} from '../components/common/DataStates'
import { useAsyncData } from '../hooks/useAsyncData'
import {
  basketService,
  ordersService,
  portfolioService,
  yieldService,
} from '../lib/services'
import { useRealtime, useRealtimeStatus } from '../lib/realtime'
import {
  categoryLabel,
  changeTone,
  formatEtb,
  formatRelative,
  formatShares,
  titleCase,
} from '../lib/format'

const OPEN_STATUSES = new Set(['PENDING', 'PARTIALLY_FILLED'])

export default function Assets() {
  const [category, setCategory] = useState('')
  const realtimeStatus = useRealtimeStatus()

  const summary = useAsyncData(() => portfolioService.summary(), [])
  const holdings = useAsyncData(() => portfolioService.holdings(), [])
  const activity = useAsyncData(() => portfolioService.activity(12), [])
  const orders = useAsyncData(() => ordersService.mine(), [])
  const baskets = useAsyncData(() => basketService.mine(), [])
  const income = useAsyncData(() => yieldService.income(), [])

  const refreshAll = useCallback(() => {
    void summary.reload()
    void holdings.reload()
    void activity.reload()
    void orders.reload()
    void baskets.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useRealtime('market', refreshAll)

  const allHoldings = holdings.data ?? []
  const categories = useMemo(
    () => [...new Set(allHoldings.map((holding) => holding.category))],
    [allHoldings],
  )
  const visible = category
    ? allHoldings.filter((holding) => holding.category === category)
    : allHoldings

  const openOrders = (orders.data ?? []).filter((order) => OPEN_STATUSES.has(order.status))
  const ownedBaskets = (baskets.data ?? []).filter(
    (basket) => basket.my_basket_shares > 0,
  )

  return (
    <DashboardLayout activeNav="assets" sidebarVariant="exchange">
      <div className="flex flex-1 flex-col gap-8 px-6 py-8 md:px-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
                My portfolio
              </h1>
              <LiveBadge status={realtimeStatus} />
            </div>
            <p className="mt-2 max-w-xl text-on-surface-variant">
              Every position you hold, valued at the latest mark from the exchange.
            </p>
          </div>
          <Link
            className="w-fit rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
            to="/marketplace"
          >
            Browse the market
          </Link>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            detail={`${summary.data?.holding_count ?? 0} assets · ${summary.data?.basket_count ?? 0} baskets`}
            label="Total portfolio value"
            loading={summary.loading}
            value={formatEtb(summary.data?.total_portfolio_value_etb)}
          />
          <SummaryCard
            detail="Ready to trade or withdraw"
            label="Cash available"
            loading={summary.loading}
            value={formatEtb(summary.data?.cash_available_etb)}
          />
          <SummaryCard
            detail={`${formatEtb(summary.data?.cash_escrowed_etb)} committed to open orders`}
            label="Securities value"
            loading={summary.loading}
            value={formatEtb(summary.data?.securities_value_etb)}
          />
          <SummaryCard
            detail={`${formatEtb(income.data?.lifetime_tax_withheld_etb)} withheld for tax`}
            label="Lifetime income"
            loading={income.loading}
            tone="text-primary"
            value={formatEtb(income.data?.lifetime_net_etb)}
          />
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-8">
            <section>
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-on-surface">Holdings</h2>
                {categories.length > 1 && (
                  <div className="flex flex-wrap gap-2" role="group">
                    <FilterPill
                      active={category === ''}
                      label="All"
                      onClick={() => setCategory('')}
                    />
                    {categories.map((item) => (
                      <FilterPill
                        key={item}
                        active={category === item}
                        label={categoryLabel(item)}
                        onClick={() => setCategory(item)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {holdings.loading && !holdings.data ? (
                <LoadingPanel label="Loading holdings" />
              ) : holdings.error ? (
                <ErrorPanel error={holdings.error} onRetry={holdings.refetch} />
              ) : visible.length === 0 ? (
                <EmptyPanel
                  action={
                    <Link
                      className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
                      to="/marketplace"
                    >
                      Find your first asset
                    </Link>
                  }
                  description="Buy fractional shares of appraised Ethiopian assets and they will appear here."
                  icon="account_balance_wallet"
                  title={category ? 'Nothing in this sector' : 'You have no holdings yet'}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {visible.map((holding) => (
                    <HoldingRow key={holding.sub_fund_id} holding={holding} />
                  ))}
                </div>
              )}
            </section>

            {ownedBaskets.length > 0 && (
              <section>
                <h2 className="mb-5 text-xl font-semibold text-on-surface">Baskets</h2>
                <div className="flex flex-col gap-3">
                  {ownedBaskets.map((basket) => (
                    <Link
                      key={basket.basket_id}
                      className="wallet-panel flex items-center justify-between gap-4 p-5 transition-colors hover:border-primary/40"
                      to={`/custom-baskets/${basket.basket_id}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-on-surface">
                          {basket.basket_name}
                        </p>
                        <p className="text-sm text-on-surface-variant">
                          {formatShares(basket.my_basket_shares)} of{' '}
                          {formatShares(basket.total_basket_shares)} units ·{' '}
                          {basket.constituent_count} sub-funds
                          {basket.is_creator ? ' · you created this' : ''}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-on-surface">
                          {formatEtb(basket.my_position_value_etb, { decimals: 2 })}
                        </p>
                        <p className="text-xs text-outline">
                          NAV {formatEtb(basket.nav_per_basket_share_etb, { decimals: 2 })}/unit
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-5 text-xl font-semibold text-on-surface">Open orders</h2>
              {openOrders.length === 0 ? (
                <p className="wallet-panel p-6 text-sm text-on-surface-variant">
                  Nothing resting on the book. Orders you place appear here until they fill or
                  you cancel them.
                </p>
              ) : (
                <div className="wallet-panel divide-y divide-outline-variant/20">
                  {openOrders.map((order) => (
                    <div
                      key={order.order_id}
                      className="flex items-center justify-between gap-4 p-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-on-surface">
                          <span
                            className={
                              order.direction === 'BUY' ? 'text-primary' : 'text-error'
                            }
                          >
                            {order.direction}
                          </span>{' '}
                          {order.asset_name}
                        </p>
                        <p className="text-sm text-on-surface-variant">
                          {formatShares(
                            order.total_shares_ordered - order.filled_shares_accumulated,
                          )}{' '}
                          of {formatShares(order.total_shares_ordered)} shares at{' '}
                          {formatEtb(order.target_price_per_share_etb, { decimals: 2 })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                          {titleCase(order.status)}
                        </span>
                        <button
                          className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:border-error hover:text-error"
                          onClick={async () => {
                            await ordersService.cancel(order.order_id)
                            refreshAll()
                          }}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-8">
            <AllocationDonut
              basketValue={summary.data?.basket_value_etb ?? 0}
              cash={summary.data?.cash_available_etb ?? 0}
              holdings={allHoldings}
            />

            <section className="wallet-panel p-6">
              <h2 className="mb-4 text-lg font-semibold text-on-surface">Unrealised result</h2>
              <p
                className={`text-3xl font-bold ${changeTone(summary.data?.unrealised_gain_etb)}`}
              >
                {formatEtb(summary.data?.unrealised_gain_etb, { decimals: 2 })}
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Measured against what you paid at issue. It moves with every trade on the
                exchange and is not realised until you sell.
              </p>
            </section>

            <section className="wallet-panel p-6">
              <h2 className="mb-4 text-lg font-semibold text-on-surface">Recent activity</h2>
              {(activity.data ?? []).length === 0 ? (
                <p className="text-sm text-on-surface-variant">Nothing has happened yet.</p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {activity.data.map((item) => (
                    <li key={`${item.stream}-${item.id}`} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {activityIcon(item)}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-on-surface">
                          {activityLabel(item)}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {formatEtb(item.amount_etb, { decimals: 2 })} ·{' '}
                          {formatRelative(item.occurred_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="wallet-panel p-6">
              <h2 className="mb-4 text-lg font-semibold text-on-surface">Income and tax</h2>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-on-surface-variant">Gross distributions</dt>
                  <dd className="font-semibold text-on-surface">
                    {formatEtb(income.data?.lifetime_gross_etb, { decimals: 2 })}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-on-surface-variant">
                    Withholding tax ({((income.data?.withholding_tax_rate ?? 0.1) * 100).toFixed(0)}%)
                  </dt>
                  <dd className="font-semibold text-error">
                    −{formatEtb(income.data?.lifetime_tax_withheld_etb, { decimals: 2 })}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-outline-variant/20 pt-3">
                  <dt className="font-semibold text-on-surface">Net received</dt>
                  <dd className="font-bold text-primary">
                    {formatEtb(income.data?.lifetime_net_etb, { decimals: 2 })}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-on-surface-variant">
                Tax is withheld at source and remitted on your behalf, so the net figure is what
                reached your wallet.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}

function SummaryCard({ label, value, detail, loading, tone = 'text-on-surface' }) {
  return (
    <div className="wallet-panel p-5">
      <p className="text-xs text-outline">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${tone}`}>{loading ? '—' : value}</p>
      <p className="mt-1.5 text-xs text-on-surface-variant">{detail}</p>
    </div>
  )
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary font-bold text-on-primary'
          : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

function activityIcon(item) {
  if (item.stream === 'TRADE') return item.label === 'BUY' ? 'trending_up' : 'trending_down'
  if (item.label === 'DEPOSIT') return 'south_west'
  if (item.label === 'WITHDRAWAL') return 'north_east'
  if (item.label === 'DIVIDEND_PAYOUT') return 'payments'
  if (item.label === 'BASKET_ROYALTY') return 'workspace_premium'
  return 'receipt_long'
}

function activityLabel(item) {
  if (item.stream === 'TRADE') {
    return `${item.label === 'BUY' ? 'Bought' : 'Sold'} ${formatShares(item.shares)} ${
      item.asset_name
    }`
  }
  return titleCase(item.label)
}
