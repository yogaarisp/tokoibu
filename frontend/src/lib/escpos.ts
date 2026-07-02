/**
 * ESC/POS Command Builder
 * Untuk printer thermal bluetooth (58mm & 80mm)
 *
 * Referensi: https://reference.epson-biz.com/modules/ref_escpos/
 */

export const ESC  = 0x1b
export const GS   = 0x1d
export const FS   = 0x1c
export const DLE  = 0x10

// ── Basic commands ──────────────────────────────────────────────
export const INIT              = [ESC, 0x40]           // Initialize printer
export const LF                = [0x0a]                 // Line feed
export const FF                = [0x0c]                 // Form feed
export const CR                = [0x0d]                 // Carriage return
export const CUT_PAPER         = [GS, 0x56, 0x41, 0x10]// Cut paper (partial)
export const CUT_PAPER_FULL    = [GS, 0x56, 0x00]      // Cut paper (full)

// ── Text alignment ───────────────────────────────────────────────
export const ALIGN_LEFT        = [ESC, 0x61, 0x00]
export const ALIGN_CENTER      = [ESC, 0x61, 0x01]
export const ALIGN_RIGHT       = [ESC, 0x61, 0x02]

// ── Text style ───────────────────────────────────────────────────
export const BOLD_ON           = [ESC, 0x45, 0x01]
export const BOLD_OFF          = [ESC, 0x45, 0x00]
export const UNDERLINE_ON      = [ESC, 0x2d, 0x01]
export const UNDERLINE_OFF     = [ESC, 0x2d, 0x00]
export const DOUBLE_HEIGHT_ON  = [ESC, 0x21, 0x10]
export const DOUBLE_SIZE_ON    = [ESC, 0x21, 0x30]     // Double width + height
export const NORMAL_SIZE       = [ESC, 0x21, 0x00]

// ── Font size ────────────────────────────────────────────────────
export const FONT_SIZE_NORMAL  = [GS, 0x21, 0x00]
export const FONT_SIZE_2X      = [GS, 0x21, 0x11]      // 2x width + height

// ── Line spacing ────────────────────────────────────────────────
export const LINE_SPACING_DEFAULT = [ESC, 0x32]
export const LINE_SPACING_TIGHT   = [ESC, 0x33, 20]

// ── Character set ────────────────────────────────────────────────
export const CHARSET_PC437     = [ESC, 0x74, 0x00]
export const CHARSET_PC850     = [ESC, 0x74, 0x02]

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Encode string ke Uint8Array */
export function encodeText(text: string): number[] {
  const encoder = new TextEncoder()
  return Array.from(encoder.encode(text))
}

/** Buat bytes dari perintah + teks */
export function cmd(...parts: (number[] | string | number)[]): number[] {
  const result: number[] = []
  for (const part of parts) {
    if (typeof part === 'string') {
      result.push(...encodeText(part))
    } else if (typeof part === 'number') {
      result.push(part)
    } else {
      result.push(...part)
    }
  }
  return result
}

/** Pad string kanan/kiri untuk layout dua kolom */
export function padLine(left: string, right: string, width: number): string {
  const spaces = width - left.length - right.length
  if (spaces <= 0) return left + ' ' + right
  return left + ' '.repeat(spaces) + right
}

/** Buat garis pemisah */
export function separator(width: number, char = '-'): string {
  return char.repeat(width) + '\n'
}

// ─────────────────────────────────────────────────────────────────
// Receipt Builder
// ─────────────────────────────────────────────────────────────────

export interface ReceiptData {
  storeName: string
  storeAddress?: string
  storePhone?: string
  invoiceNumber: string
  dateTime: string
  cashierName: string
  customerName?: string
  items: {
    name: string
    qty: number
    price: number
    subtotal: number
  }[]
  subtotal: number
  discount?: number
  tax?: number
  grandTotal: number
  paidAmount: number
  changeAmount: number
  paymentMethod: string
  note?: string
  currency?: string
  paperWidth?: 32 | 48  // 58mm = 32 chars, 80mm = 48 chars
}

export function buildReceipt(data: ReceiptData): Uint8Array {
  const w   = data.paperWidth ?? 32  // default 58mm
  const cur = data.currency ?? 'Rp'

  const fmt = (n: number) => `${cur} ${new Intl.NumberFormat('id-ID').format(Math.round(n))}`

  const bytes: number[] = []

  const push = (...parts: (number[] | string)[]) => {
    for (const p of parts) {
      if (typeof p === 'string') bytes.push(...encodeText(p))
      else bytes.push(...p)
    }
  }

  // Init
  push(INIT)
  push(LINE_SPACING_DEFAULT)

  // ── Header ──
  push(ALIGN_CENTER)
  push(BOLD_ON, DOUBLE_SIZE_ON)
  push(data.storeName + '\n')
  push(NORMAL_SIZE, BOLD_OFF)

  if (data.storeAddress) push(data.storeAddress + '\n')
  if (data.storePhone)   push(data.storePhone + '\n')

  push(ALIGN_LEFT)
  push(separator(w, '='))

  // ── Invoice info ──
  push(`No: ${data.invoiceNumber}\n`)
  push(`Tgl: ${data.dateTime}\n`)
  push(`Kasir: ${data.cashierName}\n`)
  if (data.customerName) push(`Pelanggan: ${data.customerName}\n`)

  push(separator(w))

  // ── Items ──
  for (const item of data.items) {
    // Nama produk (potong kalau terlalu panjang)
    const name = item.name.length > w ? item.name.substring(0, w - 3) + '...' : item.name
    push(name + '\n')
    // Qty x harga = subtotal
    const qtyPrice = `  ${item.qty} x ${fmt(item.price)}`
    const sub      = fmt(item.subtotal)
    push(padLine(qtyPrice, sub, w) + '\n')
  }

  push(separator(w))

  // ── Totals ──
  push(padLine('Subtotal', fmt(data.subtotal), w) + '\n')

  if (data.discount && data.discount > 0) {
    push(padLine('Diskon', `- ${fmt(data.discount)}`, w) + '\n')
  }
  if (data.tax && data.tax > 0) {
    push(padLine('Pajak', fmt(data.tax), w) + '\n')
  }

  push(separator(w, '='))
  push(BOLD_ON)
  push(padLine('TOTAL', fmt(data.grandTotal), w) + '\n')
  push(BOLD_OFF)

  push(padLine(`Bayar (${data.paymentMethod.toUpperCase()})`, fmt(data.paidAmount), w) + '\n')
  if (data.changeAmount > 0) {
    push(padLine('Kembalian', fmt(data.changeAmount), w) + '\n')
  }

  // ── Footer ──
  push(separator(w, '='))
  push(ALIGN_CENTER)
  if (data.note) push(data.note + '\n')
  push('\n\n\n')  // Feed sebelum cut

  // Cut paper
  push(CUT_PAPER)

  return new Uint8Array(bytes)
}
