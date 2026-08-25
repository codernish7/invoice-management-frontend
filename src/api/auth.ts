import type { ApiSuccess, Company, LoginRequest, SignupRequest } from '../types/company'
import apiClient from './apiClient'

export async function fetchCurrentCompany(): Promise<Company> {
  const response = await apiClient.get<ApiSuccess<Company>>('/company/')
  return response.data.data
}

export async function loginCompany(payload: LoginRequest): Promise<Company> {
  const response = await apiClient.post<ApiSuccess<{ company: Company }>>('/login', payload)
  return response.data.data.company
}

export async function signupCompany(payload: SignupRequest): Promise<Company> {
  const response = await apiClient.post<ApiSuccess<Company>>('/signup', payload)
  return response.data.data
}
