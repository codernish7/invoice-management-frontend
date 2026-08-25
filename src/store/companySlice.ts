import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Company } from '../types/company'

type CompanyState = {
  company: Company | null
  isInitialized: boolean
}

const initialState: CompanyState = {
  company: null,
  isInitialized: false,
}

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    setCompanyFromAuth(state, action: PayloadAction<Company>) {
      state.company = action.payload
      state.isInitialized = true
    },
    hydrateCompany(state, action: PayloadAction<Company>) {
      state.company = action.payload
      state.isInitialized = true
    },
    hydrateUnauthenticated(state) {
      if (state.isInitialized && state.company !== null) {
        return
      }
      state.company = null
      state.isInitialized = true
    },
  },
})

export const { setCompanyFromAuth, hydrateCompany, hydrateUnauthenticated } =
  companySlice.actions

export default companySlice.reducer
