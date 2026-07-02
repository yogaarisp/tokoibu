import { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface Props {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export default function EmptyState({ title = 'Data kosong', description, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-4 text-slate-400 shadow-inner">
        {icon ?? <Inbox size={28} />}
      </div>
      <p className="text-sm font-bold text-slate-600">{title}</p>
      {description && (
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
