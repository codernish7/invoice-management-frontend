import { configureStore } from '@reduxjs/toolkit'
import clientsReducer from './clientsSlice'
import companyReducer from './companySlice'

export const store = configureStore({
  reducer: {
    company: companyReducer,
    clients: clientsReducer,
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
