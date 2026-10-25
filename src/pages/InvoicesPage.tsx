import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import axios from 'axios'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
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
import { downloadInvoicePdf, getInvoices } from '../api/invoices'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import RowActionsMenu from '../components/RowActionsMenu'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  invoicesFetchFailed,
  invoicesFetchStarted,
  invoicesFetchSucceeded,
} from '../store/invoicesSlice'
import {
  selectInvoices,
  selectInvoicesError,
  selectInvoicesListQuery,
  selectInvoicesPagination,
  selectInvoicesStatus,
} from '../store/store'
import {
  INVOICE_STATUS_FILTER_OPTIONS,
  INVOICE_TYPE_FILTER_OPTIONS,
} from '../types/invoice'
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  PAGE_SIZE_OPTIONS,
} from '../types/pagination'
import { formatInvoiceDate, formatMoney, triggerBlobDownload } from '../utils/format'
import { createInvoicesListNavigationState } from '../utils/invoicesListNavigation'

const SEARCH_DEBOUNCE_MS = 300

function getInvoiceActionPaths(invoiceId: string) {
  return {
    viewPath: `/invoices/${invoiceId}`,
    editPath: `/invoices/${invoiceId}/edit`,
  }
}

function statusChipColor(status: string): 'success' | 'info' | 'default' {
  if (status === 'COMPLETE') {
    return 'success'
  }
  if (status === 'DRAFT') {
    return 'info'
  }
  return 'default'
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

function parseEnumParam(
  value: string | null,
  allowed: readonly string[],
): string {
  if (value === null) {
    return ''
  }
  const normalized = value.trim().toUpperCase()
  if (normalized === '' || !allowed.includes(normalized)) {
    return ''
  }
  return normalized
}

type DebouncedSearchFieldProps = {
  committedValue: string
  onCommit: (nextValue: string) => void
}

function DebouncedSearchField({
  committedValue,
  onCommit,
}: DebouncedSearchFieldProps) {
  const [inputValue, setInputValue] = useState(committedValue)
  const [prevCommittedValue, setPrevCommittedValue] = useState(committedValue)

  if (committedValue !== prevCommittedValue) {
    setPrevCommittedValue(committedValue)
    setInputValue((current) =>
      current.trim() === committedValue ? current : committedValue,
    )
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextValue = inputValue.trim()
      if (nextValue === committedValue) {
        return
      }
      onCommit(nextValue)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [committedValue, inputValue, onCommit])

  return (
    <TextField
      value={inputValue}
      onChange={(event) => setInputValue(event.target.value)}
      placeholder="Search by invoice number or client"
      size="small"
      sx={{ minWidth: { sm: 260 }, flexGrow: 1 }}
      slotProps={{
        htmlInput: { 'aria-label': 'Search invoices' },
      }}
    />
  )
}

export default function InvoicesPage() {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const invoices = useAppSelector(selectInvoices)
  const fetchStatus = useAppSelector(selectInvoicesStatus)
  const error = useAppSelector(selectInvoicesError)
  const pagination = useAppSelector(selectInvoicesPagination)
  const listQuery = useAppSelector(selectInvoicesListQuery)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const page = parsePage(searchParams.get('page'))
  const limit = parseLimit(searchParams.get('limit'))
  const search = parseSearch(searchParams.get('search'))
  const invoiceType = parseEnumParam(
    searchParams.get('invoice_type'),
    INVOICE_TYPE_FILTER_OPTIONS,
  )
  const invoiceStatus = parseEnumParam(
    searchParams.get('status'),
    INVOICE_STATUS_FILTER_OPTIONS,
  )

  const currentQuery = useMemo(
    () => ({ page, limit, search, invoiceType, invoiceStatus }),
    [page, limit, search, invoiceType, invoiceStatus],
  )

  const hasActiveFilters =
    currentQuery.search !== '' ||
    currentQuery.invoiceType !== '' ||
    currentQuery.invoiceStatus !== ''

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

  const handleInvoiceTypeChange = (event: SelectChangeEvent) => {
    const nextType = event.target.value
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('page')
        if (nextType === '') {
          next.delete('invoice_type')
        } else {
          next.set('invoice_type', nextType)
        }
        return next
      },
      { replace: true },
    )
  }

  const handleInvoiceStatusChange = (event: SelectChangeEvent) => {
    const nextStatus = event.target.value
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('page')
        if (nextStatus === '') {
          next.delete('status')
        } else {
          next.set('status', nextStatus)
        }
        return next
      },
      { replace: true },
    )
  }

  const handleClearFilters = () => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('page')
        next.delete('search')
        next.delete('invoice_type')
        next.delete('status')
        return next
      },
      { replace: true },
    )
  }

  useEffect(() => {
    const controller = new AbortController()
    const requestId = crypto.randomUUID()

    async function loadInvoices() {
      dispatch(invoicesFetchStarted(requestId))
      try {
        const result = await getInvoices(
          {
            page: currentQuery.page,
            limit: currentQuery.limit,
            search: currentQuery.search === '' ? undefined : currentQuery.search,
            invoice_type:
              currentQuery.invoiceType === '' ? undefined : currentQuery.invoiceType,
            status:
              currentQuery.invoiceStatus === ''
                ? undefined
                : currentQuery.invoiceStatus,
          },
          { signal: controller.signal },
        )
        dispatch(
          invoicesFetchSucceeded({
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
        dispatch(invoicesFetchFailed(getApiErrorMessage(err)))
      }
    }

    void loadInvoices()

    return () => {
      controller.abort()
    }
  }, [currentQuery, dispatch, setSearchParams])

  const isCurrentResult =
    listQuery !== null &&
    listQuery.page === currentQuery.page &&
    listQuery.limit === currentQuery.limit &&
    listQuery.search === currentQuery.search &&
    listQuery.invoiceType === currentQuery.invoiceType &&
    listQuery.invoiceStatus === currentQuery.invoiceStatus
  const isPageOutOfRange =
    isCurrentResult &&
    pagination.totalPages > 0 &&
    currentQuery.page > pagination.totalPages

  const isLoadingNewQuery =
    (fetchStatus === 'loading' && !isCurrentResult) || isPageOutOfRange
  const showError = fetchStatus === 'failed' && error !== null && !isCurrentResult
  const showEmpty =
    isCurrentResult &&
    !isPageOutOfRange &&
    invoices.length === 0 &&
    !hasActiveFilters
  const showNoMatch =
    isCurrentResult &&
    !isPageOutOfRange &&
    invoices.length === 0 &&
    hasActiveFilters
  const showTable = isCurrentResult && !isPageOutOfRange && invoices.length > 0
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

  const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
    if (downloadingId !== null) {
      return
    }

    setDownloadError(null)
    setDownloadingId(invoiceId)

    try {
      const blob = await downloadInvoicePdf(invoiceId)
      triggerBlobDownload(blob, `${invoiceNumber}.pdf`)
    } catch (err) {
      setDownloadError(getApiErrorMessage(err))
    } finally {
      setDownloadingId(null)
    }
  }

  const listNavigationState = createInvoicesListNavigationState(
    searchParams.toString() === '' ? '' : `?${searchParams.toString()}`,
  )

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
          Invoices
        </Typography>
        <Button component={RouterLink} to="/invoices/create" variant="contained">
          Create Invoice
        </Button>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, flexWrap: 'wrap' }}
      >
        <DebouncedSearchField
          committedValue={search}
          onCommit={handleCommitSearch}
        />
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
          <InputLabel id="invoice-type-filter-label">Invoice type</InputLabel>
          <Select
            labelId="invoice-type-filter-label"
            label="Invoice type"
            value={invoiceType}
            onChange={handleInvoiceTypeChange}
            inputProps={{ 'aria-label': 'Filter by invoice type' }}
          >
            <MenuItem value="">Any</MenuItem>
            {INVOICE_TYPE_FILTER_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
          <InputLabel id="invoice-status-filter-label">Status</InputLabel>
          <Select
            labelId="invoice-status-filter-label"
            label="Status"
            value={invoiceStatus}
            onChange={handleInvoiceStatusChange}
            inputProps={{ 'aria-label': 'Filter by invoice status' }}
          >
            <MenuItem value="">Any</MenuItem>
            {INVOICE_STATUS_FILTER_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {hasActiveFilters && (
          <Button variant="outlined" onClick={handleClearFilters}>
            Clear filters
          </Button>
        )}
      </Stack>

      {downloadError !== null && <Alert severity="error">{downloadError}</Alert>}

      {isLoadingNewQuery && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading invoices" />
        </Box>
      )}

      {showError && <Alert severity="error">{error}</Alert>}

      {showEmpty && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <Typography color="text.secondary">No invoices yet</Typography>
            <Button component={RouterLink} to="/invoices/create" variant="contained">
              Create Invoice
            </Button>
          </Stack>
        </Paper>
      )}

      {showNoMatch && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No invoices match the current search or filters
          </Typography>
        </Paper>
      )}

      {showTable && (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ flex: 1, minHeight: 0 }}
        >
          <Table stickyHeader aria-label="invoices table">
            <TableHead>
              <TableRow>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Invoice Date</TableCell>
                <TableCell>Invoice Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Grand Total</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => {
                const canEdit = invoice.status === 'DRAFT'
                const canDownload = invoice.status === 'COMPLETE'
                return (
                  <TableRow key={invoice.id} hover>
                    <TableCell>{invoice.invoice_number}</TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{invoice.client_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invoice.client_business}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{formatInvoiceDate(invoice.invoice_date)}</TableCell>
                    <TableCell>{invoice.invoice_type}</TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        color={statusChipColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatMoney(invoice.grand_total)}
                    </TableCell>
                    <TableCell align="right">
                      <RowActionsMenu
                        entityId={invoice.id}
                        getPaths={getInvoiceActionPaths}
                        ariaLabel={`Actions for ${invoice.invoice_number}`}
                        editDisabled={!canEdit}
                        navigationState={listNavigationState}
                        onDownload={() => {
                          void handleDownload(invoice.id, invoice.invoice_number)
                        }}
                        downloadDisabled={!canDownload || downloadingId !== null}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
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
