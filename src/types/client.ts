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
