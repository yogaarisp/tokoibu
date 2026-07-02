import api from './axios'
import { Category, Customer, PaginatedResponse, Purchase, Sale, Setting, StockMovement, Supplier, CustomerDebt, SupplierDebt, Location, StockTransfer, Product } from '@/types'

// ── Categories ───────────────────────────────────────────────────────────────
export const getCategories  = (params?: object) => api.get<PaginatedResponse<Category>>('/categories', { params })
export const createCategory = (data: object)    => api.post<Category>('/categories', data)
export const updateCategory = (id: number, data: object) => api.put<Category>(`/categories/${id}`, data)
export const deleteCategory = (id: number)      => api.delete(`/categories/${id}`)

// ── Products ───────────────────────────────────────────────────────────────
export const getProducts    = (params?: object) => api.get<PaginatedResponse<Product>>('/products', { params })
export const getProduct     = (id: number)      => api.get<Product>(`/products/${id}`)
export const createProduct  = (data: object)    => api.post<Product>('/products', data)
export const updateProduct  = (id: number, data: object) => api.put<Product>(`/products/${id}`, data)
export const deleteProduct  = (id: number)      => api.delete(`/products/${id}`)

// ── Suppliers ────────────────────────────────────────────────────────────────
export const getSuppliers  = (params?: object) => api.get<PaginatedResponse<Supplier>>('/suppliers', { params })
export const getSupplier   = (id: number)      => api.get<Supplier>(`/suppliers/${id}`)
export const createSupplier = (data: object)   => api.post<Supplier>('/suppliers', data)
export const updateSupplier = (id: number, data: object) => api.put<Supplier>(`/suppliers/${id}`, data)
export const deleteSupplier = (id: number)     => api.delete(`/suppliers/${id}`)

// ── Customers ────────────────────────────────────────────────────────────────
export const getCustomers  = (params?: object) => api.get<PaginatedResponse<Customer>>('/customers', { params })
export const getCustomer   = (id: number)      => api.get<Customer>(`/customers/${id}`)
export const createCustomer = (data: object)   => api.post<Customer>('/customers', data)
export const updateCustomer = (id: number, data: object) => api.put<Customer>(`/customers/${id}`, data)
export const deleteCustomer = (id: number)     => api.delete(`/customers/${id}`)
export const getCustomerHistory = (id: number) => api.get(`/customers/${id}/history`)

// ── Sales ─────────────────────────────────────────────────────────────────────
export const getSales     = (params?: object)  => api.get<PaginatedResponse<Sale>>('/sales', { params })
export const getSale      = (id: number)       => api.get<Sale>(`/sales/${id}`)
export const createSale   = (data: object)     => api.post<Sale>('/sales', data)
export const cancelSale   = (id: number, reason?: string) => api.post(`/sales/${id}/cancel`, { reason })

// ── Purchases ─────────────────────────────────────────────────────────────────
export const getPurchases    = (params?: object) => api.get<PaginatedResponse<Purchase>>('/purchases', { params })
export const getPurchase     = (id: number)      => api.get<Purchase>(`/purchases/${id}`)
export const createPurchase  = (data: object)    => api.post<Purchase>('/purchases', data)
export const receivePurchase = (id: number, received_date?: string) => api.post(`/purchases/${id}/receive`, { received_date })

// ── Inventory ─────────────────────────────────────────────────────────────────
export const getMovements  = (params?: object) => api.get<PaginatedResponse<StockMovement>>('/inventory', { params })
export const stockIn       = (data: object)    => api.post('/inventory/in', data)
export const stockOut      = (data: object)    => api.post('/inventory/out', data)
export const stockAdjust   = (data: object)    => api.post('/inventory/adjust', data)

// ── Locations ─────────────────────────────────────────────────────────────────
export const getLocations  = () => api.get<Location[]>('/locations')
export const getLocation   = (id: number) => api.get<Location>(`/locations/${id}`)
export const createLocation = (data: Partial<Location>) => api.post<Location>('/locations', data)
export const updateLocation = (id: number, data: Partial<Location>) => api.put<Location>(`/locations/${id}`, data)
export const deleteLocation = (id: number) => api.delete(`/locations/${id}`)

// ── Stock Transfers ───────────────────────────────────────────────────────────
export const getStockTransfers = (params?: object) => api.get<PaginatedResponse<StockTransfer>>('/stock-transfers', { params })
export const getStockTransfer  = (id: number) => api.get<StockTransfer>(`/stock-transfers/${id}`)
export const createStockTransfer = (data: {
  from_location_id: number
  to_location_id: number
  product_id: number
  quantity: number
  notes?: string
}) => api.post<StockTransfer>('/stock-transfers', data)

// ── Customer Debts ────────────────────────────────────────────────────────────
export const getCustomerDebts = (params?: object) => api.get<PaginatedResponse<CustomerDebt>>('/debts/customers', { params })
export const payCustomerDebt  = (id: number, data: object) => api.post(`/debts/customers/${id}/pay`, data)

// ── Supplier Debts ────────────────────────────────────────────────────────────
export const getSupplierDebts = (params?: object) => api.get<PaginatedResponse<SupplierDebt>>('/debts/suppliers', { params })
export const paySupplierDebt  = (id: number, data: object) => api.post(`/debts/suppliers/${id}/pay`, data)

// ── Reports ───────────────────────────────────────────────────────────────────
export const getSalesReport     = (params?: object) => api.get('/reports/sales', { params })
export const getInventoryReport = ()                 => api.get('/reports/inventory')
export const getProfitLossReport= (params?: object) => api.get('/reports/profit-loss', { params })
export const getBestSelling     = (params?: object) => api.get('/reports/best-selling', { params })

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings    = () => api.get<Setting>('/settings')
export const updateSettings = (data: object) => api.post('/settings', data)

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers    = (params?: object) => api.get('/users', { params })
export const createUser  = (data: object)    => api.post('/users', data)
export const updateUser  = (id: number, data: object) => api.put(`/users/${id}`, data)
export const deleteUser  = (id: number)      => api.delete(`/users/${id}`)

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboard = () => api.get('/dashboard')
