import { NavLink, useNavigate } from 'react-router-dom'
import {
  Tags, Truck, Users, Boxes, Warehouse, CreditCard,
  BarChart3, TrendingUp, Settings, LogOut, X, Printer,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { logout as apiLogout } from '@/api/auth'
import { cn } from '@/lib/utils'

const menuItems = [
  { label: 'Kategori',      to: '/categories',          icon: <Tags size={18} />,         permission: 'kategori' },
  { label: 'Supplier',      to: '/suppliers',           icon: <Truck size={18} />,        permission: 'supplier' },
  { label: 'Pelanggan',     to: '/customers',           icon: <Users size={18} />,        permission: 'pelanggan' },
  { label: 'Pembelian',     to: '/purchases',           icon: <Boxes size={18} />,        permission: 'supplier' },
  { label: 'Inventori',     to: '/inventory',           icon: <Warehouse size={18} />,    permission: 'produk' },
  { label: 'Hutang Pel.',   to: '/debts/customers',     icon: <CreditCard size={18} />,   permission: 'hutang' },
  { label: 'Hutang Sup.',   to: '/debts/suppliers',     icon: <CreditCard size={18} />,   permission: 'hutang' },
  { label: 'Lap. Penjualan',to: '/reports/sales',       icon: <BarChart3 size={18} />,    permission: 'laporan' },
  { label: 'Lap. Inventori',to: '/reports/inventory',   icon: <BarChart3 size={18} />,    permission: 'laporan' },
  { label: 'Laba Rugi',     to: '/reports/profit-loss', icon: <TrendingUp size={18} />,   permission: 'laporan' },
  { label: 'Pengguna',      to: '/users',               icon: <Users size={18} />,        role: 'owner' },
  { label: 'Pengaturan',    to: '/settings',            icon: <Settings size={18} />,     role: 'owner' },
  { label: 'Printer',       to: '/settings/printer',    icon: <Printer size={18} />,      role: 'owner' },
]

interface Props { open: boolean; onClose: () => void }

export default function MobileMenu({ open, onClose }: Props) {
  const { user, clearAuth, hasPermission, hasRole } = useAuthStore()
  const navigate = useNavigate()

  const canView = (item: { permission?: string; role?: string }) => {
    if (item.role)       return hasRole(item.role)
    if (item.permission) return hasPermission(item.permission)
    return true
  }

  const handleLogout = async () => {
    try { await apiLogout() } catch { /* logout tetap lanjut walau request gagal */ }
    clearAuth()
    navigate('/login')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-soft max-h-[80vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.roles?.[0]}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Menu grid */}
        <div className="overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-2">
            {menuItems.filter(canView).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => cn(
                  'flex flex-col items-center gap-2 p-3 rounded-2xl text-center transition-all duration-200',
                  isActive
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                )}
              >
                <span>{item.icon}</span>
                <span className="text-xs font-semibold leading-tight">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </div>
    </div>
  )
}
