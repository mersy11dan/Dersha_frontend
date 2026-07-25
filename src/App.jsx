import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import AccountInfo from './pages/AccountInfo'
import IdentityVerification from './pages/IdentityVerification'
import LinkFunding from './pages/LinkFunding'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account-info" element={<AccountInfo />} />
        <Route path="/identity-verification" element={<IdentityVerification />} />
        <Route path="/link-funding" element={<LinkFunding />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
