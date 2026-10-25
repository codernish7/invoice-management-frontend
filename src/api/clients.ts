import type { ApiSuccess } from '../types/company'
import type {
  Client,
  CreateClientRequest,
  GetClientsQuery,
  GetClientsResult,
  UpdateClientInput,
} from '../types/client'
import type { PaginatedApiSuccess } from '../types/pagination'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../types/pagination'
import apiClient from './apiClient'

export async function getClients(
  params: GetClientsQuery = {},
  options?: { signal?: AbortSignal },
): Promise<GetClientsResult> {
  const page = params.page ?? DEFAULT_PAGE
  const limit = params.limit ?? DEFAULT_LIMIT
  const search = params.search?.trim() ?? ''

  const query: { page: number; limit: number; search?: string } = {
    page,
    limit,
  }
  if (search !== '') {
    query.search = search
  }

  const response = await apiClient.get<PaginatedApiSuccess<Client[]>>(
    '/company/clients/view',
    {
      params: query,
      signal: options?.signal,
    },
  )

  return {
    clients: response.data.data,
    pagination: response.data.pagination,
    search,
  }
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
