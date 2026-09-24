import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/auth';
import { AdminRoute, ProtectedRoute } from '@/components/ProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';
import { PricingPage } from '@/pages/PricingPage';
import { RoadmapPage } from '@/pages/RoadmapPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { DocsPage } from '@/pages/DocsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AccountOverview } from '@/pages/account/AccountOverview';
import { LicensePage } from '@/pages/account/LicensePage';
import { BillingPage } from '@/pages/account/BillingPage';
import { PaymentsPage } from '@/pages/account/PaymentsPage';
import { DevicesPage } from '@/pages/account/DevicesPage';
import { TeamPage } from '@/pages/account/TeamPage';
import { SettingsPage } from '@/pages/account/SettingsPage';
import { SupportPage } from '@/pages/account/SupportPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminUserDetail } from '@/pages/admin/AdminUserDetail';
import { AdminLicenses } from '@/pages/admin/AdminLicenses';
import { AdminSales } from '@/pages/admin/AdminSales';
import { AdminActivity } from '@/pages/admin/AdminActivity';
import { AdminAnalytics } from '@/pages/admin/AdminAnalytics';
import { AdminPlans } from '@/pages/admin/AdminPlans';
import { AdminVersions } from '@/pages/admin/AdminVersions';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

            <Route path="/account" element={<ProtectedRoute><AccountOverview /></ProtectedRoute>} />
            <Route path="/account/license" element={<ProtectedRoute><LicensePage /></ProtectedRoute>} />
            <Route path="/account/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
            <Route path="/account/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
            <Route path="/account/devices" element={<ProtectedRoute><DevicesPage /></ProtectedRoute>} />
            <Route path="/account/team" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
            <Route path="/account/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/account/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />

            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/users/:id" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
            <Route path="/admin/licenses" element={<AdminRoute><AdminLicenses /></AdminRoute>} />
            <Route path="/admin/sales" element={<AdminRoute><AdminSales /></AdminRoute>} />
            <Route path="/admin/activity" element={<AdminRoute><AdminActivity /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
            <Route path="/admin/plans" element={<AdminRoute><AdminPlans /></AdminRoute>} />
            <Route path="/admin/versions" element={<AdminRoute><AdminVersions /></AdminRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
