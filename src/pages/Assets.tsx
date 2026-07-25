import DashboardLayout from "../components/layout/DashboardLayout";

export default function Assets() {
  return (
    <DashboardLayout activeNav="assets" sidebarVariant="exchange">
      <div className="mt-16 p-margin-desktop flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-section-gap">
          <div className="glass-card p-6 rounded-2xl shadow-[0_10px_30px_rgba(30,41,59,0.04)] relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
            <p className="text-label-md text-outline mb-1">
              Total Portfolio Value
            </p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-display font-display text-on-surface">
                1,420,000
              </h2>
              <span className="text-headline-md font-headline-md text-outline">
                ETB
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-primary font-bold text-label-md">
              <span className="material-symbols-outlined text-sm">
                trending_up
              </span>
              <span className="">+12.4% this month</span>
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl shadow-[0_10px_30px_rgba(30,41,59,0.04)]">
            <p className="text-label-md text-outline mb-1">Total Assets</p>
            <h2 className="text-display font-display text-on-surface">12</h2>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-primary ring-2 ring-white"></div>
                <div className="w-6 h-6 rounded-full bg-tertiary ring-2 ring-white"></div>
                <div className="w-6 h-6 rounded-full bg-secondary ring-2 ring-white"></div>
              </div>
              <span className="text-label-sm text-outline">
                Across 4 sectors
              </span>
            </div>
          </div>
          <div
            className="glass-card p-6 rounded-2xl shadow-[0_10px_30px_rgba(30,41,59,0.04)] bg-primary-container text-on-primary-container"
            // style={
            //     {
            //         transform: [{ translateY(0px)

            //         }]
            //     }
            // }
          >
            <p className="text-label-md opacity-80 mb-1">Pending Sell</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-display font-display">84,500</h2>
              <span className="text-headline-md font-headline-md opacity-60">
                ETB
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 lg:col-span-8 space-y-stack-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button className="px-6 py-2 rounded-full bg-primary text-on-primary text-label-md font-bold whitespace-nowrap">
                  All Assets
                </button>
                <button className="px-6 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-label-md hover:bg-surface-container-highest transition-colors whitespace-nowrap">
                  Real Estate
                </button>
                <button className="px-6 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-label-md hover:bg-surface-container-highest transition-colors whitespace-nowrap">
                  Agriculture
                </button>
                <button className="px-6 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-label-md hover:bg-surface-container-highest transition-colors whitespace-nowrap">
                  Commodities
                </button>
                <button className="px-6 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-label-md hover:bg-surface-container-highest transition-colors whitespace-nowrap">
                  Tech Bonds
                </button>
              </div>
              <button className="flex items-center gap-2 text-label-md text-primary font-bold">
                <span className="material-symbols-outlined text-lg">
                  filter_list
                </span>
                Advanced Filters
              </button>
            </div>

            <div className="space-y-gutter">
              <div className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 h-48 overflow-hidden">
                    <img
                      alt="Asset"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBXvMRw93mOCwoMiYD90JpSFtwHruGOfMEl-qPugr_RKc1d3Gh2nyj0w9ItK4q5yJVi6-K0uIf7ok9NJoNGC37sPkeUTjwnhLSIzVwPedGLwLXkVGDW1Xnh7hYjzGWW0omgv9gyEl3Q__5x56tPXUq_g6WVcEhvbTImWxyJ8__gErDcOT7XNiWnFBAjVOCxDq1Zh2j8rmqVuAoamqb3NNGd8B2_UyO8becvy23GHwzx-nC2fiOV4kEKZjkm4AK2l_hlw6nU1LmMw6t"
                    />
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                            Real Estate
                          </span>
                          <span className="text-label-sm text-outline">
                            • Bole District, Addis
                          </span>
                        </div>
                        <h3 className="text-headline-md font-headline-md text-on-surface">
                          Bole Skyrise Residences - Phase II
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-label-sm text-outline">
                          Current Value
                        </p>
                        <p className="text-headline-md font-bold text-on-surface">
                          450,000 ETB
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex gap-8">
                        <div>
                          <p className="text-label-sm text-outline">
                            Yield (YoY)
                          </p>
                          <p className="text-label-md font-bold text-primary">
                            +8.2%
                          </p>
                        </div>
                        <div>
                          <p className="text-label-sm text-outline">
                            Ownership
                          </p>
                          <p className="text-label-md font-bold">
                            0.45% (Fractional)
                          </p>
                        </div>
                        <div>
                          <p className="text-label-sm text-outline">
                            Risk Level
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            <p className="text-label-md font-bold">Low</p>
                          </div>
                        </div>
                      </div>
                      <button className="h-10 px-6 rounded-xl border border-primary text-primary text-label-md font-bold hover:bg-primary hover:text-on-primary transition-all">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 h-48 overflow-hidden">
                    <img
                      alt="Asset"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY8ajTv3OdXJySy69JhL1BArS8lniAh-MGbPnP-0qPSZKXmkk5OsZKdH7T6okncolRvwQiwzp7dHaL7x1g6wXR5w0_uxEGtc8mw0t-XYpRHePb6Tjz943Qevjc9iNFpnERPnldYPUjaW7uZjT9N6ZPB6bBxknzg0YolUhzpAjLPV9IDNtjIFzQnrwGviv9UyiMVZdY3FldHLGoW7pRuxoOFKGEHxTnQkX5-EVVeBhYBBC2p9-HfHq-9p6Tgxn1hrjpqy-UKrycg0Nq"
                    />
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary-container text-secondary">
                            Agriculture
                          </span>
                          <span className="text-label-sm text-outline">
                            • Sidama Coffee Cooperative
                          </span>
                        </div>
                        <h3 className="text-headline-md font-headline-md text-on-surface">
                          Export Grade Coffee Batch #104
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-label-sm text-outline">
                          Current Value
                        </p>
                        <p className="text-headline-md font-bold text-on-surface">
                          225,000 ETB
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex gap-8">
                        <div>
                          <p className="text-label-sm text-outline">
                            Estimated ROI
                          </p>
                          <p className="text-label-md font-bold text-primary">
                            +14.5%
                          </p>
                        </div>
                        <div>
                          <p className="text-label-sm text-outline">Maturity</p>
                          <p className="text-label-md font-bold">9 Months</p>
                        </div>
                        <div>
                          <p className="text-label-sm text-outline">
                            Risk Level
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-error"></span>
                            <p className="text-label-md font-bold text-error">
                              High
                            </p>
                          </div>
                        </div>
                      </div>
                      <button className="h-10 px-6 rounded-xl border border-primary text-primary text-label-md font-bold hover:bg-primary hover:text-on-primary transition-all">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 h-48 overflow-hidden">
                    <img
                      alt="Asset"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWo5B0scRIu7ZimyD55l_XWdHCFsJyGEGRk2UH5HD2O18MyVT73Pj0hQBdLOKcYawWBNWG3E1BYx91nj_n-H3sRJFHPOxGJV_e8PVHX-jOLXG6HKtjxg1zn2CG-Tw9kwxlvUjhCaZswpeMsf5d8IbL_PP95PVD8EvB-os18i7e15FOtf-5eDDNzPbVa-wTJDRuZQgYli5PH82lKNQ5n-y9b0rfJyZdwY-OEA7VV7x65f5EJgwpQ13Kl5k1PqwfE83SPyEh5xXQgqwF"
                    />
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-tertiary-fixed text-tertiary">
                            Bond
                          </span>
                          <span className="text-label-sm text-outline">
                            • Federal Digital Infra Bond
                          </span>
                        </div>
                        <h3 className="text-headline-md font-headline-md text-on-surface">
                          Telecom Expansion Series A
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-label-sm text-outline">
                          Current Value
                        </p>
                        <p className="text-headline-md font-bold text-on-surface">
                          745,000 ETB
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex gap-8">
                        <div>
                          <p className="text-label-sm text-outline">
                            Coupon Rate
                          </p>
                          <p className="text-label-md font-bold text-primary">
                            6.5% Fixed
                          </p>
                        </div>
                        <div>
                          <p className="text-label-sm text-outline">
                            Frequency
                          </p>
                          <p className="text-label-md font-bold">Quarterly</p>
                        </div>
                        <div>
                          <p className="text-label-sm text-outline">
                            Risk Level
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-secondary"></span>
                            <p className="text-label-md font-bold">Medium</p>
                          </div>
                        </div>
                      </div>
                      <button className="h-10 px-6 rounded-xl border border-primary text-primary text-label-md font-bold hover:bg-primary hover:text-on-primary transition-all">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <h3 className="text-headline-md font-headline-md text-on-surface mb-6">
                Pending Transactions
              </h3>
              <div className="glass-card rounded-2xl overflow-hidden divide-y divide-outline-variant/30">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">
                        hourglass_top
                      </span>
                    </div>
                    <div>
                      <p className="text-label-md font-bold text-on-surface">
                        Purchase: Solar Farm Cluster IV
                      </p>
                      <p className="text-label-sm text-outline">
                        Initiated Oct 2, 2024 • Processing payment
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-label-md font-bold text-on-surface">
                      150,000 ETB
                    </p>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
                      Verifying Assets
                    </p>
                  </div>
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">
                        description
                      </span>
                    </div>
                    <div>
                      <p className="text-label-md font-bold text-on-surface">
                        Redemption Request: Retail Index Fund
                      </p>
                      <p className="text-label-sm text-outline">
                        Initiated Sept 30, 2024 • Awaiting approval
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-label-md font-bold text-on-surface">
                      42,000 ETB
                    </p>
                    <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1">
                      In Review
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="col-span-12 lg:col-span-4 space-y-gutter">
            <div
              className="glass-card p-6 rounded-2xl shadow-sm"
              //   style="transform: translateY(0px)"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-label-md font-bold text-on-surface">
                  Portfolio Allocation
                </h3>
                <span className="material-symbols-outlined text-outline">
                  more_horiz
                </span>
              </div>
              <div className="relative w-48 h-48 mx-auto mb-8">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    className="text-surface-container"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="currentColor"
                    stroke-width="12"
                  ></circle>
                  <circle
                    className="text-primary"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="currentColor"
                    stroke-dasharray="251.2"
                    stroke-dashoffset="125.6"
                    stroke-width="12"
                  ></circle>
                  <circle
                    className="text-tertiary"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="currentColor"
                    stroke-dasharray="251.2"
                    stroke-dashoffset="200"
                    stroke-width="12"
                  ></circle>
                  <circle
                    className="text-secondary"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="currentColor"
                    stroke-dasharray="251.2"
                    stroke-dashoffset="230"
                    stroke-width="12"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-headline-md font-bold">52%</p>
                  <p className="text-[10px] text-outline uppercase font-bold">
                    Real Estate
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    <span className="text-label-md text-on-surface-variant">
                      Real Estate
                    </span>
                  </div>
                  <span className="text-label-md font-bold">52%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-tertiary"></span>
                    <span className="text-label-md text-on-surface-variant">
                      Agriculture
                    </span>
                  </div>
                  <span className="text-label-md font-bold">28%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-secondary"></span>
                    <span className="text-label-md text-on-surface-variant">
                      Bonds
                    </span>
                  </div>
                  <span className="text-label-md font-bold">12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-surface-variant"></span>
                    <span className="text-label-md text-on-surface-variant">
                      Commodities
                    </span>
                  </div>
                  <span className="text-label-md font-bold">8%</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-sm bg-surface-container-low">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">
                    verified_user
                  </span>
                </div>
                <h3 className="text-label-md font-bold text-on-surface">
                  Portfolio Health
                </h3>
              </div>
              <p className="text-label-sm text-on-surface-variant mb-4">
                Your portfolio is well-diversified. Current risk-adjusted score:
                <span className="text-primary font-bold">88/100</span>.
              </p>
              <div className="h-2 w-full bg-outline-variant/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: "88%",
                  }}
                ></div>
              </div>
              <button className="mt-6 w-full py-2.5 rounded-xl border border-outline text-label-sm font-bold hover:bg-surface-container transition-colors">
                Full Security Audit
              </button>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-sm">
              <h3 className="text-label-md font-bold text-on-surface mb-6">
                Recent Activity
              </h3>
              <div className="space-y-6 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-px before:bg-outline-variant/40">
                <div className="relative flex gap-4 pl-8">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center z-10">
                    <span
                      className="material-symbols-outlined text-[12px] text-primary"
                      style={{
                        fontVariationSettings: '"FILL" 1',
                      }}
                    >
                      payments
                    </span>
                  </div>
                  <div>
                    <p className="text-label-sm font-bold text-on-surface">
                      Dividend Received
                    </p>
                    <p className="text-[10px] text-outline mb-1">2 hours ago</p>
                    <p className="text-label-sm text-on-surface-variant">
                      You received 12,400 ETB from Bole Skyrise.
                    </p>
                  </div>
                </div>
                <div className="relative flex gap-4 pl-8">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-secondary flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-[12px] text-secondary">
                      trending_up
                    </span>
                  </div>
                  <div>
                    <p className="text-label-sm font-bold text-on-surface">
                      Price Increase
                    </p>
                    <p className="text-[10px] text-outline mb-1">Yesterday</p>
                    <p className="text-label-sm text-on-surface-variant">
                      Coffee Batch #104 value rose by 2.4%.
                    </p>
                  </div>
                </div>
                <div className="relative flex gap-4 pl-8">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-outline-variant flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-[12px] text-outline">
                      description
                    </span>
                  </div>
                  <div>
                    <p className="text-label-sm font-bold text-on-surface">
                      Report Generated
                    </p>
                    <p className="text-[10px] text-outline mb-1">Oct 1, 2024</p>
                    <p className="text-label-sm text-on-surface-variant">
                      Monthly tax summary for Q3 is ready.
                    </p>
                  </div>
                </div>
              </div>
              <button className="mt-8 text-primary text-label-md font-bold hover:underline w-full text-center">
                View All History
              </button>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
