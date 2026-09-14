import { useLocation } from 'react-router-dom'
import { Menu, Bell, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const breadcrumbs: Record<string, { label: string; parent?: string }> = {
  '/dashboard':           { label: 'Dashboard' },
  '/pos':                 { label: 'Kasir / POS' },
  '/products':            { label: 'Produk', parent: 'Katalog' },
  '/products/create':     { label: 'Tambah Produk', parent: 'Produk' },
  '/categories':          { label: 'Kategori', parent: 'Katalog' },
  '/suppliers':           { label: 'Supplier', parent: 'Relasi' },
  '/customers':           { label: 'Pelanggan', parent: 'Relasi' },
  '/sales':               { label: 'Penjualan', parent: 'Transaksi' },
  '/purchases':           { label: 'Pembelian', parent: 'Transaksi' },
  '/purchases/create':    { label: 'Buat PO', parent: 'Pembelian' },
  '/inventory':           { label: 'Inventori', parent: 'Transaksi' },
  '/debts/customers':     { label: 'Hutang Pelanggan', parent: 'Hutang' },
  '/debts/suppliers':     { label: 'Hutang Supplier', parent: 'Hutang' },
  '/reports/sales':       { label: 'Lap. Penjualan', parent: 'Laporan' },
  '/reports/inventory':   { label: 'Lap. Inventori', parent: 'Laporan' },
  '/reports/profit-loss': { label: 'Laba Rugi', parent: 'Laporan' },
  '/users':               { label: 'Pengguna', parent: 'Sistem' },
  '/settings':            { label: 'Pengaturan', parent: 'Sistem' },
  '/settings/printer':    { label: 'Printer Bluetooth', parent: 'Pengaturan' },
}

interface Props { onMenuClick: () => void }

export default function Header({ onMenuClick }: Props) {
  const { pathname } = useLocation()
  const user         = useAuthStore((s) => s.user)

  // Find best match
  const match = Object.entries(breadcrumbs)
    .filter(([key]) => pathname.startsWith(key))
    .sort((a, b) => b[0].length - a[0].length)[0]

  const current = match?.[1] ?? { label: 'Warung Bu Tutik' }

  return (
    <header className="
      flex items-center gap-3 px-4 md:px-5 py-3
      bg-white/80 backdrop-blur-md
      border-b border-slate-100/80
      lg:mx-3 lg:mt-3 lg:mb-0 lg:rounded-2xl lg:border lg:border-white/60
      lg:shadow-sm
      shrink-0
    ">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="btn-icon lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {current.parent && (
          <>
            <span className="text-xs text-slate-400 font-medium hidden sm:block">{current.parent}</span>
            <ChevronRight size={12} className="text-slate-300 hidden sm:block shrink-0" />
          </>
        )}
        <h1 className="text-sm font-bold text-slate-800 truncate">{current.label}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Notification */}
        <button className="btn-icon relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Avatar */}
        <button className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-slate-100 transition-colors">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-600 hidden sm:block max-w-[80px] truncate">
            {user?.name}
          </span>
        </button>
      </div>
    </header>
  )
}
