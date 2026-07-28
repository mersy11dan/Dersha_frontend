import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
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
import Dashboard from "./pages/Dashboard";
import StockComparison from "./pages/StockComparison";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account-info" element={<AccountInfo />} />

            {/* Onboarding */}
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
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
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
              path="/stock-comparison"
              element={
                <ProtectedRoute>
                  <StockComparison />
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

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
