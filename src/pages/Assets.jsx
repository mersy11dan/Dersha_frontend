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
  formatEtb,
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

  const allHoldings = useMemo(() => holdings.data ?? [], [holdings.data])
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

  const totalValue = summary.data?.total_portfolio_value_etb ?? 0
  const gain = summary.data?.unrealised_gain_etb ?? 0

  return (
    <DashboardLayout activeNav="assets" sidebarVariant="exchange">
      <div className="flex flex-1 flex-col gap-8 font-body-md text-on-surface">
        
        {/* Portfolio Net Worth Banner */}
        <header className="glass-card rounded-[24px] p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-white/50">
                  PORTFOLIO NET WORTH
                </span>
                <LiveBadge status={realtimeStatus} />
              </div>

              <h1 className="font-display-lg text-[36px] sm:text-[48px] font-extrabold text-white leading-none tracking-tight">
                {summary.loading ? '—' : formatEtb(totalValue, { decimals: 2 })}
              </h1>

              <div className="mt-4 flex items-center gap-3">
                <span className="bg-primary-fixed/15 text-primary-fixed border border-primary-fixed/30 px-3.5 py-1 rounded-full font-title-md text-[13px] font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(213,251,69,0.2)]">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span>+{formatEtb(gain, { decimals: 2 })} (+8.8% ALL TIME)</span>
                </span>
                <span className="font-body-md text-[12px] text-white/50">Marked Live from ETH Exchange</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="px-5 py-2.5 bg-primary-fixed text-on-primary rounded-xl font-title-md text-[13px] font-bold shadow-[0_0_15px_rgba(213,251,69,0.4)] hover:brightness-110 transition-all flex items-center gap-2" to="/wallet/deposit">
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>DEPOSIT CASH</span>
              </Link>
              <Link className="px-5 py-2.5 glass-card text-white border border-white/15 rounded-xl font-title-md text-[13px] font-bold hover:bg-white/10 transition-all flex items-center gap-2" to="/marketplace">
                <span>EXPLORE MARKET</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </header>

        {/* 4 Summary Stat Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4.5">
          <SummaryCard
            detail={`${summary.data?.holding_count ?? 0} assets · ${summary.data?.basket_count ?? 0} baskets`}
            icon="pie_chart"
            badgeBg="bg-primary-fixed/15 border-primary-fixed/30 text-primary-fixed"
            cardBg="from-primary-fixed/10 via-transparent to-transparent"
            label="PORTFOLIO VALUE"
            loading={summary.loading}
            tone="text-primary-fixed"
            value={formatEtb(summary.data?.total_portfolio_value_etb)}
          />
          <SummaryCard
            detail="Available for trading or withdrawal"
            icon="payments"
            badgeBg="bg-[#38bdf8]/15 border-[#38bdf8]/30 text-[#38bdf8]"
            cardBg="from-[#38bdf8]/10 via-transparent to-transparent"
            label="CASH BALANCE"
            loading={summary.loading}
            tone="text-[#38bdf8]"
            value={formatEtb(summary.data?.cash_available_etb)}
          />
          <SummaryCard
            detail={`${formatEtb(summary.data?.cash_escrowed_etb)} committed`}
            icon="verified_user"
            badgeBg="bg-[#c084fc]/15 border-[#c084fc]/30 text-[#c084fc]"
            cardBg="from-[#c084fc]/10 via-transparent to-transparent"
            label="SECURITIES VALUE"
            loading={summary.loading}
            tone="text-[#c084fc]"
            value={formatEtb(summary.data?.securities_value_etb)}
          />
          <SummaryCard
            detail={`${formatEtb(income.data?.lifetime_tax_withheld_etb)} tax withheld`}
            icon="trending_up"
            badgeBg="bg-[#34d399]/15 border-[#34d399]/30 text-[#34d399]"
            cardBg="from-[#34d399]/10 via-transparent to-transparent"
            label="LIFETIME DIVIDENDS"
            loading={income.loading}
            tone="text-[#34d399]"
            value={formatEtb(income.data?.lifetime_net_etb)}
          />
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-8">
            <section>
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-display-lg text-[24px] font-bold text-white">Asset Positions</h2>
                {categories.length > 1 && (
                  <div className="flex flex-wrap gap-2" role="group">
                    <FilterPill
                      active={category === ''}
                      label="All Sectors"
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
                <LoadingPanel label="Loading portfolio holdings..." />
              ) : holdings.error ? (
                <ErrorPanel error={holdings.error} onRetry={holdings.refetch} />
              ) : visible.length === 0 ? (
                <EmptyPanel
                  action={
                    <Link
                      className="px-6 py-2.5 bg-primary-fixed text-on-primary rounded-xl font-title-md text-[13px] font-bold shadow-[0_0_15px_rgba(213,251,69,0.4)] hover:brightness-110 transition-all"
                      to="/marketplace"
                    >
                      Find your first asset
                    </Link>
                  }
                  description="Fractional shares you acquire will appear here."
                  icon="account_balance_wallet"
                  title={category ? 'Nothing in this sector' : 'You have no holdings yet'}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5">
                  {visible.map((holding) => (
                    <HoldingRow key={holding.sub_fund_id} holding={holding} />
                  ))}
                </div>
              )}
            </section>

            {ownedBaskets.length > 0 && (
              <section>
                <h2 className="mb-4 font-display-lg text-[24px] font-bold text-white">Index Baskets</h2>
                <div className="flex flex-col gap-3">
                  {ownedBaskets.map((basket) => (
                    <Link
                      key={basket.basket_id}
                      className="glass-card rounded-[24px] p-6 flex items-center justify-between gap-4 hover:border-primary-fixed/40 transition-all"
                      to={`/custom-baskets/${basket.basket_id}`}
                    >
                      <div>
                        <p className="font-title-md text-[18px] font-bold text-white">{basket.basket_name}</p>
                        <p className="font-body-md text-[12px] text-white/50">
                          {formatShares(basket.my_basket_shares)} units owned
                        </p>
                      </div>
                      <p className="font-display-lg text-[20px] font-extrabold text-primary-fixed">
                        {formatEtb(basket.my_position_value_etb, { decimals: 2 })}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {openOrders.length > 0 && (
              <section>
                <h2 className="mb-4 font-display-lg text-[24px] font-bold text-white">Open Limit Orders</h2>
                <div className="glass-card rounded-[24px] overflow-hidden border border-white/10 divide-y divide-white/5">
                  {openOrders.map((order) => (
                    <div key={order.order_id} className="p-5 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-label-sm text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${order.side === 'BUY' ? 'bg-primary-fixed/15 text-primary-fixed' : 'bg-[#FF3B30]/15 text-[#FF3B30]'}`}>
                            {order.side}
                          </span>
                          <span className="font-title-md text-[14px] font-bold text-white">{order.sub_fund_name}</span>
                        </div>
                        <p className="font-body-md text-[12px] text-white/50">
                          {formatShares(order.quantity)} shares @ {formatEtb(order.price_per_share_etb)}
                        </p>
                      </div>
                      <span className="font-label-sm text-[11px] text-primary-fixed font-bold uppercase">
                        {titleCase(order.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Allocation Sidebar */}
          <aside className="flex flex-col gap-6">
            <section className="glass-card rounded-[24px] p-6">
              <h2 className="mb-4 font-title-md text-[16px] font-bold text-white">Sector Allocation</h2>
              <AllocationDonut holdings={allHoldings} />
            </section>

            <section className="glass-card rounded-[24px] p-6">
              <h2 className="mb-4 font-title-md text-[16px] font-bold text-white">Yield Telemetry</h2>
              <dl className="flex flex-col gap-3 font-body-md text-[13px]">
                <div className="flex items-center justify-between">
                  <dt className="text-white/50 font-medium">Gross Dividends</dt>
                  <dd className="font-title-md text-white font-bold">
                    {formatEtb(income.data?.lifetime_gross_etb, { decimals: 2 })}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-white/50 font-medium">
                    Withholding Tax ({((income.data?.withholding_tax_rate ?? 0.1) * 100).toFixed(0)}%)
                  </dt>
                  <dd className="font-title-md font-bold text-[#FF3B30]">
                    −{formatEtb(income.data?.lifetime_tax_withheld_etb, { decimals: 2 })}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <dt className="font-title-md text-white font-bold">Net Disbursed</dt>
                  <dd className="font-title-md font-bold text-primary-fixed">
                    {formatEtb(income.data?.lifetime_net_etb, { decimals: 2 })}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}

function SummaryCard({ label, value, detail, loading, icon = 'account_balance', tone = 'text-white', badgeBg = 'bg-primary-fixed/15 border-primary-fixed/30 text-primary-fixed', cardBg = 'from-primary-fixed/10 via-transparent to-transparent' }) {
  return (
    <div
      className={`glass-card bg-gradient-to-br ${cardBg} rounded-[24px] p-3.5 sm:p-4.5 border border-white/15 flex flex-col justify-between h-[140px] sm:h-[155px] hover:border-white/30 transition-all duration-300 relative overflow-hidden group shadow-lg`}
    >
      <div className="flex items-start justify-between gap-2 z-10">
        <span className="font-label-sm text-[9px] sm:text-[10px] text-white/70 uppercase tracking-wider font-bold max-w-[110px] leading-tight">
          {label}
        </span>
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-md ${badgeBg}`}>
          <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
            {icon}
          </span>
        </div>
      </div>

      <div className="z-10 mt-auto">
        <div className={`font-display-lg text-[18px] sm:text-[24px] font-black tracking-tight leading-none ${tone}`}>
          {loading ? '—' : value}
        </div>
        <p className="mt-1 font-body-md text-[11px] sm:text-[12px] text-white/70 truncate">
          {detail}
        </p>
      </div>
    </div>
  )
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full px-5 py-2 font-title-md text-[12px] transition-all ${
        active
          ? 'bg-white text-black font-bold shadow-md'
          : 'glass-card border border-white/10 text-white/70 hover:text-white hover:border-primary-fixed/50'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
