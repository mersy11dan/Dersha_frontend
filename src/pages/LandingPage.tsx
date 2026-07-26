import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <body className="bg-background text-on-background font-body-md selection:bg-primary/20">
      <nav className="fixed top-0 w-full z-[100] bg-background/80 nav-blur border-b border-outline-variant">
        <div className="flex justify-between items-center px-margin-desktop h-16 max-w-container-max mx-auto">
          <div className="flex items-center gap-10">
            <a
              className="font-display text-headline-md text-primary tracking-widest font-bold"
              href="#"
            >
              DERSHA
            </a>
            <div className="hidden xl:flex gap-8 items-center text-[12px] font-semibold uppercase tracking-wider">
              <a
                className="text-on-surface hover:text-primary transition-colors"
                href="#vision"
              >
                Vision
              </a>
              <a
                className="text-on-surface hover:text-primary transition-colors"
                href="#mission"
              >
                Mission
              </a>
              <a
                className="text-on-surface hover:text-primary transition-colors"
                href="#market"
              >
                Market
              </a>
              <a
                className="text-on-surface hover:text-primary transition-colors"
                href="#impact"
              >
                Impact
              </a>
              <a
                className="text-on-surface hover:text-primary transition-colors"
                href="#workflow"
              >
                How It Works
              </a>
              <a
                className="text-on-surface hover:text-primary transition-colors"
                href="#security"
              >
                Security
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 text-[12px] font-bold uppercase tracking-wider hover:text-primary transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/account-info")}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-DEFAULT text-[12px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>
      <main className="pt-16">
        <section className="relative min-h-[85vh] flex items-center overflow-hidden border-b border-outline-variant">
          <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-section-gap items-center py-20 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-bold text-primary uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Regulated by Capital Market Authority
              </div>
              <h1 className="font-display text-[64px] leading-[1.1] text-on-surface tracking-tight mb-8">
                Ethiopia's Institutional <br />
                <span className="text-primary">Gateway</span> to Alternatives.
              </h1>
              <p className="font-body-lg text-on-surface-variant max-w-lg mb-10 leading-relaxed">
                Unlock fractional ownership in high-yield real estate,
                agriculture, and industrial projects. Regulated, secure, and
                transparent investments designed for the modern professional.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-primary text-on-primary px-10 py-4 rounded-DEFAULT font-bold uppercase text-[12px] tracking-widest flex items-center gap-3 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  Get Started
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </button>
                <button className="bg-surface-container text-on-surface px-10 py-4 rounded-DEFAULT border border-outline-variant font-bold uppercase text-[12px] tracking-widest hover:bg-surface-container-high transition-all">
                  Marketplace
                </button>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/10 rounded-xl blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
              <div className="relative rounded-xl overflow-hidden border border-outline-variant shadow-2xl">
                <img
                  className="w-full aspect-[4/3] object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                  data-alt="Addis Ababa development"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAe0N6k1bt5UmY-wtJSFJCWE_49vBpNGbRyK3b32fD0fL7FaN_Ge8gjD6TQ3qdXJXBlipbIpYUJMOqlKbZ3zbBcOVNSXkdQPjP-dlv3YFtSCycm1sFvYrDPOt-4y9TEMAGuVyMRMuX3QaBM8TqqWC2Mc31b8QTLxwGDZJgxypILnXcZKZ1hUAHgqgnUD-1jwvbrGq2hJJVzihp96XGn-FUsqCw5hosbNn84jamxijsDtRKvUQhkblyuxAyFNgBkRav1RSVng-qr3RjX"
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 gradient-overlay flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-primary mb-1">
                      Featured Institutional Asset
                    </p>
                    <h3 className="font-headline-md text-on-surface">
                      Bole District Premium Office
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">
                      Est. Yield
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      12.4% p.a.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 border-b border-outline-variant" id="vision">
          <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-section-gap items-center">
            <div className="space-y-8">
              <h2 className="text-[12px] font-bold text-primary uppercase tracking-[0.4em]">
                01 // THE VISION
              </h2>
              <h3 className="font-display text-[44px] leading-tight text-on-surface">
                Democratizing high-value opportunities across Ethiopia.
              </h3>
              <p className="font-body-lg text-on-surface-variant leading-relaxed">
                To foster national economic growth through fractional ownership,
                making asset classes once reserved for the ultra-wealthy
                accessible to all. We bridge the gap between capital and
                opportunity.
              </p>
            </div>
            <div
              className="bg-surface-container p-12 rounded-xl border border-outline-variant relative overflow-hidden group"
              id="mission"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-[120px] text-primary">
                  analytics
                </span>
              </div>
              <h2 className="text-[12px] font-bold text-secondary uppercase tracking-[0.4em] mb-6">
                02 // THE MISSION
              </h2>
              <h4 className="font-display text-headline-lg text-on-surface mb-6">
                A secure, regulated exchange for diversification.
              </h4>
              <p className="font-body-md text-on-surface-variant mb-10 leading-relaxed">
                Providing business owners a reliable platform to diversify
                capital into tangible, asset-backed opportunities that hedge
                against volatility and currency fluctuations.
              </p>
              <div className="flex items-center gap-4 text-primary bg-primary/10 w-fit px-4 py-2 rounded-full border border-primary/20">
                <span className="material-symbols-outlined text-[20px]">
                  verified
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  CMA Regulated #ET-2024-01
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="py-24 bg-surface-container-low border-b border-outline-variant overflow-hidden"
          id="impact"
        >
          <div className="max-w-container-max mx-auto px-margin-desktop">
            <div className="text-center mb-20">
              <h2 className="text-[12px] font-bold text-primary uppercase tracking-[0.4em] mb-4">
                03 // OUR IMPACT
              </h2>
              <h3 className="font-display text-display text-on-surface">
                Driving Economic Growth
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              <div className="p-10 bg-surface text-center border border-outline-variant hover:border-primary/50 transition-all group">
                <p className="text-display text-primary mb-2 group-hover:scale-110 transition-transform">
                  150M
                </p>
                <p className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">
                  ETB Capital Deployed
                </p>
              </div>
              <div className="p-10 bg-surface text-center border border-outline-variant hover:border-primary/50 transition-all group">
                <p className="text-display text-primary mb-2 group-hover:scale-110 transition-transform">
                  12,500+
                </p>
                <p className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Fractional Owners
                </p>
              </div>
              <div className="p-10 bg-surface text-center border border-outline-variant hover:border-primary/50 transition-all group">
                <p className="text-display text-primary mb-2 group-hover:scale-110 transition-transform">
                  18
                </p>
                <p className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Vetted Projects
                </p>
              </div>
              <div className="p-10 bg-surface text-center border border-outline-variant hover:border-primary/50 transition-all group">
                <p className="text-display text-primary mb-2 group-hover:scale-110 transition-transform">
                  100%
                </p>
                <p className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Compliance Record
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 border-b border-outline-variant" id="market">
          <div className="max-w-container-max mx-auto px-margin-desktop">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="max-w-2xl">
                <h2 className="text-[12px] font-bold text-primary uppercase tracking-[0.4em] mb-4">
                  04 // OPEN MARKET
                </h2>
                <h3 className="font-display text-headline-lg text-on-surface">
                  Institutional-Grade Opportunities
                </h3>
              </div>
              <a
                className="text-[12px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 hover:translate-x-1 transition-transform"
                href="#"
              >
                Terminal Access{" "}
                <span className="material-symbols-outlined text-[18px]">
                  open_in_new
                </span>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden group hover:border-primary transition-all">
                <div className="h-56 relative overflow-hidden">
                  <img
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    data-alt="Bole High-Rise"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7bL1LtabzHM4XKqjLkh9RVEPnMHulDIzd0hJyV7Nmp9pyMchHw_IhIQPFd3Q96ZBLHLiOsBW84Ksrk5o5T1bD8VSyBKq9_Tp2b5pCshO2Oq8Z_yYn_afAaWqlhC5PVSvnUDqtmehL423N_6Ksg7tN6Q3I2uij9eb-P-u4uptc5f8u8T7jfi1YsGL8Flf-OpCyno8CRAEAJ7eAUGx31546sshs6a69LOU0PT1HkRSHp9PVeLSOKP8sEqh8MjbTr4v1nzKbBtcn3agm"
                  />
                  <div className="absolute top-4 right-4 bg-primary px-3 py-1 text-[10px] font-bold text-on-primary uppercase tracking-widest rounded">
                    ACTIVE
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-[11px] font-bold text-primary uppercase mb-2">
                    Real Estate // Bole District
                  </p>
                  <h4 className="font-bold text-headline-md mb-6">
                    Bole High-Rise Residency
                  </h4>
                  <div className="grid grid-cols-2 gap-y-4 mb-8">
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                        ROI Proj.
                      </p>
                      <p className="text-headline-md text-primary">14.2%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                        Min Invest
                      </p>
                      <p className="text-headline-md">15k ETB</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                      <span className="text-on-surface-variant">
                        Funding Progress
                      </span>
                      <span>75%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-[75%] rounded-full"></div>
                    </div>
                    <button className="w-full py-4 bg-surface rounded font-bold uppercase text-[11px] tracking-widest border border-outline-variant group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-all">
                      Execute View
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden group hover:border-primary transition-all">
                <div className="h-56 relative overflow-hidden">
                  <img
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    data-alt="Sidama Coffee"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBV2edui3BzBpValxL-ycZ8VH2zrVPN8rGC1RVf8tCpuFvHnAVhnLNAp0wJs5BupLSh-eMkewbvhaWVaoWC7fZX9uuMJfObhRWdAawGpFa7yCJBQL6Nxw_RaGYpyScmN5cN1kKuCYkcSHrsDhLAtw3ZSViCA02SO2Yx62dxtM8KHnr_kO-alG3O4FYwGG7bKDVCIhtT35G6gj_I9vQ42p2K6329we6WSh39nM6EeYza5BRulmtP4R0rLBR15m9rO7GeMCMTb1LuIwP1"
                  />
                  <div className="absolute top-4 right-4 bg-primary px-3 py-1 text-[10px] font-bold text-on-primary uppercase tracking-widest rounded">
                    ACTIVE
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-[11px] font-bold text-primary uppercase mb-2">
                    Agriculture // Sidama Region
                  </p>
                  <h4 className="font-bold text-headline-md mb-6">
                    Sidama Specialty Coffee
                  </h4>
                  <div className="grid grid-cols-2 gap-y-4 mb-8">
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                        ROI Proj.
                      </p>
                      <p className="text-headline-md text-primary">18.5%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                        Min Invest
                      </p>
                      <p className="text-headline-md">5k ETB</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                      <span className="text-on-surface-variant">
                        Funding Progress
                      </span>
                      <span>40%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-[40%] rounded-full"></div>
                    </div>
                    <button className="w-full py-4 bg-surface rounded font-bold uppercase text-[11px] tracking-widest border border-outline-variant group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-all">
                      Execute View
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden group hover:border-primary transition-all">
                <div className="h-56 relative overflow-hidden">
                  <img
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    data-alt="Energy Park"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNMvOhWIxlj2PtEU4h9pQs2o_s563_ZEAry3Q4bYP08OPqm3bFdVL6aB4WbW7BBjTnTfukpXhJui1cYEeKlYOtEuUT9eSelMddZaWLdrNFIoEspgNZ1QrpoTMy6KweJzfKt38zXXbfrnQBMNPFOVAkYQh7FxY_L2IXTYeNZRvjDfiV1iJjyjU4ZcJy4XQkPYgFhHKScjDxuVbdXF9WeHsA3yNLt6sUg3jGlpSXKWSOh3PQRJVmjI6-CwK21rR0zs95sJ3YpGYTu1Lg"
                  />
                  <div className="absolute top-4 right-4 bg-secondary px-3 py-1 text-[10px] font-bold text-on-secondary uppercase tracking-widest rounded">
                    CLOSING
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-[11px] font-bold text-primary uppercase mb-2">
                    Infrastructure // Energy
                  </p>
                  <h4 className="font-bold text-headline-md mb-6">
                    Blue Nile Energy Park
                  </h4>
                  <div className="grid grid-cols-2 gap-y-4 mb-8">
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                        ROI Proj.
                      </p>
                      <p className="text-headline-md text-primary">11.8%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                        Min Invest
                      </p>
                      <p className="text-headline-md">25k ETB</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                      <span className="text-on-surface-variant">
                        Funding Progress
                      </span>
                      <span>90%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-[90%] rounded-full"></div>
                    </div>
                    <button className="w-full py-4 bg-surface rounded font-bold uppercase text-[11px] tracking-widest border border-outline-variant group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-all">
                      Execute View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="py-24 bg-surface-container-low border-b border-outline-variant"
          id="workflow"
        >
          <div className="max-w-container-max mx-auto px-margin-desktop">
            <div className="text-center mb-20">
              <h2 className="text-[12px] font-bold text-primary uppercase tracking-[0.4em] mb-4">
                05 // WORKFLOW
              </h2>
              <h3 className="font-display text-display text-on-surface">
                Your Journey to Ownership
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-10 bg-background border border-outline-variant rounded-xl group hover:border-primary transition-all">
                <div className="w-14 h-14 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary rounded-xl mb-8 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">
                    search
                  </span>
                </div>
                <h4 className="font-bold uppercase text-[14px] tracking-widest mb-4">
                  Discover Assets
                </h4>
                <p className="text-[15px] text-on-surface-variant leading-relaxed">
                  Browse our marketplace of curated and vetted alternative
                  assets with comprehensive data and projections.
                </p>
              </div>
              <div className="p-10 bg-background border border-outline-variant rounded-xl group hover:border-primary transition-all">
                <div className="w-14 h-14 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary rounded-xl mb-8 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">
                    account_balance
                  </span>
                </div>
                <h4 className="font-bold uppercase text-[14px] tracking-widest mb-4">
                  Secure Ownership
                </h4>
                <p className="text-[15px] text-on-surface-variant leading-relaxed">
                  Purchase fractional shares instantly via our secure platform
                  with integrated bank transfers.
                </p>
              </div>
              <div className="p-10 bg-background border border-outline-variant rounded-xl group hover:border-primary transition-all">
                <div className="w-14 h-14 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary rounded-xl mb-8 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">
                    payments
                  </span>
                </div>
                <h4 className="font-bold uppercase text-[14px] tracking-widest mb-4">
                  Earn Distributions
                </h4>
                <p className="text-[15px] text-on-surface-variant leading-relaxed">
                  Monitor your portfolio in real-time and receive automated
                  dividend distributions directly to your account.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="py-24 bg-background border-b border-outline-variant relative overflow-hidden"
          id="security"
        >
          <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2"></div>
          <div className="max-w-container-max mx-auto px-margin-desktop relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-section-gap items-center">
              <div>
                <h2 className="text-[12px] font-bold text-primary uppercase tracking-[0.4em] mb-6">
                  06 // SECURITY &amp; COMPLIANCE
                </h2>
                <h3 className="font-display text-[44px] leading-tight text-on-surface mb-8">
                  Built on Institutional Trust
                </h3>
                <p className="font-body-lg text-on-surface-variant mb-10">
                  Security is not an afterthought; it is our foundation. Dirsha
                  operates under a strict regulatory framework to ensure
                  investor protection at every layer.
                </p>
                <div className="space-y-6">
                  <div className="flex gap-6 p-6 bg-surface-container rounded-xl border border-outline-variant">
                    <span className="material-symbols-outlined text-primary text-[32px]">
                      gpp_good
                    </span>
                    <div>
                      <h5 className="font-bold text-[16px] mb-2">
                        CMA Regulated
                      </h5>
                      <p className="text-sm text-on-surface-variant">
                        Licensed by the Ethiopian Capital Market Authority
                        (ECMA) as a Crowdfunding Platform Operator.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6 p-6 bg-surface-container rounded-xl border border-outline-variant">
                    <span className="material-symbols-outlined text-primary text-[32px]">
                      security
                    </span>
                    <div>
                      <h5 className="font-bold text-[16px] mb-2">
                        SOC2 Type II Compliant
                      </h5>
                      <p className="text-sm text-on-surface-variant">
                        Our infrastructure meets global standards for data
                        security, availability, and processing integrity.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6 p-6 bg-surface-container rounded-xl border border-outline-variant">
                    <span className="material-symbols-outlined text-primary text-[32px]">
                      account_balance
                    </span>
                    <div>
                      <h5 className="font-bold text-[16px] mb-2">
                        Tier-1 Custody
                      </h5>
                      <p className="text-sm text-on-surface-variant">
                        Assets are held in bankruptcy-remote structures with
                        institutional custodial banks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-surface-container-high p-12 rounded-2xl border border-outline-variant shadow-2xl">
                  <div className="flex justify-between items-center mb-10 pb-6 border-b border-outline-variant">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary">
                          lock
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">
                          Safety Framework
                        </p>
                        <p className="font-bold">Encryption Status: ACTIVE</p>
                      </div>
                    </div>
                    <span className="text-primary text-xs font-bold px-3 py-1 bg-primary/10 rounded-full">
                      AES-256
                    </span>
                  </div>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                      <span className="material-symbols-outlined text-primary text-sm mt-1">
                        check_circle
                      </span>
                      <span className="text-sm">
                        End-to-end data encryption for all transactions
                      </span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="material-symbols-outlined text-primary text-sm mt-1">
                        check_circle
                      </span>
                      <span className="text-sm">
                        Biometric &amp; MFA authentication protocols
                      </span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="material-symbols-outlined text-primary text-sm mt-1">
                        check_circle
                      </span>
                      <span className="text-sm">
                        Real-time fraud monitoring &amp; AML checks
                      </span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="material-symbols-outlined text-primary text-sm mt-1">
                        check_circle
                      </span>
                      <span className="text-sm">
                        Regular external security audits
                      </span>
                    </li>
                  </ul>
                  <div className="mt-12 p-4 bg-background/50 border border-outline-variant rounded-lg text-center">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-2">
                      Legal Entity Identifier
                    </p>
                    <p className="font-mono text-sm tracking-widest text-primary">
                      CMA-LEI-ET-2024-01-X9
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-background">
          <div className="max-w-container-max mx-auto px-margin-desktop">
            <div className="bg-surface-container rounded-2xl p-12 lg:p-20 relative overflow-hidden border border-outline-variant group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 group-hover:scale-110 transition-transform duration-1000"></div>
              <div className="relative z-10 max-w-3xl">
                <h2 className="font-display text-[52px] leading-tight mb-8">
                  Ready to build your{" "}
                  <span className="italic text-primary">legacy</span>?
                </h2>
                <p className="font-body-lg opacity-70 mb-12">
                  Join the exclusive network of institutional and individual
                  investors shaping the future of the Ethiopian economy.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-primary text-on-primary px-12 py-5 rounded-DEFAULT font-bold uppercase text-[12px] tracking-widest hover:brightness-110 shadow-xl shadow-primary/20">
                    Open an Institutional Account
                  </button>
                  <button className="bg-transparent border border-outline-variant text-on-surface px-12 py-5 rounded-DEFAULT font-bold uppercase text-[12px] tracking-widest hover:bg-surface-container-high transition-all">
                    Consult an Advisor
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-10 p-6 bg-surface-container-low border border-outline-variant rounded-xl text-[12px] text-on-surface-variant leading-relaxed">
              Dirsha is licensed and regulated by the{" "}
              <strong>Ethiopian Capital Market Authority (ECMA)</strong>. All
              investments involve risk, and past performance is not indicative
              of future results. Please read our full Risk Disclosure before
              committing capital.
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-background border-t border-outline-variant py-24">
        <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-5 space-y-8">
            <a
              className="font-display text-headline-md text-primary font-bold tracking-widest"
              href="#"
            >
              DIRSHA
            </a>
            <p className="text-[15px] text-on-surface-variant leading-relaxed max-w-sm">
              Ethiopia's premier platform for institutional-grade alternative
              asset ownership. Built for stability, growth, and transparency.
            </p>
            <div className="flex gap-4">
              <a
                className="w-10 h-10 rounded border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all"
                href="#"
              >
                <span className="material-symbols-outlined text-[18px]">
                  public
                </span>
              </a>
              <a
                className="w-10 h-10 rounded border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all"
                href="#"
              >
                <span className="material-symbols-outlined text-[18px]">
                  mail
                </span>
              </a>
              <a
                className="w-10 h-10 rounded border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all"
                href="#"
              >
                <span className="material-symbols-outlined text-[18px]">
                  share
                </span>
              </a>
            </div>
          </div>
          <div className="md:col-span-2">
            <h5 className="text-[11px] font-bold text-primary uppercase tracking-[0.3em] mb-8">
              Invest
            </h5>
            <ul className="space-y-4 text-[13px] font-semibold text-on-surface-variant">
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Real Estate
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Agriculture
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Infrastructure
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Energy
                </a>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h5 className="text-[11px] font-bold text-primary uppercase tracking-[0.3em] mb-8">
              Platform
            </h5>
            <ul className="space-y-4 text-[13px] font-semibold text-on-surface-variant">
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  How It Works
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Security
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Our Impact
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Marketplace
                </a>
              </li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <h5 className="text-[11px] font-bold text-secondary uppercase tracking-[0.3em] mb-8">
              Regulatory
            </h5>
            <div className="space-y-6">
              <div className="border-b border-outline-variant pb-3">
                <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">
                  CMA License
                </p>
                <p className="text-xs font-semibold">CMA-01-2024-FP</p>
              </div>
              <div className="border-b border-outline-variant pb-3">
                <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">
                  Cyber Security
                </p>
                <p className="text-xs font-semibold">ISO 27001 Certified</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-container-max mx-auto px-margin-desktop mt-24 pt-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          <p>© 2024 Dirsha Fractional Investments. All Rights Reserved.</p>
          <div className="flex gap-8">
            <a className="hover:text-primary" href="#">
              Terms of Service
            </a>
            <a className="hover:text-primary" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-primary" href="#">
              Risk Disclosure
            </a>
          </div>
        </div>
      </footer>
    </body>
  );
}
