import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSale, cancelSale } from '@/api'
import { formatCurrency, formatDateTime, saleStatusBadge, saleStatusLabel } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useState } from 'react'

export default function SaleDetail() {
  const { id }   = useParams()
  const qc       = useQueryClient()
  const currency = useSettingStore((s) => s.currency())
  const settings = useSettingStore((s) => s.settings)
  const [cancelOpen, setCancelOpen] = useState(false)

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => getSale(Number(id)).then(r => r.data),
  })

  const cancelMut = useMutation({
    mutationFn: () => cancelSale(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['sale', id] })
      toast.success('Transaksi dibatalkan.')
      setCancelOpen(false)
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal membatalkan.'),
  })

  if (isLoading) return <Spinner />
  if (!sale) return null

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <Link to="/sales" className="btn-ghost text-sm gap-1.5"><ArrowLeft size={16} /> Kembali</Link>
        <div className="flex gap-2">
          {sale.status !== 'cancelled' && (
            <button onClick={() => setCancelOpen(true)} className="btn-danger"><XCircle size={15} /> Batalkan</button>
          )}
          <button onClick={() => window.print()} className="btn-secondary"><Printer size={15} /> Print</button>
        </div>
      </div>

      <div className="card" id="receipt">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{settings['store_name']}</h2>
            <p className="text-xs text-slate-400">{settings['store_address']}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold">{sale.invoice_number}</p>
            <p className="text-xs text-slate-400">{formatDateTime(sale.created_at)}</p>
            <span className={`badge ${saleStatusBadge(sale.status)} mt-1`}>{saleStatusLabel(sale.status)}</span>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-100 text-sm">
          <div>
            <p className="text-xs text-slate-400">Pelanggan</p>
            <p className="font-medium">{sale.customer?.name ?? 'Umum'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Kasir</p>
            <p className="font-medium">{(sale.user as any)?.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Metode Bayar</p>
            <p className="font-medium capitalize">{sale.payment_method}</p>
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 text-xs font-semibold text-slate-500">Produk</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500">Qty</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500">Harga</th>
              <th className="text-right py-2 text-xs font-semibold text-slate-500">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item) => (
              <tr key={item.id} className="border-b border-slate-50">
                <td className="py-2">{item.product_name}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(item.sell_price, currency)}</td>
                <td className="py-2 text-right font-medium">{formatCurrency(item.subtotal, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="space-y-1.5 text-sm border-t border-slate-100 pt-3">
          <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(sale.subtotal, currency)}</span></div>
          {Number(sale.discount_amount) > 0 && <div className="flex justify-between text-slate-500"><span>Diskon</span><span>-{formatCurrency(sale.discount_amount, currency)}</span></div>}
          {Number(sale.tax_amount) > 0 && <div className="flex justify-between text-slate-500"><span>Pajak</span><span>{formatCurrency(sale.tax_amount, currency)}</span></div>}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-100 mt-1"><span>TOTAL</span><span className="text-primary-600">{formatCurrency(sale.grand_total, currency)}</span></div>
          <div className="flex justify-between text-slate-500"><span>Dibayar</span><span>{formatCurrency(sale.paid_amount, currency)}</span></div>
          {Number(sale.change_amount) > 0 && <div className="flex justify-between text-slate-500"><span>Kembalian</span><span>{formatCurrency(sale.change_amount, currency)}</span></div>}
        </div>

        {settings['receipt_note'] && (
          <p className="text-center text-xs text-slate-400 mt-4 pt-3 border-t border-dashed border-slate-200">{settings['receipt_note']}</p>
        )}
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Batalkan Transaksi"
        message="Transaksi akan dibatalkan dan stok akan dikembalikan. Yakin?"
        confirmLabel="Batalkan Transaksi"
        onConfirm={() => cancelMut.mutate()}
        onCancel={() => setCancelOpen(false)}
        loading={cancelMut.isPending}
      />
    </div>
  )
}
