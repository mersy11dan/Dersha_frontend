# DERSHA (CELL Platform) — Ethiopia's Institutional Gateway to Fractional Real Assets

![DERSHA Platform Hero Preview](public/vortex_dersha_hero.png)

> **DERSHA** is an institutional-grade digital book-entry fractional exchange built for Ethiopia. It empowers retail and institutional investors to acquire, hold, and trade fractionated real assets (Commercial Real Estate, Logistics Fleets, Agricultural Processing, and Gold Bullion) custodied with the Commercial Bank of Ethiopia (CBE) and settled digitally via EthSwitch.

---

## 🏗️ System Architecture & Data Flow

```
                                  ┌─────────────────────────────────────────┐
                                  │      DERSHA REACT FRONTEND SPA         │
                                  │   (Vite + React 19 + Tailwind CSS 4)    │
                                  └────────────────────┬────────────────────┘
                                                       │
                                          HTTPS REST & WebSockets
                                                       │
                                  ┌────────────────────▼────────────────────┐
                                  │         DIRSHA API ENGINE               │
                                  │   (Node.js / Express / TypeScript)      │
                                  └──────────┬───────────────────┬──────────┘
                                             │                   │
                     ┌───────────────────────┴──┐             ┌──┴───────────────────────┐
                     │   MySQL RDBMS DATASTORE   │             │   ETH-SWITCH & CBE GATE   │
                     │  (Sub-funds, Orders, NAV) │             │ (Custody Bank Settlement) │
                     └──────────────────────────┘             └──────────────────────────┘
```

### Key Subsystems & Lifecycle:
1. **Asset Appraisal & Sub-Fund Creation**: Real-world assets are appraised by independent valuers and transferred to a regulated bank trust. The platform generates book-entry digital units (**CELL**).
2. **Retail Fractional Marketplace**: Investors browse verified sub-funds, view orderbooks, inspect 24h volume telemetry, and place real-time buy/sell limit orders.
3. **Automated Yield Disbursement**: Operating revenue, rents, and lease cashflows are distributed digitally into investor wallets with automatic tax withholding telemetry.
4. **Secondary Trading & Exit Liquidation**: Fractional shares trade freely on the secondary market until target liquidation or fund maturity dates.

---

## 🎨 UI/UX System & Design Architecture

### 1. Multi-Theme Engine (3 System Themes)
The platform features an integrated CSS token engine supporting 3 visual themes, toggled instantly via the top navigation header:

- 🌑 **Obsidian Dark Mode** (`dark`): Deep space black background (`#050505`) with vibrant Neon Volt (`#d5fb45`) telemetry highlights and glassmorphic card elements.
- 🪨 **Graphite Slate Mode** (`light`): Sleek graphite slate background (`#1a1c1c`) with soft high-contrast accents.
- 🤍 **Pearl Light Mode** (`pearl`): Warm off-white surface (`#f8f7f4`) with deep navy ink typography (`#1a1a2e`) and **Cobalt Blue (`#2563eb`)** primary accents for buttons, telemetry badges, and chart indicators.

### 2. Desktop Collapsible Sidebar & Navigation Registry
- **Persisted Collapsible State**: Toggle between expanded mode (`260px`) and compact mini-icon mode (`80px`) with smooth 300ms CSS cubic-bezier transitions and tooltips.
- **Signature Dersha Shield SVG**: Custom geometric shield logo with multi-faceted cutouts and a neon volt gradient glow (`#d5fb45` to `#a3e635`).
- **Complete Route Coverage**: Includes full navigation items across all 10 core views:
  - 📊 `Dashboard` (`/dashboard`)
  - 🏛️ `Marketplace` (`/marketplace`)
  - 🧺 `Custom Baskets` (`/custom-baskets`)
  - 📈 `Stock Comparison` (`/stock-comparison`)
  - 💼 `My Assets` (`/portfolio/assets`)
  - 💳 `Deposit Cash` (`/wallet/deposit`)
  - 🏧 `Withdraw Cash` (`/wallet/withdraw`)
  - 👤 `Account Info` (`/account/info`)
  - 🆔 `KYC Verification` (`/kyc/verify`)
  - 🏦 `Bank Funding` (`/bank-funding`)

### 3. Non-Generic Domain Icon System
Every asset sector is paired with domain-specific Material Symbols icons and tailored color palettes:
- 🏢 **Real Estate**: `apartment` (Emerald / Volt)
- 🚜 **Agriculture**: `agriculture` (Lime Green)
- ⚡ **Energy & Infra**: `bolt` (Cyan)
- 🚛 **Logistics Fleets**: `local_shipping` (Amber)
- 💎 **Gold & Metals**: `diamond` (Gold)
- 🏬 **Micro-Business**: `storefront` (Purple)
- 🎨 **Fine Art & Culture**: `palette` (Rose)

### 4. Responsive Mobile Optimization (2-Column Grid)
- Mobile viewport rules (`< 640px`) strictly render **2 cards per row (`grid-cols-2`)** across Market Insights telemetry, Marketplace asset cards, and Portfolio summary cards.

---

## 🔌 API Endpoint & Backend Integration Registry

All frontend data hooks connect directly to `dirshaApi` endpoints:

| Domain | Method & Endpoint | Description |
|---|---|---|
| **Marketplace** | `GET /marketplace/highlights` | Market TVL, 24h Volume, Top Gainers |
| **Marketplace** | `GET /marketplace/assets` | Sub-fund asset listings & pricing |
| **Marketplace** | `GET /marketplace/sub-funds/:id` | Detailed asset valuation & custody status |
| **Order Book** | `GET /marketplace/sub-funds/:id/order-book` | Real-time buy/sell limit orders |
| **Trade History** | `GET /marketplace/sub-funds/:id/trade-history` | Historical execution price feed |
| **Orders** | `POST /orders/place` | Submit limit buy/sell order |
| **Portfolio** | `GET /portfolio/summary` | Net portfolio valuation & unrealized yield |
| **Portfolio** | `GET /portfolio/holdings` | Fractional holdings & ownership share % |
| **Portfolio** | `GET /portfolio/activity` | Transaction audit log |
| **Custom Baskets** | `GET /custom-baskets/market` | Listed public index baskets |
| **Custom Baskets** | `POST /custom-baskets/create` | Assemble custom asset index basket |
| **Yield & Tax** | `GET /yield/income` | Lifetime net yield & tax withholding |
| **Wallet** | `GET /wallet/balance` | Available cash & escrowed balance |
| **Wallet** | `POST /wallet/deposit-instructions` | EthSwitch & CBE bank deposit gateway |
| **Wallet** | `POST /wallet/withdraw` | Cash payout to verified bank account |

---

## 🛠️ Technology Stack & Dependencies

- **Frontend Core**: React 19, React Router DOM 7, Vite
- **Styling & Tokens**: Tailwind CSS 4, Vanilla CSS Design System (`index.css`)
- **Data Visualization**: Chart.js, React-Chartjs-2
- **Iconography**: Material Symbols Outlined, Custom SVG Badges
- **Linting**: Oxlint

---

## ⚙️ Quick Start Guide

### 1. Install Dependencies
```powershell
npm install
```

### 2. Launch Local Dev Server
```powershell
npm run dev
```
Open `http://localhost:5173`.

### 3. Verify Code Quality
```powershell
npx oxlint
```
