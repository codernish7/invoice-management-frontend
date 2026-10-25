import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Client, ClientsListQuery, GetClientsResult } from '../types/client'
import type { PaginationMeta } from '../types/pagination'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../types/pagination'

type ClientsStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

type ClientsFetchSuccessPayload = GetClientsResult & {
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

type ClientsState = {
  clients: Client[]
  pagination: PaginationMeta
  listQuery: ClientsListQuery | null
  status: ClientsStatus
  error: string | null
  hasFetched: boolean
  activeRequestId: string | null
}

const initialState: ClientsState = {
  clients: [],
  pagination: emptyPagination,
  listQuery: null,
  status: 'idle',
  error: null,
  hasFetched: false,
  activeRequestId: null,
}

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    clientsFetchStarted: {
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
    clientsFetchSucceeded(state, action: PayloadAction<ClientsFetchSuccessPayload>) {
      const requestId = action.payload.requestId
      if (
        requestId !== undefined &&
        state.activeRequestId !== null &&
        requestId !== state.activeRequestId
      ) {
        return
      }
      state.clients = action.payload.clients
      state.pagination = action.payload.pagination
      state.listQuery = {
        page: action.payload.pagination.page,
        limit: action.payload.pagination.limit,
        search: action.payload.search,
      }
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
    clientUpdated(state, action: PayloadAction<Client>) {
      const index = state.clients.findIndex(
        (client) => client.id === action.payload.id,
      )
      if (index !== -1) {
        state.clients[index] = action.payload
      }
      state.status = 'succeeded'
      state.error = null
    },
    clearClients() {
      return initialState
    },
  },
})

export const {
  clientsFetchStarted,
  clientsFetchSucceeded,
  clientsFetchFailed,
  clientCreated,
  clientUpdated,
  clearClients,
} = clientsSlice.actions

export default clientsSlice.reducer
