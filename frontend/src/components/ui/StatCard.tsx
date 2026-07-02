import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  gradient?: string
  trend?: { value: number; label: string }
}

export default function StatCard({ title, value, subtitle, icon, gradient = 'from-emerald-500 to-green-600', trend }: Props) {
  return (
    <div className="card overflow-hidden relative group hover:-translate-y-0.5 transition-transform duration-200 p-3 md:p-5">
      {/* Background accent */}
      <div className={cn(
        'absolute -right-3 -top-3 w-16 h-16 md:w-24 md:h-24 rounded-full opacity-10 bg-gradient-to-br',
        gradient
      )} />

      <div className="flex items-start justify-between gap-2 relative">
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider leading-tight truncate">
            {title}
          </p>
          <p className="text-base md:text-2xl font-bold text-slate-800 mt-0.5 md:mt-1 leading-tight break-words">
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] md:text-xs text-slate-400 mt-0.5 font-medium leading-tight">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              'text-xs font-semibold mt-1 flex items-center gap-1',
              trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'
            )}>
              <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-slate-400 font-normal">{trend.label}</span>
            </p>
          )}
        </div>

        {/* Icon */}
        <div className={cn(
          'w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0',
          'bg-gradient-to-br text-white shadow-md',
          gradient
        )}>
          {/* Scale down icon size on mobile */}
          <span className="[&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-5 md:[&>svg]:h-5">
            {icon}
          </span>
        </div>
      </div>
    </div>
  )
}
