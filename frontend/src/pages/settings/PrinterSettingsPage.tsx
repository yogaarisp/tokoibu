import { useState, useEffect } from 'react'
import { Bluetooth, BluetoothConnected, BluetoothOff, Printer, CheckCircle, AlertTriangle, RefreshCw, Wifi, X, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { printerManager, printerStorage, PrinterSettings } from '@/lib/bluetoothPrinter'
import { buildReceipt } from '@/lib/escpos'
import { useSettingStore } from '@/store/settingStore'

export default function PrinterSettingsPage() {
  const settings  = useSettingStore((s) => s.settings)
  const [connected, setConnected]         = useState(false)
  const [deviceName, setDeviceName]       = useState<string | null>(null)
  const [connecting, setConnecting]       = useState(false)
  const [printing, setPrinting]           = useState(false)
  const [printerConfig, setPrinterConfig] = useState<PrinterSettings>(printerStorage.load())
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
      const device = await printerManager.connect()
      setConnected(true)
      setDeviceName(device.name)
      printerStorage.save({ ...printerConfig, deviceName: device.name })
      toast.success(`✅ Terhubung ke ${device.name}`)
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
        storeName:     settings['store_name'] ?? 'Warung Bu Tutik',
        storeAddress:  settings['store_address'],
        storePhone:    settings['store_phone'],
        invoiceNumber: 'TEST-001',
        dateTime:      new Date().toLocaleString('id-ID'),
        cashierName:   'Test Kasir',
        items: [
          { name: 'Indomie Goreng Original', qty: 2, price: 3500, subtotal: 7000 },
          { name: 'Teh Botol Sosro 450ml',   qty: 1, price: 6000, subtotal: 6000 },
        ],
        subtotal:      13000,
        grandTotal:    13000,
        paidAmount:    15000,
        changeAmount:  2000,
        paymentMethod: 'TUNAI',
        currency:      settings['currency'] ?? 'Rp',
        note:          settings['receipt_note'] ?? 'Terima kasih!',
        paperWidth:    printerConfig.paperWidth,
      })
      await printerManager.print(testReceipt)
      toast.success('Test print berhasil! 🖨️')
    } catch (e: any) {
      toast.error(e.message ?? 'Gagal print.')
    } finally {
      setPrinting(false)
    }
  }

  const savePrinterConfig = (newConfig: Partial<PrinterSettings>) => {
    const updated = { ...printerConfig, ...newConfig }
    setPrinterConfig(updated)
    printerStorage.save(updated)
    toast.success('Pengaturan printer disimpan.')
  }

  return (
    <div className="max-w-2xl space-y-5">

      {/* Back button */}
      <Link to="/settings" className="btn-ghost text-sm gap-1.5 inline-flex">
        <ArrowLeft size={16} /> Kembali ke Pengaturan
      </Link>

      {/* ── Browser support check ── */}
      {!isSupported && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
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
                  { name: 'Edge Desktop',   icon: '✅' },
                  { name: 'Firefox',        icon: '❌' },
                  { name: 'Safari iOS',     icon: '❌' },
                ].map(b => (
                  <span key={b.name} className="text-xs bg-white border border-amber-200 px-2 py-1 rounded-lg">
                    {b.icon} {b.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Connection card ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${connected ? 'bg-primary-100' : 'bg-slate-100'}`}>
            {connected
              ? <BluetoothConnected size={20} className="text-primary-600" />
              : <Bluetooth size={20} className="text-slate-400" />
            }
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Koneksi Printer Bluetooth</h2>
            <p className="text-xs text-slate-400">
              {connected ? `Terhubung ke: ${deviceName}` : 'Belum ada printer terkoneksi'}
            </p>
          </div>
          {/* Status dot */}
          <div className="ml-auto flex items-center gap-1.5">
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
                <><RefreshCw size={15} className="animate-spin" /> Mencari printer...</>
              ) : (
                <><Bluetooth size={15} /> Cari & Hubungkan</>
              )}
            </button>
          ) : (
            <>
              <button onClick={handleTestPrint} disabled={printing} className="btn-primary">
                {printing
                  ? <><RefreshCw size={15} className="animate-spin" /> Printing...</>
                  : <><Printer size={15} /> Test Print</>
                }
              </button>
              <button onClick={handleDisconnect} className="btn-secondary">
                <BluetoothOff size={15} /> Putus Koneksi
              </button>
            </>
          )}
        </div>

        {/* Connection guide */}
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
                <span className="w-5 h-5 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="text-xs text-slate-500">{step}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Paper size settings ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Printer size={20} className="text-blue-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">Konfigurasi Printer</h2>
        </div>

        <div className="space-y-4">
          {/* Paper width */}
          <div>
            <label className="label">Lebar Kertas</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { value: 32 as const, label: '58mm', desc: 'Printer mini / portable', icon: '📄' },
                { value: 48 as const, label: '80mm', desc: 'Printer kasir standar',   icon: '🗞️' },
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
                  <div>
                    <p className={`text-sm font-bold ${printerConfig.paperWidth === opt.value ? 'text-primary-700' : 'text-slate-700'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-slate-400">{opt.desc}</p>
                  </div>
                  {printerConfig.paperWidth === opt.value && (
                    <CheckCircle size={18} className="text-primary-600 ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Compatibility info ── */}
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
              ].map((p) => (
                <div key={p} className="flex items-center gap-1.5">
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
