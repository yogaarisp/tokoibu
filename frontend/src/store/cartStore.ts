import { create } from 'zustand'
import { CartItem, Product } from '@/types'

// Helper — pastikan nilai selalu number (API Laravel kirim decimal sebagai string)
const toNum = (v: unknown): number => {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

const calcLineSubtotal = (qty: number, price: unknown, discount: number): number => {
  return toNum(qty) * toNum(price) * (1 - toNum(discount) / 100)
}

interface CartState {
  items: CartItem[]
  customerId: number | null
  paymentMethod: 'cash' | 'qris' | 'transfer' | 'debt'
  discountAmount: number
  paidAmount: number
  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  updateQty: (productId: number, qty: number) => void
  updateDiscount: (productId: number, discount: number) => void
  setCustomer: (id: number | null) => void
  setPaymentMethod: (method: CartState['paymentMethod']) => void
  setDiscountAmount: (amount: number) => void
  setPaidAmount: (amount: number) => void
  clearCart: () => void
  subtotal: () => number
  grandTotal: (taxRate?: number) => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  paymentMethod: 'cash',
  discountAmount: 0,
  paidAmount: 0,

  addItem: (product) => {
    const price = toNum(product.sell_price)
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id)
      if (existing) {
        const newQty = existing.quantity + 1
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: newQty, subtotal: calcLineSubtotal(newQty, price, i.discount) }
              : i
          ),
        }
      }
      return {
        items: [
          ...state.items,
          { product, quantity: 1, discount: 0, subtotal: price },
        ],
      }
    })
  },

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),

  updateQty: (productId, qty) => {
    if (qty <= 0) { get().removeItem(productId); return }
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: qty, subtotal: calcLineSubtotal(qty, i.product.sell_price, i.discount) }
          : i
      ),
    }))
  },

  updateDiscount: (productId, discount) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId
          ? { ...i, discount, subtotal: calcLineSubtotal(i.quantity, i.product.sell_price, discount) }
          : i
      ),
    })),

  setCustomer: (id) => set({ customerId: id }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setDiscountAmount: (amount) => set({ discountAmount: toNum(amount) }),
  setPaidAmount: (amount) => set({ paidAmount: toNum(amount) }),

  clearCart: () => set({
    items: [],
    customerId: null,
    paymentMethod: 'cash',
    discountAmount: 0,
    paidAmount: 0,
  }),

  subtotal: () => get().items.reduce((s, i) => s + toNum(i.subtotal), 0),

  grandTotal: (taxRate = 0) => {
    const sub   = get().subtotal()
    const disc  = toNum(get().discountAmount)
    const after = sub - disc
    const tax   = after * (toNum(taxRate) / 100)
    return after + tax
  },
}))
