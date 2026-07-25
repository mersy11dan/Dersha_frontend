import { useNavigate } from 'react-router-dom'
import WalletLayout from '../components/wallet/WalletLayout'
import WalletFundingView from '../components/wallet/WalletFundingView'

const OVERVIEW = {
  primaryLabel: 'Available Balance',
  primaryAmount: '25,500.00 ETB',
  primaryBar: '100%',
  secondaryLabel: 'Escrowed Amount',
  secondaryAmount: '5,000.00 ETB',
  secondaryBar: '16%',
  totalLabel: 'Total Balance',
  totalAmount: '30,500.00 ETB',
}

export default function WalletWithdrawal() {
  const navigate = useNavigate()

  return (
    <WalletLayout sidebarVariant="exchange">
      <WalletFundingView
        activeTab="withdraw"
        onInitiate={() => navigate('/wallet/confirm-withdrawal')}
        overviewData={OVERVIEW}
      />
    </WalletLayout>
  )
}
