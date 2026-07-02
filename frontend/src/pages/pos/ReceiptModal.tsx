import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { Sale } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'
import { ShoppingCart, Printer, Bluetooth, BluetoothOff } from 'lucide-react'
import { printerManager, printerStorage } from '@/lib/bluetoothPrinter'
import { buildReceipt } from '@/lib/escpos'
import { printReceiptBrowser } from '@/lib/browserPrint'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

interface Props { open: boolean; onClose: () => void; sale: Sale }

export default function ReceiptModal({ open, onClose, sale }: Props) {
  const settings = useSettingStore((s) => s.settings)
  const currency = useSettingStore((s) => s.currency())
  const [printing, setPrinting] = useState(false)

  const btConnected = printerManager.isConnected()

  const handleBTPrint = async () => {
    if (!btConnected) {
      toast.error('Printer Bluetooth belum terhubung. Buka Pengaturan → Printer.')
      return
    }

    setPrinting(true)
    try {
      const config = printerStorage.load()
      const bytes  = buildReceipt({
        storeName:     settings['store_name'] ?? 'Warung Bu Tutik',
        storeAddress:  settings['store_address'],
        storePhone:    settings['store_phone'],
        invoiceNumber: sale.invoice_number,
        dateTime:      formatDateTime(sale.created_at),
        cashierName:   (sale.user as any)?.name ?? '-',
        customerName:  sale.customer?.name,
        items: (sale.items ?? []).map(item => ({
          name:     item.product_name,
          qty:      item.quantity,
          price:    Number(item.sell_price),
          subtotal: Number(item.subtotal),
        })),
        subtotal:      Number(sale.subtotal),
        discount:      Number(sale.discount_amount),
        tax:           Number(sale.tax_amount),
        grandTotal:    Number(sale.grand_total),
        paidAmount:    Number(sale.paid_amount),
        changeAmount:  Number(sale.change_amount),
        paymentMethod: sale.payment_method.toUpperCase(),
        currency,
        note:          settings['receipt_note'],
        paperWidth:    config.paperWidth,
      })
      await printerManager.print(bytes)
      toast.success('Struk berhasil dicetak! 🖨️')
    } catch (e: any) {
      toast.error(e.message ?? 'Gagal mencetak struk.')
    } finally {
      setPrinting(false)
    }
  }

  const handleBrowserPrint = () => {
    const config = printerStorage.load()
    printReceiptBrowser({
      storeName:     settings['store_name'] ?? 'Warung Bu Tutik',
      storeAddress:  settings['store_address'],
      storePhone:    settings['store_phone'],
      invoiceNumber: sale.invoice_number,
      dateTime:      formatDateTime(sale.created_at),
      cashierName:   (sale.user as any)?.name ?? '-',
      customerName:  sale.customer?.name,
      items: (sale.items ?? []).map(item => ({
        name:     item.product_name,
        qty:      item.quantity,
        price:    formatCurrency(Number(item.sell_price), currency),
        subtotal: formatCurrency(Number(item.subtotal), currency),
      })),
      subtotal:      formatCurrency(Number(sale.subtotal), currency),
      discount:      formatCurrency(Number(sale.discount_amount), currency),
      tax:           formatCurrency(Number(sale.tax_amount), currency),
      grandTotal:    formatCurrency(Number(sale.grand_total), currency),
      paidAmount:    formatCurrency(Number(sale.paid_amount), currency),
      changeAmount:  formatCurrency(Number(sale.change_amount), currency),
      paymentMethod: sale.payment_method.toUpperCase(),
      note:          settings['receipt_note'],
      paperWidth:    config.paperWidth === 48 ? '80mm' : '58mm',
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Struk Transaksi" size="sm">
      {/* Receipt preview */}
      <div id="receipt" className="font-mono text-xs bg-white rounded-2xl p-4 border border-slate-100">
        {/* Header */}
        <div className="text-center mb-3">
          <p className="font-bold text-base">{settings['store_name']}</p>
          {settings['store_address'] && <p className="text-slate-500">{settings['store_address']}</p>}
          {settings['store_phone']   && <p className="text-slate-500">{settings['store_phone']}</p>}
          <p className="border-t border-dashed border-slate-300 pt-2 mt-2 text-slate-400">
            {sale.invoice_number} · {formatDateTime(sale.created_at)}
          </p>
          {sale.customer && <p>Pelanggan: {sale.customer.name}</p>}
          <p className="text-slate-400">Kasir: {(sale.user as any)?.name}</p>
        </div>

        <div className="border-t border-dashed border-slate-300 my-2" />

        {/* Items */}
        <div className="space-y-1.5">
          {sale.items?.map((item) => (
            <div key={item.id}>
              <p className="font-medium leading-tight">{item.product_name}</p>
              <div className="flex justify-between text-slate-500">
                <span>{item.quantity} x {formatCurrency(Number(item.sell_price), currency)}</span>
                <span>{formatCurrency(Number(item.subtotal), currency)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-slate-300 my-2" />

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(Number(sale.subtotal), currency)}</span></div>
          {Number(sale.discount_amount) > 0 && (
            <div className="flex justify-between text-slate-500"><span>Diskon</span><span>-{formatCurrency(Number(sale.discount_amount), currency)}</span></div>
          )}
          {Number(sale.tax_amount) > 0 && (
            <div className="flex justify-between text-slate-500"><span>Pajak</span><span>{formatCurrency(Number(sale.tax_amount), currency)}</span></div>
          )}
          <div className="flex justify-between font-bold text-sm border-t border-dashed border-slate-300 pt-1.5 mt-1">
            <span>TOTAL</span><span>{formatCurrency(Number(sale.grand_total), currency)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Bayar ({sale.payment_method.toUpperCase()})</span>
            <span>{formatCurrency(Number(sale.paid_amount), currency)}</span>
          </div>
          {Number(sale.change_amount) > 0 && (
            <div className="flex justify-between text-slate-500"><span>Kembalian</span><span>{formatCurrency(Number(sale.change_amount), currency)}</span></div>
          )}
        </div>

        {settings['receipt_note'] && (
          <>
            <div className="border-t border-dashed border-slate-300 my-2" />
            <p className="text-center text-slate-400">{settings['receipt_note']}</p>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5 mt-4">

        {/* Bluetooth print — primary action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBTPrint}
            disabled={printing}
            className={`flex-1 btn py-3 gap-2 ${
              btConnected
                ? 'btn-primary'
                : 'bg-slate-100 text-slate-400 rounded-xl font-semibold cursor-not-allowed'
            }`}
          >
            {printing ? (
              <>
                <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                Mencetak...
              </>
            ) : btConnected ? (
              <><Bluetooth size={16} /> Print Bluetooth</>
            ) : (
              <><BluetoothOff size={16} /> Bluetooth (belum konek)</>
            )}
          </button>
          {!btConnected && (
            <Link
              to="/settings/printer"
              onClick={onClose}
              className="btn-secondary px-4 py-3 text-xs font-semibold whitespace-nowrap"
            >
              Hubungkan
            </Link>
          )}
        </div>

        {/* Browser print — popup window struk */}
        <button onClick={handleBrowserPrint} className="btn-secondary w-full py-2.5 gap-2">
          <Printer size={16} />
          Print via Browser
          <span className="text-xs text-slate-400 font-normal">(popup window)</span>
        </button>

        {/* New transaction */}
        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-slate-400 hover:text-primary-600 transition-colors"
        >
          <ShoppingCart size={16} />
          Transaksi Baru
        </button>
      </div>
    </Modal>
  )
}
