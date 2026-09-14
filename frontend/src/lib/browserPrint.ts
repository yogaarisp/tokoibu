/**
 * Browser Print Helper
 *
 * Buka popup window terpisah berisi struk, lalu print.
 * Lebih andal daripada window.print() langsung karena
 * tidak bergantung pada @media print di halaman utama.
 */

export interface BrowserReceiptData {
  storeName: string
  storeAddress?: string
  storePhone?: string
  invoiceNumber: string
  dateTime: string
  cashierName: string
  customerName?: string
  items: { name: string; qty: number; price: string; subtotal: string }[]
  subtotal: string
  discount?: string
  tax?: string
  grandTotal: string
  paidAmount: string
  changeAmount?: string
  paymentMethod: string
  note?: string
  paperWidth?: '58mm' | '80mm'
}

export function printReceiptBrowser(data: BrowserReceiptData): void {
  const w = data.paperWidth ?? '80mm'

  const itemsHtml = data.items.map(item => `
    <div class="item-name">${item.name}</div>
    <div class="item-row">
      <span>${item.qty} x ${item.price}</span>
      <span>${item.subtotal}</span>
    </div>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Struk - ${data.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      width: ${w};
      padding: 4px 6px;
      color: #000;
      background: #fff;
    }
    .center  { text-align: center; }
    .bold    { font-weight: bold; }
    .large   { font-size: 14px; }
    .sep     { border-top: 1px dashed #000; margin: 4px 0; }
    .sep-solid { border-top: 1px solid #000; margin: 4px 0; }
    .row     { display: flex; justify-content: space-between; }
    .item-name { margin-top: 3px; word-break: break-word; }
    .item-row  { display: flex; justify-content: space-between; padding-left: 8px; color: #333; }
    .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; }
    .mt2 { margin-top: 2px; }
    .mt4 { margin-top: 4px; }
    @media print {
      @page { size: ${w} auto; margin: 0; }
      body  { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="center bold large mt4">${data.storeName}</div>
  ${data.storeAddress ? `<div class="center">${data.storeAddress}</div>` : ''}
  ${data.storePhone   ? `<div class="center">${data.storePhone}</div>`   : ''}

  <div class="sep-solid mt4"></div>

  <div>No: ${data.invoiceNumber}</div>
  <div>Tgl: ${data.dateTime}</div>
  <div>Kasir: ${data.cashierName}</div>
  ${data.customerName ? `<div>Pelanggan: ${data.customerName}</div>` : ''}

  <div class="sep"></div>

  ${itemsHtml}

  <div class="sep"></div>

  <div class="row mt2"><span>Subtotal</span><span>${data.subtotal}</span></div>
  ${data.discount && data.discount !== 'Rp 0' ? `<div class="row"><span>Diskon</span><span>- ${data.discount}</span></div>` : ''}
  ${data.tax && data.tax !== 'Rp 0' ? `<div class="row"><span>Pajak</span><span>${data.tax}</span></div>` : ''}

  <div class="sep-solid"></div>
  <div class="total-row mt2"><span>TOTAL</span><span>${data.grandTotal}</span></div>
  <div class="row mt2"><span>Bayar (${data.paymentMethod})</span><span>${data.paidAmount}</span></div>
  ${data.changeAmount && data.changeAmount !== 'Rp 0' ? `<div class="row"><span>Kembalian</span><span>${data.changeAmount}</span></div>` : ''}

  <div class="sep-solid mt4"></div>
  ${data.note ? `<div class="center mt4">${data.note}</div>` : ''}
  <div class="mt4"></div>
</body>
</html>`

  // Buka popup window kecil seukuran struk
  const popup = window.open('', '_blank', `width=400,height=600,left=200,top=100`)
  if (!popup) {
    alert('Popup diblokir browser. Izinkan popup untuk halaman ini.')
    return
  }
  popup.document.write(html)
  popup.document.close()

  // Tunggu konten render lalu print
  popup.onload = () => {
    popup.focus()
    popup.print()
    // Tutup popup setelah print dialog ditutup
    popup.onafterprint = () => popup.close()
  }
}
