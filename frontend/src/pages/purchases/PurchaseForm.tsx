import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSuppliers, createPurchase } from '@/api'
import { getProducts } from '@/api/products'
import { formatCurrency } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'

interface POItem { product_id: number; product_name: string; quantity: number; buy_price: number }

export default function PurchaseForm() {
  const navigate = useNavigate()
  const qc       = useQueryClient()
  const currency = useSettingStore((s) => s.currency())

  const [supplierId, setSupplierId] = useState('')
  const [orderDate, setOrderDate]   = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes]           = useState('')
  const [items, setItems]           = useState<POItem[]>([])
  const [prodSearch, setProdSearch] = useState('')

  const { data: suppliers } = useQuery({ queryKey: ['supps-po'], queryFn: () => getSuppliers({ per_page: 100 }).then(r => r.data) })
  const { data: products }  = useQuery({
    queryKey: ['prods-po', prodSearch],
    queryFn: () => getProducts({ search: prodSearch, per_page: 20 }).then(r => r.data),
    enabled: prodSearch.length > 1,
  })

  const createMut = useMutation({
    mutationFn: createPurchase,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['purchases'] })
      toast.success('PO berhasil dibuat.')
      navigate(`/purchases/${r.data.id}`)
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal membuat PO.'),
  })

  const addItem = (product: any) => {
    if (items.find(i => i.product_id === product.id)) return
    setItems(prev => [...prev, { product_id: product.id, product_name: product.name, quantity: 1, buy_price: product.buy_price }])
    setProdSearch('')
  }

  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.product_id !== id))

  const updateItem = (id: number, field: 'quantity' | 'buy_price', val: number) =>
    setItems(prev => prev.map(i => i.product_id === id ? { ...i, [field]: val } : i))

  const total = items.reduce((s, i) => s + i.quantity * i.buy_price, 0)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!supplierId) { toast.error('Pilih supplier.'); return }
    if (items.length === 0) { toast.error('Tambah minimal 1 produk.'); return }
    createMut.mutate({ supplier_id: Number(supplierId), order_date: orderDate, notes, items })
  }

  return (
    <div>
      <div className="mb-5">
        <Link to="/purchases" className="btn-ghost text-sm gap-1.5"><ArrowLeft size={16} /> Kembali</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Header */}
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Informasi PO</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Supplier *</label>
                  <select className="input" value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
                    <option value="">Pilih Supplier</option>
                    {suppliers?.data.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Tanggal Order</label>
                  <input type="date" className="input" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="label">Catatan</label>
                  <textarea className="input resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Produk</h2>

              {/* Product search */}
              <div className="relative mb-4">
                <input className="input" placeholder="Cari produk untuk ditambahkan..." value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
                {products && products.data.length > 0 && prodSearch && (
                  <div className="absolute z-10 top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {products.data.map(p => (
                      <button key={p.id} type="button" onClick={() => addItem(p)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-left text-sm">
                        <span>{p.name} <span className="text-slate-400 text-xs">({p.sku})</span></span>
                        <span className="text-primary-600 font-medium text-xs">{formatCurrency(p.buy_price, currency)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items table */}
              {items.length > 0 ? (
                <div className="tbl-wrapper">
                  <table className="tbl">
                    <thead><tr><th>Produk</th><th>Qty</th><th>Harga Beli</th><th>Subtotal</th><th></th></tr></thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.product_id}>
                          <td className="font-medium">{item.product_name}</td>
                          <td>
                            <input type="number" className="input w-20 text-sm" min="1" value={item.quantity}
                              onChange={e => updateItem(item.product_id, 'quantity', Number(e.target.value))} />
                          </td>
                          <td>
                            <input type="number" className="input w-28 text-sm" min="0" value={item.buy_price}
                              onChange={e => updateItem(item.product_id, 'buy_price', Number(e.target.value))} />
                          </td>
                          <td className="font-semibold">{formatCurrency(item.quantity * item.buy_price, currency)}</td>
                          <td><button type="button" onClick={() => removeItem(item.product_id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">Belum ada produk. Cari produk di atas.</p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-5">
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Ringkasan</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-500"><span>Total Item</span><span>{items.length} produk</span></div>
                <div className="flex justify-between text-slate-500"><span>Total Qty</span><span>{items.reduce((s, i) => s + i.quantity, 0)}</span></div>
                <div className="flex justify-between font-bold text-base border-t border-slate-100 pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-primary-600">{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </div>
            <button type="submit" disabled={createMut.isPending} className="btn-primary w-full justify-center py-2.5">
              {createMut.isPending ? 'Membuat PO...' : 'Buat Purchase Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
