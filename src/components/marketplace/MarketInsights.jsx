import { formatEtbCompact } from '../../lib/format'

export default function MarketInsights({ highlights, assets = [], loading }) {
  const topGainer = [...assets]
    .filter((asset) => asset.price_change_24h_percentage !== null)
    .sort((a, b) => b.price_change_24h_percentage - a.price_change_24h_percentage)[0]

  const tiles = [
    {
      id: 'tvl',
      icon: 'lock',
      label: 'Total Value Locked',
      value: formatEtbCompact(highlights?.total_value_locked_etb),
      detail: `${highlights?.listed_sub_funds ?? 0} Listed Sub-Funds`,
      textStyle: 'text-primary-fixed',
      badgeBg: 'bg-primary-fixed/15 border-primary-fixed/30 text-primary-fixed',
      cardBg: 'from-[#d5fb45]/10 via-transparent to-transparent',
    },
    {
      id: 'volume',
      icon: 'monitoring',
      label: '24h Trading Volume',
      value: formatEtbCompact(highlights?.volume_24h_etb),
      detail: `${highlights?.trades_24h ?? 0} Trades Settled`,
      textStyle: 'text-[#38bdf8]',
      badgeBg: 'bg-[#38bdf8]/15 border-[#38bdf8]/30 text-[#38bdf8]',
      cardBg: 'from-[#38bdf8]/10 via-transparent to-transparent',
    },
    {
      id: 'gainer',
      icon: 'trending_up',
      label: 'Top Asset Gainer',
      value: topGainer ? `${topGainer.price_change_24h_percentage > 0 ? '+' : ''}${topGainer.price_change_24h_percentage.toFixed(2)}%` : '—',
      detail: topGainer ? topGainer.asset_name : 'Market Stabilized',
      textStyle: 'text-[#34d399]',
      badgeBg: 'bg-[#34d399]/15 border-[#34d399]/30 text-[#34d399]',
      cardBg: 'from-[#34d399]/10 via-transparent to-transparent',
    },
    {
      id: 'custody',
      icon: 'verified_user',
      label: 'CBE Custody Status',
      value: 'ACTIVE',
      detail: 'EthSwitch Settlement Ready',
      textStyle: 'text-[#c084fc]',
      badgeBg: 'bg-[#c084fc]/15 border-[#c084fc]/30 text-[#c084fc]',
      cardBg: 'from-[#c084fc]/10 via-transparent to-transparent',
    },
  ]

  return (
    <div className="mb-6">
      {/* 2-column grid on mobile (grid-cols-2), 4-column grid on desktop (md:grid-cols-4) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className={`glass-card bg-gradient-to-br ${tile.cardBg} rounded-[24px] p-3.5 sm:p-4.5 border border-white/15 flex flex-col justify-between h-[140px] sm:h-[155px] hover:border-white/30 transition-all duration-300 relative overflow-hidden group shadow-lg`}
          >
            {/* Top row: Label + Icon Badge close together */}
            <div className="flex items-start justify-between gap-2 z-10">
              <span className="font-label-sm text-[9px] sm:text-[10px] text-white/70 uppercase tracking-wider font-bold max-w-[110px] leading-tight">
                {tile.label}
              </span>
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-md ${tile.badgeBg}`}>
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                  {tile.icon}
                </span>
              </div>
            </div>

            {/* Bottom row: Bold Value + Subtext */}
            <div className="z-10 mt-auto">
              <div className={`font-display-lg text-[20px] sm:text-[26px] font-black tracking-tight leading-none ${tile.textStyle}`}>
                {loading ? '—' : tile.value}
              </div>
              <p className="mt-1 font-body-md text-[11px] sm:text-[12px] text-white/70 truncate">
                {tile.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
