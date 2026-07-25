import { useNavigate } from 'react-router-dom'
import WalletLayout from '../components/wallet/WalletLayout'
import WalletFundingView from '../components/wallet/WalletFundingView'

const OVERVIEW = {
  primaryLabel: 'Available Balance',
  primaryAmount: '18,500 ETB',
  primaryBar: '72%',
  secondaryLabel: 'Escrowed Amount',
  secondaryAmount: '7,000 ETB',
  secondaryBar: '28%',
  totalLabel: 'Total Available',
  totalAmount: '25,500.00 ETB',
}

export default function WalletDeposit() {
  const navigate = useNavigate()

  return (
    <WalletLayout sidebarVariant="exchange">
      <WalletFundingView
        activeTab="deposit"
        onInitiate={() => navigate('/wallet/confirm-deposit')}
        overviewData={OVERVIEW}
      />
    </WalletLayout>
  )
}
