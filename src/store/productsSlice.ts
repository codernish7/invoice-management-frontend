import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Product } from '../types/product'

type ProductsStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

type ProductsState = {
  products: Product[]
  status: ProductsStatus
  error: string | null
  hasFetched: boolean
}

const initialState: ProductsState = {
  products: [],
  status: 'idle',
  error: null,
  hasFetched: false,
}

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    productsFetchStarted(state) {
      state.status = 'loading'
      state.error = null
    },
    productsFetchSucceeded(state, action: PayloadAction<Product[]>) {
      state.products = action.payload
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
    clearProducts(state) {
      state.products = []
      state.status = 'idle'
      state.error = null
      state.hasFetched = false
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
