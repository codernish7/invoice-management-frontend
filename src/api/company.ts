import type { ApiSuccess, Company, UpdateCompanyRequest } from '../types/company'
import apiClient from './apiClient'

export async function updateCompany(payload: UpdateCompanyRequest): Promise<Company> {
  const response = await apiClient.patch<ApiSuccess<Company>>('/company/', payload)
  return response.data.data
}
