import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLocations, getProducts, createStockTransfer, getStockTransfers } from '@/api'
import { Location, Product, StockTransfer } from '@/types'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

export default function StockTransferPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    product_id: '',
    quantity_pcs: '',
    quantity_unit: '',
    notes: ''
  })

  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ['locations-all'],
    queryFn: () => getLocations().then(r => r.data),
  })

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => getProducts({ per_page: 100 }).then(r => 
      Array.isArray(r.data) ? r.data : r.data.data
    ),
  })

  const { data: transfers = [], isLoading: loadingTransfers } = useQuery({
    queryKey: ['stock-transfers'],
    queryFn: () => getStockTransfers().then(r => r.data.data),
  })

  const mutation = useMutation({
    mutationFn: createStockTransfer,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['stock-transfers'] })
      qc.invalidateQueries({ queryKey: ['products'], exact: false })
      qc.invalidateQueries({ queryKey: ['product', variables.product_id] })
      qc.invalidateQueries({ queryKey: ['products-all'] })
      qc.invalidateQueries({ queryKey: ['products-for-scanner'] })
      qc.invalidateQueries({ queryKey: ['pos-products'], exact: false })
      toast.success('Stok berhasil dipindahkan ke rak display!')
      setForm({ product_id: '', quantity_pcs: '', quantity_unit: '', notes: '' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal memindahkan stok. Periksa stok di gudang!')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product_id || (!form.quantity_pcs && !form.quantity_unit)) {
      toast.error('Mohon isi produk dan jumlah')
      return
    }

    const gudang = locations.find(l => l.type === 'warehouse')
    const display = locations.find(l => l.type === 'display')

    if (!gudang || !display) {
      toast.error('Lokasi gudang atau display tidak ditemukan')
      return
    }

    const product = products.find(p => p.id === Number(form.product_id))
    const conversion = product ? (Number(product.unit_conversion) || 1) : 1
    const totalPcs = (Number(form.quantity_pcs) || 0) + 
                     (Number(form.quantity_unit) || 0) * conversion

    if (totalPcs <= 0) {
      toast.error('Jumlah harus lebih dari 0')
      return
    }

    mutation.mutate({
      from_location_id: gudang.id,
      to_location_id: display.id,
      product_id: Number(form.product_id),
      quantity: totalPcs,
      notes: form.notes
    })
  }

  const getProductStock = (productId: number) => {
    const gudang = locations.find(l => l.type === 'warehouse')
    if (!gudang) return 0

    const product = products.find(p => p.id === productId)
    if (!product) return 0

    const productStock = (product as any).product_stocks?.find(
      (ps: any) => ps.location_id === gudang.id
    ) || (product as any).productStocks?.find(
      (ps: any) => ps.location_id === gudang.id
    )
    return productStock ? productStock.stock : ((product as any).total_stock || product.stock)
  }

  const selectedProduct = products.find(p => p.id === Number(form.product_id))
  const conversion = selectedProduct ? (Number(selectedProduct.unit_conversion) || 1) : 1
  const totalPcs = (Number(form.quantity_pcs) || 0) + 
                   (Number(form.quantity_unit) || 0) * conversion

  const isLoading = loadingLocations || loadingProducts || loadingTransfers

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Isi Rak Display</h1>
        <p className="text-slate-500 mt-1">Pindahkan stok dari Gudang ke Rak Display</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Transfer */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Pindah Stok Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Produk
              </label>
              <select
                value={form.product_id}
                onChange={e => setForm({ ...form, product_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Pilih produk...</option>
                {products.map(prod => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} (Stok Gudang: {getProductStock(prod.id)} {prod.unit})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-blue-800">Jumlah yang dipindahkan</h3>
                
                {((selectedProduct.unit_warehouse !== selectedProduct.unit) || conversion > 1) && (
                  <div>
                    <label className="block text-sm text-blue-700 mb-1">
                      Jumlah dalam {selectedProduct.unit_warehouse || 'satuan gudang'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={form.quantity_unit}
                        onChange={e => setForm({ ...form, quantity_unit: e.target.value })}
                        className="flex-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder={`Contoh: 1 untuk 1 ${selectedProduct.unit_warehouse}`}
                      />
                      <span className="text-sm font-medium text-blue-700">
                        {selectedProduct.unit_warehouse}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      1 {selectedProduct.unit_warehouse} = {conversion} {selectedProduct.unit}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-blue-700 mb-1">
                    Jumlah dalam {selectedProduct.unit}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={form.quantity_pcs}
                      onChange={e => setForm({ ...form, quantity_pcs: e.target.value })}
                      className="flex-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder={`Contoh: 40`}
                    />
                    <span className="text-sm font-medium text-blue-700">
                      {selectedProduct.unit}
                    </span>
                  </div>
                </div>

                {(form.quantity_pcs || form.quantity_unit) && (
                  <div className="pt-2 border-t border-blue-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-600">Total yang dipindahkan:</span>
                      <span className="font-bold text-blue-800">
                        {totalPcs} {selectedProduct.unit}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Misal: Isi rak depan dengan 1 dus Indomie"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {mutation.isPending ? 'Memproses...' : 'Pindahkan ke Rak Display'}
              </button>
            </div>
          </form>
        </div>

        {/* Riwayat */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Riwayat Isi Rak</h2>
          {transfers.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              Belum ada riwayat isi rak
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {transfers.map(transfer => (
                <div key={transfer.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {transfer.product.name}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {transfer.quantity} {transfer.product.unit}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 ml-3 shrink-0">
                      {new Date(transfer.transferred_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  {transfer.notes && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {transfer.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
