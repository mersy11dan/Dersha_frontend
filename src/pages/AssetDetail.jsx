import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import OrderBook from '../components/marketplace/OrderBook'
import TradeTicket from '../components/marketplace/TradeTicket'
import PriceSparkline from '../components/marketplace/PriceSparkline'
import { ErrorPanel, LiveBadge, LoadingPanel } from '../components/common/DataStates'
import { useAsyncData } from '../hooks/useAsyncData'
import {
  marketService,
  ordersService,
  portfolioService,
  walletService,
  yieldService,
} from '../lib/services'
import { realtimeTopics, useRealtime, useRealtimeStatus } from '../lib/realtime'
import {
  categoryIcon,
  categoryLabel,
  changeTone,
  formatChange,
  formatDate,
  formatEtb,
  formatRelative,
  formatShares,
  titleCase,
} from '../lib/format'

const OPEN_STATUSES = new Set(['PENDING', 'PARTIALLY_FILLED'])

export default function AssetDetail() {
  const { subFundId } = useParams()
  const realtimeStatus = useRealtimeStatus()
  const [ticketHint, setTicketHint] = useState({ price: null, direction: null })

  const asset = useAsyncData(() => marketService.getAsset(subFundId), [subFundId])
  const book = useAsyncData(() => marketService.orderBook(subFundId), [subFundId])
  const holdings = useAsyncData(() => portfolioService.holdings(), [])
  const balance = useAsyncData(() => walletService.balance(), [])
  const orders = useAsyncData(() => ordersService.mine(), [])
  const distributions = useAsyncData(
    () => yieldService.distributions(subFundId),
    [subFundId],
  )

  const refreshAll = useCallback(() => {
    void asset.reload()
    void book.reload()
    void holdings.reload()
    void balance.reload()
    void orders.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useRealtime(realtimeTopics.subFund(subFundId), refreshAll)

  const data = asset.data
  const holding = (holdings.data ?? []).find((row) => row.sub_fund_id === subFundId)
  const openOrders = (orders.data ?? []).filter(
    (order) => order.sub_fund_id === subFundId && OPEN_STATUSES.has(order.status),
  )

  if (asset.loading && !data) {
    return (
      <DashboardLayout activeNav="marketplace" sidebarVariant="exchange">
        <div className="px-6 py-8 md:px-10">
          <LoadingPanel label="Loading asset" rows={5} />
        </div>
      </DashboardLayout>
    )
  }

  if (asset.error || !data) {
    return (
      <DashboardLayout activeNav="marketplace" sidebarVariant="exchange">
        <div className="px-6 py-8 md:px-10">
          <ErrorPanel error={asset.error} onRetry={asset.refetch} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeNav="marketplace" sidebarVariant="exchange">
      <div className="flex flex-1 flex-col gap-8 px-6 py-8 md:px-10">
        <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Link className="hover:text-primary" to="/marketplace">
            Marketplace
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-on-surface">{data.asset_name}</span>
        </nav>

        <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-primary-container px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-on-primary-container">
                {categoryLabel(data.category)}
              </span>
              <span className="rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                {titleCase(data.sub_fund_status)}
              </span>
              <LiveBadge status={realtimeStatus} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
              {data.asset_name}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-on-surface-variant">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                {categoryIcon(data.category)}
              </span>
              {data.location}
            </p>
          </div>

          <div className="shrink-0 text-left lg:text-right">
            <p className="text-xs text-outline">Mark price</p>
            <p className="text-4xl font-bold text-on-surface">
              {formatEtb(data.price_per_share_etb, { decimals: 2 })}
            </p>
            <p className={`mt-1 text-sm font-bold ${changeTone(data.price_change_24h_percentage)}`}>
              {data.price_change_24h_percentage === null
                ? 'No prior trade to compare'
                : `${formatChange(data.price_change_24h_percentage)} over 24h`}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Appraised value" value={formatEtb(data.appraised_value_etb)} />
          <Stat
            label="Market capitalisation"
            value={formatEtb(data.market_capitalisation_etb)}
          />
          <Stat label="24h volume" value={formatEtb(data.volume_24h_etb)} />
          <Stat label="Issued shares" value={formatShares(data.total_issued_shares)} />
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-8">
            <PriceSparkline
              nominalPrice={data.nominal_price_per_share_etb}
              trades={data.recent_trades ?? []}
            />

            <OrderBook
              book={book.data}
              onPickPrice={(price, direction) => setTicketHint({ price, direction })}
            />

            <section className="wallet-panel p-6">
              <h2 className="mb-5 text-lg font-semibold text-on-surface">Recent trades</h2>
              {(data.recent_trades ?? []).length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  No trades yet. The first fill will set the market price.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-outline">
                        <th className="pb-2 font-bold">Time</th>
                        <th className="pb-2 font-bold">Price</th>
                        <th className="pb-2 text-right font-bold">Shares</th>
                        <th className="pb-2 text-right font-bold">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {data.recent_trades.slice(0, 12).map((trade, index) => (
                        <tr key={`${trade.executed_at}-${index}`}>
                          <td className="py-2 text-on-surface-variant">
                            {formatRelative(trade.executed_at)}
                          </td>
                          <td className="py-2 font-semibold text-on-surface">
                            {formatEtb(trade.price_per_share_etb, { decimals: 2 })}
                          </td>
                          <td className="py-2 text-right text-on-surface-variant">
                            {formatShares(trade.shares)}
                          </td>
                          <td className="py-2 text-right text-xs text-outline">
                            {trade.execution_type === 'AMM_BUYBACK'
                              ? 'Liquidity buffer'
                              : 'Order book'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="wallet-panel p-6">
              <h2 className="mb-5 text-lg font-semibold text-on-surface">Income history</h2>
              {(distributions.data ?? []).length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  No distributions yet. Rent and revenue are paid out to shareholders as they
                  are collected.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {distributions.data.map((distribution) => (
                    <li
                      key={distribution.distribution_id}
                      className="flex items-center justify-between gap-4 border-b border-outline-variant/20 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-on-surface">
                          {titleCase(distribution.yield_category)}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {formatDate(distribution.reporting_period_start)} to{' '}
                          {formatDate(distribution.reporting_period_end)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-primary">
                          {formatEtb(distribution.net_amount_disbursed_etb)}
                        </p>
                        <p className="text-xs text-outline">
                          {formatEtb(distribution.total_tax_withheld_etb)} tax withheld
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <TradeTicket
              asset={data}
              cashAvailable={balance.data?.available_balance_etb ?? 0}
              holding={holding}
              onTraded={refreshAll}
              suggestedDirection={ticketHint.direction}
              suggestedPrice={ticketHint.price}
            />

            <section className="wallet-panel p-6">
              <h2 className="mb-4 text-lg font-semibold text-on-surface">Your position</h2>
              {holding ? (
                <dl className="flex flex-col gap-3 text-sm">
                  <Row label="Shares owned" value={formatShares(holding.shares_owned)} />
                  <Row label="Tradable" value={formatShares(holding.tradable_shares)} />
                  <Row
                    label="Market value"
                    value={formatEtb(holding.market_value_etb, { decimals: 2 })}
                  />
                  <Row
                    label="Unrealised"
                    tone={changeTone(holding.unrealised_gain_etb)}
                    value={`${formatEtb(holding.unrealised_gain_etb, { decimals: 2 })} (${formatChange(
                      holding.unrealised_gain_percentage,
                    )})`}
                  />
                  {holding.vesting_locked_shares > 0 && (
                    <Row
                      label="Vesting locked"
                      value={`${formatShares(holding.vesting_locked_shares)} until ${formatDate(
                        holding.vesting_unlock_at,
                      )}`}
                    />
                  )}
                </dl>
              ) : (
                <p className="text-sm text-on-surface-variant">
                  You do not hold this asset yet.
                </p>
              )}
            </section>

            <section className="wallet-panel p-6">
              <h2 className="mb-4 text-lg font-semibold text-on-surface">Your open orders</h2>
              {openOrders.length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  Nothing resting on the book for this asset.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {openOrders.map((order) => (
                    <li
                      key={order.order_id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold ${
                            order.direction === 'BUY' ? 'text-primary' : 'text-error'
                          }`}
                        >
                          {order.direction}{' '}
                          {formatShares(
                            order.total_shares_ordered - order.filled_shares_accumulated,
                          )}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          at {formatEtb(order.target_price_per_share_etb, { decimals: 2 })}
                        </p>
                      </div>
                      <button
                        className="shrink-0 rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:border-error hover:text-error"
                        onClick={async () => {
                          await ordersService.cancel(order.order_id)
                          refreshAll()
                        }}
                        type="button"
                      >
                        Cancel
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="wallet-panel p-6">
              <h2 className="mb-4 text-lg font-semibold text-on-surface">Custody</h2>
              <dl className="flex flex-col gap-3 text-sm">
                <Row label="Custodian" value={data.custodian_bank_name ?? 'Pending'} />
                <Row label="Last appraisal" value={formatDate(data.last_appraisal_date)} />
                <Row
                  label="Nominal price"
                  value={formatEtb(data.nominal_price_per_share_etb, { decimals: 2 })}
                />
              </dl>
              <p className="mt-4 text-xs text-on-surface-variant">
                The physical asset is held in trust by the custodian bank. Shares are a claim on
                that trust, not a direct title transfer.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}

function Stat({ label, value }) {
  return (
    <div className="wallet-panel p-4">
      <p className="text-xs text-outline">{label}</p>
      <p className="mt-1 text-xl font-bold text-on-surface">{value}</p>
    </div>
  )
}

function Row({ label, value, tone = 'text-on-surface' }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className={`text-right font-semibold ${tone}`}>{value}</dd>
    </div>
  )
}
