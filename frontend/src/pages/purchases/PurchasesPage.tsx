import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Eye } from 'lucide-react'
import { getPurchases } from '@/api'
import { formatCurrency, formatDate, purchaseStatusBadge, purchaseStatusLabel } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'
import Pagination from '@/components/ui/Pagination'
import SearchBar from '@/components/ui/SearchBar'
import Spinner from '@/components/ui/Spinner'

export default function PurchasesPage() {
  const currency = useSettingStore((s) => s.currency())
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page, search, status],
    queryFn: () => getPurchases({ page, search, status: status || undefined, per_page: 20 }).then(r => r.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Cari PO..." />
          <select className="input w-36" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="received">Diterima</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
        <Link to="/purchases/create" className="btn-primary"><Plus size={16} /> Buat PO</Link>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="card p-0">
          <div className="tbl-wrapper">
            <table className="tbl">
              <thead>
                <tr><th>No. PO</th><th>Supplier</th><th>Total</th><th>Tgl Order</th><th>Status</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {data?.data.map((p) => (
                  <tr key={p.id}>
                    <td><span className="font-mono text-xs font-medium">{p.po_number}</span></td>
                    <td>{p.supplier?.name}</td>
                    <td className="font-semibold">{formatCurrency(p.total_amount, currency)}</td>
                    <td className="text-xs text-slate-500">{formatDate(p.order_date)}</td>
                    <td><span className={`badge ${purchaseStatusBadge(p.status)}`}>{purchaseStatusLabel(p.status)}</span></td>
                    <td><Link to={`/purchases/${p.id}`} className="btn-ghost p-1.5"><Eye size={15} /></Link></td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">Tidak ada purchase order</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data && <div className="p-4"><Pagination data={data} onPageChange={setPage} /></div>}
        </div>
      )}
    </div>
  )
}
