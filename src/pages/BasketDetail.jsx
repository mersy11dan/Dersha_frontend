import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import BasketNavChart from '../components/baskets/BasketNavChart'
import ListUnitsForm from '../components/baskets/ListUnitsForm'
import BuyUnitsForm from '../components/baskets/BuyUnitsForm'
import { ErrorPanel, LiveBadge, LoadingPanel } from '../components/common/DataStates'
import FormAlert from '../components/common/FormAlert'
import { useAsyncData } from '../hooks/useAsyncData'
import { basketService, walletService } from '../lib/services'
import { realtimeTopics, useRealtime, useRealtimeStatus } from '../lib/realtime'
import {
  categoryLabel,
  formatDateTime,
  formatEtb,
  formatPercentage,
  formatShares,
  titleCase,
} from '../lib/format'

export default function BasketDetail() {
  const { basketId } = useParams()
  const navigate = useNavigate()
  const realtimeStatus = useRealtimeStatus()
  const [notice, setNotice] = useState(null)
  const [dissolving, setDissolving] = useState(false)

  const basket = useAsyncData(() => basketService.get(basketId), [basketId])
  const wallet = useAsyncData(() => walletService.balance(), [])

  const topics = useMemo(
    () => [realtimeTopics.basket(basketId), realtimeTopics.market],
    [basketId],
  )
  const onEvent = useCallback(() => {
    void basket.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useRealtime(topics, onEvent)

  const refresh = useCallback(() => {
    void basket.reload()
    void wallet.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (basket.loading && !basket.data) {
    return (
      <DashboardLayout activeNav="custom-baskets" sidebarVariant="exchange">
        <div className="flex-1 px-6 py-8 md:px-10">
          <LoadingPanel label="Loading basket" />
        </div>
      </DashboardLayout>
    )
  }

  if (basket.error) {
    return (
      <DashboardLayout activeNav="custom-baskets" sidebarVariant="exchange">
        <div className="flex-1 px-6 py-8 md:px-10">
          <ErrorPanel error={basket.error} onRetry={basket.refetch} />
        </div>
      </DashboardLayout>
    )
  }

  const data = basket.data
  const myListings = data.open_listings.filter((listing) => listing.is_mine)
  const otherListings = data.open_listings.filter((listing) => !listing.is_mine)
  const dissolved = data.lifecycle_status === 'DISSOLVED'

  async function handleDissolve() {
    setNotice(null)
    setDissolving(true)
    try {
      await basketService.dissolve(basketId)
      setNotice({
        tone: 'success',
        message: 'Basket dissolved. The underlying shares are back in your portfolio.',
      })
      refresh()
    } catch (error) {
      setNotice({ tone: 'error', message: error.message })
    } finally {
      setDissolving(false)
    }
  }

  return (
    <DashboardLayout activeNav="custom-baskets" sidebarVariant="exchange">
      <div className="flex flex-1 flex-col gap-8 px-6 py-8 md:px-10">
        <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Link className="hover:text-primary" to="/custom-baskets">
            Custom baskets
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-on-surface">{data.basket_name}</span>
        </nav>

        <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                {titleCase(data.lifecycle_status)}
              </span>
              {data.is_creator && (
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  You created this
                </span>
              )}
              <LiveBadge status={realtimeStatus} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
              {data.basket_name}
            </h1>
            <p className="mt-2 text-on-surface-variant">
              Assembled by {data.creator_name} from {data.constituents.length} sub-funds ·{' '}
              {formatPercentage(data.creator_royalty_percentage, 2)} creator royalty on
              every trade
            </p>
          </div>

          <div className="shrink-0 text-left lg:text-right">
            <p className="text-xs text-outline">NAV per unit</p>
            <p className="text-3xl font-bold text-on-surface">
              {formatEtb(data.nav_per_basket_share_etb, { decimals: 2 })}
            </p>
            <p className="mt-1 text-xs text-outline">
              Marked {formatDateTime(data.nav_last_calculated_at)}
            </p>
          </div>
        </header>

        {notice && <FormAlert message={notice.message} tone={notice.tone} />}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Basket NAV" value={formatEtb(data.nav_total_etb)} />
          <Tile label="Units issued" value={formatShares(data.total_basket_shares)} />
          <Tile
            label="You hold"
            value={`${formatShares(data.my_basket_shares)} units`}
            detail={
              data.my_locked_basket_shares > 0
                ? `${formatShares(data.my_locked_basket_shares)} listed for sale`
                : 'None listed'
            }
          />
          <Tile
            label="Your stake"
            tone="text-primary"
            value={formatEtb(data.my_position_value_etb, { decimals: 2 })}
          />
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-8">
            <BasketNavChart history={data.nav_history} />

            <section>
              <h2 className="mb-4 text-xl font-semibold text-on-surface">Constituents</h2>
              <div className="wallet-panel divide-y divide-outline-variant/20">
                {data.constituents.map((item) => (
                  <div
                    key={item.sub_fund_id}
                    className="flex items-center justify-between gap-4 p-5"
                  >
                    <div className="min-w-0">
                      <Link
                        className="truncate font-semibold text-on-surface hover:text-primary"
                        to={`/marketplace/assets/${item.sub_fund_id}`}
                      >
                        {item.asset_name}
                      </Link>
                      <p className="text-sm text-on-surface-variant">
                        {categoryLabel(item.category)} ·{' '}
                        {formatShares(item.shares_allocated)} shares at{' '}
                        {formatEtb(item.mark_price_etb, { decimals: 2 })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-on-surface">
                        {formatEtb(item.value_etb, { decimals: 2 })}
                      </p>
                      <p className="text-xs text-outline">
                        {formatPercentage(item.weight_percentage, 1)} of NAV
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-on-surface-variant">
                These shares sit in the platform custody pool while the basket is live. NAV
                re-marks whenever any constituent trades.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-on-surface">Units for sale</h2>
              {otherListings.length === 0 ? (
                <p className="wallet-panel p-6 text-sm text-on-surface-variant">
                  Nobody is offering units of this basket right now.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {otherListings.map((listing) => (
                    <BuyUnitsForm
                      key={listing.listing_id}
                      cashAvailable={wallet.data?.available_balance_etb ?? 0}
                      listing={listing}
                      navPerUnit={data.nav_per_basket_share_etb}
                      onDone={(message) => {
                        setNotice({ tone: 'success', message })
                        refresh()
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-8">
            {!dissolved && data.my_basket_shares > 0 && (
              <ListUnitsForm
                basketId={basketId}
                freeUnits={data.my_basket_shares - data.my_locked_basket_shares}
                navPerUnit={data.nav_per_basket_share_etb}
                onDone={(message) => {
                  setNotice({ tone: 'success', message })
                  refresh()
                }}
              />
            )}

            {myListings.length > 0 && (
              <section className="wallet-panel p-6">
                <h2 className="mb-4 text-lg font-semibold text-on-surface">
                  Your open listings
                </h2>
                <ul className="flex flex-col gap-4">
                  {myListings.map((listing) => (
                    <li
                      key={listing.listing_id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface">
                          {formatShares(listing.basket_shares_remaining)} units at{' '}
                          {formatEtb(listing.price_per_unit_etb, { decimals: 2 })}
                        </p>
                        <p className="text-xs text-outline">
                          {listing.sale_mode === 'FRACTIONAL_POOL'
                            ? 'Fractional pool'
                            : 'Whole basket only'}{' '}
                          · {titleCase(listing.status)}
                        </p>
                      </div>
                      <button
                        className="shrink-0 rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:border-error hover:text-error"
                        onClick={async () => {
                          setNotice(null)
                          try {
                            await basketService.cancelListing(listing.listing_id)
                            setNotice({
                              tone: 'success',
                              message: 'Listing withdrawn and units unlocked.',
                            })
                            refresh()
                          } catch (error) {
                            setNotice({ tone: 'error', message: error.message })
                          }
                        }}
                        type="button"
                      >
                        Withdraw
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.is_creator && !dissolved && (
              <section className="wallet-panel p-6">
                <h2 className="mb-2 text-lg font-semibold text-on-surface">
                  Dissolve the basket
                </h2>
                <p className="mb-4 text-sm text-on-surface-variant">
                  Only possible while you hold every unit. The constituent shares leave
                  custody and return to your portfolio, and the basket stops trading.
                </p>
                <button
                  className="w-full rounded-xl border border-error px-6 py-2.5 text-sm font-bold text-error transition-colors hover:bg-error hover:text-on-error disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={
                    dissolving || data.my_basket_shares < data.total_basket_shares
                  }
                  onClick={handleDissolve}
                  type="button"
                >
                  {dissolving ? 'Dissolving…' : 'Dissolve and reclaim shares'}
                </button>
                {data.my_basket_shares < data.total_basket_shares && (
                  <p className="mt-3 text-xs text-outline">
                    You hold {formatShares(data.my_basket_shares)} of{' '}
                    {formatShares(data.total_basket_shares)} units. Buy back the rest first.
                  </p>
                )}
              </section>
            )}

            {dissolved && (
              <section className="wallet-panel p-6">
                <h2 className="mb-2 text-lg font-semibold text-on-surface">Dissolved</h2>
                <p className="text-sm text-on-surface-variant">
                  This basket no longer trades. Its constituent shares were returned to the
                  holder and appear in the portfolio directly.
                </p>
                <button
                  className="mt-4 w-full rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
                  onClick={() => navigate('/portfolio/assets')}
                  type="button"
                >
                  View portfolio
                </button>
              </section>
            )}
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}

function Tile({ label, value, detail, tone = 'text-on-surface' }) {
  return (
    <div className="wallet-panel p-5">
      <p className="text-xs text-outline">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${tone}`}>{value}</p>
      {detail && <p className="mt-1.5 text-xs text-on-surface-variant">{detail}</p>}
    </div>
  )
}
