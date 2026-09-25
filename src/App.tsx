import { lazy, Suspense, type ComponentType } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/auth';
import { AdminRoute, ProtectedRoute } from '@/components/ProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';

// Every page except the landing page is loaded on demand, so visitors of the
// marketing site do not download the account and admin panels.
function page<K extends string>(loader: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() => loader().then((m) => ({ default: m[name] })));
}

const PricingPage = page(() => import('@/pages/PricingPage'), 'PricingPage');
const RoadmapPage = page(() => import('@/pages/RoadmapPage'), 'RoadmapPage');
const DocsPage = page(() => import('@/pages/DocsPage'), 'DocsPage');
const NotFoundPage = page(() => import('@/pages/NotFoundPage'), 'NotFoundPage');
const LoginPage = page(() => import('@/pages/auth/LoginPage'), 'LoginPage');
const RegisterPage = page(() => import('@/pages/auth/RegisterPage'), 'RegisterPage');
const ForgotPasswordPage = page(() => import('@/pages/auth/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = page(() => import('@/pages/auth/ResetPasswordPage'), 'ResetPasswordPage');
const CheckoutPage = page(() => import('@/pages/CheckoutPage'), 'CheckoutPage');

const AccountOverview = page(() => import('@/pages/account/AccountOverview'), 'AccountOverview');
const PlanPage = page(() => import('@/pages/account/PlanPage'), 'PlanPage');
const UsagePage = page(() => import('@/pages/account/UsagePage'), 'UsagePage');
const LicensePage = page(() => import('@/pages/account/LicensePage'), 'LicensePage');
const BillingPage = page(() => import('@/pages/account/BillingPage'), 'BillingPage');
const PaymentsPage = page(() => import('@/pages/account/PaymentsPage'), 'PaymentsPage');
const DevicesPage = page(() => import('@/pages/account/DevicesPage'), 'DevicesPage');
const TeamPage = page(() => import('@/pages/account/TeamPage'), 'TeamPage');
const SettingsPage = page(() => import('@/pages/account/SettingsPage'), 'SettingsPage');
const SupportPage = page(() => import('@/pages/account/SupportPage'), 'SupportPage');

const AdminDashboard = page(() => import('@/pages/admin/AdminDashboard'), 'AdminDashboard');
const AdminUsers = page(() => import('@/pages/admin/AdminUsers'), 'AdminUsers');
const AdminUserDetail = page(() => import('@/pages/admin/AdminUserDetail'), 'AdminUserDetail');
const AdminLicenses = page(() => import('@/pages/admin/AdminLicenses'), 'AdminLicenses');
const AdminSales = page(() => import('@/pages/admin/AdminSales'), 'AdminSales');
const AdminInvoices = page(() => import('@/pages/admin/AdminInvoices'), 'AdminInvoices');
const AdminPos = page(() => import('@/pages/admin/AdminPos'), 'AdminPos');
const AdminCredits = page(() => import('@/pages/admin/AdminCredits'), 'AdminCredits');
const AdminJobs = page(() => import('@/pages/admin/AdminJobs'), 'AdminJobs');
const AdminActivity = page(() => import('@/pages/admin/AdminActivity'), 'AdminActivity');
const AdminAnalytics = page(() => import('@/pages/admin/AdminAnalytics'), 'AdminAnalytics');
const AdminPlans = page(() => import('@/pages/admin/AdminPlans'), 'AdminPlans');
const AdminVersions = page(() => import('@/pages/admin/AdminVersions'), 'AdminVersions');
const AdminAudit = page(() => import('@/pages/admin/AdminAudit'), 'AdminAudit');

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50">
      <Loader2 size={24} className="animate-spin text-ink-400" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Suspense fallback={<PageFallback />}>
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
              <Route path="/account/plan" element={<ProtectedRoute><PlanPage /></ProtectedRoute>} />
              <Route path="/account/usage" element={<ProtectedRoute><UsagePage /></ProtectedRoute>} />
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
              <Route path="/admin/invoices" element={<AdminRoute><AdminInvoices /></AdminRoute>} />
              <Route path="/admin/pos" element={<AdminRoute><AdminPos /></AdminRoute>} />
              <Route path="/admin/credits" element={<AdminRoute><AdminCredits /></AdminRoute>} />
              <Route path="/admin/jobs" element={<AdminRoute><AdminJobs /></AdminRoute>} />
              <Route path="/admin/activity" element={<AdminRoute><AdminActivity /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/plans" element={<AdminRoute><AdminPlans /></AdminRoute>} />
              <Route path="/admin/versions" element={<AdminRoute><AdminVersions /></AdminRoute>} />
              <Route path="/admin/audit" element={<AdminRoute><AdminAudit /></AdminRoute>} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
