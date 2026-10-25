import type { PaginationMeta } from './pagination'

export type Client = {
  id: string
  company_id: string
  name: string
  email: string
  phone: string | null
  pan: string | null
  gstin: string | null
  address: string | null
  client_business: string
  state: string | null
  onboarding_date: string
  created_at: string
  updated_at: string
}

export type CreateClientRequest = {
  name: string
  email: string
  phone: string | null
  pan: string | null
  gstin: string | null
  address: string | null
  client_business: string
  onboarding_date: string
  state: string | null
}

export type GetClientsQuery = {
  page?: number
  limit?: number
  search?: string
}

export type GetClientsResult = {
  clients: Client[]
  pagination: PaginationMeta
  search: string
}

export type ClientsListQuery = {
  page: number
  limit: number
  search: string
}

export type UpdateClientInput = {
  name: string
  email: string
  phone: string | null
  pan: string | null
  gstin: string | null
  address: string | null
  client_business: string
  onboarding_date: string
  state: string | null
}
