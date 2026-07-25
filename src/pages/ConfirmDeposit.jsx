import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmTransferModal from '../components/wallet/ConfirmTransferModal'
import WalletLayout from '../components/wallet/WalletLayout'
import WalletFundingView from '../components/wallet/WalletFundingView'

const OVERVIEW = {
  primaryLabel: 'Bank Accounts',
  primaryAmount: '18,500 ETB',
  primaryBar: '72%',
  secondaryLabel: 'Mobile Wallets',
  secondaryAmount: '7,000 ETB',
  secondaryBar: '28%',
  totalLabel: 'Total Available',
  totalAmount: '25,500.00 ETB',
}

export default function ConfirmDeposit() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(true)

  return (
    <WalletLayout sidebarVariant="adisa">
      <WalletFundingView
        activeTab="deposit"
        onInitiate={() => setShowModal(true)}
        overviewData={OVERVIEW}
      />
      {showModal && (
        <ConfirmTransferModal
          account="CBE Bank (Linked)"
          amount="10000"
          onClose={() => {
            setShowModal(false)
            navigate('/wallet/deposit')
          }}
          onConfirm={() => navigate('/wallet/deposit')}
          type="deposit"
        />
      )}
    </WalletLayout>
  )
}
