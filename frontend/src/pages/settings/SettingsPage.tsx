import { useState, useEffect, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Save, Store, Settings, FileText, Printer, Package, Users, DollarSign, Bluetooth, BluetoothConnected, BluetoothOff, RefreshCw, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSettings, updateSettings } from '@/api'
import { useSettingStore } from '@/store/settingStore'
import Spinner from '@/components/ui/Spinner'

// Import Printer Settings components & logic
import { printerManager, printerStorage, PrinterSettings as PrinterSettingsType } from '@/lib/bluetoothPrinter'
import { buildReceipt } from '@/lib/escpos'

// --- Tab Components ---

function GeneralTab() {
  const qc = useQueryClient()
  const setSettings = useSettingStore((s) => s.setSettings)

  const [form, setForm] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    tax_rate: '0',
    currency: 'Rp',
    receipt_note: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings().then((r) => r.data),
  })

  useEffect(() => {
    if (data) {
      setForm({
        store_name: data['store_name'] ?? '',
        store_address: data['store_address'] ?? '',
        store_phone: data['store_phone'] ?? '',
        tax_rate: data['tax_rate'] ?? '0',
        currency: data['currency'] ?? 'Rp',
        receipt_note: data['receipt_note'] ?? '',
      })
    }
  }, [data])

  const saveMut = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      setSettings({ ...data, ...form })
      toast.success('Pengaturan berhasil disimpan.')
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          saveMut.mutate(form)
        }}
        className="space-y-6"
      >
        {/* Info Toko */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shrink-0">
              <Store size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-700">Informasi Toko</h2>
              <p className="text-xs text-slate-400">Data yang muncul di struk</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Nama Toko *</label>
              <input
                className="input"
                value={form.store_name}
                onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))}
                placeholder="Warung Bu Tutik"
                required
              />
            </div>
            <div>
              <label className="label">Alamat</label>
              <textarea
                className="input resize-none"
                rows={2}
                value={form.store_address}
                onChange={(e) => setForm((f) => ({ ...f, store_address: e.target.value }))}
                placeholder="Jl. Contoh No. 1"
              />
            </div>
            <div>
              <label className="label">No. Telepon</label>
              <input
                type="tel"
                className="input"
                value={form.store_phone}
                onChange={(e) => setForm((f) => ({ ...f, store_phone: e.target.value }))}
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>
        </div>

        {/* Pengaturan POS */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <DollarSign size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-700">Pengaturan POS</h2>
              <p className="text-xs text-slate-400">Mata uang & pajak</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Mata Uang</label>
                <input
                  className="input"
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  placeholder="Rp"
                />
              </div>
              <div>
                <label className="label">Pajak (%)</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.tax_rate}
                  onChange={(e) => setForm((f) => ({ ...f, tax_rate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="label">Catatan Struk</label>
              <input
                className="input"
                value={form.receipt_note}
                onChange={(e) => setForm((f) => ({ ...f, receipt_note: e.target.value }))}
                placeholder="Terima kasih sudah berbelanja!"
              />
            </div>
          </div>
        </div>

        {/* Preview Struk */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center shrink-0">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-700">Preview Struk</h2>
              <p className="text-xs text-slate-400">Real-time preview</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 font-mono text-xs text-center border border-slate-100">
            <p className="font-bold text-sm">{form.store_name || '—'}</p>
            {form.store_address && <p className="text-slate-400 mt-0.5">{form.store_address}</p>}
            {form.store_phone && <p className="text-slate-400">{form.store_phone}</p>}
            <div className="border-t border-dashed border-slate-200 my-3" />
            <div className="text-left space-y-1.5 text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rp 50.000</span>
              </div>
              {Number(form.tax_rate) > 0 && (
                <div className="flex justify-between">
                  <span>Pajak {form.tax_rate}%</span>
                  <span>Rp {(50000 * Number(form.tax_rate) / 100).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-800 pt-2 border-t border-dashed border-slate-200">
                <span>TOTAL</span>
                <span>{form.currency} {(50000 * (1 + Number(form.tax_rate) / 100)).toLocaleString('id-ID')}</span>
              </div>
            </div>
            {form.receipt_note && (
              <>
                <div className="border-t border-dashed border-slate-200 my-3" />
                <p className="text-slate-400 italic">{form.receipt_note}</p>
              </>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saveMut.isPending}
          className="btn-primary w-full py-3.5 text-sm font-bold"
        >
          <Save size={18} />
          {saveMut.isPending ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
        </button>
      </form>
    </div>
  )
}

function PrinterTab() {
  const settings = useSettingStore((s) => s.settings)
  const [connected, setConnected] = useState(false)
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [printerConfig, setPrinterConfig] = useState<PrinterSettingsType>(printerStorage.load())
  const isSupported = printerManager.isSupported()

  useEffect(() => {
    const dev = printerManager.getConnectedDevice()
    if (dev && printerManager.isConnected()) {
      setConnected(true)
      setDeviceName(dev.name)
    }
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const dev = await printerManager.connect()
      setConnected(true)
      setDeviceName(dev.name)
      printerStorage.save({ ...printerConfig, deviceName: dev.name })
      toast.success(`✓ Terhubung ke ${dev.name}`)
    } catch (e: any) {
      if (e.message?.includes('cancelled') || e.name === 'NotFoundError') {
        toast('Pemilihan printer dibatalkan.', { icon: 'ℹ️' })
      } else {
        toast.error(e.message ?? 'Gagal koneksi ke printer.')
      }
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    await printerManager.disconnect()
    setConnected(false)
    setDeviceName(null)
    toast('Printer diputus.', { icon: '📴' })
  }

  const handleTestPrint = async () => {
    if (!printerManager.isConnected()) {
      toast.error('Printer belum terkoneksi.')
      return
    }
    setPrinting(true)
    try {
      const testReceipt = buildReceipt({
        storeName: settings['store_name'] ?? 'Warung Bu Tutik',
        storeAddress: settings['store_address'],
        storePhone: settings['store_phone'],
        invoiceNumber: 'TEST-001',
        dateTime: new Date().toLocaleString('id-ID'),
        cashierName: 'Test Kasir',
        items: [
          { name: 'Indomie Goreng Original', qty: 2, price: 3500, subtotal: 7000 },
          { name: 'Teh Botol Sosro 450ml', qty: 1, price: 6000, subtotal: 6000 },
        ],
        subtotal: 13000,
        grandTotal: 13000,
        paidAmount: 15000,
        changeAmount: 2000,
        paymentMethod: 'TUNAI',
        currency: settings['currency'] ?? 'Rp',
        note: settings['receipt_note'] ?? 'Terima kasih!',
        paperWidth: printerConfig.paperWidth,
      })
      await printerManager.print(testReceipt)
      toast.success('Test print berhasil! 🖨️')
    } catch (e: any) {
      toast.error(e.message ?? 'Gagal print.')
    } finally {
      setPrinting(false)
    }
  }

  const savePrinterConfig = (newConfig: Partial<PrinterSettingsType>) => {
    const updated = { ...printerConfig, ...newConfig }
    setPrinterConfig(updated)
    printerStorage.save(updated)
    toast.success('Pengaturan printer disimpan.')
  }

  return (
    <div className="space-y-6">
      {/* Browser Support */}
      {!isSupported && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-lg">⚠️</span>
            </div>
            <div>
              <p className="font-bold text-amber-800 text-sm">Browser Tidak Mendukung Web Bluetooth</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Printer Bluetooth hanya bisa digunakan di <strong>Chrome</strong> atau <strong>Edge</strong> (versi terbaru).
                Firefox dan Safari belum mendukung Web Bluetooth API.
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {[
                  { name: 'Chrome Android', icon: '✅' },
                  { name: 'Chrome Desktop', icon: '✅' },
                  { name: 'Edge Desktop', icon: '✅' },
                  { name: 'Firefox', icon: '❌' },
                  { name: 'Safari iOS', icon: '❌' },
                ].map((b) => (
                  <span key={b.name} className="text-xs bg-white border border-amber-200 px-2 py-1 rounded-lg">
                    {b.icon} {b.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${connected ? 'bg-primary-100' : 'bg-slate-100'}`}>
            {connected ? <BluetoothConnected size={20} className="text-primary-600" /> : <Bluetooth size={20} className="text-slate-400" />}
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-800">Koneksi Printer Bluetooth</h2>
            <p className="text-xs text-slate-400">
              {connected ? `Terhubung ke: ${deviceName}` : 'Belum ada printer terkoneksi'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className={`text-xs font-semibold ${connected ? 'text-emerald-600' : 'text-slate-400'}`}>
              {connected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {!connected ? (
            <button
              onClick={handleConnect}
              disabled={connecting || !isSupported}
              className="btn-primary"
            >
              {connecting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Mencari printer...
                </>
              ) : (
                <>
                  <Bluetooth size={15} /> Cari & Hubungkan
                </>
              )}
            </button>
          ) : (
            <>
              <button onClick={handleTestPrint} disabled={printing} className="btn-primary">
                {printing ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" /> Printing...
                  </>
                ) : (
                  <>
                    <Printer size={15} /> Test Print
                  </>
                )}
              </button>
              <button onClick={handleDisconnect} className="btn-secondary">
                <BluetoothOff size={15} /> Putus Koneksi
              </button>
            </>
          )}
        </div>

        {/* Guide */}
        {!connected && isSupported && (
          <div className="mt-4 bg-slate-50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-slate-600">Cara menghubungkan printer:</p>
            {[
              'Nyalakan printer thermal Bluetooth',
              'Aktifkan Bluetooth di HP/laptop Anda',
              'Klik tombol "Cari & Hubungkan" di atas',
              'Pilih nama printer dari daftar yang muncul',
              'Printer siap digunakan',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-slate-500">{step}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paper Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Printer size={20} className="text-blue-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">Konfigurasi Printer</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Lebar Kertas</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { value: 32 as const, label: '58mm', desc: 'Printer mini / portable', icon: '📄' },
                { value: 48 as const, label: '80mm', desc: 'Printer kasir standar', icon: '🗞️' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => savePrinterConfig({ paperWidth: opt.value })}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                    printerConfig.paperWidth === opt.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${printerConfig.paperWidth === opt.value ? 'text-primary-700' : 'text-slate-700'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-slate-400">{opt.desc}</p>
                  </div>
                  {printerConfig.paperWidth === opt.value && (
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compatibility */}
      <div className="card bg-slate-50/80 border-dashed">
        <div className="flex items-start gap-3">
          <Wifi size={18} className="text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2">Printer yang Kompatibel</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-500">
              {[
                'Epson TM-T20 / T82',
                'Gprinter GP-58 / GP-80',
                'Xprinter XP-58 / XP-80',
                'Rongta RPP300',
                'HOIN HOP-H58',
                'Iware IW-58 / IW-80',
                'Dan semua ESC/POS compatible',
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-primary-400 rounded-full shrink-0" />
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ComingSoonTab({ title }: { title: string }) {
  return (
    <div className="card flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
        <span className="text-4xl">🚧</span>
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-2">{title}</h3>
      <p className="text-sm text-slate-400">Fitur ini akan segera tersedia!</p>
    </div>
  )
}

// --- Main Settings Component ---

export default function SettingsPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const getActiveTab = () => {
    const path = location.pathname
    if (path.includes('/printer')) return 'printer'
    if (path.includes('/users')) return 'users'
    return 'general'
  }

  const activeTab = getActiveTab()

  const tabs = [
    { id: 'general', label: 'Umum', icon: <Settings size={18} />, to: '/settings/general' },
    { id: 'printer', label: 'Printer', icon: <Printer size={18} />, to: '/settings/printer' },
    { id: 'users', label: 'Pengguna', icon: <Users size={18} />, to: '/settings/users' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-800">Pengaturan</h1>
        <p className="text-xs text-slate-400 mt-1">Kelola pengaturan aplikasi</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1 flex gap-1 border border-slate-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.to)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'printer' && <PrinterTab />}
        {activeTab === 'users' && <ComingSoonTab title="Pengaturan Pengguna" />}
      </div>
    </div>
  )
}
