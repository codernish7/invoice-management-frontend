import type { PaginationMeta } from './pagination'

export type Product = {
  id: string
  company_id: string
  product_name: string
  hsn_code: string
  unit: string
  gst_percent: string
  created_at: string
  updated_at: string
}

export type CreateProductInput = {
  product_name: string
  hsn_code: string
  unit: string
  gst_percent: number
}

export type GetProductsQuery = {
  page?: number
  limit?: number
  search?: string
  gst_percent?: string
  unit?: string
}

export type GetProductsResult = {
  products: Product[]
  pagination: PaginationMeta
  search: string
  gstPercent: string
  unit: string
}

export type ProductsListQuery = {
  page: number
  limit: number
  search: string
  gstPercent: string
  unit: string
}

export type UpdateProductInput = {
  product_name?: string
  hsn_code?: string
  gst_percent?: number
  unit?: string
}
