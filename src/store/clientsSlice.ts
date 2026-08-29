import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Client } from '../types/client'

type ClientsStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

type ClientsState = {
  clients: Client[]
  status: ClientsStatus
  error: string | null
  hasFetched: boolean
}

const initialState: ClientsState = {
  clients: [],
  status: 'idle',
  error: null,
  hasFetched: false,
}

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    clientsFetchStarted(state) {
      state.status = 'loading'
      state.error = null
    },
    clientsFetchSucceeded(state, action: PayloadAction<Client[]>) {
      state.clients = action.payload
      state.status = 'succeeded'
      state.error = null
      state.hasFetched = true
    },
    clientsFetchFailed(state, action: PayloadAction<string>) {
      state.status = 'failed'
      state.error = action.payload
    },
    clientCreated(state, action: PayloadAction<Client>) {
      state.clients.push(action.payload)
      state.status = 'succeeded'
      state.error = null
      state.hasFetched = true
    },
    clearClients(state) {
      state.clients = []
      state.status = 'idle'
      state.error = null
      state.hasFetched = false
    },
  },
})

export const {
  clientsFetchStarted,
  clientsFetchSucceeded,
  clientsFetchFailed,
  clientCreated,
  clearClients,
} = clientsSlice.actions

export default clientsSlice.reducer
