import { useState, useEffect, FormEvent, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Scan, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '@/components/ui/Spinner'
import { getProduct, createProduct, updateProduct, checkProductIdentity, getProducts } from '@/api/products'
import { getCategories, getSuppliers, stockAdjust } from '@/api'
import SmartScanner from '@/components/ui/SmartScanner'
import { Product, ProductStock } from '@/types'

const UNITS = ['pcs', 'kg', 'gram', 'liter', 'ml', 'dus', 'lusin', 'karton', 'pak', 'botol', 'kaleng', 'bungkus', 'galon', 'sachet']

const Field = ({
  label, name, errors, required, children,
}: { label: string; name: string; errors: Record<string, string>; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="label">
      {label} {required && <span className="text-red-500 normal-case font-normal">*</span>}
    </label>
    {children}
    {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
  </div>
)

export default function ProductFormPage() {
  const { id }   = useParams()
  const isEdit   = !!id
  const navigate = useNavigate()
  const qc       = useQueryClient()

  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', category_id: '', supplier_id: '',
    buy_price: '', sell_price: '', min_stock: '5',
    unit: 'pcs', unit_warehouse: 'pcs', unit_conversion: '1',
    description: '', is_active: true,
  })
  const [photo, setPhoto]           = useState<File | null>(null)
  const [preview, setPreview]       = useState<string>('')
  const [removePhoto, setRemovePhoto] = useState(false)
  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [skuLoading, setSkuLoading] = useState(false)
  const [identityInput, setIdentityInput] = useState({ sku: '', barcode: '' })
  const objectUrlRef = useRef<string | null>(null)

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(Number(id)).then(r => {
      console.log('Product data:', r.data);
      return r.data;
    }),
    enabled: isEdit,
  })

  const { data: cats }  = useQuery({
    queryKey: ['cats-all'],
    queryFn: () => getCategories({ per_page: 100, is_active: true }).then(r => r.data),
  })
  const { data: supps } = useQuery({
    queryKey: ['supps-all'],
    queryFn: () => getSuppliers({ per_page: 100 }).then(r => r.data),
  })
  const { data: productsData } = useQuery({
    queryKey: ['products-for-scanner'],
    queryFn: () => getProducts({ per_page: 100, is_active: true }).then(r => r.data),
  })

  useEffect(() => {
    if (product) {
      setForm({
        name:        product.name,
        sku:         product.sku,
        barcode:     product.barcode ?? '',
        category_id: String(product.category_id),
        supplier_id: String(product.supplier_id ?? ''),
        buy_price:   String(product.buy_price),
        sell_price:  String(product.sell_price),
        min_stock:   String(product.min_stock),
        unit:        product.unit,
        unit_warehouse: product.unit_warehouse ?? 'pcs',
        unit_conversion: String(product.unit_conversion ?? 1),
        description: product.description ?? '',
        is_active:   product.is_active,
      })
      setPreview(product.photo_url)
      setPhoto(null)
      setRemovePhoto(false)
    }
  }, [product])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIdentityInput({
        sku: form.sku.trim().toUpperCase(),
        barcode: form.barcode.trim(),
      })
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [form.barcode, form.sku])

  const { data: identityCheck, isFetching: checkingIdentity } = useQuery({
    queryKey: ['product-identity-check', identityInput.sku, identityInput.barcode, id],
    queryFn: () => checkProductIdentity({
      sku: identityInput.sku || undefined,
      barcode: identityInput.barcode || undefined,
      ignore_id: isEdit ? Number(id) : undefined,
    }).then((r) => r.data),
    enabled: identityInput.sku.length >= 3 || identityInput.barcode.length >= 4,
    staleTime: 1000 * 30,
  })

  const mutation = useMutation({
    mutationFn: (fd: FormData) => isEdit ? updateProduct(Number(id), fd) : createProduct(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'], exact: false })
      if (isEdit && id) {
        qc.invalidateQueries({ queryKey: ['product', id] })
      }
      toast.success(isEdit ? 'Produk diperbarui.' : 'Produk ditambahkan.')
      navigate('/products')
    },
    onError: (e: any) => {
      if (e.response?.data?.errors) setErrors(e.response.data.errors)
      else toast.error(e.response?.data?.message ?? 'Gagal menyimpan.')
    },
  })

  const stockAdjustMut = useMutation({
    mutationFn: (data: { product_id: number; location_id: number; new_quantity: number; notes?: string }) => stockAdjust(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product', id] })
      qc.invalidateQueries({ queryKey: ['products'], exact: false })
      qc.invalidateQueries({ queryKey: ['products-all'] })
      qc.invalidateQueries({ queryKey: ['products-for-scanner'] })
      qc.invalidateQueries({ queryKey: ['pos-products'], exact: false })
      toast.success('Stok berhasil diperbarui.')
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? 'Gagal memperbarui stok.')
    },
  })

  const [stockEdit, setStockEdit] = useState<{ [key: number]: { value: string; isEditing: boolean } }>({})

  // Helper functions
  const getProductStocks = () => {
    if (!product) return []
    const stocks = product.productStocks || product.product_stocks || []
    return stocks.map((s: any) => ({
      ...s,
      location: s.location || (s.location_id ? { id: s.location_id, type: s.location_type, name: s.location_name } : null)
    }))
  }

  const getUnitWarehouse = () => product?.unit_warehouse || product?.unit || 'pcs'
  const getUnitRack = () => product?.unit || 'pcs'
  const getConversion = () => Number(product?.unit_conversion) || 1

  // Mendapatkan stok dalam satuan lokasi (gudang dalam unit gudang, rak dalam unit rak)
  const getStockForDisplay = (stockItem: any) => {
    const locationType = stockItem.location?.type
    if (locationType === 'warehouse') {
      const conversion = getConversion()
      return Math.floor(stockItem.stock / conversion)
    }
    return stockItem.stock
  }

  // Mendapatkan unit untuk display
  const getUnitForDisplay = (stockItem: any) => {
    const locationType = stockItem.location?.type
    if (locationType === 'warehouse') {
      return getUnitWarehouse()
    }
    return getUnitRack()
  }

  // Menkonversi input user ke pcs untuk backend
  const convertToPcs = (value: number, stockItem: any) => {
    const locationType = stockItem.location?.type
    if (locationType === 'warehouse') {
      const conversion = getConversion()
      return value * conversion
    }
    return value
  }

  const startEditStock = (stock: ProductStock) => {
    const currentDisplayValue = getStockForDisplay(stock)
    setStockEdit(prev => ({
      ...prev,
      [stock.location_id]: { value: String(currentDisplayValue), isEditing: true }
    }))
  }

  const cancelEditStock = (locationId: number) => {
    setStockEdit(prev => {
      const newPrev = { ...prev }
      delete newPrev[locationId]
      return newPrev
    })
  }

  const saveStockEdit = (stock: ProductStock) => {
    const editState = stockEdit[stock.location_id]
    if (!editState) return
    if (!product?.id) return
    
    const numValue = Number(editState.value)
    if (isNaN(numValue) || numValue < 0) {
      toast.error('Masukkan jumlah stok yang valid')
      return
    }

    const qtyInPcs = convertToPcs(numValue, stock)
    
    stockAdjustMut.mutate({
      product_id: product.id,
      location_id: stock.location_id,
      new_quantity: qtyInPcs,
      notes: 'Penyesuaian stok manual'
    })
    cancelEditStock(stock.location_id)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (Number(form.buy_price) > Number(form.sell_price)) {
      toast.error('Harga jual tidak boleh lebih kecil dari harga beli.')
      return
    }

    if (identityCheck?.sku.exists) {
      toast.error('SKU sudah dipakai produk lain.')
      return
    }

    if (identityCheck?.barcode.exists) {
      toast.error('Barcode sudah dipakai produk lain.')
      return
    }

    const fd = new FormData()
    fd.append('name', form.name.trim())
    fd.append('sku', form.sku.trim().toUpperCase())
    fd.append('barcode', form.barcode.trim())
    fd.append('category_id', form.category_id)
    fd.append('buy_price', form.buy_price)
    fd.append('sell_price', form.sell_price)
    fd.append('min_stock', form.min_stock)
    fd.append('unit', form.unit)
    fd.append('unit_warehouse', form.unit_warehouse)
    fd.append('unit_conversion', form.unit_conversion)
    fd.append('description', form.description.trim())
    fd.append('is_active', form.is_active ? '1' : '0')

    if (form.supplier_id) fd.append('supplier_id', form.supplier_id)
    if (photo) fd.append('photo', photo)
    if (removePhoto) fd.append('remove_photo', '1')
    if (isEdit) fd.append('_method', 'PUT')
    mutation.mutate(fd)
  }

  // Generate SKU otomatis
  const generateSku = () => {
    setSkuLoading(true)
    const prefix = form.name
      ? form.name.substring(0, 3).toUpperCase().replace(/\s/g, '')
      : 'SKU'
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    setTimeout(() => {
      updateField('sku', `${prefix}-${random}`)
      setSkuLoading(false)
    }, 300)
  }

  const calculateEan13CheckDigit = (value: string) => {
    const digits = value.split('').map(Number)
    const total = digits.reduce((sum, digit, index) => sum + digit * (index % 2 === 0 ? 1 : 3), 0)
    return (10 - (total % 10)) % 10
  }

  const generateBarcode = () => {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const base12 = `20${timestamp}${random}`.slice(0, 12)
    const checkDigit = calculateEan13CheckDigit(base12)
    updateField('barcode', `${base12}${checkDigit}`)
  }

  // Saat barcode terdeteksi dari scanner kamera
  const handleBarcodeDetected = (code: string) => {
    updateField('barcode', code.trim())
    setShowBarcodeScanner(false)
    toast.success(`Barcode diisi: ${code}`, { icon: '📷' })
  }

  const updateField = (name: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handlePhotoChange = (file?: File | null) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('File foto harus berupa gambar.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2MB.')
      return
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const nextPreview = URL.createObjectURL(file)
    objectUrlRef.current = nextPreview

    setPhoto(file)
    setPreview(nextPreview)
    setRemovePhoto(false)
    setErrors((prev) => ({ ...prev, photo: '' }))
  }

  const handleRemovePhoto = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    setPhoto(null)
    setPreview('')
    setRemovePhoto(!!(isEdit && product?.photo))
  }

  const buyPrice = Number(form.buy_price || 0)
  const sellPrice = Number(form.sell_price || 0)
  const marginValue = sellPrice - buyPrice
  const marginPercent = buyPrice > 0 ? (marginValue / buyPrice) * 100 : 0
  const hasNegativeMargin = buyPrice > 0 && sellPrice < buyPrice
  const skuConflict = Boolean(identityCheck?.sku.exists && identityInput.sku)
  const barcodeConflict = Boolean(identityCheck?.barcode.exists && identityInput.barcode)
  const canSubmit = !mutation.isPending && !hasNegativeMargin && !skuConflict && !barcodeConflict

  return (
    <div>
      {/* Back */}
      <div className="mb-5">
        <Link to="/products" className="btn-ghost text-sm gap-1.5 inline-flex">
          <ArrowLeft size={16} /> Kembali ke Produk
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left: Main info ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Informasi Produk */}
            <div className="card">
              <h2 className="text-sm font-bold text-slate-700 mb-4">Informasi Produk</h2>
              <div className="space-y-4">
                <Field label="Nama Produk" name="name" errors={errors} required>
                  <input
                    className="input"
                    value={form.name}
                    onChange={e => updateField('name', e.target.value)}
                    placeholder="Contoh: Indomie Goreng Original"
                    required
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SKU dengan tombol generate */}
                  <Field label="SKU" name="sku" errors={errors}>
                    <div className="flex gap-2">
                      <input
                        className="input flex-1"
                        value={form.sku}
                        onChange={e => updateField('sku', e.target.value.toUpperCase())}
                        placeholder="Auto-generate"
                        autoCapitalize="characters"
                      />
                      <button
                        type="button"
                        onClick={generateSku}
                        className="btn-secondary px-3 shrink-0"
                        title="Generate SKU otomatis"
                      >
                        <RefreshCw size={15} className={skuLoading ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    <p className="text-xs mt-1 text-slate-400">
                      {checkingIdentity && identityInput.sku === form.sku.trim().toUpperCase()
                        ? 'Cek SKU...'
                        : skuConflict
                          ? `SKU sudah dipakai: ${identityCheck?.sku.product?.name}`
                          : form.sku.trim().length >= 3
                            ? 'SKU siap dipakai'
                            : 'Minimal 3 karakter agar mudah dicari'}
                    </p>
                  </Field>

                  {/* Barcode dengan tombol scan kamera */}
                  <Field label="Barcode" name="barcode" errors={errors}>
                    <div className="flex gap-2">
                      <input
                        className="input flex-1"
                        value={form.barcode}
                        onChange={e => updateField('barcode', e.target.value.trim())}
                        placeholder="Scan atau ketik manual"
                        inputMode="numeric"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                      <button
                        type="button"
                        onClick={generateBarcode}
                        className="btn-secondary px-3 shrink-0"
                        title="Generate barcode otomatis"
                      >
                        <RefreshCw size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBarcodeScanner(true)}
                        className="btn-secondary px-3 shrink-0 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700"
                        title="Buka kamera untuk scan barcode"
                      >
                        <Scan size={15} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Klik ikon kamera untuk scan via kamera, atau ketik langsung
                    </p>
                    <p className={`text-xs mt-1 ${barcodeConflict ? 'text-red-500' : 'text-slate-400'}`}>
                      {checkingIdentity && identityInput.barcode === form.barcode.trim()
                        ? 'Cek barcode...'
                        : barcodeConflict
                          ? `Barcode sudah dipakai: ${identityCheck?.barcode.product?.name}`
                          : form.barcode.trim().length >= 4
                            ? 'Barcode unik dan bisa dipakai untuk scan'
                            : 'Boleh kosong, tapi idealnya isi barcode unik per produk'}
                    </p>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Kategori" name="category_id" errors={errors} required>
                    <select
                      className="input"
                      value={form.category_id}
                      onChange={e => updateField('category_id', e.target.value)}
                      required
                    >
                      <option value="">Pilih kategori</option>
                      {cats?.data.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Supplier" name="supplier_id" errors={errors}>
                    <select
                      className="input"
                      value={form.supplier_id}
                      onChange={e => updateField('supplier_id', e.target.value)}
                    >
                      <option value="">Pilih supplier (opsional)</option>
                      {supps?.data.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Deskripsi" name="description" errors={errors}>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    value={form.description}
                    onChange={e => updateField('description', e.target.value)}
                    placeholder="Deskripsi produk (opsional)"
                  />
                </Field>
              </div>
            </div>

            {/* Harga & Satuan */}
            <div className="card">
              <h2 className="text-sm font-bold text-slate-700 mb-4">Harga & Satuan</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Harga Beli" name="buy_price" errors={errors} required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                    <input
                      type="number"
                      className="input pl-9"
                      min="0"
                      value={form.buy_price}
                      onChange={e => updateField('buy_price', e.target.value)}
                      required
                    />
                  </div>
                </Field>

                <Field label="Harga Jual" name="sell_price" errors={errors} required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                    <input
                      type="number"
                      className="input pl-9"
                      min="0"
                      value={form.sell_price}
                      onChange={e => updateField('sell_price', e.target.value)}
                      required
                    />
                  </div>
                </Field>

                {/* Margin info */}
                {form.buy_price && form.sell_price && buyPrice > 0 && (
                  <div className={`col-span-2 rounded-xl px-4 py-2.5 flex items-center justify-between ${hasNegativeMargin ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    <span className={`text-xs font-medium ${hasNegativeMargin ? 'text-red-700' : 'text-emerald-700'}`}>
                      {hasNegativeMargin ? 'Margin minus' : 'Margin keuntungan'}
                    </span>
                    <span className={`text-sm font-bold ${hasNegativeMargin ? 'text-red-700' : 'text-emerald-700'}`}>
                      Rp {marginValue.toLocaleString('id')}
                      {' '}
                      <span className="text-xs font-normal">
                        ({marginPercent.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                )}

                <Field label="Satuan Gudang" name="unit_warehouse" errors={errors} required>
                  <select
                    className="input"
                    value={form.unit_warehouse}
                    onChange={e => updateField('unit_warehouse', e.target.value)}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>

                <Field label="Satuan Rak Display" name="unit" errors={errors} required>
                  <select
                    className="input"
                    value={form.unit}
                    onChange={e => updateField('unit', e.target.value)}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>

                <div className="col-span-2">
                  <label className="label">
                    Konversi Satuan Gudang ke Rak
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">1</span>
                    <span className="text-sm font-medium text-slate-700">{form.unit_warehouse}</span>
                    <span className="text-sm text-slate-500">=</span>
                    <input
                      type="number"
                      min="1"
                      value={form.unit_conversion}
                      onChange={e => updateField('unit_conversion', e.target.value)}
                      className="input w-24"
                    />
                    <span className="text-sm font-medium text-slate-700">{form.unit}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Contoh: 1 dus = 40 pcs
                  </p>
                </div>

                <Field label="Stok Minimal (Rak)" name="min_stock" errors={errors}>
                  <div>
                    <input
                      type="number"
                      className="input"
                      min="0"
                      value={form.min_stock}
                      onChange={e => updateField('min_stock', e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-1">Alert muncul jika stok ≤ nilai ini</p>
                  </div>
                </Field>
              </div>
            </div>

            {/* Stok Saat Ini */}
            {isEdit && product && (
              <div className="card">
                <h2 className="text-sm font-bold text-slate-700 mb-4">Stok Saat Ini</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getProductStocks().map((stock) => {
                    const isEditing = stockEdit[stock.location_id]?.isEditing
                    const editValue = stockEdit[stock.location_id]?.value ?? String(getStockForDisplay(stock))
                    const locationName = stock.location?.name || (stock.location?.type === 'warehouse' ? 'Gudang' : 'Rak Display')
                    const locationType = stock.location?.type === 'warehouse' ? 'warehouse' : 'display'
                    const unit = getUnitForDisplay(stock)
                    const colorClass = locationType === 'warehouse' ? 'amber' : 'emerald'

                    return (
                      <div key={stock.location_id} className={`bg-${colorClass}-50 border border-${colorClass}-200 rounded-xl p-4`}>
                        <p className={`text-xs text-${colorClass}-700 mb-2`}>{locationName}</p>
                        
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => {
                                  // Hanya izinkan angka dan hapus awalan 0
                                  let newValue = e.target.value.replace(/[^0-9]/g, '')
                                  if (newValue.length > 1 && newValue.startsWith('0')) {
                                    newValue = newValue.replace(/^0+/, '')
                                  }
                                  setStockEdit(prev => ({
                                    ...prev,
                                    [stock.location_id]: { ...prev[stock.location_id], value: newValue }
                                  }))
                                }}
                                className={`input flex-1 bg-white`}
                              />
                              <span className={`text-sm font-medium text-${colorClass}-700`}>{unit}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => cancelEditStock(stock.location_id)}
                                className="btn-ghost flex-1 text-sm py-2"
                                disabled={stockAdjustMut.isPending}
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => saveStockEdit(stock)}
                                className={`btn-primary flex-1 text-sm py-2 bg-${colorClass}-600 hover:bg-${colorClass}-700`}
                                disabled={stockAdjustMut.isPending}
                              >
                                {stockAdjustMut.isPending ? <Spinner size={16} showText={false} /> : 'Simpan'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-xl font-bold text-${colorClass}-900`}>
                                {getStockForDisplay(stock)} <span className="text-sm font-normal">{unit}</span>
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                ({stock.stock} {getUnitRack()})
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => startEditStock(stock)}
                              className={`btn-secondary text-sm py-1.5 px-3 bg-${colorClass}-100 hover:bg-${colorClass}-200 text-${colorClass}-700 border-transparent`}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  * Perubahan stok akan dicatat sebagai penyesuaian manual
                </p>
              </div>
            )}
          </div>

          {/* ── Right: Sidebar ── */}
          <div className="space-y-5">

            {/* Foto Produk */}
            <div className="card">
              <h2 className="text-sm font-bold text-slate-700 mb-3">Foto Produk</h2>
              {preview && (
                <div className="mb-3 relative group">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full aspect-square object-cover rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              )}
              <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-primary-300 hover:bg-primary-50/30 transition-colors cursor-pointer">
                <span className="text-2xl">📷</span>
                <span className="text-xs font-medium text-slate-500">Klik untuk pilih foto</span>
                <span className="text-xs text-slate-400">JPG, PNG, max 2MB</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={e => handlePhotoChange(e.target.files?.[0])}
                />
              </label>
              {errors.photo && <p className="text-xs text-red-500 mt-1">{errors.photo}</p>}
            </div>

            {/* Status */}
            <div className="card">
              <h2 className="text-sm font-bold text-slate-700 mb-3">Status</h2>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`w-11 h-6 rounded-full transition-colors relative ${form.is_active ? 'bg-primary-500' : 'bg-slate-300'}`}
                  onClick={() => updateField('is_active', !form.is_active)}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {form.is_active ? 'Produk Aktif' : 'Produk Nonaktif'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {form.is_active ? 'Tampil di POS & pencarian' : 'Tersembunyi dari POS'}
                  </p>
                </div>
              </label>
            </div>

            {/* Info barcode */}
            <div className="card bg-blue-50/50 border-blue-100">
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Scan size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-800">Cara isi Barcode</p>
                  <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                    Klik tombol <strong>ikon kamera</strong> di field barcode untuk scan via kamera HP/webcam.
                    Atau colok scanner USB dan langsung scan ke field barcode.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary w-full py-3 text-base"
            >
              <Save size={16} />
              {mutation.isPending
                ? 'Menyimpan...'
                : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'
              }
            </button>
            {hasNegativeMargin && (
              <p className="text-xs text-red-500 text-center">
                Periksa harga jual. Nilainya masih di bawah harga beli.
              </p>
            )}
            {(skuConflict || barcodeConflict) && (
              <p className="text-xs text-red-500 text-center">
                SKU dan barcode harus unik untuk setiap produk agar aman dipakai di POS.
              </p>
            )}
          </div>
        </div>
      </form>

      {/* Smart Scanner Modal */}
      {showBarcodeScanner && (
        <SmartScanner
          title="Scan Barcode Produk"
          onDetected={handleBarcodeDetected}
          onProductMatched={() => {}} // Tidak dibutuhkan di halaman form
          products={productsData?.data || []}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  )
}
