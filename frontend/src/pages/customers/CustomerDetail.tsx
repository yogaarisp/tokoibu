import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getCustomerHistory } from '@/api'
import { formatCurrency, formatDateTime, saleStatusBadge, saleStatusLabel, debtStatusBadge, debtStatusLabel } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'
import Spinner from '@/components/ui/Spinner'

export default function CustomerDetail() {
  const { id }   = useParams()
  const currency = useSettingStore((s) => s.currency())

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer-history', id],
    queryFn: () => getCustomerHistory(Number(id)).then(r => r.data),
  })

  if (isLoading) return <Spinner />
  if (!customer) return null

  return (
    <div className="space-y-5">
      <Link to="/customers" className="btn-ghost text-sm gap-1.5 inline-flex"><ArrowLeft size={16} /> Kembali</Link>

      {/* Profile */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{customer.name}</h2>
            <p className="text-sm text-slate-500">{customer.phone ?? '-'}</p>
            <p className="text-xs text-slate-400 mt-1">{customer.address ?? '-'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Hutang Aktif</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(customer.current_debt, currency)}</p>
            <p className="text-xs text-slate-400">Limit: {formatCurrency(customer.debt_limit, currency)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sales History */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Riwayat Pembelian</h3>
          <div className="space-y-2">
            {customer.sales?.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Belum ada transaksi</p>}
            {customer.sales?.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium font-mono">{s.invoice_number}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(s.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(s.grand_total, currency)}</p>
                  <span className={`badge ${saleStatusBadge(s.status)}`}>{saleStatusLabel(s.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Debt History */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Riwayat Hutang</h3>
          <div className="space-y-2">
            {customer.debts?.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Tidak ada hutang</p>}
            {customer.debts?.map((d: any) => (
              <div key={d.id} className="py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{formatCurrency(d.amount, currency)}</p>
                  <span className={`badge ${debtStatusBadge(d.status)}`}>{debtStatusLabel(d.status)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-slate-400">Sisa: {formatCurrency(d.remaining_amount, currency)}</p>
                  {d.due_date && <p className="text-xs text-slate-400">Jatuh tempo: {d.due_date}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
