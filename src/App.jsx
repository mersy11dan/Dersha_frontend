import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import AccountInfo from './pages/AccountInfo'
import IdentityVerification from './pages/IdentityVerification'
import LinkFunding from './pages/LinkFunding'
import Marketplace from './pages/Marketplace'
import WalletDeposit from './pages/WalletDeposit'
import WalletWithdrawal from './pages/WalletWithdrawal'
import ConfirmDeposit from './pages/ConfirmDeposit'
import ConfirmWithdrawal from './pages/ConfirmWithdrawal'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account-info" element={<AccountInfo />} />
        <Route path="/identity-verification" element={<IdentityVerification />} />
        <Route path="/link-funding" element={<LinkFunding />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/wallet/deposit" element={<WalletDeposit />} />
        <Route path="/wallet/withdrawal" element={<WalletWithdrawal />} />
        <Route path="/wallet/confirm-deposit" element={<ConfirmDeposit />} />
        <Route path="/wallet/confirm-withdrawal" element={<ConfirmWithdrawal />} />
        <Route path="/dashboard" element={<Marketplace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
