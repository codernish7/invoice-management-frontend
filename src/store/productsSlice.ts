import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PaginationMeta } from '../types/pagination'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../types/pagination'
import type { GetProductsResult, Product, ProductsListQuery } from '../types/product'

type ProductsStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

type ProductsFetchSuccessPayload = GetProductsResult & {
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

type ProductsState = {
  products: Product[]
  pagination: PaginationMeta
  listQuery: ProductsListQuery | null
  status: ProductsStatus
  error: string | null
  hasFetched: boolean
  activeRequestId: string | null
}

const initialState: ProductsState = {
  products: [],
  pagination: emptyPagination,
  listQuery: null,
  status: 'idle',
  error: null,
  hasFetched: false,
  activeRequestId: null,
}

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    productsFetchStarted: {
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
    productsFetchSucceeded(state, action: PayloadAction<ProductsFetchSuccessPayload>) {
      const requestId = action.payload.requestId
      if (
        requestId !== undefined &&
        state.activeRequestId !== null &&
        requestId !== state.activeRequestId
      ) {
        return
      }
      state.products = action.payload.products
      state.pagination = action.payload.pagination
      state.listQuery = {
        page: action.payload.pagination.page,
        limit: action.payload.pagination.limit,
        search: action.payload.search,
        gstPercent: action.payload.gstPercent,
        unit: action.payload.unit,
      }
      state.status = 'succeeded'
      state.error = null
      state.hasFetched = true
    },
    productsFetchFailed(state, action: PayloadAction<string>) {
      state.status = 'failed'
      state.error = action.payload
    },
    productsCreated(state, action: PayloadAction<Product[]>) {
      state.products.push(...action.payload)
      state.status = 'succeeded'
      state.error = null
      state.hasFetched = true
    },
    productUpdated(state, action: PayloadAction<Product>) {
      const index = state.products.findIndex(
        (product) => product.id === action.payload.id,
      )
      if (index !== -1) {
        state.products[index] = action.payload
      }
      state.status = 'succeeded'
      state.error = null
    },
    clearProducts() {
      return initialState
    },
  },
})

export const {
  productsFetchStarted,
  productsFetchSucceeded,
  productsFetchFailed,
  productsCreated,
  productUpdated,
  clearProducts,
} = productsSlice.actions

export default productsSlice.reducer
