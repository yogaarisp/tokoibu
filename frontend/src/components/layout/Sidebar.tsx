import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Package, Tags, Truck,
  Users, FileText, Boxes, Warehouse, CreditCard,
  BarChart3, Settings, LogOut, Store, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useSettingStore } from '@/store/settingStore'
import { logout as apiLogout } from '@/api/auth'
import { useState, useEffect } from 'react'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  permission?: string
  role?: string
}

// Semua item — dikelompokkan hanya dengan divider, tanpa label
const navSections: NavItem[][] = [
  // Utama
  [
    { label: 'Dashboard',   to: '/dashboard',       icon: <LayoutDashboard size={17} /> },
    { label: 'Kasir / POS', to: '/pos',             icon: <ShoppingCart size={17} />,   permission: 'kasir' },
  ],
  // Katalog & Relasi
  [
    { label: 'Produk',      to: '/products',        icon: <Package size={17} />,        permission: 'produk' },
    { label: 'Kategori',    to: '/categories',      icon: <Tags size={17} />,           permission: 'kategori' },
    { label: 'Supplier',    to: '/suppliers',       icon: <Truck size={17} />,          permission: 'supplier' },
    { label: 'Pelanggan',   to: '/customers',       icon: <Users size={17} />,          permission: 'pelanggan' },
  ],
  // Transaksi
  [
    { label: 'Penjualan',   to: '/sales',           icon: <FileText size={17} />,       permission: 'laporan' },
    { label: 'Pembelian',   to: '/purchases',       icon: <Boxes size={17} />,          permission: 'supplier' },
    { label: 'Inventori',   to: '/inventory',       icon: <Warehouse size={17} />,      permission: 'produk' },
    { label: 'Hutang Pel.', to: '/debts/customers', icon: <CreditCard size={17} />,     permission: 'hutang' },
    { label: 'Hutang Sup.', to: '/debts/suppliers', icon: <CreditCard size={17} />,     permission: 'hutang' },
  ],
  // Laporan
  [
    { label: 'Lap. Penjualan',  to: '/reports/sales',       icon: <BarChart3 size={17} />, permission: 'laporan' },
    { label: 'Lap. Inventori',  to: '/reports/inventory',   icon: <BarChart3 size={17} />, permission: 'laporan' },
    { label: 'Laba Rugi',       to: '/reports/profit-loss', icon: <BarChart3 size={17} />, permission: 'laporan' },
  ],
  // Sistem
  [
    { label: 'Pengguna',    to: '/users',            icon: <Users size={17} />,    role: 'owner' },
    { label: 'Pengaturan',  to: '/settings',         icon: <Settings size={17} />, role: 'owner' },
  ],
]

interface Props { onClose: () => void }

export default function Sidebar({ onClose }: Props) {
  const { user, clearAuth, hasPermission, hasRole } = useAuthStore()
  const storeName = useSettingStore((s) => s.storeName())
  const navigate  = useNavigate()
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved === 'true'
  })

  // Save to localStorage when collapsed changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed))
  }, [collapsed])

  const canView = (item: NavItem) => {
    if (item.role)       return hasRole(item.role)
    if (item.permission) return hasPermission(item.permission)
    return true
  }

  const handleLogout = async () => {
    try { await apiLogout() } catch { /* logout tetap lanjut walau request gagal */ }
    clearAuth()
    navigate('/login')
  }

  return (
    <aside className={cn(
      'h-full flex flex-col bg-white/95 backdrop-blur-xl',
      'lg:m-3 lg:rounded-3xl lg:h-[calc(100vh-24px)]',
      'shadow-soft border border-white/60 transition-all duration-300',
      collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]',
    )}>

      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4 shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md shadow-primary-200 shrink-0">
          <Store size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate leading-tight">{storeName}</p>
            <p className="text-[10px] text-slate-400 font-medium">POS System</p>
          </div>
        )}
        {/* Close — mobile only */}
        <button onClick={onClose} className="lg:hidden ml-auto text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-2 space-y-1 overflow-x-hidden">
        {navSections.map((section, si) => {
          const visible = section.filter(canView)
          if (visible.length === 0) return null
          return (
            <div key={si}>
              {/* Divider between sections (skip first) */}
              {si > 0 && (
                <div className="mx-2 my-2.5 border-t border-slate-100" />
              )}
              {visible.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group',
                    collapsed ? 'justify-center px-3' : '',
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
                  )}
                >
                  <span className="shrink-0 flex items-center justify-center w-5 h-5">{item.icon}</span>
                  {!collapsed && (
                    <span className="truncate text-[13px] font-medium">{item.label}</span>
                  )}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* ── User footer ── */}
      <div className="px-2.5 py-3 border-t border-slate-100 shrink-0">
        <div className={cn(
          'flex items-center gap-2.5 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors',
          collapsed && 'justify-center px-0',
        )}>
          {/* Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.roles?.[0]}</p>
            </div>
          )}

          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shrink-0"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {!collapsed && (
            <button
              onClick={handleLogout}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-xl',
                'text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0',
              )}
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
