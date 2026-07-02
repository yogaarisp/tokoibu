import api from './axios'
import { PaginatedResponse, Product, ProductIdentityCheckResponse } from '@/types'

export interface ProductParams {
  search?: string
  category_id?: number | string
  page?: number
  per_page?: number
  low_stock?: boolean
  is_active?: boolean
}

export interface CheckProductIdentityParams {
  sku?: string
  barcode?: string
  ignore_id?: number
}

export const getProducts = (params?: ProductParams) =>
  api.get<PaginatedResponse<Product>>('/products', { params })

export const getProduct = (id: number) =>
  api.get<Product>(`/products/${id}`)

export const createProduct = (data: FormData) =>
  api.post<Product>('/products', data)

export const updateProduct = (id: number, data: FormData) =>
  api.post<Product>(`/products/${id}`, data)

export const deleteProduct = (id: number) =>
  api.delete(`/products/${id}`)

export const searchByBarcode = (barcode: string) =>
  api.get<Product>('/products/search/barcode', { params: { barcode } })

export const checkProductIdentity = (params: CheckProductIdentityParams) =>
  api.get<ProductIdentityCheckResponse>('/products/meta/check-identity', { params })
