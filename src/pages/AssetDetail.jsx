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
          <LoadingPanel label="Loading asset telemetry..." rows={5} />
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
      <div className="flex flex-1 flex-col gap-8 px-6 py-8 md:px-10 font-sans text-[#ffffff]">
        <nav className="flex items-center gap-2 font-mono text-xs text-[#8c8c8c]">
          <Link className="hover:text-[#D4FF00] transition-colors" to="/marketplace">
            MARKETPLACE
          </Link>
          <span aria-hidden="true">•</span>
          <span className="text-[#ffffff] font-bold">{data.asset_name}</span>
        </nav>

        <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between border-b border-[#D4FF00]/30 pb-6">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-3 font-mono">
              <span className="vortex-badge vortex-badge-volt">
                {categoryLabel(data.category)}
              </span>
              <span className="vortex-badge vortex-badge-outline">
                {titleCase(data.sub_fund_status)}
              </span>
              <LiveBadge status={realtimeStatus} />
            </div>
            <h1 className="font-sans text-3xl font-extrabold uppercase tracking-tight text-[#ffffff] lg:text-4xl">
              {data.asset_name}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-[#8c8c8c]">
              <span aria-hidden="true" className="material-symbols-outlined text-base text-[#D4FF00]">
                {categoryIcon(data.category)}
              </span>
              {data.location}
            </p>
          </div>

          <div className="shrink-0 text-left lg:text-right font-mono">
            <p className="text-xs text-[#8c8c8c] uppercase">MARK PRICE</p>
            <p className="text-4xl font-black text-[#D4FF00]">
              {formatEtb(data.price_per_share_etb, { decimals: 2 })}
            </p>
            <p className={`mt-1 text-xs font-bold ${data.price_change_24h_percentage >= 0 ? 'text-[#00FF9D]' : 'text-red-400'}`}>
              {data.price_change_24h_percentage === null
                ? 'NO PRIOR TRADE TO COMPARE'
                : `${formatChange(data.price_change_24h_percentage)} OVER 24H`}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4 font-mono">
          <Stat label="APPRAISED VALUE" value={formatEtb(data.appraised_value_etb)} />
          <Stat
            label="MARKET CAPITALISATION"
            value={formatEtb(data.market_capitalisation_etb)}
          />
          <Stat label="24H VOLUME" value={formatEtb(data.volume_24h_etb)} />
          <Stat label="ISSUED SHARES" value={formatShares(data.total_issued_shares)} />
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

            <section className="vortex-panel p-6 bg-[#050505]">
              <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-[#D4FF00]">
                // RECENT TRADE EXECUTIONS
              </h2>
              {(data.recent_trades ?? []).length === 0 ? (
                <p className="font-mono text-xs text-[#8c8c8c]">
                  No trades executed yet. First fill sets mark price.
                </p>
              ) : (
                <div className="overflow-x-auto font-mono text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] uppercase text-[#8c8c8c]">
                        <th className="pb-3">TIME</th>
                        <th className="pb-3">PRICE</th>
                        <th className="pb-3 text-right">SHARES</th>
                        <th className="pb-3 text-right">TYPE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.recent_trades.slice(0, 12).map((trade, index) => (
                        <tr key={`${trade.executed_at}-${index}`} className="hover:bg-white/5">
                          <td className="py-3 text-[#8c8c8c]">
                            {formatRelative(trade.executed_at)}
                          </td>
                          <td className="py-3 font-bold text-[#D4FF00]">
                            {formatEtb(trade.price_per_share_etb, { decimals: 2 })}
                          </td>
                          <td className="py-3 text-right text-[#ffffff]">
                            {formatShares(trade.shares)}
                          </td>
                          <td className="py-3 text-right text-[10px] text-[#8c8c8c]">
                            {trade.execution_type === 'AMM_BUYBACK'
                              ? 'AMM BUFFER'
                              : 'ORDER BOOK'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="vortex-panel p-6 bg-[#050505]">
              <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-[#00FF9D]">
                // DIVIDEND & INCOME HISTORY
              </h2>
              {(distributions.data ?? []).length === 0 ? (
                <p className="font-mono text-xs text-[#8c8c8c]">
                  No distributions yet. Monthly rent and lease cashflows disburse directly to token holders.
                </p>
              ) : (
                <ul className="flex flex-col gap-3 font-mono text-xs">
                  {distributions.data.map((distribution) => (
                    <li
                      key={distribution.distribution_id}
                      className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#ffffff]">
                          {titleCase(distribution.yield_category)}
                        </p>
                        <p className="text-[10px] text-[#8c8c8c]">
                          {formatDate(distribution.reporting_period_start)} TO{' '}
                          {formatDate(distribution.reporting_period_end)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-[#00FF9D]">
                          {formatEtb(distribution.net_amount_disbursed_etb)}
                        </p>
                        <p className="text-[10px] text-[#8c8c8c]">
                          {formatEtb(distribution.total_tax_withheld_etb)} TAX WITHHELD
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

            <section className="vortex-panel p-6 bg-[#050505]">
              <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-[#D4FF00]">
                // YOUR POSITION
              </h2>
              {holding ? (
                <dl className="flex flex-col gap-3 font-mono text-xs">
                  <Row label="SHARES OWNED" value={formatShares(holding.shares_owned)} />
                  <Row label="TRADABLE" value={formatShares(holding.tradable_shares)} />
                  <Row
                    label="MARKET VALUE"
                    value={formatEtb(holding.market_value_etb, { decimals: 2 })}
                  />
                  <Row
                    label="UNREALIZED"
                    tone={holding.unrealised_gain_etb >= 0 ? 'text-[#00FF9D]' : 'text-red-400'}
                    value={`${formatEtb(holding.unrealised_gain_etb, { decimals: 2 })} (${formatChange(
                      holding.unrealised_gain_percentage,
                    )})`}
                  />
                </dl>
              ) : (
                <p className="font-mono text-xs text-[#8c8c8c]">
                  You do not hold units of this asset yet.
                </p>
              )}
            </section>

            <section className="vortex-panel p-6 bg-[#050505]">
              <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-[#00FF9D]">
                // CUSTODY TRUST
              </h2>
              <dl className="flex flex-col gap-3 font-mono text-xs">
                <Row label="CUSTODIAN BANK" value={data.custodian_bank_name ?? 'CBE Trustee'} />
                <Row label="LAST APPRAISAL" value={formatDate(data.last_appraisal_date)} />
                <Row
                  label="NOMINAL PRICE"
                  value={formatEtb(data.nominal_price_per_share_etb, { decimals: 2 })}
                />
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}

function Stat({ label, value }) {
  return (
    <div className="vortex-panel p-4 bg-[#050505]">
      <p className="font-mono text-[10px] text-[#8c8c8c] uppercase">{label}</p>
      <p className="mt-1 font-mono text-lg font-black text-[#D4FF00]">{value}</p>
    </div>
  )
}

function Row({ label, value, tone = 'text-[#ffffff]' }) {
  return (
    <div className="flex items-center justify-between gap-3 font-mono text-xs">
      <dt className="text-[#8c8c8c]">{label}</dt>
      <dd className={`text-right font-bold ${tone}`}>{value}</dd>
    </div>
  )
}
