import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { GetInvoicesResult, InvoiceSummary, InvoicesListQuery } from '../types/invoice'
import type { PaginationMeta } from '../types/pagination'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../types/pagination'

type InvoicesFetchStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

type InvoicesFetchSuccessPayload = GetInvoicesResult & {
  requestId?: string
}

const emptyPagination: PaginationMeta = {
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

type InvoicesState = {
  invoices: InvoiceSummary[]
  pagination: PaginationMeta
  listQuery: InvoicesListQuery | null
  status: InvoicesFetchStatus
  error: string | null
  hasFetched: boolean
  activeRequestId: string | null
}

const initialState: InvoicesState = {
  invoices: [],
  pagination: emptyPagination,
  listQuery: null,
  status: 'idle',
  error: null,
  hasFetched: false,
  activeRequestId: null,
}

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    invoicesFetchStarted: {
      reducer(state, action: PayloadAction<string | undefined>) {
        state.status = 'loading'
        state.error = null
        if (action.payload !== undefined) {
          state.activeRequestId = action.payload
        }
      },
      prepare(requestId?: string) {
        return { payload: requestId }
      },
    },
    invoicesFetchSucceeded(state, action: PayloadAction<InvoicesFetchSuccessPayload>) {
      const requestId = action.payload.requestId
      if (
        requestId !== undefined &&
        state.activeRequestId !== null &&
        requestId !== state.activeRequestId
      ) {
        return
      }
      state.invoices = action.payload.invoices
      state.pagination = action.payload.pagination
      state.listQuery = {
        page: action.payload.pagination.page,
        limit: action.payload.pagination.limit,
        search: action.payload.search,
        invoiceType: action.payload.invoiceType,
        invoiceStatus: action.payload.invoiceStatus,
      }
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
    invoiceUpdated(state, action: PayloadAction<InvoiceSummary>) {
      const index = state.invoices.findIndex(
        (invoice) => invoice.id === action.payload.id,
      )
      if (index !== -1) {
        state.invoices[index] = action.payload
      }
      state.status = 'succeeded'
      state.error = null
    },
    clearInvoices() {
      return initialState
    },
  },
})

export const {
  invoicesFetchStarted,
  invoicesFetchSucceeded,
  invoicesFetchFailed,
  invoiceCreated,
  invoiceUpdated,
  clearInvoices,
} = invoicesSlice.actions

export default invoicesSlice.reducer
