import type { ApiSuccess } from '../types/company'
import type { Client, CreateClientRequest, UpdateClientInput } from '../types/client'
import apiClient from './apiClient'

export async function getClients(): Promise<Client[]> {
  const response = await apiClient.get<ApiSuccess<Client[]>>('/company/clients/view')
  return response.data.data
}

export async function createClient(payload: CreateClientRequest): Promise<Client> {
  const response = await apiClient.post<ApiSuccess<Client>>('/company/client', payload)
  return response.data.data
}

export async function getClientById(clientId: string): Promise<Client> {
  const response = await apiClient.get<ApiSuccess<Client>>(
    `/company/client/${clientId}`,
  )
  return response.data.data
}

export async function updateClient(
  clientId: string,
  payload: UpdateClientInput,
): Promise<Client> {
  const response = await apiClient.patch<ApiSuccess<Client>>(
    `/company/client/${clientId}/edit`,
    payload,
  )
  return response.data.data
}
