import type { ApiSuccess } from '../types/company'
import type {
  CreateInvoiceInput,
  CreateInvoiceResponse,
  InvoiceDetails,
  InvoiceSummary,
} from '../types/invoice'
import apiClient from './apiClient'

export async function getInvoices(): Promise<InvoiceSummary[]> {
  const response = await apiClient.get<ApiSuccess<InvoiceSummary[]>>(
    '/company/invoice/view',
  )
  return response.data.data
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

export async function downloadInvoicePdf(invoiceId: string): Promise<Blob> {
  const response = await apiClient.get<Blob>(`/company/invoice/${invoiceId}/pdf`, {
    responseType: 'blob',
  })
  return response.data
}
