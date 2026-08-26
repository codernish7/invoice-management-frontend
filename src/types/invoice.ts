export type InvoiceType = 'SALE'
export type InvoiceStatus = 'DRAFT' | 'COMPLETE'

export type InvoiceSummary = {
  id: string
  invoice_number: string
  invoice_type: InvoiceType
  status: string
  invoice_date: string
  subtotal: string
  cgst_amount: string
  sgst_amount: string
  igst_amount: string
  grand_total: string
  client_id: string
  client_name: string
  client_business: string
}

export type InvoiceItem = {
  id: string
  product_id: string
  product_name: string
  hsn_code: string
  unit: string
  quantity: number
  rate: string
  gst_percent: string
  gst_amount: string
  line_total: string
}

export type InvoiceDetailsCompany = {
  id: string
  owner: string
  name: string
  email: string
  phone: string | null
  gstin: string | null
  pan: string | null
  address: string | null
  state: string | null
  bank_name: string | null
  account_number: string | null
  ifsc_code: string | null
  branch: string | null
}

export type InvoiceDetailsClient = {
  id: string
  name: string
  email: string
  phone: string | null
  gstin: string | null
  pan: string | null
  address: string | null
  state: string | null
  client_business: string
  bank_name: string | null
  account_number: string | null
  ifsc_code: string | null
  branch: string | null
}

export type InvoiceDetailsInvoice = {
  id: string
  invoice_number: string
  invoice_type: InvoiceType
  status: string
  invoice_date: string
  subtotal: string
  cgst_amount: string
  sgst_amount: string
  igst_amount: string
  grand_total: string
}

export type InvoiceDetails = {
  company: InvoiceDetailsCompany
  client: InvoiceDetailsClient
  invoice: InvoiceDetailsInvoice
  items: InvoiceItem[]
  total_items: number
}

export type CreateInvoiceItemInput = {
  product_id: string
  quantity: number
  rate: number
}

export type CreateInvoiceInput = {
  client_id: string
  invoice_type: InvoiceType
  invoice_date: string
  status: InvoiceStatus
  items: CreateInvoiceItemInput[]
}

export type CreateInvoiceResponse = {
  invoice_id: string
  invoice_number: string
  subtotal: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  grandTotal: number
  items: Array<{
    id: string
    invoice_id: string
    product_id: string
    quantity: number
    rate: string
    line_total: string
    created_at: string
    updated_at: string
    product_name: string
    hsn_code: string
    unit: string
    gst_percent: string
    gst_amount: string
  }>
}
