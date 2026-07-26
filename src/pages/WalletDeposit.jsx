import WalletLayout from '../components/wallet/WalletLayout'
import WalletFundingView from '../components/wallet/WalletFundingView'

export default function WalletDeposit() {
  return (
    <WalletLayout sidebarVariant="exchange">
      <WalletFundingView activeTab="deposit" />
    </WalletLayout>
  )
}
