import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, Minus, Trash2, ShoppingBag,
  User, ChevronDown, Scan, X, CreditCard,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getProducts, searchByBarcode } from '@/api/products'
import { getCustomers, createSale } from '@/api'
import { useCartStore } from '@/store/cartStore'
import { useSettingStore } from '@/store/settingStore'
import { formatCurrency, cn } from '@/lib/utils'
import { Product } from '@/types'
import ReceiptModal from './ReceiptModal'
import SmartScanner from '@/components/ui/SmartScanner'

export default function PosPage() {
  const [search, setSearch]             = useState('')
  const [lastSale, setLastSale]         = useState<any>(null)
  const [showReceipt, setShowReceipt]   = useState(false)
  const [showCartSheet, setShowCartSheet] = useState(false)
  const [showScanner, setShowScanner]   = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const cart     = useCartStore()
  const currency = useSettingStore((s) => s.currency())
  const taxRate  = useSettingStore((s) => s.taxRate())
  const qc       = useQueryClient()

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['pos-products', search],
    queryFn: () => getProducts({ search, per_page: 60, is_active: true }).then(r => r.data),
    staleTime: 1000 * 60 * 2,
  })

  const { data: customers } = useQuery({
    queryKey: ['customers-pos'],
    queryFn: () => getCustomers({ per_page: 200, is_active: true }).then(r => r.data),
  })

  // USB/BT barcode scanner hardware listener
  const barcodeBuffer = useRef('')
  const barcodeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleBarcodeLookup = async (code: string) => {
    try {
      const res = await searchByBarcode(code)
      if (res.data) {
        cart.addItem(res.data)
        setSearch('')
        setShowScanner(false)
        toast.success(`✓ ${res.data.name}`, { duration: 1500, icon: '📦' })
      }
    } catch {
      toast.error(`Barcode "${code}" tidak ditemukan`, { duration: 2000 })
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length >= 4) handleBarcodeLookup(barcodeBuffer.current)
        barcodeBuffer.current = ''
        return
      }
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current)
        barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = '' }, 200)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listener pasang sekali; handler stabil via ref cart
  }, [])

  const saleMut = useMutation({
    mutationFn: createSale,
    onSuccess: (r) => {
      setLastSale(r.data)
      setShowReceipt(true)
      setShowCartSheet(false)
      cart.clearCart()
      qc.invalidateQueries({ queryKey: ['pos-products'] })
      toast.success('Transaksi berhasil!')
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  const subtotal   = cart.subtotal()
  const taxAmt     = subtotal * (Number(taxRate) || 0) / 100
  const grand      = cart.grandTotal(Number(taxRate) || 0)
  const change     = cart.paymentMethod === 'cash' ? Math.max(0, (Number(cart.paidAmount) || 0) - grand) : 0
  const totalItems = cart.items.reduce((s, i) => s + i.quantity, 0)

  const handleCheckout = () => {
    if (cart.items.length === 0) return
    saleMut.mutate({
      items: cart.items.map(i => ({
        product_id: i.product.id,
        quantity:   i.quantity,
        discount:   i.discount,
      })),
      customer_id:     cart.customerId,
      payment_method:  cart.paymentMethod,
      paid_amount:     cart.paymentMethod === 'cash' ? cart.paidAmount : grand,
      discount_amount: cart.discountAmount,
      tax_rate:        taxRate,
    })
  }

  const addProduct = (product: Product) => {
    cart.addItem(product)
    // Di mobile: tampilkan mini bar tapi jangan auto buka sheet
    toast.success(`✓ ${product.name}`, { duration: 800, icon: '🛒' })
  }

  // ── Shared: Desktop Cart Panel
  const CartPanel = () => (
    <div className="flex flex-col h-full bg-white lg:rounded-3xl lg:shadow-soft lg:border lg:border-slate-100">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-primary-600" />
          <span className="font-bold text-slate-700 text-sm">Keranjang</span>
        </div>
        {totalItems > 0 && (
          <div className="flex items-center gap-2">
            <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full">{totalItems} item</span>
            <button onClick={() => cart.clearCart()} className="text-slate-300 hover:text-red-500 transition-colors" title="Kosongkan">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Customer */}
      <div className="px-4 py-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <User size={13} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pelanggan</span>
        </div>
        <div className="relative">
          <select className="input text-sm pr-8 appearance-none"
            value={cart.customerId ?? ''}
            onChange={e => cart.setCustomer(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Umum / Tanpa Pelanggan</option>
            {customers?.data.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 py-8">
            <ShoppingBag size={36} className="mb-2" />
            <p className="text-sm font-medium">Keranjang kosong</p>
          </div>
        ) : cart.items.map(item => (
          <div key={item.product.id} className="bg-slate-50 rounded-2xl p-3">
            <div className="flex justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-slate-700 flex-1 line-clamp-2 leading-tight">{item.product.name}</p>
              <button onClick={() => cart.removeItem(item.product.id)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => cart.updateQty(item.product.id, item.quantity - 1)}
                  className="w-7 h-7 bg-white rounded-xl border border-slate-200 flex items-center justify-center hover:border-primary-400 transition-all">
                  <Minus size={12} />
                </button>
                <span className="text-sm font-bold w-7 text-center">{item.quantity}</span>
                <button onClick={() => cart.updateQty(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                  className="w-7 h-7 bg-white rounded-xl border border-slate-200 flex items-center justify-center hover:border-primary-400 transition-all disabled:opacity-40">
                  <Plus size={12} />
                </button>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-primary-600">{formatCurrency(item.subtotal, currency)}</span>
                <p className="text-xs text-slate-400">{formatCurrency(Number(item.product.sell_price), currency)}/{item.product.unit}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment */}
      <div className="border-t border-slate-100 p-4 space-y-3 shrink-0">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span></div>
          {taxRate > 0 && <div className="flex justify-between text-slate-500"><span>Pajak ({taxRate}%)</span><span>{formatCurrency(taxAmt, currency)}</span></div>}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-100">
            <span className="text-slate-800">Total</span>
            <span className="text-primary-600">{formatCurrency(grand, currency)}</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {(['cash','qris','transfer','debt'] as const).map(m => (
            <button key={m} onClick={() => cart.setPaymentMethod(m)}
              className={cn('py-2 rounded-xl text-xs font-bold transition-all',
                cart.paymentMethod === m ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>
              {m === 'cash' ? 'Tunai' : m === 'transfer' ? 'TF' : m === 'debt' ? 'Hutang' : 'QRIS'}
            </button>
          ))}
        </div>
        {cart.paymentMethod === 'cash' && (
          <div>
            <label className="label">Uang Diterima</label>
            <input type="number" className="input" value={cart.paidAmount || ''}
              onChange={e => cart.setPaidAmount(Number(e.target.value))}
              placeholder={String(Math.ceil(grand))} />
            {cart.paidAmount >= grand && grand > 0 && (
              <p className="text-xs font-bold text-emerald-600 mt-1.5">Kembalian: {formatCurrency(change, currency)}</p>
            )}
          </div>
        )}
        <button onClick={handleCheckout} disabled={cart.items.length === 0 || saleMut.isPending} className="btn-primary w-full py-3.5 text-base">
          {saleMut.isPending
            ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</span>
            : `Bayar ${formatCurrency(grand, currency)}`}
        </button>
      </div>
    </div>
  )

  // ── Shared: Product Grid
  const ProductGrid = ({ products }: { products: Product[] }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      {products.map(product => (
        <button key={product.id} onClick={() => addProduct(product)} disabled={product.stock === 0}
          className="card p-3 text-left hover:shadow-card-hover hover:border-primary-200 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
          <div className="aspect-square bg-slate-50 rounded-xl mb-2.5 overflow-hidden">
            <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <p className="text-xs font-semibold text-slate-700 line-clamp-2 leading-tight min-h-[2.5rem]">{product.name}</p>
          <p className="text-sm font-bold text-primary-600 mt-1.5">{formatCurrency(Number(product.sell_price), currency)}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-400">
              {product.stock === 0 ? <span className="text-red-500 font-medium">Habis</span> : `${product.stock} ${product.unit}`}
            </p>
            {product.is_low_stock && product.stock > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-lg font-semibold">Tipis</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )

  const products = productsData?.data ?? []

  return (
    <>
      {/* ══════════════════════════════════════════
          DESKTOP LAYOUT
      ══════════════════════════════════════════ */}
      <div className="hidden lg:flex gap-4 h-[calc(100vh-7rem)]">
        {/* Left: Products */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input ref={searchRef} type="text" className="input pl-10 w-full"
                placeholder="Cari nama produk... (Enter untuk cari barcode)"
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && search.length >= 4) handleBarcodeLookup(search) }}
                autoFocus />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
            </div>
            <button onClick={() => setShowScanner(true)}
              className="px-4 rounded-xl flex items-center gap-2 text-sm font-semibold border bg-white text-slate-600 border-slate-200 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-all"
              title="Buka kamera untuk scan barcode">
              <Scan size={18} /><span className="hidden xl:inline">Scan Kamera</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {productsLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300">
                <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
                <p className="text-sm">Memuat produk...</p>
              </div>
            ) : <ProductGrid products={products} />}
          </div>
          {!productsLoading && products.length > 0 && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              {search ? `${products.length} hasil` : `${products.length} produk tersedia`}
            </p>
          )}
        </div>
        {/* Right: Cart */}
        <div className="w-72 xl:w-80 flex flex-col shrink-0"><CartPanel /></div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE LAYOUT
      ══════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
        {/* Search bar */}
        <div className="flex gap-2 mb-3 shrink-0">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" className="input pl-10 w-full"
              placeholder="Cari produk..."
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && search.length >= 4) handleBarcodeLookup(search) }} />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={14} /></button>}
          </div>
          <button onClick={() => setShowScanner(true)}
            className="w-11 h-11 rounded-xl flex items-center justify-center border bg-white text-slate-500 border-slate-200 hover:bg-primary-50 hover:text-primary-700 transition-all shrink-0">
            <Scan size={18} />
          </button>
        </div>

        {/* Product grid — full screen, bottom padding agar tidak tertutup mini bar */}
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: totalItems > 0 ? '160px' : '100px' }}>
          {productsLoading ? (
            <div className="flex items-center justify-center h-40 gap-3 text-slate-400">
              <div className="w-6 h-6 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
              <span className="text-sm">Memuat...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-300 gap-2">
              <Search size={32} /><p className="text-sm">Tidak ada produk</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map(product => (
                <button key={product.id} onClick={() => addProduct(product)} disabled={product.stock === 0}
                  className="card p-3 text-left hover:border-primary-200 active:scale-95 transition-all disabled:opacity-50">
                  <div className="aspect-square bg-slate-50 rounded-xl mb-2 overflow-hidden">
                    <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 line-clamp-2 leading-tight min-h-[2rem]">{product.name}</p>
                  <p className="text-sm font-bold text-primary-600 mt-1">{formatCurrency(Number(product.sell_price), currency)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {product.stock === 0 ? <span className="text-red-500">Habis</span> : `${product.stock} ${product.unit}`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE: MINI CART BAR (di atas bottom nav)
          Seperti Kopi Kenangan — banner merah dengan
          harga + tombol arrow
      ══════════════════════════════════════════ */}
      {totalItems > 0 && (
        <div className="lg:hidden fixed bottom-[88px] left-0 right-0 z-30 px-4">
          <button
            onClick={() => setShowCartSheet(true)}
            className="w-full bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-500/25 px-5 py-4 flex items-center gap-4 active:scale-[0.98] transition-all"
          >
            {/* Left: item count + price */}
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-primary-200 leading-tight">
                {totalItems} produk
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-lg font-extrabold leading-tight">
                  {formatCurrency(grand, currency)}
                </span>
                {/* harga subtotal sebelum diskon/pajak (strikethrough) kalau berbeda */}
                {subtotal !== grand && subtotal > 0 && (
                  <span className="text-sm text-primary-300 line-through font-medium">
                    {new Intl.NumberFormat('id-ID').format(Math.round(subtotal))}
                  </span>
                )}
              </div>
            </div>

            {/* Right: arrow button */}
            <div className="w-11 h-11 rounded-full border-2 border-white/40 flex items-center justify-center shrink-0 bg-white/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MOBILE: CART SHEET (slide up dari bawah)
      ══════════════════════════════════════════ */}
      {showCartSheet && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCartSheet(false)} />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh]">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-primary-600" />
                <span className="font-bold text-slate-800 text-sm">Keranjang</span>
                <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">{totalItems}</span>
              </div>
              <div className="flex items-center gap-2">
                {totalItems > 0 && (
                  <button onClick={() => { cart.clearCart(); setShowCartSheet(false) }}
                    className="text-xs text-red-500 font-semibold hover:underline">Hapus semua</button>
                )}
                <button onClick={() => setShowCartSheet(false)} className="btn-icon w-8 h-8">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Customer select */}
            <div className="px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 mb-1.5">
                <User size={13} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pelanggan</span>
              </div>
              <div className="relative">
                <select className="input text-sm pr-8 appearance-none"
                  value={cart.customerId ?? ''}
                  onChange={e => cart.setCustomer(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Umum / Tanpa Pelanggan</option>
                  {customers?.data.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Cart items — scrollable */}
            <div className="overflow-y-auto px-4 py-3 space-y-2 flex-1">
              {cart.items.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3">
                  {/* Product image */}
                  <img src={item.product.photo_url} alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-xl shrink-0 bg-white" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-primary-600 font-bold">{formatCurrency(Number(item.product.sell_price), currency)}</p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => cart.updateQty(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 bg-white rounded-xl border border-slate-200 flex items-center justify-center hover:border-primary-400 transition-all">
                      <Minus size={13} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => cart.updateQty(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="w-8 h-8 bg-white rounded-xl border border-slate-200 flex items-center justify-center hover:border-primary-400 transition-all disabled:opacity-40">
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right shrink-0 min-w-[64px]">
                    <p className="text-sm font-bold text-slate-800">{formatCurrency(item.subtotal, currency)}</p>
                    <button onClick={() => cart.removeItem(item.product.id)} className="text-slate-300 hover:text-red-500 mt-0.5">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment summary + checkout */}
            <div className="px-5 pt-3 pb-6 border-t border-slate-100 space-y-3 shrink-0">
              {/* Totals */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span></div>
                {taxRate > 0 && <div className="flex justify-between text-slate-500"><span>Pajak ({taxRate}%)</span><span>{formatCurrency(taxAmt, currency)}</span></div>}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-100">
                  <span className="text-slate-800">Total</span>
                  <span className="text-primary-600">{formatCurrency(grand, currency)}</span>
                </div>
              </div>

              {/* Payment method */}
              <div className="grid grid-cols-4 gap-2">
                {(['cash','qris','transfer','debt'] as const).map(m => (
                  <button key={m} onClick={() => cart.setPaymentMethod(m)}
                    className={cn('py-2.5 rounded-xl text-xs font-bold transition-all',
                      cart.paymentMethod === m ? 'bg-primary-600 text-white shadow-sm shadow-primary-200' : 'bg-slate-100 text-slate-500')}>
                    {m === 'cash' ? 'Tunai' : m === 'transfer' ? 'TF' : m === 'debt' ? 'Hutang' : 'QRIS'}
                  </button>
                ))}
              </div>

              {/* Cash input */}
              {cart.paymentMethod === 'cash' && (
                <div>
                  <label className="label">Uang Diterima</label>
                  <input type="number" className="input" value={cart.paidAmount || ''}
                    onChange={e => cart.setPaidAmount(Number(e.target.value))}
                    placeholder={String(Math.ceil(grand))} />
                  {cart.paidAmount >= grand && grand > 0 && (
                    <p className="text-xs font-bold text-emerald-600 mt-1.5">Kembalian: {formatCurrency(change, currency)}</p>
                  )}
                </div>
              )}

              {/* Checkout button */}
              <button onClick={handleCheckout} disabled={cart.items.length === 0 || saleMut.isPending}
                className="btn-primary w-full py-4 text-base">
                <CreditCard size={18} />
                {saleMut.isPending
                  ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</span>
                  : `Bayar ${formatCurrency(grand, currency)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Scanner */}
      {showScanner && (
        <SmartScanner
          title="Smart Scanner"
          onDetected={handleBarcodeLookup}
          onProductMatched={addProduct}
          products={products}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Receipt */}
      {lastSale && <ReceiptModal open={showReceipt} onClose={() => setShowReceipt(false)} sale={lastSale} />}
    </>
  )
}
