import type { ApiSuccess } from '../types/company'
import type { CreateProductInput, Product, UpdateProductInput } from '../types/product'
import apiClient from './apiClient'

export async function getProducts(): Promise<Product[]> {
  const response = await apiClient.get<ApiSuccess<Product[]>>('/company/products/view')
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
