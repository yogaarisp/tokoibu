import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Minus, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMovements, stockIn, stockOut, stockAdjust } from '@/api'
import { getProducts } from '@/api/products'
import { cn, formatDateTime } from '@/lib/utils'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { StockMovement } from '@/types'

type ActionType = 'in' | 'out' | 'adjust' | null

const typeConfig: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  in:         { label: 'Masuk',       badge: 'badge-green',  icon: <ArrowUp size={11} /> },
  out:        { label: 'Keluar',      badge: 'badge-red',    icon: <ArrowDown size={11} /> },
  adjustment: { label: 'Penyesuaian', badge: 'badge-yellow', icon: <SlidersHorizontal size={11} /> },
  opname:     { label: 'Opname',      badge: 'badge-blue',   icon: <SlidersHorizontal size={11} /> },
}

export default function InventoryPage() {
  const qc = useQueryClient()
  const [page, setPage]     = useState(1)
  const [action, setAction] = useState<ActionType>(null)
  const [form, setForm]     = useState({ product_id: '', quantity: '', new_quantity: '', notes: '' })
  const [prodSearch, setProdSearch] = useState('')

  const { data: movements, isLoading } = useQuery({
    queryKey: ['movements', page],
    queryFn: () => getMovements({ page, per_page: 30 }).then(r => r.data),
  })

  const { data: products } = useQuery({
    queryKey: ['prods-inv', prodSearch],
    queryFn: () => getProducts({ search: prodSearch, per_page: 20 }).then(r => r.data),
    enabled: prodSearch.length > 1,
  })

  const mutFns: Record<string, (d: object) => Promise<any>> = { in: stockIn, out: stockOut, adjust: stockAdjust }

  const saveMut = useMutation({
    mutationFn: (d: object) => mutFns[action!](d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Stok diperbarui.')
      setAction(null)
      setForm({ product_id: '', quantity: '', new_quantity: '', notes: '' })
      setProdSearch('')
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  const handleSave = () => {
    if (!form.product_id) { toast.error('Pilih produk.'); return }
    const payload = action === 'adjust'
      ? { product_id: Number(form.product_id), new_quantity: Number(form.new_quantity), notes: form.notes }
      : { product_id: Number(form.product_id), quantity: Number(form.quantity), notes: form.notes }
    saveMut.mutate(payload)
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setAction('in')} className="btn-primary">
          <Plus size={16} /> Stok Masuk
        </button>
        <button onClick={() => setAction('out')} className="btn-danger">
          <Minus size={16} /> Stok Keluar
        </button>
        <button onClick={() => setAction('adjust')} className="btn-secondary">
          <SlidersHorizontal size={15} /> Penyesuaian
        </button>
      </div>

      {isLoading ? <Spinner /> : (
        <>
          {/* Desktop */}
          <div className="card p-0 hidden md:block">
            <div className="tbl-wrapper">
              <table className="tbl">
                <thead><tr><th>Produk</th><th>Tipe</th><th>Sebelum</th><th>Perubahan</th><th>Sesudah</th><th>Referensi</th><th>Oleh</th><th>Waktu</th></tr></thead>
                <tbody>
                  {movements?.data.map((m) => {
                    const cfg = typeConfig[m.type]
                    return (
                      <tr key={m.id}>
                        <td className="font-semibold">{m.product?.name}</td>
                        <td><span className={`badge ${cfg?.badge ?? 'badge-gray'}`}>{cfg?.icon}{cfg?.label ?? m.type}</span></td>
                        <td className="font-mono text-xs text-slate-500">{m.quantity_before}</td>
                        <td>
                          <span className={cn('font-bold font-mono text-sm', m.quantity_change > 0 ? 'text-emerald-600' : 'text-red-500')}>
                            {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                          </span>
                        </td>
                        <td className="font-bold font-mono text-sm">{m.quantity_after}</td>
                        <td className="text-xs text-slate-400">{m.reference_type ?? '-'}</td>
                        <td className="text-xs text-slate-500">{m.user?.name}</td>
                        <td className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(m.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {movements?.data.length === 0 && <EmptyState title="Belum ada pergerakan stok" />}
            {movements && <div className="p-4"><Pagination data={movements} onPageChange={setPage} /></div>}
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-2">
            {movements?.data.length === 0 && <EmptyState title="Belum ada data" />}
            {movements?.data.map((m: StockMovement) => {
              const cfg = typeConfig[m.type]
              return (
                <div key={m.id} className="card p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{m.product?.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(m.created_at)} · {m.user?.name}</p>
                    </div>
                    <span className={`badge ml-2 shrink-0 ${cfg?.badge ?? 'badge-gray'}`} style={{fontSize:'10px'}}>{cfg?.icon}{cfg?.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-50">
                    <div className="text-center flex-1">
                      <p className="text-[10px] text-slate-400">Sebelum</p>
                      <p className="font-mono font-bold text-xs text-slate-600">{m.quantity_before}</p>
                    </div>
                    <div className="flex-1 text-center">
                      <span className={cn('font-mono font-bold text-base', m.quantity_change > 0 ? 'text-emerald-600' : 'text-red-500')}>
                        {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                      </span>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-[10px] text-slate-400">Sesudah</p>
                      <p className="font-mono font-bold text-xs text-slate-800">{m.quantity_after}</p>
                    </div>
                  </div>
                </div>
              )
            })}
            {movements && <Pagination data={movements} onPageChange={setPage} />}
          </div>
        </>
      )}

      {/* Modal */}
      <Modal open={!!action} size="sm" onClose={() => { setAction(null); setProdSearch('') }}
        title={action === 'in' ? '📦 Stok Masuk' : action === 'out' ? '📤 Stok Keluar' : '⚖️ Penyesuaian Stok'}>
        <div className="space-y-4">
          <div>
            <label className="label">Cari Produk *</label>
            <input className="input" placeholder="Ketik nama produk..." value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
            {products && products.data.length > 0 && prodSearch && (
              <div className="mt-1 border border-slate-200 rounded-2xl overflow-hidden max-h-40 overflow-y-auto shadow-sm">
                {products.data.map(p => (
                  <button key={p.id} type="button"
                    onClick={() => { setForm(f => ({...f, product_id: String(p.id)})); setProdSearch(`${p.name} (Stok: ${p.stock})`) }}
                    className="w-full flex justify-between items-center px-4 py-2.5 hover:bg-primary-50 text-sm text-left transition-colors">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-slate-400 ml-2">Stok: {p.stock} {p.unit}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {action === 'adjust' ? (
            <div>
              <label className="label">Stok Baru *</label>
              <input type="number" className="input" min="0" value={form.new_quantity} onChange={e => setForm(f => ({...f, new_quantity: e.target.value}))} />
            </div>
          ) : (
            <div>
              <label className="label">Jumlah *</label>
              <input type="number" className="input" min="1" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} />
            </div>
          )}

          <div>
            <label className="label">Catatan</label>
            <input className="input" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Opsional..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setAction(null); setProdSearch('') }} className="btn-secondary flex-1">Batal</button>
            <button onClick={handleSave} disabled={saveMut.isPending} className="btn-primary flex-1">
              {saveMut.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
