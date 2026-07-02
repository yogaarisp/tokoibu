import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Eye, SlidersHorizontal } from 'lucide-react'
import { getSales } from '@/api'
import { formatCurrency, formatDateTime, saleStatusBadge, saleStatusLabel } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'
import Pagination from '@/components/ui/Pagination'
import SearchBar from '@/components/ui/SearchBar'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { Sale } from '@/types'

export default function SalesPage() {
  const currency = useSettingStore((s) => s.currency())
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom]     = useState('')
  const [to, setTo]         = useState('')
  const [showFilter, setShowFilter] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, search, status, from, to],
    queryFn: () => getSales({ page, search, status: status || undefined, from: from || undefined, to: to || undefined, per_page: 20 }).then(r => r.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Cari invoice..." className="flex-1 min-w-[160px]" />
        <button onClick={() => setShowFilter(!showFilter)} className={`btn-secondary ${showFilter ? 'ring-2 ring-primary-300' : ''}`}>
          <SlidersHorizontal size={15} /><span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {showFilter && (
        <div className="card py-3">
          <div className="flex flex-wrap gap-3 items-center">
            <select className="input w-36 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
              <option value="">Semua Status</option>
              <option value="paid">Lunas</option>
              <option value="debt">Hutang</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
            <input type="date" className="input w-40 text-sm" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
            <span className="text-slate-400 text-sm font-medium">s/d</span>
            <input type="date" className="input w-40 text-sm" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
            {(status || from || to) && (
              <button onClick={() => { setStatus(''); setFrom(''); setTo('') }} className="text-xs text-red-500 font-semibold hover:underline">Reset</button>
            )}
          </div>
        </div>
      )}

      {isLoading ? <Spinner /> : (
        <>
          {/* Desktop */}
          <div className="card p-0 hidden md:block">
            <div className="tbl-wrapper">
              <table className="tbl">
                <thead><tr><th>Invoice</th><th>Pelanggan</th><th>Kasir</th><th>Total</th><th>Metode</th><th>Status</th><th>Waktu</th><th></th></tr></thead>
                <tbody>
                  {data?.data.map((s) => (
                    <tr key={s.id}>
                      <td><span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg">{s.invoice_number}</span></td>
                      <td className="font-medium">{s.customer?.name ?? <span className="text-slate-400 text-xs">Umum</span>}</td>
                      <td className="text-xs text-slate-500">{(s.user as any)?.name}</td>
                      <td className="font-bold text-slate-800">{formatCurrency(s.grand_total, currency)}</td>
                      <td><span className="text-xs capitalize text-slate-500">{s.payment_method}</span></td>
                      <td><span className={`badge ${saleStatusBadge(s.status)}`}>{saleStatusLabel(s.status)}</span></td>
                      <td className="text-xs text-slate-400">{formatDateTime(s.created_at)}</td>
                      <td><Link to={`/sales/${s.id}`} className="btn-icon"><Eye size={15} /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.data.length === 0 && <EmptyState title="Tidak ada transaksi" />}
            {data && <div className="p-4"><Pagination data={data} onPageChange={setPage} /></div>}
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-2">
            {data?.data.length === 0 && <EmptyState title="Tidak ada transaksi" />}
            {data?.data.map((s: Sale) => (
              <Link key={s.id} to={`/sales/${s.id}`} className="card p-3 flex items-center gap-3 active:scale-98 transition-transform">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="font-mono text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">{s.invoice_number}</span>
                    <span className={`badge ${saleStatusBadge(s.status)}`} style={{fontSize:'10px',padding:'1px 6px'}}>{saleStatusLabel(s.status)}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{s.customer?.name ?? 'Umum'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(s.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(s.grand_total, currency)}</p>
                  <p className="text-[10px] text-slate-400 capitalize mt-0.5">{s.payment_method}</p>
                </div>
              </Link>
            ))}
            {data && <Pagination data={data} onPageChange={setPage} />}
          </div>
        </>
      )}
    </div>
  )
}
