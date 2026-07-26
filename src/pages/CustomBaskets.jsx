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
  { id: 'mine', label: 'My baskets' },
  { id: 'market', label: 'On the market' },
  { id: 'royalties', label: 'Royalties' },
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
      <div className="flex flex-1 flex-col gap-8 px-6 py-8 md:px-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
                Custom baskets
              </h1>
              <LiveBadge status={realtimeStatus} />
            </div>
            <p className="mt-2 max-w-xl text-on-surface-variant">
              Bundle assets you own into a single instrument, sell units of it, and collect a
              royalty on every trade that follows.
            </p>
          </div>
          <button
            className="flex w-fit items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
            onClick={() => setBuilding(true)}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              add
            </span>
            Build a basket
          </button>
        </header>

        <div
          aria-label="Basket view"
          className="flex w-fit rounded-xl bg-surface-container-low p-1"
          role="group"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              aria-pressed={tab === item.id}
              className={`rounded-lg px-5 py-2 text-sm font-bold transition-colors ${
                tab === item.id
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
              onClick={() => setTab(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        {active.loading && !active.data ? (
          <LoadingPanel label="Loading baskets" />
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
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
            onClick={onBuild}
            type="button"
          >
            Build your first basket
          </button>
        }
        description="A basket pools shares you already hold into one instrument other investors can buy fractions of."
        icon="shopping_basket"
        title="You have not created or bought a basket yet"
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {baskets.map((basket) => (
        <Link
          key={basket.basket_id}
          className="wallet-panel flex flex-col gap-4 p-6 transition-colors hover:border-primary/40"
          to={`/custom-baskets/${basket.basket_id}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                {basket.is_creator && (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Creator
                  </span>
                )}
                <span className="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {titleCase(basket.lifecycle_status)}
                </span>
              </div>
              <h3 className="truncate text-lg font-semibold text-on-surface">
                {basket.basket_name}
              </h3>
              <p className="mt-0.5 text-sm text-on-surface-variant">
                {basket.constituent_count} sub-funds ·{' '}
                {formatShares(basket.total_basket_shares)} units issued
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-outline">NAV per unit</p>
              <p className="text-xl font-bold text-on-surface">
                {formatEtb(basket.nav_per_basket_share_etb, { decimals: 2 })}
              </p>
            </div>
          </div>

          <dl className="flex flex-wrap gap-x-8 gap-y-3 border-t border-outline-variant/20 pt-4">
            <Stat label="Basket NAV" value={formatEtb(basket.nav_total_etb)} />
            <Stat
              label="You hold"
              value={`${formatShares(basket.my_basket_shares)} units`}
            />
            <Stat
              label="Your stake"
              tone="text-primary"
              value={formatEtb(basket.my_position_value_etb, { decimals: 2 })}
            />
            <Stat
              label="Royalty"
              value={formatPercentage(basket.creator_royalty_percentage, 2)}
            />
          </dl>

          <p className="text-xs text-outline">
            NAV last marked {formatDateTime(basket.nav_last_calculated_at)}
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
        description="When an investor offers units of their basket for sale, they show up here."
        icon="storefront"
        title="No baskets listed right now"
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
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
        description="Once someone trades a basket you created, your 0.5% cut lands in your wallet and is tallied here."
        icon="workspace_premium"
        title="No royalties earned yet"
      />
    )
  }

  const total = rows.reduce((sum, row) => sum + row.royalty_earned_etb, 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="wallet-panel p-6">
        <p className="text-xs text-outline">Lifetime royalties</p>
        <p className="mt-1 text-3xl font-bold text-primary">
          {formatEtb(total, { decimals: 2 })}
        </p>
        <p className="mt-2 text-sm text-on-surface-variant">
          Paid instantly out of every basket trade, on top of any units you still hold.
        </p>
      </div>

      <div className="wallet-panel divide-y divide-outline-variant/20">
        {rows.map((row) => (
          <Link
            key={row.basket_id}
            className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-surface-container-low"
            to={`/custom-baskets/${row.basket_id}`}
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-on-surface">{row.basket_name}</p>
              <p className="text-sm text-on-surface-variant">
                {row.trade_count} trade{row.trade_count === 1 ? '' : 's'} ·{' '}
                {formatEtb(row.gross_volume_etb)} of volume
              </p>
            </div>
            <p className="shrink-0 font-bold text-primary">
              {formatEtb(row.royalty_earned_etb, { decimals: 2 })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, tone = 'text-on-surface' }) {
  return (
    <div>
      <dt className="text-xs text-outline">{label}</dt>
      <dd className={`text-sm font-bold ${tone}`}>{value}</dd>
    </div>
  )
}
