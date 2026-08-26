export type Product = {
  id: string
  company_id: string
  product_name: string
  hsn_code: string
  unit: string
  gst_percent: string
  created_at: string
  updated_at: string
}

export type CreateProductInput = {
  product_name: string
  hsn_code: string
  unit: string
  gst_percent: number
}
