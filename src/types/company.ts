export type Company = {
  id: string
  owner: string
  name: string
  phone: string | null
  email: string
  pan: string | null
  gstin: string | null
  address: string | null
  invoice_prefix: string
  created_at: string
  updated_at: string
  state: string | null
  next_invoice_number: number
  bank_name: string | null
  account_number: string | null
  ifsc_code: string | null
  branch: string | null
}

export type ApiSuccess<T> = {
  success: true
  message: string
  data: T
}

export type LoginRequest = {
  email: string
  password: string
}

export type SignupRequest = {
  email: string
  password: string
  owner: string
  name: string
  invoice_prefix: string
}

export type UpdateCompanyRequest = {
  owner: string
  name: string
  phone: string | null
  pan: string | null
  gstin: string | null
  address: string | null
  state: string | null
  invoice_prefix: string
  bank_name: string | null
  account_number: string | null
  ifsc_code: string | null
  branch: string | null
}
