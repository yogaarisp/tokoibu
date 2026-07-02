import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPurchase, receivePurchase } from '@/api'
import { formatCurrency, formatDate, purchaseStatusBadge, purchaseStatusLabel } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useState } from 'react'

export default function PurchaseDetail() {
  const { id }   = useParams()
  const qc       = useQueryClient()
  const currency = useSettingStore((s) => s.currency())
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: purchase, isLoading } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => getPurchase(Number(id)).then(r => r.data),
  })

  const receiveMut = useMutation({
    mutationFn: () => receivePurchase(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase', id] })
      qc.invalidateQueries({ queryKey: ['purchases'] })
      toast.success('Barang diterima. Stok diperbarui.')
      setConfirmOpen(false)
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  if (isLoading) return <Spinner />
  if (!purchase) return null

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <Link to="/purchases" className="btn-ghost text-sm gap-1.5"><ArrowLeft size={16} /> Kembali</Link>
        {purchase.status === 'pending' && (
          <button onClick={() => setConfirmOpen(true)} className="btn-primary">
            <CheckCircle size={15} /> Terima Barang
          </button>
        )}
      </div>

      <div className="card">
        {/* Header */}
        <div className="flex items-start justify-between mb-5 pb-4 border-b border-slate-100">
          <div>
            <p className="font-mono text-lg font-bold">{purchase.po_number}</p>
            <p className="text-sm text-slate-500">Supplier: <span className="font-medium text-slate-700">{purchase.supplier?.name}</span></p>
            <p className="text-xs text-slate-400 mt-0.5">Tanggal Order: {formatDate(purchase.order_date)}</p>
            {purchase.received_date && <p className="text-xs text-slate-400">Diterima: {formatDate(purchase.received_date)}</p>}
          </div>
          <span className={`badge ${purchaseStatusBadge(purchase.status)} text-sm px-3 py-1`}>{purchaseStatusLabel(purchase.status)}</span>
        </div>

        {/* Items */}
        <div className="tbl-wrapper mb-5">
          <table className="tbl">
            <thead><tr><th>Produk</th><th className="text-right">Qty</th><th className="text-right">Harga Beli</th><th className="text-right">Subtotal</th></tr></thead>
            <tbody>
              {purchase.items?.map(item => (
                <tr key={item.id}>
                  <td className="font-medium">{item.product_name}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.buy_price, currency)}</td>
                  <td className="text-right font-semibold">{formatCurrency(item.subtotal, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="text-right">
            <p className="text-xs text-slate-400">Total PO</p>
            <p className="text-2xl font-bold text-primary-600">{formatCurrency(purchase.total_amount, currency)}</p>
          </div>
        </div>

        {purchase.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Catatan:</p>
            <p className="text-sm text-slate-600">{purchase.notes}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Konfirmasi Penerimaan"
        message="Stok semua produk akan ditambah sesuai PO ini. Tindakan tidak bisa dibatalkan. Lanjutkan?"
        confirmLabel="Terima Barang"
        onConfirm={() => receiveMut.mutate()}
        onCancel={() => setConfirmOpen(false)}
        loading={receiveMut.isPending}
      />
    </div>
  )
}
