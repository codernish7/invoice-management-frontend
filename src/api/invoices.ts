import type { ApiSuccess } from '../types/company'
import type {
  CreateInvoiceInput,
  CreateInvoiceResponse,
  GetInvoicesQuery,
  GetInvoicesResult,
  InvoiceDetails,
  InvoiceSummary,
  UpdateInvoiceInput,
  UpdateInvoiceResponse,
} from '../types/invoice'
import type { PaginatedApiSuccess } from '../types/pagination'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../types/pagination'
import apiClient from './apiClient'

export async function getInvoices(
  params: GetInvoicesQuery = {},
  options?: { signal?: AbortSignal },
): Promise<GetInvoicesResult> {
  const page = params.page ?? DEFAULT_PAGE
  const limit = params.limit ?? DEFAULT_LIMIT
  const search = params.search?.trim() ?? ''
  const invoiceType = params.invoice_type?.trim() ?? ''
  const invoiceStatus = params.status?.trim() ?? ''

  const query: {
    page: number
    limit: number
    search?: string
    invoice_type?: string
    status?: string
  } = {
    page,
    limit,
  }
  if (search !== '') {
    query.search = search
  }
  if (invoiceType !== '') {
    query.invoice_type = invoiceType
  }
  if (invoiceStatus !== '') {
    query.status = invoiceStatus
  }

  const response = await apiClient.get<PaginatedApiSuccess<InvoiceSummary[]>>(
    '/company/invoice/view',
    {
      params: query,
      signal: options?.signal,
    },
  )

  return {
    invoices: response.data.data,
    pagination: response.data.pagination,
    search,
    invoiceType,
    invoiceStatus,
  }
}

export async function createInvoice(
  payload: CreateInvoiceInput,
): Promise<CreateInvoiceResponse> {
  const response = await apiClient.post<ApiSuccess<CreateInvoiceResponse>>(
    '/company/invoice',
    payload,
  )
  return response.data.data
}

export async function getInvoice(invoiceId: string): Promise<InvoiceDetails> {
  const response = await apiClient.get<ApiSuccess<InvoiceDetails>>(
    `/company/invoice/${invoiceId}`,
  )
  return response.data.data
}

export async function updateInvoice(
  invoiceId: string,
  payload: UpdateInvoiceInput,
): Promise<UpdateInvoiceResponse> {
  const response = await apiClient.patch<ApiSuccess<UpdateInvoiceResponse>>(
    `/company/invoice/${invoiceId}`,
    payload,
  )
  return response.data.data
}

export async function downloadInvoicePdf(invoiceId: string): Promise<Blob> {
  const response = await apiClient.get<Blob>(`/company/invoice/${invoiceId}/pdf`, {
    responseType: 'blob',
  })
  return response.data
}
