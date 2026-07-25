import { useNavigate } from 'react-router-dom'
import {
  DEPOSIT_ACCOUNTS,
  RECENT_TRANSACTIONS,
  WITHDRAW_ACCOUNTS,
} from './constants'

function FundingOverview({ data }) {
  return (
    <div className="wallet-panel h-full p-6">
      <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-outline">
        Funding Overview
      </h3>
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex justify-between">
            <span className="text-sm text-on-surface">{data.primaryLabel}</span>
            <span className="text-sm font-bold text-primary">{data.primaryAmount}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-outline-variant/20">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: data.primaryBar }}
            />
          </div>
        </div>
        <div>
          <div className="mb-2 flex justify-between">
            <span className="text-sm text-on-surface">{data.secondaryLabel}</span>
            <span className="text-sm font-bold text-secondary">{data.secondaryAmount}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-outline-variant/20">
            <div
              className="h-full rounded-full bg-secondary"
              style={{ width: data.secondaryBar }}
            />
          </div>
        </div>
        <div className="border-t border-outline-variant/10 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-outline">{data.totalLabel}</p>
            <p className="text-xl font-semibold text-primary">{data.totalAmount}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SecurityStatus() {
  return (
    <div className="wallet-panel flex h-full flex-col p-6">
      <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-outline">
        Security &amp; Status
      </h3>
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">
            verified
          </span>
          <div>
            <p className="text-xs font-bold text-on-surface">CBE Linked</p>
            <p className="text-[11px] text-outline">Verified Institutional</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-secondary/10 bg-secondary/5 p-3">
          <span className="material-symbols-outlined text-secondary" aria-hidden="true">
            check_circle
          </span>
          <div>
            <p className="text-xs font-bold text-on-surface">Telebirr Verified</p>
            <p className="text-[11px] text-outline">Tier 3 Limits Active</p>
          </div>
        </div>
      </div>
      <div className="mt-6 border-t border-outline-variant/10 pt-4">
        <p className="text-[11px] italic text-outline">
          Need help?{' '}
          <a className="font-bold text-primary hover:underline" href="#">
            View Transfer FAQ
          </a>
        </p>
      </div>
    </div>
  )
}

function RecentActivity() {
  return (
    <div className="mt-section-gap">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="text-3xl font-semibold text-on-surface">Recent Funding Activity</h3>
        <button
          className="flex items-center gap-1 text-sm font-bold text-primary transition-all hover:underline"
          type="button"
        >
          View All History
          <span className="material-symbols-outlined text-sm" aria-hidden="true">
            arrow_forward
          </span>
        </button>
      </div>
      <div className="wallet-glass-card overflow-hidden rounded-[24px]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/20 bg-surface-container-low/30">
              {['Date', 'Method', 'Amount', 'Status', 'Action'].map((col) => (
                <th
                  key={col}
                  className={`px-8 py-5 text-xs font-bold uppercase tracking-wider text-outline ${
                    col === 'Amount' ? 'text-right' : col === 'Status' ? 'text-center' : col === 'Action' ? 'text-right' : ''
                  }`}
                  scope="col"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {RECENT_TRANSACTIONS.map((tx) => (
              <tr key={`${tx.date}-${tx.method}`} className="transition-colors hover:bg-white/40">
                <td className="px-8 py-6">
                  <p className="text-sm text-on-surface">{tx.date}</p>
                  <p className="text-[11px] text-outline">{tx.time}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        tx.iconTone === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-sm ${
                          tx.iconTone === 'primary' ? 'text-primary' : 'text-secondary'
                        }`}
                        aria-hidden="true"
                      >
                        {tx.icon}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface">{tx.method}</p>
                  </div>
                </td>
                <td className="px-8 py-6 text-right font-bold text-on-surface">{tx.amount}</td>
                <td className="px-8 py-6 text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                      tx.statusTone === 'primary'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary-container/30 text-secondary'
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button
                    aria-label={`View receipt for ${tx.method}`}
                    className="p-2 text-outline transition-colors hover:text-primary"
                    type="button"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      receipt_long
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function WalletFundingView({
  activeTab,
  overviewData,
  amount = '10000',
  account = 'CBE Bank (Linked)',
  onInitiate,
}) {
  const navigate = useNavigate()
  const isDeposit = activeTab === 'deposit'
  const accounts = isDeposit ? DEPOSIT_ACCOUNTS : WITHDRAW_ACCOUNTS

  const handleTabChange = (tab) => {
    navigate(tab === 'deposit' ? '/wallet/deposit' : '/wallet/withdrawal')
  }

  return (
    <div className="mx-auto w-full max-w-container-max flex-1 p-10">
      <div className="mb-10">
        <h2 className="text-3xl font-semibold text-on-surface">Wallet &amp; Funding</h2>
        <p className="mt-2 text-lg text-on-surface-variant">
          Manage your liquidity and institutional capital transfers.
        </p>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <FundingOverview data={overviewData} />
        </div>

        <div className="lg:col-span-4">
          <div className="wallet-panel h-full p-6">
            <div className="relative mb-6 flex items-center justify-between border-b border-outline-variant/10 pb-2">
              <div className="flex gap-6" role="tablist" aria-label="Transfer type">
                {['deposit', 'withdraw'].map((tab) => (
                  <button
                    key={tab}
                    aria-selected={activeTab === tab}
                    className={`relative pb-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === tab ? 'text-primary' : 'text-outline hover:text-on-surface-variant'
                    }`}
                    id={`${tab}-tab`}
                    onClick={() => handleTabChange(tab)}
                    role="tab"
                    type="button"
                  >
                    {tab === 'deposit' ? 'Deposit' : 'Withdraw'}
                    <div
                      className="absolute bottom-[-9px] left-0 h-0.5 bg-primary transition-all"
                      style={{ width: activeTab === tab ? '100%' : '0' }}
                    />
                  </button>
                ))}
              </div>
              <span className="material-symbols-outlined text-sm text-outline" aria-hidden="true">
                swap_vert
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="mb-2 block text-[11px] font-bold uppercase text-outline"
                  htmlFor="transfer-source"
                >
                  {isDeposit ? 'Source Account' : 'Destination Account'}
                </label>
                <div className="relative">
                  <select
                    className="wallet-input appearance-none pr-10"
                    defaultValue={account}
                    id="transfer-source"
                  >
                    {accounts.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <span
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-outline"
                    aria-hidden="true"
                  >
                    <span className="material-symbols-outlined">expand_more</span>
                  </span>
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-[11px] font-bold uppercase text-outline"
                  htmlFor="transfer-amount"
                >
                  {isDeposit ? 'Amount (ETB)' : 'Amount to Withdraw (ETB)'}
                </label>
                <input
                  className="wallet-input wallet-input-plain text-xl font-semibold"
                  defaultValue={amount}
                  id="transfer-amount"
                  inputMode="decimal"
                  type="number"
                />
              </div>

              <button
                className="wallet-btn-primary mt-2"
                onClick={onInitiate}
                type="button"
              >
                {isDeposit ? 'Initiate Transfer' : 'Initiate Withdrawal'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <SecurityStatus />
        </div>
      </div>

      <RecentActivity />
    </div>
  )
}
