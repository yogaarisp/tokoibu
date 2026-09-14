import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Edit2, Trash2, AlertTriangle, Filter, Search, X, Package, ArrowRightLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProducts, deleteProduct } from '@/api/products'
import { getCategories, stockIn, getLocations, createStockTransfer } from '@/api'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'
import Pagination from '@/components/ui/Pagination'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { Product, Location } from '@/types'

export default function ProductsPage() {
  const qc       = useQueryClient()
  const currency = useSettingStore((s) => s.currency())
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [catId, setCatId]       = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [showAddStock, setShowAddStock] = useState<number | null>(null)
  const [addStockQty, setAddStockQty] = useState('')
  const [addStockNote, setAddStockNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, catId],
    queryFn: () => getProducts({ page, search, category_id: catId || undefined, per_page: 20 }).then(r => r.data),
  })

  const { data: cats } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => getCategories({ per_page: 100, is_active: true }).then(r => r.data),
  })

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { 
      qc.invalidateQueries({ 
        queryKey: ['products'], 
        exact: false
      }); 
      if (deleteId) {
        qc.invalidateQueries({ 
          queryKey: ['product', deleteId]
        })
      }
      toast.success('Produk dihapus.'); 
      setDeleteId(null) 
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal menghapus.'),
  })

  const addStockMut = useMutation({
    mutationFn: (data: { product_id: number; quantity: number; notes?: string }) => stockIn(data),
    onSuccess: () => {
      qc.invalidateQueries({ 
        queryKey: ['products'], 
        exact: false
      })
      if (showAddStock) {
        qc.invalidateQueries({ 
          queryKey: ['product', showAddStock]
        })
      }
      qc.invalidateQueries({ 
        queryKey: ['products-all']
      })
      qc.invalidateQueries({ 
        queryKey: ['products-for-scanner']
      })
      qc.invalidateQueries({ 
        queryKey: ['pos-products'],
        exact: false
      })
      toast.success('Stok gudang berhasil ditambahkan.')
      setShowAddStock(null)
      setAddStockQty('')
      setAddStockNote('')
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal menambah stok.'),
  })

  const fillRackMut = useMutation({
    mutationFn: (data: { from_location_id: number; to_location_id: number; product_id: number; quantity: number; notes?: string }) => createStockTransfer(data),
    onSuccess: () => {
      qc.invalidateQueries({ 
        queryKey: ['products'], 
        exact: false
      })
      if (showFillRack) {
        qc.invalidateQueries({ 
          queryKey: ['product', showFillRack]
        })
      }
      qc.invalidateQueries({ 
        queryKey: ['products-all']
      })
      qc.invalidateQueries({ 
        queryKey: ['products-for-scanner']
      })
      qc.invalidateQueries({ 
        queryKey: ['pos-products'],
        exact: false
      })
      toast.success('Stok berhasil dipindahkan ke rak.')
      setShowFillRack(null)
      setFillRackQty('')
      setFillRackNote('')
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal memindahkan stok.'),
  })

  const getCurrentProduct = () => data?.data.find((p: Product) => p.id === showAddStock)
  
  // Dapatkan stok gudang dalam satuan rak (pcs)
  const getGudangStockPcs = (p: Product) => {
    const stocks = (p as any).productStocks || (p as any).product_stocks || []
    return stocks.find((ps: any) => ps.location?.type === 'warehouse')?.stock || 0
  }
  
  // Dapatkan stok gudang dalam satuan gudang (misal dus)
  const getGudangStockDisplay = (p: Product) => {
    const stockPcs = getGudangStockPcs(p)
    const conversion = Number((p as any).unit_conversion) || 1
    return Math.floor(stockPcs / conversion)
  }
  
  const getDisplayStock = (p: Product) => {
    const stocks = (p as any).productStocks || (p as any).product_stocks || []
    return stocks.find((ps: any) => ps.location?.type === 'display')?.stock || 0
  }
  
  const getUnitWarehouse = (p: Product) => (p as any).unit_warehouse || p.unit
  
  const getUnitRack = (p: Product) => p.unit
  
  const getConversion = (p: Product) => Number((p as any).unit_conversion) || 1

  const [showFillRack, setShowFillRack] = useState<number | null>(null)
  const [fillRackQty, setFillRackQty] = useState('')
  const [fillRackNote, setFillRackNote] = useState('')
  const [fillRackUnit, setFillRackUnit] = useState<'warehouse' | 'rack'>('warehouse')

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocations(),
  })

  const getCurrentFillRackProduct = () => data?.data.find((p: Product) => p.id === showFillRack)
  const getWarehouseLocation = () => locations?.data?.find((l: Location) => l.type === 'warehouse')
  const getDisplayLocation = () => locations?.data?.find((l: Location) => l.type === 'display')

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            className="input pl-10 pr-9 w-full"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari produk..."
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => { setSearch(''); setPage(1) }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`btn-secondary gap-2 ${showFilter ? 'ring-2 ring-primary-300' : ''}`}
        >
          <Filter size={15} />
          <span className="hidden sm:inline">Filter</span>
        </button>
        <Link to="/products/create" className="btn-primary">
          <Plus size={16} />
          <span className="hidden sm:inline">Tambah Produk</span>
          <span className="sm:hidden">Tambah</span>
        </Link>
      </div>

      {/* Filter row */}
      {showFilter && (
        <div className="card py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Kategori:</label>
              <select className="input w-44 text-sm" value={catId} onChange={(e) => { setCatId(e.target.value); setPage(1) }}>
                <option value="">Semua</option>
                {cats?.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {catId && (
              <button onClick={() => setCatId('')} className="text-xs text-red-500 font-semibold hover:underline">
                Reset filter
              </button>
            )}
          </div>
        </div>
      )}

      {isLoading ? <Spinner /> : (
        <>
          {/* ── Desktop table ── */}
          <div className="card p-0 hidden md:block">
            <div className="tbl-wrapper">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Produk</th><th>SKU</th><th>Kategori</th>
                    <th>Harga Jual</th><th>Stok Gudang</th><th>Stok Rak</th><th>Status</th><th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((p) => {
                    const gudangStockDisplay = getGudangStockDisplay(p)
                    const displayStock = getDisplayStock(p)
                    return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <img src={p.photo_url} alt={p.name} className="w-10 h-10 object-cover rounded-xl bg-slate-100 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">{p.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{p.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-lg">{p.sku}</span></td>
                      <td><span className="badge badge-blue">{p.category?.name}</span></td>
                      <td className="font-bold text-slate-800">{formatCurrency(p.sell_price, currency)}</td>
                      <td>
                        <span className={`badge ${gudangStockDisplay === 0 ? 'badge-yellow' : 'badge-green'}`}>
                          {formatNumber(gudangStockDisplay)} {getUnitWarehouse(p)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${displayStock === 0 ? 'badge-red' : p.is_low_stock ? 'badge-yellow' : 'badge-green'}`}>
                          {displayStock === 0 && <AlertTriangle size={11} />}
                          {formatNumber(displayStock)} {getUnitRack(p)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.is_active ? 'badge-green' : 'badge-gray'}`}>
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setShowFillRack(p.id)} className="btn-icon text-emerald-600 hover:bg-emerald-50" title="Isi Rak Display">
                            <ArrowRightLeft size={15} />
                          </button>
                          <button onClick={() => setShowAddStock(p.id)} className="btn-icon text-blue-600 hover:bg-blue-50" title="Isi Stok Gudang">
                            <Package size={15} />
                          </button>
                          <Link to={`/products/${p.id}/edit`} className="btn-icon"><Edit2 size={15} /></Link>
                          <button onClick={() => setDeleteId(p.id)} className="btn-icon text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            {data?.data.length === 0 && <EmptyState title="Tidak ada produk" description="Tambah produk pertama Anda" action={<Link to="/products/create" className="btn-primary">+ Tambah Produk</Link>} />}
            {data && <div className="p-4 border-t border-slate-50"><Pagination data={data} onPageChange={setPage} /></div>}
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-2">
            {data?.data.length === 0 && (
              <EmptyState title="Tidak ada produk" action={<Link to="/products/create" className="btn-primary">+ Tambah Produk</Link>} />
            )}
            {data?.data.map((p: Product) => {
                    const gudangStockDisplay = getGudangStockDisplay(p)
                    const displayStock = getDisplayStock(p)
                    return (
              <div key={p.id} className="card p-3 flex items-center gap-2.5">
                <img src={p.photo_url} alt={p.name} className="w-12 h-12 object-cover rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate leading-tight">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="badge badge-blue" style={{fontSize:'10px',padding:'1px 6px'}}>{p.category?.name}</span>
                    <span className="badge badge-yellow" style={{fontSize:'10px',padding:'1px 6px'}}>
                      📦 {formatNumber(gudangStockDisplay)} {getUnitWarehouse(p)}
                    </span>
                    <span className={`badge ${displayStock === 0 ? 'badge-red' : 'badge-green'}`} style={{fontSize:'10px',padding:'1px 6px'}}>
                      🏪 {formatNumber(displayStock)} {getUnitRack(p)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-primary-600 mt-1">{formatCurrency(p.sell_price, currency)}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => setShowFillRack(p.id)} className="btn-icon w-7 h-7 text-emerald-600 hover:bg-emerald-50" title="Isi Rak Display">
                    <ArrowRightLeft size={13} />
                  </button>
                  <button onClick={() => setShowAddStock(p.id)} className="btn-icon w-7 h-7 text-blue-600 hover:bg-blue-50" title="Isi Stok Gudang">
                    <Package size={13} />
                  </button>
                  <Link to={`/products/${p.id}/edit`} className="btn-icon w-7 h-7"><Edit2 size={13} /></Link>
                  <button onClick={() => setDeleteId(p.id)} className="btn-icon w-7 h-7 text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
                </div>
              </div>
            )})}
            {data && <Pagination data={data} onPageChange={setPage} />}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId} message="Produk ini akan dihapus permanen. Yakin?"
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        onCancel={() => setDeleteId(null)} loading={deleteMut.isPending}
      />

      <Modal
        open={!!showAddStock}
        onClose={() => setShowAddStock(null)}
        title="Isi Stok Gudang"
        size="sm"
      >
        {getCurrentProduct() && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <img src={getCurrentProduct()?.photo_url} alt="" className="w-12 h-12 object-cover rounded-xl" />
              <div>
                <p className="font-semibold text-slate-800">{getCurrentProduct()?.name}</p>
                <p className="text-xs text-slate-500">
                  Stok gudang saat ini: <span className="font-bold text-amber-700">{formatNumber(getGudangStockDisplay(getCurrentProduct()!))} {getUnitWarehouse(getCurrentProduct()!)}</span>
                  <span className="text-slate-400 ml-1">({formatNumber(getGudangStockPcs(getCurrentProduct()!))} {getUnitRack(getCurrentProduct()!)})</span>
                </p>
              </div>
            </div>

            <div>
              <label className="label">Jumlah Stok Ditambahkan</label>
              <div className="relative">
                <input
                  type="text"
                  value={addStockQty}
                  onChange={(e) => {
                    let newValue = e.target.value.replace(/[^0-9]/g, '')
                    if (newValue.length > 1 && newValue.startsWith('0')) {
                      newValue = newValue.replace(/^0+/, '')
                    }
                    setAddStockQty(newValue)
                  }}
                  className="input pr-16"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{getUnitWarehouse(getCurrentProduct()!)}</span>
              </div>
            </div>

            <div>
              <label className="label">Catatan (Opsional)</label>
              <textarea
                value={addStockNote}
                onChange={(e) => setAddStockNote(e.target.value)}
                placeholder="Contoh: Pengembalian barang, penyesuaian stok, dll."
                className="input min-h-[80px]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddStock(null)}
                className="btn-ghost flex-1"
                disabled={addStockMut.isPending}
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!addStockQty || Number(addStockQty) <= 0) {
                    toast.error('Masukkan jumlah stok yang valid')
                    return
                  }
                  const qtyInPcs = Number(addStockQty) * getConversion(getCurrentProduct()!)
                  addStockMut.mutate({
                    product_id: showAddStock!,
                    quantity: qtyInPcs,
                    notes: addStockNote || undefined
                  })
                }}
                className="btn-primary flex-1"
                disabled={addStockMut.isPending}
              >
                {addStockMut.isPending ? <Spinner size={16} showText={false} /> : 'Simpan'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!showFillRack}
        onClose={() => setShowFillRack(null)}
        title="Isi Rak Display"
        size="sm"
      >
        {getCurrentFillRackProduct() && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <img src={getCurrentFillRackProduct()?.photo_url} alt="" className="w-12 h-12 object-cover rounded-xl" />
              <div>
                <p className="font-semibold text-slate-800">{getCurrentFillRackProduct()?.name}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Gudang: {formatNumber(getGudangStockDisplay(getCurrentFillRackProduct()!))} {getUnitWarehouse(getCurrentFillRackProduct()!)}
                    <span className="text-amber-500 ml-1">({formatNumber(getGudangStockPcs(getCurrentFillRackProduct()!))} {getUnitRack(getCurrentFillRackProduct()!)})</span>
                  </span>
                  <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Rak: {formatNumber(getDisplayStock(getCurrentFillRackProduct()!))} {getUnitRack(getCurrentFillRackProduct()!)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Pilih Satuan</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFillRackUnit('warehouse')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border ${fillRackUnit === 'warehouse' ? 'bg-primary-100 border-primary-200 text-primary-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  {getUnitWarehouse(getCurrentFillRackProduct()!)}
                </button>
                <button
                  type="button"
                  onClick={() => setFillRackUnit('rack')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border ${fillRackUnit === 'rack' ? 'bg-primary-100 border-primary-200 text-primary-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  {getUnitRack(getCurrentFillRackProduct()!)}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Jumlah Stok Dipindahkan</label>
              <div className="relative">
                <input
                  type="text"
                  value={fillRackQty}
                  onChange={(e) => {
                    let newValue = e.target.value.replace(/[^0-9]/g, '')
                    if (newValue.length > 1 && newValue.startsWith('0')) {
                      newValue = newValue.replace(/^0+/, '')
                    }
                    setFillRackQty(newValue)
                  }}
                  className="input pr-16"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  {fillRackUnit === 'warehouse' ? getUnitWarehouse(getCurrentFillRackProduct()!) : getUnitRack(getCurrentFillRackProduct()!)}
                </span>
              </div>
            </div>

            <div>
              <label className="label">Catatan (Opsional)</label>
              <textarea
                value={fillRackNote}
                onChange={(e) => setFillRackNote(e.target.value)}
                placeholder="Contoh: Pengisian rak, restock, dll."
                className="input min-h-[80px]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowFillRack(null)}
                className="btn-ghost flex-1"
                disabled={fillRackMut.isPending}
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!fillRackQty || Number(fillRackQty) <= 0) {
                    toast.error('Masukkan jumlah stok yang valid')
                    return
                  }
                  
                  const product = getCurrentFillRackProduct()!
                  const warehouseLocation = getWarehouseLocation()
                  const displayLocation = getDisplayLocation()
                  
                  if (!warehouseLocation || !displayLocation) {
                    toast.error('Lokasi gudang atau rak tidak ditemukan')
                    return
                  }

                  let qtyToTransfer = Number(fillRackQty)
                  
                  if (fillRackUnit === 'warehouse') {
                    // Jika memilih satuan gudang, kalikan dengan konversi
                    qtyToTransfer = qtyToTransfer * getConversion(product)
                  }

                  const gudangStockPcs = getGudangStockPcs(product)
                  if (qtyToTransfer > gudangStockPcs) {
                    toast.error(`Stok di gudang tidak mencukupi (hanya tersedia ${formatNumber(gudangStockPcs)} ${getUnitRack(product)} / ${formatNumber(getGudangStockDisplay(product))} ${getUnitWarehouse(product)})`)
                    return
                  }

                  fillRackMut.mutate({
                    from_location_id: warehouseLocation.id,
                    to_location_id: displayLocation.id,
                    product_id: product.id,
                    quantity: qtyToTransfer,
                    notes: fillRackNote || undefined
                  })
                }}
                className="btn-primary flex-1"
                disabled={fillRackMut.isPending}
              >
                {fillRackMut.isPending ? <Spinner size={16} showText={false} /> : 'Pindahkan'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
