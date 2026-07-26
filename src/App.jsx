import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import Login from "./pages/Login";
import AccountInfo from "./pages/AccountInfo";
import IdentityVerification from "./pages/IdentityVerification";
import LinkFunding from "./pages/LinkFunding";
import Marketplace from "./pages/Marketplace";
import AssetDetail from "./pages/AssetDetail";
import CustomBaskets from "./pages/CustomBaskets";
import BasketDetail from "./pages/BasketDetail";
import WalletDeposit from "./pages/WalletDeposit";
import WalletWithdrawal from "./pages/WalletWithdrawal";
import Assets from "./pages/Assets";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/account-info" element={<AccountInfo />} />

          {/* Onboarding: authenticated, but reachable before verification. */}
          <Route
            path="/identity-verification"
            element={
              <ProtectedRoute requireVerified={false}>
                <IdentityVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/link-funding"
            element={
              <ProtectedRoute>
                <LinkFunding />
              </ProtectedRoute>
            }
          />

          {/* Verified investors only */}
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace/assets/:subFundId"
            element={
              <ProtectedRoute>
                <AssetDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/custom-baskets"
            element={
              <ProtectedRoute>
                <CustomBaskets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/custom-baskets/:basketId"
            element={
              <ProtectedRoute>
                <BasketDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet/deposit"
            element={
              <ProtectedRoute>
                <WalletDeposit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet/withdrawal"
            element={
              <ProtectedRoute>
                <WalletWithdrawal />
              </ProtectedRoute>
            }
          />
          {/* Confirmation is a modal on the funding screen now, not its own page. */}
          <Route
            path="/wallet/confirm-deposit"
            element={<Navigate to="/wallet/deposit" replace />}
          />
          <Route
            path="/wallet/confirm-withdrawal"
            element={<Navigate to="/wallet/withdrawal" replace />}
          />
          <Route
            path="/portfolio/assets"
            element={
              <ProtectedRoute>
                <Assets />
              </ProtectedRoute>
            }
          />

          <Route path="/dashboard" element={<Navigate to="/marketplace" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
