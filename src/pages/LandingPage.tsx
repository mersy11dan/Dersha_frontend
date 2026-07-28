import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState("1Y");

  // Smooth scroll handler helper
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Chart Telemetry Data for Financial Graph
  const chartData = [
    { month: "JAN", nav: 100, yield: 11.2, volume: "12M ETB" },
    { month: "FEB", nav: 104, yield: 12.1, volume: "18M ETB" },
    { month: "MAR", nav: 108, yield: 12.8, volume: "24M ETB" },
    { month: "APR", nav: 112, yield: 13.4, volume: "31M ETB" },
    { month: "MAY", nav: 119, yield: 13.9, volume: "42M ETB" },
    { month: "JUN", nav: 125, yield: 14.2, volume: "58M ETB" },
    { month: "JUL", nav: 132, yield: 14.8, volume: "75M ETB" },
    { month: "AUG", nav: 138, yield: 15.1, volume: "92M ETB" },
    { month: "SEP", nav: 144, yield: 15.6, volume: "110M ETB" },
    { month: "OCT", nav: 151, yield: 16.0, volume: "128M ETB" },
    { month: "NOV", nav: 158, yield: 16.4, volume: "142M ETB" },
    { month: "DEC", nav: 167, yield: 17.2, volume: "150M ETB" },
  ];

  return (
    <div className="page-shell vortex-grid-bg min-h-screen bg-[#000000] text-[#ffffff]">
      {/* Navigation Header */}
      <nav className="fixed top-0 z-[100] w-full border-b-2 border-[#D4FF00] bg-[#000000]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-8 xl:gap-12">
            <a onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 shrink-0 cursor-pointer" href="#">
              <div className="flex h-9 w-9 items-center justify-center rounded-[2px] bg-[#D4FF00] font-mono text-lg font-black text-[#000000]">
                D
              </div>
              <div>
                <span className="font-mono text-xl font-black tracking-widest text-[#D4FF00]">DERSHA</span>
                <span className="block font-mono text-[9px] font-bold tracking-widest text-[#2AFF0A]">CELL PLATFORM</span>
              </div>
            </a>

            {/* Desktop Navigation Links with Smooth Scrolling */}
            <div className="hidden items-center gap-6 xl:gap-8 font-mono text-xs font-bold uppercase tracking-widest text-[#a0a0a0] lg:flex">
              <a onClick={(e) => { e.preventDefault(); scrollToSection("vision"); }} className="transition-colors hover:text-[#D4FF00] py-2 cursor-pointer" href="#vision">Vision</a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("mission"); }} className="transition-colors hover:text-[#D4FF00] py-2 cursor-pointer" href="#mission">Mission</a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("market"); }} className="transition-colors hover:text-[#D4FF00] py-2 cursor-pointer" href="#market">Market</a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("impact"); }} className="transition-colors hover:text-[#D4FF00] py-2 cursor-pointer" href="#impact">Impact</a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("workflow"); }} className="transition-colors hover:text-[#D4FF00] py-2 cursor-pointer" href="#workflow">How It Works</a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("chart"); }} className="transition-colors hover:text-[#D4FF00] py-2 cursor-pointer" href="#chart">Performance</a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("security"); }} className="transition-colors hover:text-[#D4FF00] py-2 cursor-pointer" href="#security">Security</a>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:inline-flex vortex-btn-secondary px-4 py-2 text-xs"
            >
              LOG IN
            </button>
            <button
              onClick={() => navigate("/account-info")}
              className="hidden sm:inline-flex vortex-btn-primary px-5 py-2 text-xs"
            >
              GET STARTED
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex items-center justify-center p-2 text-[#D4FF00] border-2 border-[#D4FF00] rounded-[2px] bg-[#050505] lg:hidden hover:bg-[#D4FF00] hover:text-[#000000] transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer UI */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b-2 border-[#D4FF00] bg-[#000000]/98 px-6 py-6 font-mono text-xs space-y-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col space-y-3 font-bold uppercase tracking-wider text-[#a0a0a0]">
              <a onClick={(e) => { e.preventDefault(); scrollToSection("vision"); }} className="hover:text-[#D4FF00] py-2 border-b border-white/5 flex items-center justify-between" href="#vision">
                <span>01. VISION</span>
                <span className="material-symbols-outlined text-sm text-[#D4FF00]">arrow_forward</span>
              </a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("mission"); }} className="hover:text-[#D4FF00] py-2 border-b border-white/5 flex items-center justify-between" href="#mission">
                <span>02. MISSION</span>
                <span className="material-symbols-outlined text-sm text-[#D4FF00]">arrow_forward</span>
              </a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("market"); }} className="hover:text-[#D4FF00] py-2 border-b border-white/5 flex items-center justify-between" href="#market">
                <span>03. MARKET CATALOGUE</span>
                <span className="material-symbols-outlined text-sm text-[#D4FF00]">arrow_forward</span>
              </a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("impact"); }} className="hover:text-[#D4FF00] py-2 border-b border-white/5 flex items-center justify-between" href="#impact">
                <span>04. TELEMETRY IMPACT</span>
                <span className="material-symbols-outlined text-sm text-[#D4FF00]">arrow_forward</span>
              </a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("workflow"); }} className="hover:text-[#D4FF00] py-2 border-b border-white/5 flex items-center justify-between" href="#workflow">
                <span>05. CELL MECHANICS</span>
                <span className="material-symbols-outlined text-sm text-[#D4FF00]">arrow_forward</span>
              </a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("chart"); }} className="hover:text-[#D4FF00] py-2 border-b border-white/5 flex items-center justify-between" href="#chart">
                <span>06. PERFORMANCE GRAPH</span>
                <span className="material-symbols-outlined text-sm text-[#D4FF00]">arrow_forward</span>
              </a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("security"); }} className="hover:text-[#D4FF00] py-2 border-b border-white/5 flex items-center justify-between" href="#security">
                <span>07. CUSTODY SECURITY</span>
                <span className="material-symbols-outlined text-sm text-[#D4FF00]">arrow_forward</span>
              </a>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}
                className="vortex-btn-secondary w-full py-3 text-center text-xs font-bold"
              >
                LOG IN TO TERMINAL
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/account-info"); }}
                className="vortex-btn-primary w-full py-3 text-center text-xs font-bold"
              >
                REGISTER INVESTOR ACCOUNT →
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="pt-20">
        {/* HERO SECTION - FULL SCREEN UNBROKEN IMAGE BACKGROUND */}
        <section
          className="relative min-h-[90vh] w-full border-b-2 border-[#D4FF00] bg-cover bg-center bg-no-repeat py-16 sm:py-24 flex items-center"
          style={{ backgroundImage: `url('/Assets/Img17_(1).jpg_2K_202607151400.jpeg')` }}
        >
          {/* Subtle bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/20 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-[#000000]/20 pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-10 w-full">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-[2px] border border-[#2AFF0A] bg-[#000000]/70 backdrop-blur-md px-3.5 sm:px-4 py-1.5 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#2AFF0A] shadow-lg">
                <span className="h-2 w-2 rounded-full bg-[#2AFF0A] animate-pulse" />
                ECMA REGULATED • CUSTODIAN BANK TRUST
              </div>

              <h1 className="mb-6 font-sans text-3xl sm:text-5xl lg:text-6xl font-black uppercase leading-[1.08] tracking-tight text-[#ffffff] drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
                ETHIOPIA'S INSTITUTIONAL GATEWAY TO <span className="bg-[#D4FF00] px-2 sm:px-2.5 text-[#000000]">FRACTIONAL REAL ASSETS</span>
              </h1>

              <p className="mb-8 font-sans text-sm sm:text-lg lg:text-xl leading-relaxed text-[#f0f0f0] max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] font-medium">
                Democratizing high-yield commercial real estate, logistics transport fleets, agricultural processing, and gold bullion through regulated digital book-entry units (CELL). Own fractionated asset units without purchasing full properties.
              </p>

              {/* Translucent Telemetry Stat Boxes Floating directly on background */}
              <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl">
                <div className="bg-[#000000]/70 backdrop-blur-md border border-[#D4FF00] p-3.5 sm:p-4 rounded-[2px] shadow-lg">
                  <span className="block font-mono text-[10px] uppercase text-[#D4FF00]">ASSET MODEL</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#ffffff]">CELL DIGITAL UNITS</span>
                </div>
                <div className="bg-[#000000]/70 backdrop-blur-md border border-[#D4FF00] p-3.5 sm:p-4 rounded-[2px] shadow-lg">
                  <span className="block font-mono text-[10px] uppercase text-[#D4FF00]">TRUSTEE BANK</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#ffffff]">CUSTODIAN BANK TRUST</span>
                </div>
                <div className="bg-[#000000]/70 backdrop-blur-md border border-[#D4FF00] p-3.5 sm:p-4 rounded-[2px] shadow-lg">
                  <span className="block font-mono text-[10px] uppercase text-[#D4FF00]">TARGET YIELD</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#2AFF0A]">14.2% APY AVG</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 sm:gap-4">
                <button
                  onClick={() => navigate("/account-info")}
                  className="vortex-btn-primary text-xs sm:text-sm shadow-[4px_4px_0px_#ffffff]"
                >
                  START INVESTING NOW
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
                <button
                  onClick={() => navigate("/marketplace")}
                  className="vortex-btn-secondary text-xs sm:text-sm bg-[#000000]/80 backdrop-blur-md text-[#ffffff] border-white/40 hover:bg-[#ffffff] hover:text-[#000000]"
                >
                  EXPLORE MARKETPLACE
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* VISION & MISSION SECTION */}
        <section className="border-b-2 border-[#D4FF00] bg-[#000000] py-16 sm:py-20" id="vision">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="vortex-panel p-6 sm:p-10 bg-[#050505]">
                <div className="mb-4 font-mono text-xs font-bold tracking-widest text-[#D4FF00]">
                  01. THE VISION
                </div>
                <h2 className="mb-4 font-sans text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#ffffff]">
                  DEMOCRATIZING HIGH-VALUE REAL ASSET OWNERSHIP ACROSS ETHIOPIA
                </h2>
                <p className="font-sans text-sm leading-relaxed text-[#a0a0a0]">
                  To foster national economic growth through compliant fractional ownership. By converting appraised real assets—such as prime commercial buildings, heavy logistics fleets, and agriculture—into digital book-entry units, investors build inflation-hedged portfolios with liquid monthly cash flow.
                </p>
              </div>

              <div className="vortex-panel bg-[#050505] p-6 sm:p-10" id="mission">
                <div className="mb-4 font-mono text-xs font-bold tracking-widest text-[#2AFF0A]">
                  02. THE MISSION
                </div>
                <h2 className="mb-4 font-sans text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#ffffff]">
                  STABLE CUSTODIED MARKETPLACE FOR YIELD & CAPITAL PRESERVATION
                </h2>
                <p className="mb-6 font-sans text-sm leading-relaxed text-[#a0a0a0]">
                  Provide asset owners an institutional channel to monetize asset equity while retaining operational stake, while providing retail and business investors direct access to audited, dividend-paying assets.
                </p>
                <div className="inline-flex items-center gap-2 border border-[#2AFF0A] bg-[#2AFF0A]/10 px-3 py-1.5 font-mono text-xs text-[#2AFF0A]">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>CMA COMPLIANT • FRAMEWORK ET-2026</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MARKET / REAL ASSET CATALOGUE */}
        <section className="border-b-2 border-[#D4FF00] bg-[#050505] py-16 sm:py-20" id="market">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-10">
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#D4FF00]">
                  03. OPEN MARKET CATALOGUE
                </span>
                <h2 className="font-sans text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#ffffff]">
                  APPRAISED ETHIOPIAN SUB-FUNDS
                </h2>
              </div>
              <button
                onClick={() => navigate("/marketplace")}
                className="vortex-btn-secondary text-xs w-fit"
              >
                OPEN MARKET TERMINAL →
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
              {/* Asset 1 */}
              <div className="vortex-panel vortex-panel-hover flex flex-col bg-[#000000] p-4">
                <div className="relative h-56 sm:h-60 w-full overflow-hidden rounded-[2px] border border-white/10">
                  <img
                    src="/Assets/Img25_(1).jpg_2K_202607151451.jpeg"
                    alt="Bole High-Rise Office Tower"
                    className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
                  />
                  <span className="absolute left-3 top-3 vortex-badge vortex-badge-volt">
                    ACTIVE LEASE
                  </span>
                </div>
                <div className="mt-4 flex flex-1 flex-col font-mono">
                  <span className="text-[10px] text-[#D4FF00]">REAL ESTATE • ADDIS ABABA</span>
                  <h3 className="font-sans text-base sm:text-lg font-bold text-[#ffffff] mt-1">
                    Bole High-Rise Commercial Office
                  </h3>
                  <p className="font-sans text-xs text-[#a0a0a0] my-2">
                    Prime commercial high-rise tower in Bole district leased to multi-year corporate tenants generating steady monthly yield.
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                    <span className="text-[#8c8c8c]">TARGET YIELD</span>
                    <span className="font-bold text-[#2AFF0A]">14.2% APY</span>
                  </div>
                </div>
              </div>

              {/* Asset 2 */}
              <div className="vortex-panel vortex-panel-hover flex flex-col bg-[#000000] p-4">
                <div className="relative h-56 sm:h-60 w-full overflow-hidden rounded-[2px] border border-white/10">
                  <img
                    src="/Assets/Img8.jpg"
                    alt="Ethiopian Infrastructure Project"
                    className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
                  />
                  <span className="absolute left-3 top-3 vortex-badge vortex-badge-cyber">
                    INFRASTRUCTURE
                  </span>
                </div>
                <div className="mt-4 flex flex-1 flex-col font-mono">
                  <span className="text-[10px] text-[#D4FF00]">INFRASTRUCTURE • ENERGY & ROADS</span>
                  <h3 className="font-sans text-base sm:text-lg font-bold text-[#ffffff] mt-1">
                    Regional Infrastructure Corridor
                  </h3>
                  <p className="font-sans text-xs text-[#a0a0a0] my-2">
                    Fractional sub-fund backed by contracted municipal infrastructure leases and toll-revenue distribution assets.
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                    <span className="text-[#8c8c8c]">TARGET YIELD</span>
                    <span className="font-bold text-[#2AFF0A]">13.8% APY</span>
                  </div>
                </div>
              </div>

              {/* Asset 3 */}
              <div className="vortex-panel vortex-panel-hover flex flex-col bg-[#000000] p-4">
                <div className="relative h-56 sm:h-60 w-full overflow-hidden rounded-[2px] border border-white/10">
                  <img
                    src="/Assets/Img17 (1).jpg"
                    alt="Agricultural & Industrial Assets"
                    className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
                  />
                  <span className="absolute left-3 top-3 vortex-badge vortex-badge-outline">
                    AGRICULTURE
                  </span>
                </div>
                <div className="mt-4 flex flex-1 flex-col font-mono">
                  <span className="text-[10px] text-[#D4FF00]">AGRICULTURE • WAREHOUSE RECEIPTS</span>
                  <h3 className="font-sans text-base sm:text-lg font-bold text-[#ffffff] mt-1">
                    Sidama Coffee Warehouse Receipts
                  </h3>
                  <p className="font-sans text-xs text-[#a0a0a0] my-2">
                    Custodied specialty coffee inventory and heavy processing machinery distributing seasonal harvest gains.
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                    <span className="text-[#8c8c8c]">TARGET YIELD</span>
                    <span className="font-bold text-[#2AFF0A]">17.2% APY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TELEMETRY IMPACT NUMBERS */}
        <section className="border-b-2 border-[#D4FF00] bg-[#000000] py-16 sm:py-20" id="impact">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-10">
            <div className="mb-10 text-center">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#D4FF00]">
                04. OUR IMPACT & TELEMETRY
              </span>
              <h2 className="font-sans text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#ffffff]">
                DRIVING ECONOMIC GROWTH & MARKET SCALE
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="vortex-panel p-6 sm:p-8 text-center bg-[#050505]">
                <div className="font-mono text-3xl sm:text-4xl font-black text-[#D4FF00]">150M+</div>
                <div className="mt-2 font-mono text-xs uppercase tracking-wider text-[#a0a0a0]">
                  ETB Capital Deployed
                </div>
              </div>

              <div className="vortex-panel p-6 sm:p-8 text-center bg-[#050505]">
                <div className="font-mono text-3xl sm:text-4xl font-black text-[#2AFF0A]">12,500+</div>
                <div className="mt-2 font-mono text-xs uppercase tracking-wider text-[#a0a0a0]">
                  Registered Fractional Owners
                </div>
              </div>

              <div className="vortex-panel p-6 sm:p-8 text-center bg-[#050505]">
                <div className="font-mono text-3xl sm:text-4xl font-black text-[#ffffff]">24</div>
                <div className="mt-2 font-mono text-xs uppercase tracking-wider text-[#a0a0a0]">
                  Appraised Sub-Funds
                </div>
              </div>

              <div className="vortex-panel p-6 sm:p-8 text-center bg-[#050505]">
                <div className="font-mono text-3xl sm:text-4xl font-black text-[#D4FF00]">100%</div>
                <div className="mt-2 font-mono text-xs uppercase tracking-wider text-[#a0a0a0]">
                  ECMA Regulatory Compliance
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section className="border-b-2 border-[#D4FF00] bg-[#050505] py-16 sm:py-20" id="workflow">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-10">
            <div className="mb-12 text-center">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#2AFF0A]">
                05. CELL MECHANICS
              </span>
              <h2 className="font-sans text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#ffffff]">
                HOW THE CELL PLATFORM WORKS
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              <div className="vortex-panel p-6 bg-[#000000]">
                <div className="mb-4 font-mono text-xs sm:text-sm font-bold text-[#D4FF00]">01. APPRAISE</div>
                <h4 className="mb-2 font-sans text-base sm:text-lg font-bold text-[#ffffff]">Asset Contribution</h4>
                <p className="font-sans text-xs text-[#a0a0a0]">
                  Owner contributes real asset into a regulated sub-fund. Independent valuer appraises total Net Asset Value (NAV).
                </p>
              </div>

              <div className="vortex-panel p-6 bg-[#000000]">
                <div className="mb-4 font-mono text-xs sm:text-sm font-bold text-[#D4FF00]">02. FRACTIONALIZE</div>
                <div className="mb-2 font-sans text-base sm:text-lg font-bold text-[#ffffff]">Book-Entry Units</div>
                <p className="font-sans text-xs text-[#a0a0a0]">
                  NAV is issued as digital ownership units. Public investors purchase units; title held in custodian trust.
                </p>
              </div>

              <div className="vortex-panel p-6 bg-[#000000]">
                <div className="mb-4 font-mono text-xs sm:text-sm font-bold text-[#D4FF00]">03. DISTRIBUTE</div>
                <div className="mb-2 font-sans text-base sm:text-lg font-bold text-[#ffffff]">Cash Yield</div>
                <p className="font-sans text-xs text-[#a0a0a0]">
                  Rent, lease cashflow, and operating revenues are distributed digitally to unit holders' wallets.
                </p>
              </div>

              <div className="vortex-panel p-6 bg-[#000000]">
                <div className="mb-4 font-mono text-xs sm:text-sm font-bold text-[#D4FF00]">04. EXIT & LIQUIDATE</div>
                <div className="mb-2 font-sans text-base sm:text-lg font-bold text-[#ffffff]">Marketplace Trade</div>
                <p className="font-sans text-xs text-[#a0a0a0]">
                  Investors trade units freely on the marketplace or receive capital redemption upon planned sub-fund closure.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* INSTITUTIONAL FINANCIAL PERFORMANCE & YIELD CHART SECTION */}
        <section className="border-b-2 border-[#D4FF00] bg-[#000000] py-16 sm:py-20" id="chart">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-10">
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end border-b border-[#D4FF00]/30 pb-6">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#D4FF00]">
                  06. INSTITUTIONAL FINANCIAL PERFORMANCE
                </span>
                <h2 className="font-sans text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#ffffff] mt-1">
                  HISTORICAL NAV & YIELD TELEMETRY
                </h2>
                <p className="font-sans text-xs text-[#a0a0a0] mt-1 max-w-xl">
                  Audited cumulative growth of Net Asset Value (NAV) and monthly cash distributions across all Ethiopian sub-funds.
                </p>
              </div>

              {/* Timeframe selector pills */}
              <div className="flex items-center gap-2 font-mono text-xs">
                {["1M", "3M", "6M", "1Y", "ALL"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeframe(tf)}
                    className={`px-3 py-1.5 rounded-[2px] border font-bold transition-all ${
                      activeTimeframe === tf
                        ? "border-[#D4FF00] bg-[#D4FF00] text-[#000000]"
                        : "border-white/20 bg-[#050505] text-[#8c8c8c] hover:text-[#ffffff]"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Financial Performance SVG Chart Panel */}
            <div className="vortex-panel p-6 sm:p-8 bg-[#050505]">
              {/* Telemetry Key Metric Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 font-mono border-b border-white/10 pb-6">
                <div>
                  <span className="text-[10px] text-[#8c8c8c] uppercase">CURRENT INDEX NAV</span>
                  <div className="text-xl sm:text-2xl font-black text-[#D4FF00]">167.4 ETB/UNIT</div>
                  <span className="text-[10px] text-[#2AFF0A]">+67.4% YTD</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8c8c8c] uppercase">ANNUALIZED YIELD</span>
                  <div className="text-xl sm:text-2xl font-black text-[#2AFF0A]">17.2% APY</div>
                  <span className="text-[10px] text-[#8c8c8c]">DISTRIBUTED MONTHLY</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8c8c8c] uppercase">24H MARKET VOLUME</span>
                  <div className="text-xl sm:text-2xl font-black text-[#ffffff]">150M ETB</div>
                  <span className="text-[10px] text-[#D4FF00]">ETHEXCHANGE LIVE</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8c8c8c] uppercase">CUSTODY REGULATION</span>
                  <div className="text-xl sm:text-2xl font-black text-[#D4FF00]">CBE TRUST</div>
                  <span className="text-[10px] text-[#2AFF0A]">ECMA AUDITED</span>
                </div>
              </div>

              {/* Glowing Financial Line Graph (SVG) */}
              <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                <svg className="h-full w-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4FF00" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#D4FF00" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="1000" y2="50" stroke="#222" strokeDasharray="4 4" />
                  <line x1="0" y1="125" x2="1000" y2="125" stroke="#222" strokeDasharray="4 4" />
                  <line x1="0" y1="200" x2="1000" y2="200" stroke="#222" strokeDasharray="4 4" />

                  {/* Gradient Fill under NAV Curve */}
                  <polygon
                    points="0,270 0,220 90,205 180,190 270,175 365,150 455,135 545,115 635,100 725,85 815,65 905,45 1000,20 1000,270"
                    fill="url(#chartGradient)"
                  />

                  {/* Neon Line Curve */}
                  <polyline
                    fill="none"
                    stroke="#D4FF00"
                    strokeWidth="4"
                    points="0,220 90,205 180,190 270,175 365,150 455,135 545,115 635,100 725,85 815,65 905,45 1000,20"
                  />

                  {/* Secondary Cyber Green Dividend Bar Overlay */}
                  <line x1="90" y1="270" x2="90" y2="240" stroke="#2AFF0A" strokeWidth="6" opacity="0.8" />
                  <line x1="270" y1="270" x2="270" y2="230" stroke="#2AFF0A" strokeWidth="6" opacity="0.8" />
                  <line x1="455" y1="270" x2="455" y2="210" stroke="#2AFF0A" strokeWidth="6" opacity="0.8" />
                  <line x1="635" y1="270" x2="635" y2="195" stroke="#2AFF0A" strokeWidth="6" opacity="0.8" />
                  <line x1="815" y1="270" x2="815" y2="170" stroke="#2AFF0A" strokeWidth="6" opacity="0.8" />
                  <line x1="1000" y1="270" x2="1000" y2="150" stroke="#2AFF0A" strokeWidth="6" opacity="0.8" />

                  {/* Highlight Data Points */}
                  <circle cx="1000" cy="20" r="6" fill="#D4FF00" />
                  <circle cx="1000" cy="20" r="10" fill="none" stroke="#D4FF00" strokeWidth="2" className="animate-ping" />
                </svg>
              </div>

              {/* Chart X-Axis Labels */}
              <div className="flex justify-between font-mono text-[10px] text-[#8c8c8c] pt-4 border-t border-white/10">
                {chartData.map((d) => (
                  <span key={d.month} className="hover:text-[#D4FF00] cursor-pointer">{d.month}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY & CUSTODY */}
        <section className="bg-[#050505] py-16 sm:py-20" id="security">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-10">
            <div className="vortex-panel p-6 sm:p-10 lg:p-12 bg-[#000000]">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#2AFF0A]">
                    07. CUSTODY & REGULATION
                  </span>
                  <h2 className="mb-6 font-sans text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#ffffff]">
                    BUILT ON CUSTODIAN BANK TRUST & ECMA COMPLIANCE
                  </h2>
                  <p className="mb-8 font-sans text-sm leading-relaxed text-[#a0a0a0]">
                    Dersha operates under strict regulatory oversight. Physical title deeds and cash deposits remain held in trust with licensed Custodian Banks in Ethiopia. User accounts are verified via Fayda National ID protocols.
                  </p>
                  <div className="flex flex-wrap gap-3 font-mono text-xs">
                    <span className="vortex-badge vortex-badge-cyber">FAYDA ID VERIFIED</span>
                    <span className="vortex-badge vortex-badge-volt">CUSTODIAN BANK TRUST</span>
                    <span className="vortex-badge vortex-badge-outline">SOC2 TYPE II</span>
                  </div>
                </div>

                <div className="space-y-4 rounded-[2px] border border-[#D4FF00]/40 bg-[#050505] p-6 font-mono">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                    <span className="text-[#8c8c8c]">REGULATOR</span>
                    <span className="font-bold text-[#D4FF00]">ETHIOPIAN CAPITAL MARKET AUTHORITY</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                    <span className="text-[#8c8c8c]">TRUSTEE STRUCTURE</span>
                    <span className="font-bold text-[#2AFF0A]">CUSTODIAN BANK IN TRUST</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                    <span className="text-[#8c8c8c]">IDENTIFICATION</span>
                    <span className="font-bold text-[#ffffff]">FAYDA NATIONAL ID PROTOCOL</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8c8c8c]">SECURITY STANDARD</span>
                    <span className="font-bold text-[#D4FF00]">AES-256 BANK GRADE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="border-t-2 border-[#D4FF00] bg-[#000000] py-16 sm:py-20">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8 text-center lg:px-10">
            <div className="vortex-panel-volt mx-auto max-w-4xl p-8 sm:p-12 lg:p-16">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#000000]">
                JOIN THE DERSHA DIGITAL EXCHANGE
              </span>
              <h2 className="my-4 font-sans text-2xl sm:text-4xl lg:text-5xl font-extrabold uppercase leading-tight text-[#000000]">
                START BUILDING YOUR FRACTIONAL REAL ASSET PORTFOLIO TODAY
              </h2>
              <p className="mx-auto mb-8 max-w-2xl font-sans text-xs sm:text-sm font-semibold text-[#000000]">
                Connect your Fayda ID and Ethiopian bank account or mobile wallet to access institutional asset classes.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => navigate("/account-info")}
                  className="vortex-btn-primary bg-[#000000] text-[#D4FF00] border-[#000000] hover:bg-[#ffffff] hover:text-[#000000]"
                >
                  CREATE INVESTOR ACCOUNT
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="vortex-btn-secondary border-[#000000] text-[#000000] hover:bg-[#000000] hover:text-[#D4FF00]"
                >
                  SIGN IN TO TERMINAL
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#D4FF00] bg-[#000000] py-12 text-[#ffffff]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 font-mono text-xs text-[#8c8c8c] lg:px-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="font-bold text-[#D4FF00]">DERSHA</span> DIGITAL EXCHANGE • CELL PLATFORM
              <span className="block text-[10px] text-[#595959]">REGULATED BY ETHIOPIAN CAPITAL MARKET AUTHORITY</span>
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <a onClick={(e) => { e.preventDefault(); scrollToSection("vision"); }} className="hover:text-[#D4FF00] cursor-pointer" href="#vision">VISION</a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("mission"); }} className="hover:text-[#D4FF00] cursor-pointer" href="#mission">MISSION</a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("market"); }} className="hover:text-[#D4FF00] cursor-pointer" href="#market">MARKET</a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("impact"); }} className="hover:text-[#D4FF00] cursor-pointer" href="#impact">IMPACT</a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("workflow"); }} className="hover:text-[#D4FF00] cursor-pointer" href="#workflow">HOW IT WORKS</a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("chart"); }} className="hover:text-[#D4FF00] cursor-pointer" href="#chart">PERFORMANCE</a>
              <a onClick={(e) => { e.preventDefault(); scrollToSection("security"); }} className="hover:text-[#D4FF00] cursor-pointer" href="#security">SECURITY</a>
              <a onClick={() => navigate("/login")} className="hover:text-[#D4FF00] cursor-pointer">LOG IN</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
