import { configureStore } from '@reduxjs/toolkit'
import companyReducer from './companySlice'

export const store = configureStore({
  reducer: {
    company: companyReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const selectCompany = (state: RootState) => state.company.company
export const selectIsInitialized = (state: RootState) => state.company.isInitialized
export const selectIsAuthenticated = (state: RootState) => state.company.company !== null
