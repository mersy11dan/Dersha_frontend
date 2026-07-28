import { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'

const MOCK_STOCKS = [
  {
    id: 'MSFT',
    ticker: 'MSFT',
    name: 'Microsoft Co.',
    revenue: '$394.33B',
    revenueChange: '+12.4%',
    marketCap: '$1780.09B',
    price: '$236.11',
    priceChange: '-1.39%',
    priceChangeIsPositive: false,
    lastUpdate: 'Last update at 18:48',
    openPrice: '$228.56',
    closePrice: '$280.21',
    dividendYield: '0.82%',
    peRatio: '34.2',
    range52w: '$213.43 - $349.67',
    volume24h: '$12.4B',
    beta: '0.94',
    analystRating: 'Strong Buy',
    color: '#38bdf8',
    pathPoints: 'M0,110 C40,100 80,120 120,90 C160,70 200,85 240,55 C280,35 320,45 360,25 L360,150 L0,150 Z',
    linePath: 'M0,110 C40,100 80,120 120,90 C160,70 200,85 240,55 C280,35 320,45 360,25',
    focusPoint: { x: 240, y: 55 },
  },
  {
    id: 'AAPL',
    ticker: 'AAPL',
    name: 'Apple Inc',
    revenue: '$287.21B',
    revenueChange: '+8.6%',
    marketCap: '$2097.64B',
    price: '$180.02',
    priceChange: '+10.21%',
    priceChangeIsPositive: true,
    lastUpdate: 'Last update at 12:42',
    openPrice: '$162.10',
    closePrice: '$180.02',
    dividendYield: '0.55%',
    peRatio: '29.8',
    range52w: '$142.00 - $199.62',
    volume24h: '$18.9B',
    beta: '1.08',
    analystRating: 'Buy',
    color: '#d5fb45',
    pathPoints: 'M0,120 C40,100 80,90 120,105 C160,115 200,110 240,120 C280,105 320,90 360,65 L360,150 L0,150 Z',
    linePath: 'M0,120 C40,100 80,90 120,105 C160,115 200,110 240,120 C280,105 320,90 360,65',
    focusPoint: { x: 280, y: 105 },
  },
  {
    id: 'ETH-RST',
    ticker: 'ETH-RST',
    name: 'Addis Commercial Real Estate Fund',
    revenue: '15.4M ETB',
    revenueChange: '+14.2%',
    marketCap: '120.0M ETB',
    price: '1,250 ETB',
    priceChange: '+4.15%',
    priceChangeIsPositive: true,
    lastUpdate: 'Last update at 16:30',
    openPrice: '1,200 ETB',
    closePrice: '1,250 ETB',
    dividendYield: '8.40%',
    peRatio: '14.5',
    range52w: '1,050 - 1,320 ETB',
    volume24h: '4.2M ETB',
    beta: '0.62',
    analystRating: 'Strong Buy',
    color: '#d5fb45',
    pathPoints: 'M0,130 C40,110 80,100 120,75 C160,85 200,60 240,45 C280,30 320,40 360,20 L360,150 L0,150 Z',
    linePath: 'M0,130 C40,110 80,100 120,75 C160,85 200,60 240,45 C280,30 320,40 360,20',
    focusPoint: { x: 240, y: 45 },
  },
  {
    id: 'ETH-LOG',
    ticker: 'ETH-LOG',
    name: 'Mojo Dry Port Logistics Fleet',
    revenue: '28.1M ETB',
    revenueChange: '+18.9%',
    marketCap: '185.0M ETB',
    price: '890 ETB',
    priceChange: '+6.80%',
    priceChangeIsPositive: true,
    lastUpdate: 'Last update at 15:10',
    openPrice: '835 ETB',
    closePrice: '890 ETB',
    dividendYield: '10.2%',
    peRatio: '11.2',
    range52w: '710 - 940 ETB',
    volume24h: '6.8M ETB',
    beta: '0.78',
    analystRating: 'Buy',
    color: '#38bdf8',
    pathPoints: 'M0,110 C40,90 80,110 120,80 C160,55 200,75 240,45 C280,35 320,25 360,15 L360,150 L0,150 Z',
    linePath: 'M0,110 C40,90 80,110 120,80 C160,55 200,75 240,45 C280,35 320,25 360,15',
    focusPoint: { x: 240, y: 45 },
  },
]

const TIMEFRAMES = ['1 Day', '1 Week', '1 Month', '3 Months', '6 Months', '1 Year', '5 Years', 'All Time']

export default function StockComparison() {
  const [stock1Id, setStock1Id] = useState('MSFT')
  const [stock2Id, setStock2Id] = useState('AAPL')
  const [activeTimeframe, setActiveTimeframe] = useState('6 Months')

  const [hover1, setHover1] = useState(null)
  const [hover2, setHover2] = useState(null)

  const stock1 = MOCK_STOCKS.find((s) => s.id === stock1Id) ?? MOCK_STOCKS[0]
  const stock2 = MOCK_STOCKS.find((s) => s.id === stock2Id) ?? MOCK_STOCKS[1]

  const handleSwap = () => {
    setStock1Id(stock2Id)
    setStock2Id(stock1Id)
    setHover1(null)
    setHover2(null)
  }

  const handlePointerMove1 = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const svgX = relX * 320
    const svgY = 65 + Math.sin(relX * Math.PI * 3.5) * 30

    const isETB = stock1.openPrice.includes('ETB')
    const unit = isETB ? ' ETB' : ''
    const prefix = stock1.openPrice.startsWith('$') ? '$' : ''
    const baseOpen = parseFloat(stock1.openPrice.replace(/[^0-9.]/g, '')) || 228.56
    const baseClose = parseFloat(stock1.closePrice.replace(/[^0-9.]/g, '')) || 280.21

    const openVal = isETB
      ? Math.round(baseOpen + Math.sin(relX * Math.PI * 2) * 80).toLocaleString() + unit
      : prefix + (baseOpen + Math.sin(relX * Math.PI * 2) * 15).toFixed(2)
    const closeVal = isETB
      ? Math.round(baseClose + Math.cos(relX * Math.PI * 2.5) * 90).toLocaleString() + unit
      : prefix + (baseClose + Math.cos(relX * Math.PI * 2.5) * 22).toFixed(2)

    setHover1({ x: svgX, y: svgY, relX, open: openVal, close: closeVal })
  }

  const handlePointerMove2 = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const svgX = relX * 320
    const svgY = 85 + Math.cos(relX * Math.PI * 3) * 35

    const isETB = stock2.openPrice.includes('ETB')
    const unit = isETB ? ' ETB' : ''
    const prefix = stock2.openPrice.startsWith('$') ? '$' : ''
    const baseOpen = parseFloat(stock2.openPrice.replace(/[^0-9.]/g, '')) || 162.1
    const baseClose = parseFloat(stock2.closePrice.replace(/[^0-9.]/g, '')) || 180.0

    const openVal = isETB
      ? Math.round(baseOpen + Math.cos(relX * Math.PI * 2) * 60).toLocaleString() + unit
      : prefix + (baseOpen + Math.cos(relX * Math.PI * 2) * 12).toFixed(2)
    const closeVal = isETB
      ? Math.round(baseClose + Math.sin(relX * Math.PI * 2.5) * 75).toLocaleString() + unit
      : prefix + (baseClose + Math.sin(relX * Math.PI * 2.5) * 18).toFixed(2)

    setHover2({ x: svgX, y: svgY, relX, open: openVal, close: closeVal })
  }

  // Active focus coordinates
  const activePoint1 = hover1 ?? {
    x: 220,
    y: 65,
    relX: 0.68,
    open: stock1.openPrice,
    close: stock1.closePrice,
  }

  const activePoint2 = hover2 ?? {
    x: 220,
    y: 95,
    relX: 0.68,
    open: stock2.openPrice,
    close: stock2.closePrice,
  }

  return (
    <DashboardLayout activeNav="stock-comparison">
      <div className="space-y-6">
        {/* PAGE HEADER */}
        <div>
          <h1 className="font-headline-lg text-xl md:text-2xl text-white tracking-tight">
            Stock Comparison
          </h1>
          <p className="font-body-md text-xs text-[#a0a0a0] mt-0.5">
            Compare performance metrics, valuation, revenue growth, and historical price movements across your portfolio assets.
          </p>
        </div>

        {/* 1. SEARCH STOCKS TO COMPARE CONTAINER */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="font-title-md text-base text-white font-bold">
            Search Stocks to Compare
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3">
            {/* 1ST STOCK SELECTOR */}
            <div className="relative glass-card rounded-xl h-11 px-3 border border-white/10 flex items-center justify-between">
              <span className="font-label-sm text-[10px] text-[#a0a0a0] uppercase shrink-0 mr-2">
                1ST:
              </span>
              <select
                value={stock1Id}
                onChange={(e) => setStock1Id(e.target.value)}
                className="bg-transparent font-title-md text-xs text-white outline-none cursor-pointer w-full pr-6 truncate"
              >
                {MOCK_STOCKS.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.id === stock2Id} className="bg-[#121414] text-white">
                    {s.name} ({s.ticker})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-gray-400 text-sm absolute right-2.5 pointer-events-none">
                search
              </span>
            </div>

            {/* SWAP BUTTON */}
            <button
              onClick={handleSwap}
              title="Swap stocks"
              className="w-9 h-9 rounded-full glass-card border border-white/15 flex items-center justify-center text-primary-fixed hover:bg-white/10 transition-all mx-auto"
            >
              <span className="material-symbols-outlined text-base">swap_horiz</span>
            </button>

            {/* 2ND STOCK SELECTOR */}
            <div className="relative glass-card rounded-xl h-11 px-3 border border-white/10 flex items-center justify-between">
              <span className="font-label-sm text-[10px] text-[#a0a0a0] uppercase shrink-0 mr-2">
                2ND:
              </span>
              <select
                value={stock2Id}
                onChange={(e) => setStock2Id(e.target.value)}
                className="bg-transparent font-title-md text-xs text-white outline-none cursor-pointer w-full pr-6 truncate"
              >
                {MOCK_STOCKS.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.id === stock1Id} className="bg-[#121414] text-white">
                    {s.name} ({s.ticker})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-gray-400 text-sm absolute right-2.5 pointer-events-none">
                search
              </span>
            </div>
          </div>
        </div>

        {/* 2. OVERVIEW CARDS SECTION */}
        <div className="space-y-3">
          <h2 className="font-title-md text-base text-white">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OVERVIEW CARD 1 */}
            <div className="glass-card rounded-2xl p-4 md:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-title-md text-sm text-primary-fixed">
                  {stock1.ticker.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-title-md text-sm text-white">{stock1.ticker}</h3>
                  <p className="font-body-md text-xs text-[#a0a0a0]">{stock1.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-5 text-right">
                <div>
                  <span className="font-label-sm text-[10px] text-[#a0a0a0] uppercase block">Revenue</span>
                  <div className="flex items-center justify-end gap-0.5 font-title-md text-xs text-emerald-400 font-bold">
                    <span>{stock1.revenue}</span>
                    <span className="material-symbols-outlined text-xs">arrow_drop_up</span>
                  </div>
                </div>
                <div>
                  <span className="font-label-sm text-[10px] text-[#a0a0a0] uppercase block">Market Cap</span>
                  <span className="font-title-md text-xs text-white font-bold">{stock1.marketCap}</span>
                </div>
              </div>
            </div>

            {/* OVERVIEW CARD 2 */}
            <div className="glass-card rounded-2xl p-4 md:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-title-md text-sm text-sky-400">
                  {stock2.ticker.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-title-md text-sm text-white">{stock2.ticker}</h3>
                  <p className="font-body-md text-xs text-[#a0a0a0]">{stock2.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-5 text-right">
                <div>
                  <span className="font-label-sm text-[10px] text-[#a0a0a0] uppercase block">Revenue</span>
                  <div className="flex items-center justify-end gap-0.5 font-title-md text-xs text-emerald-400 font-bold">
                    <span>{stock2.revenue}</span>
                    <span className="material-symbols-outlined text-xs">arrow_drop_up</span>
                  </div>
                </div>
                <div>
                  <span className="font-label-sm text-[10px] text-[#a0a0a0] uppercase block">Market Cap</span>
                  <span className="font-title-md text-xs text-white font-bold">{stock2.marketCap}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. PRICE COMPARISON SECTION WITH DUAL CHARTS */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="font-title-md text-base text-white">Price Comparison</h2>

            {/* TIMEFRAME PILL FILTERS */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-full font-label-sm text-[11px] transition-all whitespace-nowrap ${
                    activeTimeframe === tf
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-[#a0a0a0] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* DUAL COMPARISON CHART CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CHART CARD 1 (MSFT / Asset 1) */}
            <div className="glass-card rounded-2xl p-5 space-y-4 relative overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display-lg text-xl text-white font-bold">{stock1.ticker}</h3>
                  <p className="font-body-md text-xs text-[#a0a0a0] mt-0.5">{stock1.name}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className={`font-label-sm text-xs flex items-center gap-0.5 font-bold ${
                        stock1.priceChangeIsPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <span>{stock1.priceChangeIsPositive ? '▲' : '▼'}</span>
                      <span>{stock1.priceChange}</span>
                    </span>
                    <span className="font-display-lg text-2xl text-white font-extrabold">
                      {stock1.price}
                    </span>
                  </div>
                  <span className="font-label-sm text-[10px] text-[#8e97a4] block mt-0.5">{stock1.lastUpdate}</span>
                </div>
              </div>

              {/* Chart Body with Left Y-Axis & Interactive SVG */}
              <div className="flex gap-3 pt-2">
                {/* Left Y-Axis Ticks */}
                <div className="flex flex-col justify-between h-[180px] font-label-sm text-[11px] text-[#8e97a4] shrink-0 py-1">
                  <span>260</span>
                  <span>240</span>
                  <span>220</span>
                  <span>200</span>
                  <span>180</span>
                  <span>160</span>
                </div>

                {/* SVG Graph Box with Pointer Listener */}
                <div
                  className="flex-1 relative h-[180px] cursor-crosshair select-none"
                  onMouseMove={handlePointerMove1}
                  onTouchMove={handlePointerMove1}
                  onMouseLeave={() => setHover1(null)}
                  onTouchEnd={() => setHover1(null)}
                >
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 320 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="msft-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="30" x2="320" y2="30" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="90" x2="320" y2="90" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="120" x2="320" y2="120" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="150" x2="320" y2="150" stroke="rgba(255,255,255,0.06)" />

                    {/* Gradient Wave Area Fill */}
                    <path
                      d="M0,80 C40,85 80,45 120,55 C160,65 200,95 240,65 C280,45 320,80 320,30 L320,180 L0,180 Z"
                      fill="url(#msft-area)"
                    />

                    {/* Dynamic Dotted Horizontal Price Guide */}
                    <line x1="0" y1={activePoint1.y} x2="320" y2={activePoint1.y} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" />

                    {/* Dynamic Dotted Vertical Month Crosshair */}
                    <line x1={activePoint1.x} y1="0" x2={activePoint1.x} y2="180" stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" />

                    {/* Smooth Wave Line */}
                    <path
                      d="M0,80 C40,85 80,45 120,55 C160,65 200,95 240,65 C280,45 320,80 320,30"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      className="chart-glow"
                    />

                    {/* Active Interactive Node Marker */}
                    <circle cx={activePoint1.x} cy={activePoint1.y} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" className="chart-glow" />
                  </svg>

                  {/* Dark Dynamic Floating Tooltip Card */}
                  <div
                    className="absolute bg-[#1e2024]/95 backdrop-blur-md border border-white/20 rounded-2xl p-3 px-4 shadow-2xl text-xs space-y-1.5 z-20 transition-all pointer-events-none"
                    style={{
                      left: `${Math.min(55, Math.max(5, activePoint1.relX * 100 - 15))}%`,
                      top: `${Math.min(55, Math.max(10, (activePoint1.y / 180) * 100 - 30))}%`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#a0a0a0] font-body-md flex items-center gap-1">
                        Open <span className="material-symbols-outlined text-xs text-emerald-400">arrow_drop_up</span>
                      </span>
                      <span className="font-mono text-white font-bold">{activePoint1.open}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#a0a0a0] font-body-md flex items-center gap-1">
                        Close <span className="material-symbols-outlined text-xs text-rose-400">arrow_drop_down</span>
                      </span>
                      <span className="font-mono text-white font-bold">{activePoint1.close}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom X-Axis Labels */}
              <div className="flex justify-between pl-9 font-label-sm text-[11px] text-[#8e97a4] pt-1">
                <span>Jan</span>
                <span>Mar</span>
                <span>May</span>
                <span>Jul</span>
                <span>Sep</span>
                <span>Nov</span>
              </div>
            </div>

            {/* CHART CARD 2 (AAPL / Asset 2) */}
            <div className="glass-card rounded-2xl p-5 space-y-4 relative overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display-lg text-xl text-white font-bold">{stock2.ticker}</h3>
                  <p className="font-body-md text-xs text-[#a0a0a0] mt-0.5">{stock2.name}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className={`font-label-sm text-xs flex items-center gap-0.5 font-bold ${
                        stock2.priceChangeIsPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <span>{stock2.priceChangeIsPositive ? '▲' : '▼'}</span>
                      <span>{stock2.priceChange}</span>
                    </span>
                    <span className="font-display-lg text-2xl text-white font-extrabold">
                      {stock2.price}
                    </span>
                  </div>
                  <span className="font-label-sm text-[10px] text-[#8e97a4] block mt-0.5">{stock2.lastUpdate}</span>
                </div>
              </div>

              {/* Chart Body with Left Y-Axis & Interactive SVG */}
              <div className="flex gap-3 pt-2">
                {/* Left Y-Axis Ticks */}
                <div className="flex flex-col justify-between h-[180px] font-label-sm text-[11px] text-[#8e97a4] shrink-0 py-1">
                  <span>200</span>
                  <span>180</span>
                  <span>160</span>
                  <span>140</span>
                  <span>120</span>
                  <span>100</span>
                </div>

                {/* SVG Graph Box with Pointer Listener */}
                <div
                  className="flex-1 relative h-[180px] cursor-crosshair select-none"
                  onMouseMove={handlePointerMove2}
                  onTouchMove={handlePointerMove2}
                  onMouseLeave={() => setHover2(null)}
                  onTouchEnd={() => setHover2(null)}
                >
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 320 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="aapl-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d5fb45" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#d5fb45" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="30" x2="320" y2="30" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="90" x2="320" y2="90" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="120" x2="320" y2="120" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="150" x2="320" y2="150" stroke="rgba(255,255,255,0.06)" />

                    {/* Gradient Wave Area Fill */}
                    <path
                      d="M0,90 C50,60 100,55 150,90 C200,95 250,75 300,105 C310,95 320,40 320,40 L320,180 L0,180 Z"
                      fill="url(#aapl-area)"
                    />

                    {/* Dynamic Dotted Horizontal Price Guide */}
                    <line x1="0" y1={activePoint2.y} x2="320" y2={activePoint2.y} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" />

                    {/* Dynamic Dotted Vertical Month Crosshair */}
                    <line x1={activePoint2.x} y1="0" x2={activePoint2.x} y2="180" stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" />

                    {/* Smooth Wave Line */}
                    <path
                      d="M0,90 C50,60 100,55 150,90 C200,95 250,75 300,105 C310,95 320,40 320,40"
                      fill="none"
                      stroke="#d5fb45"
                      strokeWidth="2.5"
                      className="chart-glow"
                    />

                    {/* Active Interactive Node Marker */}
                    <circle cx={activePoint2.x} cy={activePoint2.y} r="5" fill="#d5fb45" stroke="#ffffff" strokeWidth="2" className="chart-glow" />
                  </svg>

                  {/* Dark Dynamic Floating Tooltip Card */}
                  <div
                    className="absolute bg-[#1e2024]/95 backdrop-blur-md border border-white/20 rounded-2xl p-3 px-4 shadow-2xl text-xs space-y-1.5 z-20 transition-all pointer-events-none"
                    style={{
                      left: `${Math.min(55, Math.max(5, activePoint2.relX * 100 - 15))}%`,
                      top: `${Math.min(55, Math.max(10, (activePoint2.y / 180) * 100 - 30))}%`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#a0a0a0] font-body-md flex items-center gap-1">
                        Open <span className="material-symbols-outlined text-xs text-emerald-400">arrow_drop_up</span>
                      </span>
                      <span className="font-mono text-white font-bold">{activePoint2.open}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#a0a0a0] font-body-md flex items-center gap-1">
                        Close <span className="material-symbols-outlined text-xs text-rose-400">arrow_drop_down</span>
                      </span>
                      <span className="font-mono text-white font-bold">{activePoint2.close}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom X-Axis Labels */}
              <div className="flex justify-between pl-9 font-label-sm text-[11px] text-[#8e97a4] pt-1">
                <span>Jan</span>
                <span>Mar</span>
                <span>May</span>
                <span>Jul</span>
                <span>Sep</span>
                <span>Nov</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. FINANCIAL COMPARISON MATRIX */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="font-title-md text-base text-white">Comparative Financial Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md text-xs text-[#e2e2e2]">
              <thead>
                <tr className="border-b border-white/10 font-label-sm text-[10px] text-[#a0a0a0] uppercase">
                  <th className="pb-2.5 px-3">Financial Metric</th>
                  <th className="pb-2.5 px-3 text-sky-400">{stock1.ticker} ({stock1.name})</th>
                  <th className="pb-2.5 px-3 text-primary-fixed">{stock2.ticker} ({stock2.name})</th>
                  <th className="pb-2.5 px-3 text-right">Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-3 text-white font-sans font-medium">Dividend Yield</td>
                  <td className="py-2.5 px-3">{stock1.dividendYield}</td>
                  <td className="py-2.5 px-3">{stock2.dividendYield}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{stock1.ticker} (+ Higher)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-sans font-medium">P/E Ratio</td>
                  <td className="py-2.5 px-3">{stock1.peRatio}</td>
                  <td className="py-2.5 px-3">{stock2.peRatio}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{stock2.ticker} (Lower Valuation)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-sans font-medium">52-Week Range</td>
                  <td className="py-2.5 px-3">{stock1.range52w}</td>
                  <td className="py-2.5 px-3">{stock2.range52w}</td>
                  <td className="py-2.5 px-3 text-right text-[#a0a0a0]">-</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-sans font-medium">24h Volume</td>
                  <td className="py-2.5 px-3">{stock1.volume24h}</td>
                  <td className="py-2.5 px-3">{stock2.volume24h}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{stock2.ticker} (+ Higher Liquidity)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-sans font-medium">Volatility (Beta)</td>
                  <td className="py-2.5 px-3">{stock1.beta}</td>
                  <td className="py-2.5 px-3">{stock2.beta}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{stock1.ticker} (Lower Risk)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-sans font-medium">Analyst Consensus</td>
                  <td className="py-2.5 px-3 text-primary-fixed">{stock1.analystRating}</td>
                  <td className="py-2.5 px-3 text-sky-400">{stock2.analystRating}</td>
                  <td className="py-2.5 px-3 text-right text-primary-fixed font-bold">Both Outperform</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
