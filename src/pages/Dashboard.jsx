import { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'

export default function Dashboard() {
  const [historyFilter, setHistoryFilter] = useState('All')
  const [sendAmount, setSendAmount] = useState('43.42')
  const [receiveAmount, setReceiveAmount] = useState('342.43')
  const [sendAsset, setSendAsset] = useState('SOL')
  const [receiveAsset, setReceiveAsset] = useState('USD')

  const historyRows = [
    {
      id: 1,
      date: 'Apr 23, 2025',
      trade: '3.5676 BTC',
      tokenPrice: '$34,879.00 USD',
      value: '0.563768 USD',
      dex: 'APE',
      total: '$54,879.09',
      qty: '540',
      eth: '0.584',
    },
    {
      id: 2,
      date: 'Apr 22, 2025',
      trade: '14.20 SOL',
      tokenPrice: '$185.50 USD',
      value: '2.634100 USD',
      dex: 'RAY',
      total: '$2,634.10',
      qty: '140',
      eth: '0.782',
    },
    {
      id: 3,
      date: 'Apr 20, 2025',
      trade: '1.25 ETH',
      tokenPrice: '$3,420.00 USD',
      value: '4.275000 USD',
      dex: 'UNI',
      total: '$4,275.00',
      qty: '250',
      eth: '1.250',
    },
    {
      id: 4,
      date: 'Apr 18, 2025',
      trade: '500.00 USDT',
      tokenPrice: '$1.00 USD',
      value: '0.500000 USD',
      dex: 'PANCAKE',
      total: '$500.00',
      qty: '500',
      eth: '0.146',
    },
  ]

  const handleSwapClick = () => {
    const tempAsset = sendAsset
    setSendAsset(receiveAsset)
    setReceiveAsset(tempAsset)
    const tempAmt = sendAmount
    setSendAmount(receiveAmount)
    setReceiveAmount(tempAmt)
  }

  return (
    <DashboardLayout activeNav="dashboard" sidebarVariant="exchange">
      <div className="flex flex-col gap-6">
        {/* Page Title Header */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="font-display-lg text-[28px] sm:text-[36px] font-extrabold text-white leading-tight">
              Institutional Dashboard
            </h1>
            <p className="font-body-md text-on-surface-variant text-[14px]">
              Real-time portfolio analytics, market insights, and trading terminal.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-full glass-card text-white font-title-md text-[13px] hover:bg-white/10 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary-fixed">download</span>
              Export PDF
            </button>
          </div>
        </div>

        {/* Top Row Grid */}
        <div className="grid grid-cols-12 gap-gutter-grid">
          {/* Price Card */}
          <div className="col-span-12 lg:col-span-4 glass-card rounded-[24px] p-6 flex flex-col justify-between h-[280px]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-fixed/20 border border-primary-fixed/40 flex items-center justify-center text-primary-fixed shrink-0">
                  <span className="material-symbols-outlined text-[18px]">domain</span>
                </div>
                <span className="font-title-md text-[16px] text-white font-bold">ETHIO REAL ASSETS / ETB</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1 border border-white/10">
                <span className="material-symbols-outlined text-[14px] text-primary-fixed">verified</span>
                <span className="font-label-sm text-[10px] text-white/80">CBE TRUST</span>
              </div>
            </div>
            <div className="mb-4 flex-1 flex flex-col justify-center">
              <div className="font-display-lg text-[36px] sm:text-[40px] text-white mb-2 font-black tracking-tight">
                1,248,500 ETB
              </div>
              <div className="flex items-center gap-3">
                <div className="font-title-md text-[13px] text-white/80 bg-white/10 px-3 py-1 rounded-xl flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary-fixed">payments</span>
                  24h Telemetry
                </div>
                <div className="bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30 px-3 py-1 rounded-xl font-label-sm text-[12px] font-bold shadow-[0_0_12px_rgba(213,251,69,0.2)]">
                  +18.45%
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
              <div className="font-body-md text-[13px] text-white/70">Last Trade Price</div>
              <button className="px-4 py-1.5 bg-white/10 text-white/90 rounded-xl font-title-md text-[13px] hover:bg-white/20 transition-colors border border-white/5">
                Price (24h)
              </button>
            </div>
          </div>

          {/* Overview Chart Card */}
          <div className="col-span-12 lg:col-span-4 glass-card rounded-[24px] p-6 relative overflow-hidden h-[280px]">
            <div className="flex items-center gap-2 mb-4 z-10 relative">
              <h2 className="font-title-md text-[16px] text-white font-medium">Overview</h2>
              <span className="material-symbols-outlined text-white/50 text-[16px]">info</span>
            </div>
            {/* Simulated Chart SVG */}
            <div className="absolute inset-0 top-16 left-0 right-0 bottom-0 pointer-events-none">
              <svg height="100%" preserveAspectRatio="none" viewBox="0 0 400 200" width="100%">
                <path
                  className="chart-glow-yellow"
                  d="M0,150 C50,150 100,100 150,100 C200,100 250,50 300,80 C350,110 400,20"
                  fill="none"
                  stroke="#ffeb3b"
                  strokeWidth="2.5"
                />
                <path
                  d="M0,150 C50,150 100,100 150,100 C200,100 250,50 300,80 C350,110 400,20 L400,200 L0,200 Z"
                  fill="url(#grad-yellow)"
                  opacity="0.15"
                />
                <defs>
                  <linearGradient id="grad-yellow" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#ffeb3b', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#ffeb3b', stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            {/* Y Axis Labels */}
            <div className="flex flex-col justify-between h-[160px] absolute left-6 top-16 bottom-6 text-white/60 font-label-sm text-[11px]">
              <span>105</span>
              <span>75</span>
              <span>65</span>
              <span>35</span>
              <span>45</span>
            </div>
            {/* Tooltip Marker */}
            <div className="absolute top-[40px] left-[65%] flex flex-col items-center">
              <div className="bg-white text-black px-3 py-1 rounded-full font-label-sm text-[12px] font-bold mb-1 shadow-lg">
                +0.25%
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-black border-2 border-primary-fixed z-10 chart-glow" />
              <div className="w-[1px] h-28 bg-primary-fixed/50 border-l border-primary-fixed/80" />
              <div className="border border-white/20 rounded-full px-3 py-1 mt-1 text-white/80 font-label-sm text-[11px] bg-black/50 backdrop-blur-sm">
                May 25
              </div>
            </div>
          </div>

          {/* Your Wallet Quick Swap Card */}
          <div className="col-span-12 lg:col-span-4 glass-card rounded-[24px] p-6 flex flex-col h-[280px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-title-md text-[16px] text-white font-medium">Your Wallet</h2>
              <div className="flex gap-2 items-center">
                <button className="font-title-md text-[13px] text-white/70 hover:text-white px-2 py-1 transition-colors">
                  Buy
                </button>
                <button className="font-title-md text-[13px] text-white/70 hover:text-white px-2 py-1 transition-colors">
                  Sell
                </button>
                <button className="bg-primary-fixed text-on-primary px-3.5 py-1.5 rounded-xl font-title-md text-[13px] font-bold shadow-[0_0_15px_rgba(213,251,69,0.4)] hover:brightness-110 transition-all">
                  Exchange
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              {/* Send Row */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black shadow-md shrink-0">
                    <svg viewBox="0 0 32 32" className="w-5 h-5 fill-current">
                      <path d="M15.925 23.969l-9.819-5.794 9.819 13.825 9.825-13.825-9.825 5.794zM16.075 0l-9.819 16.294 9.819 5.806 9.825-5.806-9.825-16.294z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-label-sm text-[11px] text-white/70">Send</div>
                    <div className="font-title-md text-[14px] text-white flex items-center gap-1 cursor-pointer hover:text-primary-fixed">
                      {sendAsset} <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-label-sm text-[11px] text-white/70">Balance: 234.42</div>
                  <input
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="font-title-md text-[15px] text-white font-medium bg-transparent text-right w-24 outline-none border-b border-transparent focus:border-primary-fixed"
                  />
                </div>
              </div>

              {/* Slider & Switch Area */}
              <div className="py-4 relative flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center px-2 w-full absolute top-1/2 -translate-y-1/2 left-0 right-0 z-0 opacity-40">
                  <div className="flex-1 flex justify-between">
                    {[...Array(23)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-[1px] ${i === 22 ? 'h-4 bg-primary-fixed chart-glow' : i % 2 === 0 ? 'h-4 bg-white/40' : 'h-3 bg-white/20'}`}
                      />
                    ))}
                  </div>
                </div>
                {/* Floating Switch Button */}
                <button
                  onClick={handleSwapClick}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-primary-fixed z-20 shadow-lg hover:scale-110 transition-transform"
                >
                  <div className="flex flex-col gap-[2px]">
                    <span className="material-symbols-outlined text-[14px] leading-none">swap_vert</span>
                  </div>
                </button>
              </div>

              {/* Receive Row */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#2962FF] flex items-center justify-center text-white shadow-md shrink-0">
                    <span className="material-symbols-outlined text-[20px]">attach_money</span>
                  </div>
                  <div>
                    <div className="font-label-sm text-[11px] text-white/70">Receive</div>
                    <div className="font-title-md text-[14px] text-white flex items-center gap-1 cursor-pointer hover:text-primary-fixed">
                      {receiveAsset} <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-label-sm text-[11px] text-white/70">Updated Balance: 234.35</div>
                  <input
                    value={receiveAmount}
                    onChange={(e) => setReceiveAmount(e.target.value)}
                    className="font-title-md text-[15px] text-white font-medium bg-transparent text-right w-24 outline-none border-b border-transparent focus:border-primary-fixed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row Grid */}
        <div className="grid grid-cols-12 gap-gutter-grid">
          {/* General Statistics */}
          <div className="col-span-12 lg:col-span-8 glass-card rounded-[24px] p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                </div>
                <h2 className="font-title-md text-[18px] text-white font-medium">General Statistics</h2>
              </div>
              <button className="flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 text-white/80 font-title-md text-[13px] hover:bg-white/5 transition-colors">
                Monthly <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-fixed chart-glow" />
                <span className="font-body-md text-white/70 text-[13px]">
                  Ethereum <span className="text-white font-title-md ml-1 text-[14px]">8%</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF6B6B]" />
                <span className="font-body-md text-white/70 text-[13px]">
                  Binance <span className="text-white font-title-md ml-1 text-[14px]">30%</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#F7931A]" />
                <span className="font-body-md text-white/70 text-[13px]">
                  Bitcoin <span className="text-white font-title-md ml-1 text-[14px]">40%</span>
                </span>
              </div>
            </div>

            {/* Main Chart Area */}
            <div className="relative h-[250px] w-full mt-4">
              {/* Y Axis */}
              <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-white/50 font-label-sm text-[11px] w-8">
                <span>12K</span>
                <span>10K</span>
                <span>7K</span>
                <span>5K</span>
                <span>2K</span>
                <span>0</span>
              </div>

              {/* Chart Grid Area */}
              <div className="absolute left-10 right-0 top-0 bottom-8 border-b border-white/10 overflow-hidden rounded-b-xl">
                {/* SVG Definitions & Luminous Bezier Trend Lines */}
                <svg className="absolute inset-0 z-10 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 120">
                  <defs>
                    <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d5fb45" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#d5fb45" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="0" y1="45" x2="400" y2="45" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="400" y2="70" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="0" y1="95" x2="400" y2="95" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                  {/* Gradient Glow Fill under Bezier Curve */}
                  <path
                    d="M0,75 C40,85 80,60 120,68 C160,76 200,40 240,55 C280,70 320,30 360,40 C380,45 400,20 400,20 L400,120 L0,120 Z"
                    fill="url(#area-gradient)"
                  />

                  {/* Secondary Smooth Curve */}
                  <path
                    d="M0,95 C40,100 80,85 120,90 C160,95 200,65 240,75 C280,85 320,50 360,60 C380,65 400,45 400,45"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                    opacity="0.5"
                  />

                  {/* Primary Luminous Bezier Curve */}
                  <path
                    d="M0,75 C40,85 80,60 120,68 C160,76 200,40 240,55 C280,70 320,30 360,40 C380,45 400,20 400,20"
                    fill="none"
                    stroke="#d5fb45"
                    strokeWidth="3"
                    className="chart-glow"
                  />

                  {/* Crosshair Dotted Guide */}
                  <line x1="320" y1="0" x2="320" y2="120" stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />

                  {/* Active Highlight Node */}
                  <circle cx="320" cy="30" r="5" fill="#d5fb45" stroke="#050505" strokeWidth="2" className="chart-glow" />
                </svg>

                {/* Floating Glass Tooltip */}
                <div className="absolute right-[16%] top-[10%] bg-black/80 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-xl text-white shadow-xl z-20 flex items-center gap-2 transition-all hover:scale-105">
                  <span className="w-2 h-2 rounded-full bg-primary-fixed chart-glow" />
                  <span className="font-mono text-xs font-bold">$33,450.00</span>
                  <span className="font-label-sm text-[10px] text-emerald-400 font-bold">+14.2%</span>
                </div>
              </div>

              {/* X Axis */}
              <div className="absolute left-10 right-0 bottom-0 h-8 flex justify-between items-end text-white/50 font-label-sm text-[11px] px-2">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
                  (m) => (
                    <span key={m}>{m}</span>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Daily Relative Dominance (Pro Donut & Breakdown) */}
          <div className="col-span-12 lg:col-span-4 glass-card rounded-[24px] p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]">pie_chart</span>
                </div>
                <h2 className="font-title-md text-[18px] text-white font-medium">Daily relative Dominance</h2>
              </div>
              <span className="font-label-sm text-[10px] text-primary-fixed bg-primary-fixed/10 px-2.5 py-1 rounded-full border border-primary-fixed/20 font-bold">
                LIVE
              </span>
            </div>

            {/* Radial Segmented Donut Chart */}
            <div className="relative flex items-center justify-center my-2 h-[170px]">
              <svg className="w-[170px] h-[170px] -rotate-90 overflow-visible" viewBox="0 0 120 120">
                {/* Background Ring Track */}
                <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />

                {/* BTCUSDT (29.25%) */}
                <circle cx="60" cy="60" r="48" fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray="88 301" strokeDashoffset="0" opacity="0.9" />

                {/* DOGEUSDT (17.50% Active Neon Glow) */}
                <circle cx="60" cy="60" r="48" fill="none" stroke="#d5fb45" strokeWidth="14" strokeDasharray="53 301" strokeDashoffset="-92" className="chart-glow" />

                {/* SOLUSDT (14.30%) */}
                <circle cx="60" cy="60" r="48" fill="none" stroke="#a855f7" strokeWidth="12" strokeDasharray="43 301" strokeDashoffset="-148" opacity="0.9" />

                {/* XRPUSDT (7.48%) */}
                <circle cx="60" cy="60" r="48" fill="none" stroke="#64748b" strokeWidth="12" strokeDasharray="22 301" strokeDashoffset="-194" opacity="0.8" />

                {/* LINKUSDT (2.05%) */}
                <circle cx="60" cy="60" r="48" fill="none" stroke="#f97316" strokeWidth="12" strokeDasharray="6 301" strokeDashoffset="-219" opacity="0.9" />
              </svg>

              {/* Center Donut Hub Stats */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display-lg text-xl text-white font-extrabold tracking-tight">100%</span>
                <span className="font-label-sm text-[9px] text-[#a0a0a0] uppercase tracking-wider">DOMINANCE</span>
              </div>
            </div>

            {/* Asset Share Breakdown Cards */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between font-label-sm text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed chart-glow" />
                  <span className="text-white font-bold">DOGEUSDT</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-fixed w-[70%]" />
                  </div>
                  <span className="text-primary-fixed font-bold">17.50%</span>
                </div>
              </div>

              <div className="flex items-center justify-between font-label-sm text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-white font-bold">BTCUSDT</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[90%]" />
                  </div>
                  <span className="text-blue-400 font-bold">29.25%</span>
                </div>
              </div>

              <div className="flex items-center justify-between font-label-sm text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-white font-bold">SOLUSDT</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[55%]" />
                  </div>
                  <span className="text-purple-400 font-bold">14.30%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom History Table */}
        <div className="glass-card rounded-[24px] p-6 mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[18px]">history</span>
              </div>
              <h2 className="font-title-md text-[18px] text-white font-medium">History</h2>
            </div>

            {/* Time filters */}
            <div className="flex items-center gap-1 bg-black/30 rounded-full p-1 border border-white/10 backdrop-blur-md">
              {['All', '1 D', '1 W', '1 M', '1 Y'].map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-4 py-1 rounded-full font-title-md text-[13px] transition-all ${
                    historyFilter === f
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Table controls */}
            <div className="flex items-center gap-4">
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-[16px]">fullscreen</span>
              </button>
              <span className="font-label-sm text-[12px] text-white/70">1 - 10 of 50</span>
              <div className="flex gap-1">
                <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-white/10">
                  <th className="py-4 px-4 font-body-md text-[12px] text-white/50 font-normal">
                    Date <span className="material-symbols-outlined text-[14px] align-middle">keyboard_arrow_down</span>
                  </th>
                  <th className="py-4 px-4 font-body-md text-[12px] text-white/50 font-normal">Trade</th>
                  <th className="py-4 px-4 font-body-md text-[12px] text-white/50 font-normal">Token Price</th>
                  <th className="py-4 px-4 font-body-md text-[12px] text-white/50 font-normal">Value</th>
                  <th className="py-4 px-4 font-body-md text-[12px] text-white/50 font-normal">Dex</th>
                  <th className="py-4 px-4 font-body-md text-[12px] text-white/50 font-normal">Total</th>
                  <th className="py-4 px-4 font-body-md text-[12px] text-white/50 font-normal">Qty</th>
                  <th className="py-4 px-4 font-body-md text-[12px] text-white/50 font-normal">ETH</th>
                  <th className="py-4 px-4 font-body-md text-[12px] text-white/50 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-4 font-body-md text-[13px] text-white/90">{row.date}</td>
                    <td className="py-4 px-4 font-body-md text-[13px] text-white/90">{row.trade}</td>
                    <td className="py-4 px-4 font-body-md text-[13px] text-white/90">{row.tokenPrice}</td>
                    <td className="py-4 px-4 font-body-md text-[13px] text-white/90">{row.value}</td>
                    <td className="py-4 px-4 font-body-md text-[13px] text-white/90">
                      <span className="bg-white/10 px-2.5 py-1 rounded-md font-label-sm text-[11px] text-primary-fixed">
                        {row.dex}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-body-md text-[13px] text-white/90 font-medium">{row.total}</td>
                    <td className="py-4 px-4 font-body-md text-[13px] text-white/90">{row.qty}</td>
                    <td className="py-4 px-4 font-body-md text-[13px] text-white/90">{row.eth}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all">
                          <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
