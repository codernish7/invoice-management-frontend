import type { ApiSuccess } from '../types/company'
import type { PaginatedApiSuccess } from '../types/pagination'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../types/pagination'
import type {
  CreateProductInput,
  GetProductsQuery,
  GetProductsResult,
  Product,
  UpdateProductInput,
} from '../types/product'
import apiClient from './apiClient'

export async function getProducts(
  params: GetProductsQuery = {},
  options?: { signal?: AbortSignal },
): Promise<GetProductsResult> {
  const page = params.page ?? DEFAULT_PAGE
  const limit = params.limit ?? DEFAULT_LIMIT
  const search = params.search?.trim() ?? ''
  const gstPercent = params.gst_percent?.trim() ?? ''
  const unit = params.unit?.trim() ?? ''

  const query: {
    page: number
    limit: number
    search?: string
    gst_percent?: string
    unit?: string
  } = {
    page,
    limit,
  }
  if (search !== '') {
    query.search = search
  }
  if (gstPercent !== '') {
    query.gst_percent = gstPercent
  }
  if (unit !== '') {
    query.unit = unit
  }

  const response = await apiClient.get<PaginatedApiSuccess<Product[]>>(
    '/company/products/view',
    {
      params: query,
      signal: options?.signal,
    },
  )

  return {
    products: response.data.data,
    pagination: response.data.pagination,
    search,
    gstPercent,
    unit,
  }
}

export async function createProducts(
  products: CreateProductInput[],
): Promise<Product[]> {
  const response = await apiClient.post<ApiSuccess<Product[]>>(
    '/company/product',
    products,
  )
  return response.data.data
}

export async function getProductById(productId: string): Promise<Product> {
  const response = await apiClient.get<ApiSuccess<Product>>(
    `/company/product/${productId}`,
  )
  return response.data.data
}

export async function updateProduct(
  productId: string,
  payload: UpdateProductInput,
): Promise<Product> {
  const response = await apiClient.patch<ApiSuccess<Product>>(
    `/company/product/${productId}`,
    payload,
  )
  return response.data.data
}
