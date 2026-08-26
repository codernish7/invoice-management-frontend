import { configureStore } from '@reduxjs/toolkit'
import clientsReducer from './clientsSlice'
import companyReducer from './companySlice'
import productsReducer from './productsSlice'

export const store = configureStore({
  reducer: {
    company: companyReducer,
    clients: clientsReducer,
    products: productsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const selectCompany = (state: RootState) => state.company.company
export const selectIsInitialized = (state: RootState) => state.company.isInitialized
export const selectIsAuthenticated = (state: RootState) => state.company.company !== null

export const selectClients = (state: RootState) => state.clients.clients
export const selectClientsStatus = (state: RootState) => state.clients.status
export const selectClientsError = (state: RootState) => state.clients.error
export const selectClientsHasFetched = (state: RootState) => state.clients.hasFetched

export const selectProducts = (state: RootState) => state.products.products
export const selectProductsStatus = (state: RootState) => state.products.status
export const selectProductsError = (state: RootState) => state.products.error
export const selectProductsHasFetched = (state: RootState) => state.products.hasFetched
