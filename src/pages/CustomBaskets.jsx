import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import BasketBuilder from '../components/baskets/BasketBuilder'
import BasketCard from '../components/marketplace/BasketCard'
import {
  EmptyPanel,
  ErrorPanel,
  LiveBadge,
  LoadingPanel,
} from '../components/common/DataStates'
import { useAsyncData } from '../hooks/useAsyncData'
import { basketService, portfolioService } from '../lib/services'
import { useRealtime, useRealtimeStatus } from '../lib/realtime'
import {
  formatDateTime,
  formatEtb,
  formatPercentage,
  formatShares,
  titleCase,
} from '../lib/format'

const TABS = [
  { id: 'mine', label: 'My Baskets' },
  { id: 'market', label: 'On The Market' },
  { id: 'royalties', label: 'Royalties Telemetry' },
]

export default function CustomBaskets() {
  const [tab, setTab] = useState('mine')
  const [building, setBuilding] = useState(false)
  const navigate = useNavigate()
  const realtimeStatus = useRealtimeStatus()

  const mine = useAsyncData(() => basketService.mine(), [])
  const market = useAsyncData(() => basketService.listed(), [])
  const royalties = useAsyncData(() => basketService.royalties(), [])
  const holdings = useAsyncData(() => portfolioService.holdings(), [])

  const onMarketEvent = useCallback(() => {
    void mine.reload()
    void market.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useRealtime('market', onMarketEvent)

  const active = tab === 'mine' ? mine : tab === 'market' ? market : royalties

  return (
    <DashboardLayout activeNav="custom-baskets" sidebarVariant="exchange">
      <div className="flex flex-1 flex-col gap-8 font-body-md text-on-surface">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display-lg text-[32px] sm:text-[40px] font-extrabold text-white leading-tight">
                Custom Index Baskets
              </h1>
              <LiveBadge status={realtimeStatus} />
            </div>
            <p className="mt-1 font-body-md text-[14px] text-white/60">
              Bundle assets you hold into index units, trade on exchange, and earn automated 0.5% creator royalties.
            </p>
          </div>
          <button
            className="px-6 py-2.5 bg-primary-fixed text-on-primary rounded-xl font-title-md text-[13px] font-bold shadow-[0_0_15px_rgba(213,251,69,0.4)] hover:brightness-110 transition-all flex items-center justify-center gap-2"
            onClick={() => setBuilding(true)}
            type="button"
          >
            <span>+ BUILD INDEX BASKET</span>
            <span className="material-symbols-outlined text-[16px] leading-none">arrow_forward</span>
          </button>
        </header>

        {/* Tab Switcher */}
        <div
          aria-label="Basket view"
          className="flex w-fit rounded-full border border-white/10 bg-black/40 p-1 font-title-md text-[13px] backdrop-blur-md"
          role="group"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              aria-pressed={tab === item.id}
              className={`rounded-full px-6 py-2 uppercase transition-all ${
                tab === item.id
                  ? 'bg-primary-fixed text-on-primary font-bold shadow-[0_0_12px_rgba(213,251,69,0.4)]'
                  : 'text-white/60 hover:text-white'
              }`}
              onClick={() => setTab(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        {active.loading && !active.data ? (
          <LoadingPanel label="Loading custom baskets..." />
        ) : active.error ? (
          <ErrorPanel error={active.error} onRetry={active.refetch} />
        ) : tab === 'mine' ? (
          <MineTab baskets={mine.data ?? []} onBuild={() => setBuilding(true)} />
        ) : tab === 'market' ? (
          <MarketTab listings={market.data ?? []} />
        ) : (
          <RoyaltiesTab rows={royalties.data ?? []} />
        )}
      </div>

      {building && (
        <BasketBuilder
          holdings={holdings.data ?? []}
          onClose={() => setBuilding(false)}
          onMinted={(basket) => {
            setBuilding(false)
            void mine.reload()
            navigate(`/custom-baskets/${basket.basket_id}`)
          }}
        />
      )}
    </DashboardLayout>
  )
}

function MineTab({ baskets, onBuild }) {
  if (baskets.length === 0) {
    return (
      <EmptyPanel
        action={
          <button
            className="px-6 py-2.5 bg-primary-fixed text-on-primary rounded-xl font-title-md text-[13px] font-bold shadow-[0_0_15px_rgba(213,251,69,0.4)] hover:brightness-110 transition-all"
            onClick={onBuild}
            type="button"
          >
            BUILD YOUR FIRST BASKET
          </button>
        }
        description="Pool sub-fund shares you own into a single index instrument."
        icon="shopping_basket"
        title="YOU HAVE NOT CREATED OR BOUGHT A BASKET YET"
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {baskets.map((basket) => (
        <Link
          key={basket.basket_id}
          className="group glass-card rounded-[24px] p-6 flex flex-col gap-4 hover:-translate-y-1 hover:border-primary-fixed/40 transition-all duration-300"
          to={`/custom-baskets/${basket.basket_id}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {basket.is_creator && (
                  <span className="bg-primary-fixed/10 text-primary-fixed border border-primary-fixed/20 px-2.5 py-0.5 rounded-full font-label-sm text-[10px] font-bold uppercase">
                    CREATOR
                  </span>
                )}
                <span className="bg-white/10 text-white/80 px-2.5 py-0.5 rounded-full font-label-sm text-[10px] uppercase">
                  {titleCase(basket.lifecycle_status)}
                </span>
              </div>
              <h3 className="truncate font-title-md text-[20px] font-bold text-white group-hover:text-primary-fixed transition-colors">
                {basket.basket_name}
              </h3>
              <p className="mt-0.5 font-body-md text-[13px] text-white/60">
                {basket.constituent_count} SUB-FUNDS · {formatShares(basket.total_basket_shares)} UNITS ISSUED
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-label-sm text-[10px] text-white/50 uppercase">NAV PER UNIT</p>
              <p className="font-display-lg text-[20px] text-white font-extrabold tracking-tight">
                {formatEtb(basket.nav_per_basket_share_etb, { decimals: 2 })}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl bg-white/5 border border-white/10 p-4 font-body-md text-[13px]">
            <Stat label="BASKET NAV" value={formatEtb(basket.nav_total_etb)} />
            <Stat
              label="YOU HOLD"
              value={`${formatShares(basket.my_basket_shares)} UNITS`}
            />
            <Stat
              label="YOUR STAKE"
              tone="text-primary-fixed font-bold"
              value={formatEtb(basket.my_position_value_etb, { decimals: 2 })}
            />
            <Stat
              label="ROYALTY RATE"
              value={formatPercentage(basket.creator_royalty_percentage, 2)}
            />
          </dl>

          <p className="font-label-sm text-[10px] text-white/40">
            NAV LAST CALCULATED AT {formatDateTime(basket.nav_last_calculated_at)}
          </p>
        </Link>
      ))}
    </div>
  )
}

function MarketTab({ listings }) {
  if (listings.length === 0) {
    return (
      <EmptyPanel
        description="Baskets offered by other investors will appear here."
        icon="storefront"
        title="NO BASKETS LISTED RIGHT NOW"
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {listings.map((listing) => (
        <BasketCard key={listing.listing_id} listing={listing} />
      ))}
    </div>
  )
}

function RoyaltiesTab({ rows }) {
  if (rows.length === 0) {
    return (
      <EmptyPanel
        description="When trades occur on your index basket, your 0.5% royalty is credited to your wallet and logged here."
        icon="workspace_premium"
        title="NO ROYALTIES EARNED YET"
      />
    )
  }

  const total = rows.reduce((sum, row) => sum + row.royalty_earned_etb, 0)

  return (
    <div className="flex flex-col gap-6 font-body-md text-[13px]">
      <div className="glass-card rounded-[24px] p-6 border border-white/10">
        <p className="font-label-sm text-[10px] text-white/50 uppercase">LIFETIME ROYALTIES EARNED</p>
        <p className="mt-1 font-display-lg text-[32px] font-extrabold text-primary-fixed">
          {formatEtb(total, { decimals: 2 })}
        </p>
        <p className="mt-2 text-[13px] text-white/60">
          Automatically credited on every trade execution of your created index baskets.
        </p>
      </div>

      <div className="glass-card rounded-[24px] overflow-hidden border border-white/10 divide-y divide-white/5">
        {rows.map((row) => (
          <Link
            key={row.basket_id}
            className="flex items-center justify-between gap-4 p-5 hover:bg-white/5 transition-colors"
            to={`/custom-baskets/${row.basket_id}`}
          >
            <div className="min-w-0">
              <p className="truncate font-title-md text-[15px] font-bold text-white">{row.basket_name}</p>
              <p className="font-body-md text-[12px] text-white/50 mt-0.5">
                {row.trade_count} TRADES · {formatEtb(row.gross_volume_etb)} VOLUME
              </p>
            </div>
            <p className="shrink-0 font-title-md text-[15px] font-extrabold text-primary-fixed">
              {formatEtb(row.royalty_earned_etb, { decimals: 2 })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, tone = 'text-white' }) {
  return (
    <div>
      <dt className="font-label-sm text-[10px] text-white/50 uppercase">{label}</dt>
      <dd className={`font-title-md text-[13px] font-medium mt-0.5 ${tone}`}>{value}</dd>
    </div>
  )
}
