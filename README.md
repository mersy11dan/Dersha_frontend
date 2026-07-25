# DERSHA Frontend

DERSHA is the React frontend for a fractional collective-investment platform designed for Ethiopia. The concept is called **CELL** in the product documentation: it allows people to own and trade small portions of real assets without purchasing the entire asset.

> The current frontend is a visual prototype. Authentication, identity verification, banking, investment transactions, custody, pricing, and regulatory integrations are not yet connected to production services.

## How the platform works

An asset owner contributes a real asset—such as property, a vehicle fleet, gold, agricultural equipment, or a business—to a regulated sub-fund. An independent valuer determines its value, while the legal title is held in trust by a custodian bank.

The platform converts the appraised value into digital book-entry units:

1. **Asset to units:** The contributed asset is appraised and represented by digital ownership units.
2. **Units to cash:** A portion of the units is offered to retail investors through the marketplace. The owner may retain the remaining units to keep their interests aligned with investors.
3. **Cash to yield:** Rent, leases, operating profits, and trading gains are distributed digitally to unit holders.
4. **Exit:** Investors can sell units through the marketplace. When an asset reaches its target value or planned end date, it is sold, the units are redeemed, and the corresponding sub-fund is closed.

This structure allows the platform to offer assets without first buying all inventory itself: owners contribute assets in kind, and CELL turns them into regulated, liquid investment products.

## Supported investment categories

- **Real estate and logistics:** Warehouses, commercial floors, and urban plots intended to generate monthly lease income.
- **Vehicles and fleets:** Trucks, cargo vans, and corporate vehicles that produce daily or weekly lease cash flow.
- **Micro-businesses:** Pharmacies, groceries, cafés, and similar businesses that distribute a share of audited operating profit.
- **Gold and fine art:** Custodied assets whose unit prices follow live market feeds or scheduled appraisals.
- **Agriculture:** Warehouse receipts and agricultural equipment that can provide seasonal gains and lease income.

## Main participants

- **Fund manager:** Creates and manages sub-funds, sets investment and liquidation targets, operates the marketplace, and reports to the Ethiopian Capital Market Authority (ECMA).
- **Custodian bank:** Holds investor cash and physical titles in trust and executes compliant asset sales when instructed by the fund manager.
- **Investors:** Register with a Fayda ID and Ethiopian bank account or wallet, purchase fractional units, receive yields, and sell eligible units.
- **Asset owners:** Contribute appraised assets and initially receive the corresponding units before an agreed portion is released to the public market.

## Investment principles

- Commercial properties prioritize stable, multi-year institutional tenants.
- Vehicles and equipment should remain actively leased instead of sitting idle.
- Gold and art remain in custody while their fractional prices update from market feeds or appraisals.
- Short-term investments may liquidate when a valuation target is reached.
- Long-term investments dissolve on a planned date, returning capital gains to investor wallets.

The documentation also proposes **custom baskets**: investors could bundle selected fractions from several assets into one personal index. The basket would have a combined net asset value, continue receiving yield from its underlying assets, and trade as a single unit.

## Current frontend flow

The implemented React prototype currently covers account onboarding:

1. **Login** (`/` or `/login`) — email/password login, password visibility, session preference, social-login placeholders, and a mock authentication response.
2. **Account information** (`/account-info`) — name, email, Ethiopian phone number, and password collection.
3. **Identity verification** (`/identity-verification`) — formatted Fayda National ID input and a biometric-verification interface placeholder.
4. **Funding source** (`/link-funding`) — selection of a commercial bank or mobile-money wallet and entry of the account number.

Future pages will cover the investor dashboard, asset marketplace, asset details, portfolio, trading, yield tracking, custom baskets, and liquidation/redemption flows.

## Technology

- React 19
- Vite
- React Router
- Tailwind CSS

## Run locally

```powershell
cd c:\Users\USER\Documents\Projects\personal\dersha\dersha_frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Available commands

```powershell
npm run dev      # Start the development server
npm run build    # Create a production build
npm run preview  # Preview the production build
npm run lint     # Run the linter
```
