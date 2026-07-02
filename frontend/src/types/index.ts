// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: number
  name: string
  email: string
  roles: string[]
  permissions: string[]
}

// ─── Core Models ─────────────────────────────────────────────────────────────
export interface Category {
  id: number
  name: string
  slug: string
  icon?: string
  description?: string
  is_active: boolean
  products_count?: number
}

export interface Supplier {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  is_active: boolean
  products_count?: number
}

export interface Customer {
  id: number
  name: string
  phone?: string
  address?: string
  debt_limit: number
  current_debt: number
  notes?: string
  is_active: boolean
  sales_count?: number
}

export interface Product {
  id: number
  sku: string
  barcode?: string
  name: string
  category_id: number
  supplier_id?: number
  buy_price: number
  sell_price: number
  stock: number
  min_stock: number
  unit: string
  unit_warehouse?: string
  unit_conversion?: number
  photo?: string
  photo_url: string
  description?: string
  is_active: boolean
  is_low_stock: boolean
  category?: Category
  supplier?: Supplier
  productStocks?: ProductStock[]
  product_stocks?: ProductStock[]
  total_stock?: number
  display_stock?: number
}

export interface ProductIdentityCheck {
  value: string | null
  exists: boolean
  product: {
    id: number
    name: string
    sku?: string
    barcode?: string
  } | null
}

export interface ProductIdentityCheckResponse {
  sku: ProductIdentityCheck
  barcode: ProductIdentityCheck
}

export interface SaleItem {
  id: number
  sale_id: number
  product_id: number
  product_name: string
  quantity: number
  buy_price: number
  sell_price: number
  discount: number
  subtotal: number
  product?: Product
}

export interface Sale {
  id: number
  invoice_number: string
  customer_id?: number
  user_id: number
  subtotal: number
  discount_amount: number
  tax_amount: number
  grand_total: number
  paid_amount: number
  change_amount: number
  payment_method: 'cash' | 'qris' | 'transfer' | 'debt'
  status: 'paid' | 'debt' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  customer?: Customer
  user?: { id: number; name: string }
  items?: SaleItem[]
}

export interface PurchaseItem {
  id: number
  purchase_id: number
  product_id: number
  product_name: string
  quantity: number
  buy_price: number
  subtotal: number
  product?: Product
}

export interface Purchase {
  id: number
  po_number: string
  supplier_id: number
  user_id: number
  total_amount: number
  status: 'pending' | 'received' | 'cancelled'
  order_date: string
  received_date?: string
  notes?: string
  created_at: string
  supplier?: Supplier
  user?: { id: number; name: string }
  items?: PurchaseItem[]
}

export interface StockMovement {
  id: number
  product_id: number
  user_id: number
  type: 'in' | 'out' | 'adjustment' | 'opname'
  quantity_before: number
  quantity_change: number
  quantity_after: number
  reference_type?: string
  reference_id?: number
  notes?: string
  created_at: string
  product?: { id: number; name: string; sku: string }
  user?: { id: number; name: string }
}

export interface CustomerDebt {
  id: number
  customer_id: number
  sale_id?: number
  user_id: number
  amount: number
  paid_amount: number
  remaining_amount: number
  due_date?: string
  status: 'unpaid' | 'partial' | 'paid'
  notes?: string
  created_at: string
  customer?: Customer
  sale?: { id: number; invoice_number: string }
}

export interface SupplierDebt {
  id: number
  supplier_id: number
  purchase_id?: number
  user_id: number
  amount: number
  paid_amount: number
  remaining_amount: number
  due_date?: string
  status: 'unpaid' | 'partial' | 'paid'
  notes?: string
  created_at: string
  supplier?: Supplier
  purchase?: { id: number; po_number: string }
}

export interface Setting {
  [key: string]: string
}

// ─── Location & Stock Transfer ──────────────────────────────────────────────────
export interface Location {
  id: number
  name: string
  type: 'warehouse' | 'display'
  description?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  product_stocks?: ProductStock[]
}

export interface ProductStock {
  id: number
  product_id: number
  location_id: number
  stock: number
  min_stock: number
  created_at: string
  updated_at: string
  product?: Product
  location?: Location
}

export interface StockTransfer {
  id: number
  transfer_number: string
  from_location_id: number
  to_location_id: number
  product_id: number
  quantity: number
  notes?: string | null
  user_id: number
  transferred_at: string
  created_at: string
  updated_at: string
  from_location: Location
  to_location: Location
  product: Product
  user: { id: number; name: string }
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
  links: { url?: string; label: string; active: boolean }[]
}

// ─── POS Cart ────────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product
  quantity: number
  discount: number
  subtotal: number
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_products: number
  total_stock: number
  sales_today: number
  sales_this_month: number
  revenue_this_month: number
  customer_debt: number
  supplier_debt: number
  low_stock_count: number
}
