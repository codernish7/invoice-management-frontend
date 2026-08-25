import type { ApiSuccess } from '../types/company'
import type { Client, CreateClientRequest } from '../types/client'
import apiClient from './apiClient'

export async function getClients(): Promise<Client[]> {
  const response = await apiClient.get<ApiSuccess<Client[]>>('/company/client/view')
  return response.data.data
}

export async function createClient(payload: CreateClientRequest): Promise<Client> {
  const response = await apiClient.post<ApiSuccess<Client>>('/company/client', payload)
  return response.data.data
}
