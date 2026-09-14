import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/components/layout/AppLayout'
import Spinner from '@/components/ui/Spinner'

// Public
import LoginPage from '@/pages/auth/LoginPage'

// Pages — lazy loaded per chunk (code splitting)
const DashboardPage   = lazy(() => import('@/pages/dashboard/DashboardPage'))
const ProductsPage    = lazy(() => import('@/pages/products/ProductsPage'))
const ProductFormPage = lazy(() => import('@/pages/products/ProductFormPage'))
const CategoriesPage  = lazy(() => import('@/pages/categories/CategoriesPage'))
const SuppliersPage   = lazy(() => import('@/pages/suppliers/SuppliersPage'))
const CustomersPage   = lazy(() => import('@/pages/customers/CustomersPage'))
const CustomerDetail  = lazy(() => import('@/pages/customers/CustomerDetail'))
const PosPage         = lazy(() => import('@/pages/pos/PosPage'))
const SalesPage       = lazy(() => import('@/pages/sales/SalesPage'))
const SaleDetail      = lazy(() => import('@/pages/sales/SaleDetail'))
const PurchasesPage   = lazy(() => import('@/pages/purchases/PurchasesPage'))
const PurchaseForm    = lazy(() => import('@/pages/purchases/PurchaseForm'))
const PurchaseDetail  = lazy(() => import('@/pages/purchases/PurchaseDetail'))
const InventoryPage   = lazy(() => import('@/pages/inventory/InventoryPage'))
const StockTransferPage = lazy(() => import('@/pages/inventory/StockTransferPage'))
const CustomerDebts   = lazy(() => import('@/pages/debts/CustomerDebts'))
const SupplierDebts   = lazy(() => import('@/pages/debts/SupplierDebts'))
const ReportSales     = lazy(() => import('@/pages/reports/ReportSales'))
const ReportInventory = lazy(() => import('@/pages/reports/ReportInventory'))
const ReportPnL       = lazy(() => import('@/pages/reports/ReportPnL'))
const UsersPage       = lazy(() => import('@/pages/users/UsersPage'))
const SettingsPage    = lazy(() => import('@/pages/settings/SettingsPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner />
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Landing page per role: kasir langsung ke POS, owner/admin ke dashboard
function useLandingPath(): string {
  const user = useAuthStore((s) => s.user)
  const roles = user?.roles ?? []
  const isKasirOnly = roles.includes('kasir') && !roles.includes('owner') && !roles.includes('admin')
  return isKasirOnly ? '/pos' : '/dashboard'
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const landing = useLandingPath()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/login" element={isAuthenticated ? <Navigate to={landing} replace /> : <LoginPage />} />

                {/* Protected */}
                <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
                  <Route index element={<Navigate to={landing} replace />} />
                  <Route path="dashboard"   element={<DashboardPage />} />
                  <Route path="pos"         element={<PosPage />} />

                  {/* Products */}
                  <Route path="products"           element={<ProductsPage />} />
                  <Route path="products/create"    element={<ProductFormPage />} />
                  <Route path="products/:id/edit"  element={<ProductFormPage />} />

                  {/* Master Data */}
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="suppliers"  element={<SuppliersPage />} />
                  <Route path="customers"          element={<CustomersPage />} />
                  <Route path="customers/:id"      element={<CustomerDetail />} />

                  {/* Sales */}
                  <Route path="sales"       element={<SalesPage />} />
                  <Route path="sales/:id"   element={<SaleDetail />} />

                  {/* Purchases */}
                  <Route path="purchases"          element={<PurchasesPage />} />
                  <Route path="purchases/create"   element={<PurchaseForm />} />
                  <Route path="purchases/:id"      element={<PurchaseDetail />} />

                  {/* Inventory */}
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="stock-transfers" element={<StockTransferPage />} />

                  {/* Debts */}
                  <Route path="debts/customers" element={<CustomerDebts />} />
                  <Route path="debts/suppliers" element={<SupplierDebts />} />

                  {/* Reports */}
                  <Route path="reports/sales"       element={<ReportSales />} />
                  <Route path="reports/inventory"   element={<ReportInventory />} />
                  <Route path="reports/profit-loss" element={<ReportPnL />} />

                  {/* Admin */}
                  <Route path="users"    element={<UsersPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to={landing} replace />} />
              </Routes>
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
