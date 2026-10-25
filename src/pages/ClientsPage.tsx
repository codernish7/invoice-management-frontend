import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import axios from 'axios'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { getClients } from '../api/clients'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import RowActionsMenu from '../components/RowActionsMenu'
import {
  clientsFetchFailed,
  clientsFetchStarted,
  clientsFetchSucceeded,
} from '../store/clientsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  selectClients,
  selectClientsError,
  selectClientsListQuery,
  selectClientsPagination,
  selectClientsStatus,
} from '../store/store'
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  PAGE_SIZE_OPTIONS,
} from '../types/pagination'
import { createClientsListNavigationState } from '../utils/clientsListNavigation'

const SEARCH_DEBOUNCE_MS = 300

function displayValue(value: string | null): string {
  if (value === null || value.trim() === '') {
    return '—'
  }
  return value
}

function getClientActionPaths(clientId: string) {
  return {
    viewPath: `/clients/${clientId}`,
    editPath: `/clients/${clientId}/edit`,
  }
}

function parsePage(value: string | null): number {
  if (value === null || !/^[1-9]\d*$/.test(value)) {
    return DEFAULT_PAGE
  }
  return Number(value)
}

function parseLimit(value: string | null): number {
  if (value === null || !/^[1-9]\d*$/.test(value)) {
    return DEFAULT_LIMIT
  }
  const limit = Number(value)
  if (limit > MAX_LIMIT) {
    return MAX_LIMIT
  }
  return limit
}

function parseSearch(value: string | null): string {
  if (value === null) {
    return ''
  }
  return value.trim()
}

type ClientsSearchFieldProps = {
  committedSearch: string
  onCommitSearch: (nextSearch: string) => void
}

function ClientsSearchField({
  committedSearch,
  onCommitSearch,
}: ClientsSearchFieldProps) {
  const [searchInput, setSearchInput] = useState(committedSearch)
  const [prevCommittedSearch, setPrevCommittedSearch] = useState(committedSearch)

  if (committedSearch !== prevCommittedSearch) {
    setPrevCommittedSearch(committedSearch)
    setSearchInput((current) =>
      current.trim() === committedSearch ? current : committedSearch,
    )
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = searchInput.trim()
      if (nextSearch === committedSearch) {
        return
      }
      onCommitSearch(nextSearch)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [committedSearch, onCommitSearch, searchInput])

  return (
    <TextField
      value={searchInput}
      onChange={(event) => setSearchInput(event.target.value)}
      placeholder="Search clients"
      size="small"
      sx={{ minWidth: { sm: 280 } }}
      slotProps={{
        htmlInput: { 'aria-label': 'Search clients' },
      }}
    />
  )
}

export default function ClientsPage() {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const clients = useAppSelector(selectClients)
  const status = useAppSelector(selectClientsStatus)
  const error = useAppSelector(selectClientsError)
  const pagination = useAppSelector(selectClientsPagination)
  const listQuery = useAppSelector(selectClientsListQuery)

  const page = parsePage(searchParams.get('page'))
  const limit = parseLimit(searchParams.get('limit'))
  const search = parseSearch(searchParams.get('search'))

  const currentQuery = useMemo(
    () => ({ page, limit, search }),
    [page, limit, search],
  )

  const handleCommitSearch = useCallback(
    (nextSearch: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.delete('page')
          if (nextSearch === '') {
            next.delete('search')
          } else {
            next.set('search', nextSearch)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    const controller = new AbortController()
    const requestId = crypto.randomUUID()

    async function loadClients() {
      dispatch(clientsFetchStarted(requestId))
      try {
        const result = await getClients(
          {
            page: currentQuery.page,
            limit: currentQuery.limit,
            search: currentQuery.search === '' ? undefined : currentQuery.search,
          },
          { signal: controller.signal },
        )
        dispatch(
          clientsFetchSucceeded({
            ...result,
            requestId,
          }),
        )

        if (
          result.pagination.totalPages > 0 &&
          currentQuery.page > result.pagination.totalPages
        ) {
          setSearchParams(
            (current) => {
              const next = new URLSearchParams(current)
              const lastPage = result.pagination.totalPages
              if (lastPage <= DEFAULT_PAGE) {
                next.delete('page')
              } else {
                next.set('page', String(lastPage))
              }
              return next
            },
            { replace: true },
          )
        }
      } catch (err) {
        if (controller.signal.aborted || axios.isCancel(err)) {
          return
        }
        if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') {
          return
        }
        dispatch(clientsFetchFailed(getApiErrorMessage(err)))
      }
    }

    void loadClients()

    return () => {
      controller.abort()
    }
  }, [currentQuery, dispatch, setSearchParams])

  const isCurrentResult =
    listQuery !== null &&
    listQuery.page === currentQuery.page &&
    listQuery.limit === currentQuery.limit &&
    listQuery.search === currentQuery.search
  const isPageOutOfRange =
    isCurrentResult &&
    pagination.totalPages > 0 &&
    currentQuery.page > pagination.totalPages

  const isLoadingNewQuery =
    (status === 'loading' && !isCurrentResult) || isPageOutOfRange
  const showError = status === 'failed' && error !== null && !isCurrentResult
  const showEmpty =
    isCurrentResult &&
    !isPageOutOfRange &&
    clients.length === 0 &&
    currentQuery.search === ''
  const showNoMatch =
    isCurrentResult &&
    !isPageOutOfRange &&
    clients.length === 0 &&
    currentQuery.search !== ''
  const showTable = isCurrentResult && !isPageOutOfRange && clients.length > 0
  const showPagination =
    isCurrentResult && !isPageOutOfRange && pagination.totalItems > 0

  const handlePageChange = (_event: unknown, nextPage: number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      const backendPage = nextPage + 1
      if (backendPage === DEFAULT_PAGE) {
        next.delete('page')
      } else {
        next.set('page', String(backendPage))
      }
      return next
    })
  }

  const handleRowsPerPageChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const nextLimit = Number(event.target.value)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('page')
      if (nextLimit === DEFAULT_LIMIT) {
        next.delete('limit')
      } else {
        next.set('limit', String(nextLimit))
      }
      return next
    })
  }

  return (
    <Stack
      spacing={3}
      sx={{ flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h4" component="h1">
          Clients
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
        >
          <ClientsSearchField
            committedSearch={search}
            onCommitSearch={handleCommitSearch}
          />
          <Button component={RouterLink} to="/clients/create" variant="contained">
            Create Client
          </Button>
        </Stack>
      </Stack>

      {isLoadingNewQuery && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading clients" />
        </Box>
      )}

      {showError && <Alert severity="error">{error}</Alert>}

      {showEmpty && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <Typography color="text.secondary">No clients yet</Typography>
            <Button component={RouterLink} to="/clients/create" variant="contained">
              Create Client
            </Button>
          </Stack>
        </Paper>
      )}

      {showNoMatch && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No clients match “{currentQuery.search}”
          </Typography>
        </Paper>
      )}

      {showTable && (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ flex: 1, minHeight: 0 }}
        >
          <Table stickyHeader aria-label="clients table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Business</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>GSTIN</TableCell>
                <TableCell>State</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} hover>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.client_business}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{displayValue(client.phone)}</TableCell>
                  <TableCell>{displayValue(client.gstin)}</TableCell>
                  <TableCell>{displayValue(client.state)}</TableCell>
                  <TableCell align="right">
                    <RowActionsMenu
                      entityId={client.id}
                      getPaths={getClientActionPaths}
                      ariaLabel={`Actions for ${client.name}`}
                      navigationState={createClientsListNavigationState(
                        searchParams.toString() === ''
                          ? ''
                          : `?${searchParams.toString()}`,
                      )}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {showPagination && (
        <TablePagination
          component="div"
          sx={{ flexShrink: 0 }}
          count={pagination.totalItems}
          page={Math.max(0, pagination.page - 1)}
          onPageChange={handlePageChange}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[...PAGE_SIZE_OPTIONS]}
        />
      )}
    </Stack>
  )
}
