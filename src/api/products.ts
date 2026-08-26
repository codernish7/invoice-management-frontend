import type { ApiSuccess } from '../types/company'
import type { CreateProductInput, Product } from '../types/product'
import apiClient from './apiClient'

export async function getProducts(): Promise<Product[]> {
  const response = await apiClient.get<ApiSuccess<Product[]>>('/company/product/view')
  return response.data.data
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
