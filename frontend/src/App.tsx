import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/components/layout/AppLayout'

// Auth
import LoginPage from '@/pages/auth/LoginPage'

// Pages
import DashboardPage   from '@/pages/dashboard/DashboardPage'
import ProductsPage    from '@/pages/products/ProductsPage'
import ProductFormPage from '@/pages/products/ProductFormPage'
import CategoriesPage  from '@/pages/categories/CategoriesPage'
import SuppliersPage   from '@/pages/suppliers/SuppliersPage'
import CustomersPage   from '@/pages/customers/CustomersPage'
import CustomerDetail  from '@/pages/customers/CustomerDetail'
import PosPage         from '@/pages/pos/PosPage'
import SalesPage       from '@/pages/sales/SalesPage'
import SaleDetail      from '@/pages/sales/SaleDetail'
import PurchasesPage   from '@/pages/purchases/PurchasesPage'
import PurchaseForm    from '@/pages/purchases/PurchaseForm'
import PurchaseDetail  from '@/pages/purchases/PurchaseDetail'
import InventoryPage   from '@/pages/inventory/InventoryPage'
import StockTransferPage from '@/pages/inventory/StockTransferPage'
import CustomerDebts   from '@/pages/debts/CustomerDebts'
import SupplierDebts   from '@/pages/debts/SupplierDebts'
import ReportSales     from '@/pages/reports/ReportSales'
import ReportInventory from '@/pages/reports/ReportInventory'
import ReportPnL       from '@/pages/reports/ReportPnL'
import UsersPage       from '@/pages/users/UsersPage'
import SettingsPage    from '@/pages/settings/SettingsPage'
import PrinterSettings from '@/pages/settings/PrinterSettingsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

        {/* Protected */}
        <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
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
          <Route path="reports/sales"      element={<ReportSales />} />
          <Route path="reports/inventory"  element={<ReportInventory />} />
          <Route path="reports/profit-loss" element={<ReportPnL />} />

          {/* Admin */}
          <Route path="users"    element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />}>
            <Route index element={<Navigate to="general" replace />} />
            <Route path="general" element={<SettingsPage />} />
            <Route path="printer" element={<SettingsPage />} />
            <Route path="users" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
