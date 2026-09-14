import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, FileText, Users, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useState } from 'react'
import MobileMenu from './MobileMenu'

export default function BottomNav() {
  const { hasPermission, hasRole } = useAuthStore()
  const totalItems = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const canAccess = (permission?: string, role?: string) => {
    if (role)       return hasRole(role)
    if (permission) return hasPermission(permission)
    return true
  }

  const leftItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, permission: '' },
    { label: 'Penjualan', to: '/sales',      icon: FileText,        permission: 'laporan' },
  ]
  const rightItems = [
    { label: 'Pelanggan', to: '/customers', icon: Users,          permission: 'pelanggan' },
    { label: 'Lainnya',   to: null,          icon: MoreHorizontal, permission: '' },
  ]

  const NavItem = ({
    label, to, icon: Icon, onClick,
  }: {
    label: string; to: string | null; icon: any
    permission?: string; onClick?: () => void
  }) => {
    const isActive = to ? pathname.startsWith(to) : false

    const inner = (
      <div className={cn(
        'flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200',
        isActive ? 'bg-primary-50' : 'hover:bg-slate-50',
      )}>
        <Icon
          size={21}
          className={isActive ? 'text-primary-600' : 'text-slate-400'}
          strokeWidth={isActive ? 2.2 : 1.6}
        />
        <span className={cn(
          'text-[10px] font-bold',
          isActive ? 'text-primary-600' : 'text-slate-400',
        )}>
          {label}
        </span>
      </div>
    )

    if (onClick || !to) {
      return (
        <button onClick={onClick} className="flex-1 flex items-center justify-center">
          {inner}
        </button>
      )
    }
    return (
      <NavLink to={to} className="flex-1 flex items-center justify-center">
        {inner}
      </NavLink>
    )
  }

  return (
    <>
      {/* Spacer */}
      <div className="lg:hidden h-[80px] shrink-0" />

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4 pb-3">
        {/* ── Floating pill ── */}
        <div className="
          relative flex items-center
          bg-white rounded-[32px]
          px-2 py-1
          shadow-[0_8px_32px_rgba(0,0,0,0.12)]
          border border-slate-100
          w-full max-w-sm
        ">

          {/* LEFT */}
          {leftItems.map(item => canAccess(item.permission) && (
            <NavItem key={item.to} {...item} />
          ))}

          {/* CENTER — POS button floating up */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative -mt-7 flex flex-col items-center">
              {/* Background fill behind button (fill gap between pill top and button) */}
              <div className="absolute -inset-2 rounded-full bg-white" />

              {/* Subtle glow */}
              <div className="absolute inset-0 rounded-full bg-primary-400/20 scale-110 blur-md" />

              {/* Button */}
              <NavLink
                to="/pos"
                className={cn(
                  'relative w-14 h-14 rounded-full flex items-center justify-center',
                  'bg-gradient-to-br from-primary-500 to-primary-700',
                  'shadow-lg shadow-primary-400/50',
                  'active:scale-95 transition-transform duration-150',
                  'border-4 border-white',
                )}
              >
                <ShoppingCart size={24} className="text-white" strokeWidth={2} />
                {totalItems > 0 && (
                  <span className="
                    absolute -top-0.5 -right-0.5
                    bg-red-500 text-white text-[9px] font-extrabold
                    min-w-[18px] h-[18px] rounded-full
                    flex items-center justify-center px-1
                    shadow border-2 border-white
                  ">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </NavLink>

              {/* Label */}
              <p className={cn(
                'text-[10px] font-bold mt-1 relative z-10',
                pathname.startsWith('/pos') ? 'text-primary-600' : 'text-slate-400',
              )}>
                POS
              </p>
            </div>
          </div>

          {/* RIGHT */}
          {rightItems.map(item => canAccess(item.permission) && (
            <NavItem
              key={item.label}
              {...item}
              onClick={item.to === null ? () => setMoreOpen(true) : undefined}
            />
          ))}
        </div>
      </div>

      <MobileMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
