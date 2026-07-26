import WalletLayout from '../components/wallet/WalletLayout'
import WalletFundingView from '../components/wallet/WalletFundingView'

export default function WalletWithdrawal() {
  return (
    <WalletLayout sidebarVariant="exchange">
      <WalletFundingView activeTab="withdraw" />
    </WalletLayout>
  )
}
