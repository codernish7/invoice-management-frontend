import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { InvoiceSummary } from '../types/invoice'

type InvoicesStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

type InvoicesState = {
  invoices: InvoiceSummary[]
  status: InvoicesStatus
  error: string | null
  hasFetched: boolean
}

const initialState: InvoicesState = {
  invoices: [],
  status: 'idle',
  error: null,
  hasFetched: false,
}

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    invoicesFetchStarted(state) {
      state.status = 'loading'
      state.error = null
    },
    invoicesFetchSucceeded(state, action: PayloadAction<InvoiceSummary[]>) {
      state.invoices = action.payload
      state.status = 'succeeded'
      state.error = null
      state.hasFetched = true
    },
    invoicesFetchFailed(state, action: PayloadAction<string>) {
      state.status = 'failed'
      state.error = action.payload
    },
    invoiceCreated(state, action: PayloadAction<InvoiceSummary>) {
      state.invoices.unshift(action.payload)
      state.status = 'succeeded'
      state.error = null
      state.hasFetched = true
    },
  },
})

export const {
  invoicesFetchStarted,
  invoicesFetchSucceeded,
  invoicesFetchFailed,
  invoiceCreated,
} = invoicesSlice.actions

export default invoicesSlice.reducer
