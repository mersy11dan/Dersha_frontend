# DERSHA Frontend — Real Estate & Asset Fractional Exchange

DERSHA is the React frontend for a fractional collective-investment platform designed for Ethiopia. The concept allows investors to own and trade small book-entry portions of real assets (real estate, vehicles, gold, agricultural equipment, and micro-businesses) custodied with Commercial Bank of Ethiopia (CBE) and settled via EthSwitch.

---

## 🚀 Recent UI/UX Enhancements & Architecture Updates

### 1. 🎨 Multi-Theme Engine (3 Theme Modes)
- **Obsidian Dark Mode** (`dark`): Dark obsidian background with vibrant Neon Volt (`#d5fb45`) accents and glassmorphic telemetry cards.
- **Graphite Slate Mode** (`light`): Sleek dark graphite slate aesthetic (`#1a1c1c`) with soft neon highlights.
- **Pearl Light Mode** (`pearl`): Clean off-white background (`#f8f7f4`) with high-contrast deep ink typography (`#1a1a2e`) and professional **Cobalt Blue (`#2563eb`)** primary accents for buttons, charts, and telemetry indicators.
- **Header Theme Toggle**: Single circular button in `AppHeader.jsx` seamlessly cycles between `Dark → Light → Pearl → Dark`.

### 2. 📱 Desktop Collapsible Sidebar & Mobile Responsive Navigation
- **Desktop Sidebar Collapse**: Sidebar toggles between full width (`260px`) and mini-icon mode (`80px`) with smooth CSS transitions, persisted state (`localStorage`), floating hover tooltips, and collapse toggle buttons in header and sidebar header.
- **Dersha Signature Shield Logo**: Custom geometric SVG logo with multi-faceted shield cutout, neon volt gradient (`#d5fb45` to `#a3e635`), and glowing aura.
- **100% Navigation Coverage**: Configured navigation in `navConfig.js` covering all application routes (`Dashboard`, `Marketplace`, `Custom Baskets`, `Stock Comparison`, `My Assets`, `Deposit Cash`, `Withdraw Cash`, `Account Info`, `KYC Verification`, `Bank Funding`).

### 3. 📊 Interactive Stock Comparison & Live Analytics
- Fully interactive Chart.js visualizations for stock comparison, price history, orderbook telemetry, and sector allocation. Hover tooltips, interactive timeframes, and live volume data.

### 4. 🎴 Market Snapshot & Marketplace Card Redesign
- **Market Snapshot Cards Placement**: Positioned `MarketInsights` telemetry cards directly below the page header and category tabs on `/marketplace`.
- **Spacious & Narrow Card Proportions**: Increased Asset Card height (`h-[490px] sm:h-[540px]`), expanded image preview (`h-52 sm:h-64`), and set laptop grid layout to `lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6`.
- **Close Icon Proximity & Neon Accents**: Removed wide `justify-between` gaps on telemetry cards, placing icons next to labels with custom neon gradients (`Volt`, `Electric Sky`, `Emerald`, `Royal Purple`).
- **Mobile 2-Column Grid (`grid-cols-2`)**: Configured mobile screen breakpoint (`< 640px`) to strictly render **2 cards per row** for Market Insights, Marketplace Assets, and Portfolio Summary cards.

### 5. 🛡️ Portfolio Assets Summary Cards
- Redesigned the 4 summary cards (`PORTFOLIO VALUE`, `CASH BALANCE`, `SECURITIES VALUE`, `LIFETIME DIVIDENDS`) on `/portfolio/assets` with category domain symbol badges (`pie_chart`, `payments`, `verified_user`, `trending_up`), taller height (`h-[140px] sm:h-[155px]`), and a **2-column grid on mobile view**.

### 6. 🔌 Backend Service Integrity
- **100% Endpoint Preservation**: All API endpoints in `dirshaApi` and service methods in `src/lib/services.js` remain completely untouched, fully active, and connected to real backend services.

---

## 🛠️ Technology Stack

- **React 19**
- **Vite**
- **React Router DOM 7**
- **Tailwind CSS 4**
- **Chart.js & React-Chartjs-2**
- **Material Symbols Outlined**

---

## ⚙️ Run Locally

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## 🧪 Available Commands

```powershell
npm run dev      # Start Vite development server
npm run build    # Build for production
npm run preview  # Preview production build
npx oxlint       # Run fast linter across workspace
```
