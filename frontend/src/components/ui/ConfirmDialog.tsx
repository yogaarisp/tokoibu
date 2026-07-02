import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  title?: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  loading?: boolean
}

export default function ConfirmDialog({
  open, title = 'Konfirmasi', message,
  onConfirm, onCancel, confirmLabel = 'Hapus', loading,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-soft p-6">
        {/* Handle (mobile) */}
        <div className="flex justify-center mb-4 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle size={22} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
            Batal
          </button>
          <button onClick={onConfirm} className="btn-danger flex-1" disabled={loading}>
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
