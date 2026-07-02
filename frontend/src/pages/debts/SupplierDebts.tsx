import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSupplierDebts, paySupplierDebt } from '@/api'
import { SupplierDebt } from '@/types'
import { formatCurrency, formatDate, debtStatusBadge, debtStatusLabel } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

export default function SupplierDebts() {
  const qc       = useQueryClient()
  const currency = useSettingStore((s) => s.currency())
  const [page, setPage]       = useState(1)
  const [status, setStatus]   = useState('')
  const [payDebt, setPayDebt] = useState<SupplierDebt | null>(null)
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'cash', notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['supplier-debts', page, status],
    queryFn: () => getSupplierDebts({ page, status: status || undefined, per_page: 20 }).then(r => r.data),
  })

  const payMut = useMutation({
    mutationFn: (d: object) => paySupplierDebt(payDebt!.id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-debts'] })
      toast.success('Pembayaran dicatat.')
      setPayDebt(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select className="input w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Semua Status</option>
          <option value="unpaid">Belum Bayar</option>
          <option value="partial">Sebagian</option>
          <option value="paid">Lunas</option>
        </select>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="card p-0">
          <div className="tbl-wrapper">
            <table className="tbl">
              <thead>
                <tr><th>Supplier</th><th>No. PO</th><th>Total Hutang</th><th>Terbayar</th><th>Sisa</th><th>Jatuh Tempo</th><th>Status</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {data?.data.map((d) => (
                  <tr key={d.id}>
                    <td className="font-medium">{d.supplier?.name}</td>
                    <td><span className="font-mono text-xs">{d.purchase?.po_number ?? '-'}</span></td>
                    <td>{formatCurrency(d.amount, currency)}</td>
                    <td className="text-green-600">{formatCurrency(d.paid_amount, currency)}</td>
                    <td className="font-semibold text-red-600">{formatCurrency(d.remaining_amount, currency)}</td>
                    <td className="text-xs">{d.due_date ? formatDate(d.due_date) : '-'}</td>
                    <td><span className={`badge ${debtStatusBadge(d.status)}`}>{debtStatusLabel(d.status)}</span></td>
                    <td>
                      {d.status !== 'paid' && (
                        <button onClick={() => { setPayDebt(d); setPayForm({ amount: String(d.remaining_amount), payment_method: 'cash', notes: '' }) }}
                          className="btn-primary py-1 px-2.5 text-xs gap-1">
                          <CreditCard size={12} /> Bayar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-slate-400">Tidak ada hutang supplier</td></tr>}
              </tbody>
            </table>
          </div>
          {data && <div className="p-4"><Pagination data={data} onPageChange={setPage} /></div>}
        </div>
      )}

      <Modal open={!!payDebt} onClose={() => setPayDebt(null)} title="Bayar Hutang Supplier" size="sm">
        {payDebt && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-3 text-sm">
              <p className="font-semibold">{payDebt.supplier?.name}</p>
              <p className="text-slate-500 text-xs mt-0.5">Sisa hutang: <span className="font-bold text-red-600">{formatCurrency(payDebt.remaining_amount, currency)}</span></p>
            </div>
            <div>
              <label className="label">Jumlah Bayar *</label>
              <input type="number" className="input" min="1" max={payDebt.remaining_amount}
                value={payForm.amount} onChange={e => setPayForm(f => ({...f, amount: e.target.value}))} />
            </div>
            <div>
              <label className="label">Metode</label>
              <select className="input" value={payForm.payment_method} onChange={e => setPayForm(f => ({...f, payment_method: e.target.value}))}>
                <option value="cash">Tunai</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPayDebt(null)} className="btn-secondary">Batal</button>
              <button onClick={() => payMut.mutate({ amount: Number(payForm.amount), payment_method: payForm.payment_method, notes: payForm.notes })}
                disabled={payMut.isPending} className="btn-primary">{payMut.isPending ? 'Memproses...' : 'Catat'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
