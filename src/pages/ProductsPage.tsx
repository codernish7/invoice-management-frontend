import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import axios from 'axios'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import { getProducts } from '../api/products'
import RowActionsMenu from '../components/RowActionsMenu'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  productsFetchFailed,
  productsFetchStarted,
  productsFetchSucceeded,
} from '../store/productsSlice'
import {
  selectProducts,
  selectProductsError,
  selectProductsListQuery,
  selectProductsPagination,
  selectProductsStatus,
} from '../store/store'
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  PAGE_SIZE_OPTIONS,
} from '../types/pagination'
import { createProductsListNavigationState } from '../utils/productsListNavigation'

const SEARCH_DEBOUNCE_MS = 300

const GST_PERCENT_OPTIONS = ['0', '0.25', '3', '5', '12', '18', '28', '40'] as const

const UNIT_OPTIONS = [
  'BAG',
  'BOX',
  'BTL',
  'CTN',
  'DOZ',
  'GMS',
  'KGS',
  'LTR',
  'MTR',
  'NOS',
  'PAC',
  'PCS',
  'ROL',
  'SET',
  'SQM',
  'TON',
] as const

function formatGstPercent(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '') {
    return '—'
  }
  const asNumber = Number(trimmed)
  if (Number.isNaN(asNumber)) {
    return trimmed
  }
  return `${asNumber}%`
}

function getProductActionPaths(productId: string) {
  return {
    viewPath: `/products/${productId}`,
    editPath: `/products/${productId}/edit`,
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

function parseGstPercent(value: string | null): string {
  if (value === null) {
    return ''
  }
  const trimmed = value.trim()
  if (trimmed === '') {
    return ''
  }
  const knownOption = GST_PERCENT_OPTIONS.find(
    (option) => Number(option) === Number(trimmed),
  )
  if (knownOption !== undefined) {
    return knownOption
  }
  if (/^\d+(\.\d+)?$/.test(trimmed) && Number(trimmed) <= 100) {
    return trimmed
  }
  return ''
}

function parseUnit(value: string | null): string {
  if (value === null) {
    return ''
  }
  const trimmed = value.trim()
  if (trimmed === '') {
    return ''
  }
  const knownOption = UNIT_OPTIONS.find(
    (option) => option.toLowerCase() === trimmed.toLowerCase(),
  )
  return knownOption ?? trimmed
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
      placeholder="Search by name or HSN"
      size="small"
      sx={{ minWidth: { sm: 240 }, flexGrow: 1 }}
      slotProps={{
        htmlInput: { 'aria-label': 'Search products' },
      }}
    />
  )
}

export default function ProductsPage() {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const products = useAppSelector(selectProducts)
  const status = useAppSelector(selectProductsStatus)
  const error = useAppSelector(selectProductsError)
  const pagination = useAppSelector(selectProductsPagination)
  const listQuery = useAppSelector(selectProductsListQuery)

  const page = parsePage(searchParams.get('page'))
  const limit = parseLimit(searchParams.get('limit'))
  const search = parseSearch(searchParams.get('search'))
  const gstPercent = parseGstPercent(searchParams.get('gst_percent'))
  const unit = parseUnit(searchParams.get('unit'))

  const currentQuery = useMemo(
    () => ({ page, limit, search, gstPercent, unit }),
    [page, limit, search, gstPercent, unit],
  )

  const hasActiveFilters =
    currentQuery.search !== '' ||
    currentQuery.gstPercent !== '' ||
    currentQuery.unit !== ''

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

  const handleCommitGstPercent = useCallback(
    (nextGstPercent: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.delete('page')
          if (nextGstPercent === '') {
            next.delete('gst_percent')
          } else {
            next.set('gst_percent', nextGstPercent)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const handleCommitUnit = useCallback(
    (nextUnit: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.delete('page')
          if (nextUnit === '') {
            next.delete('unit')
          } else {
            next.set('unit', nextUnit)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const handleGstPercentChange = (event: SelectChangeEvent) => {
    handleCommitGstPercent(event.target.value)
  }

  const handleUnitChange = (event: SelectChangeEvent) => {
    handleCommitUnit(event.target.value)
  }

  const gstOptions =
    gstPercent !== '' &&
    !(GST_PERCENT_OPTIONS as readonly string[]).includes(gstPercent)
      ? [...GST_PERCENT_OPTIONS, gstPercent]
      : GST_PERCENT_OPTIONS
  const unitOptions =
    unit !== '' && !(UNIT_OPTIONS as readonly string[]).includes(unit)
      ? [...UNIT_OPTIONS, unit]
      : UNIT_OPTIONS

  const handleClearFilters = () => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('page')
        next.delete('search')
        next.delete('gst_percent')
        next.delete('unit')
        return next
      },
      { replace: true },
    )
  }

  useEffect(() => {
    const controller = new AbortController()
    const requestId = crypto.randomUUID()

    async function loadProducts() {
      dispatch(productsFetchStarted(requestId))
      try {
        const result = await getProducts(
          {
            page: currentQuery.page,
            limit: currentQuery.limit,
            search: currentQuery.search === '' ? undefined : currentQuery.search,
            gst_percent:
              currentQuery.gstPercent === '' ? undefined : currentQuery.gstPercent,
            unit: currentQuery.unit === '' ? undefined : currentQuery.unit,
          },
          { signal: controller.signal },
        )
        dispatch(
          productsFetchSucceeded({
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
        dispatch(productsFetchFailed(getApiErrorMessage(err)))
      }
    }

    void loadProducts()

    return () => {
      controller.abort()
    }
  }, [currentQuery, dispatch, setSearchParams])

  const isCurrentResult =
    listQuery !== null &&
    listQuery.page === currentQuery.page &&
    listQuery.limit === currentQuery.limit &&
    listQuery.search === currentQuery.search &&
    listQuery.gstPercent === currentQuery.gstPercent &&
    listQuery.unit === currentQuery.unit
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
    products.length === 0 &&
    !hasActiveFilters
  const showNoMatch =
    isCurrentResult &&
    !isPageOutOfRange &&
    products.length === 0 &&
    hasActiveFilters
  const showTable = isCurrentResult && !isPageOutOfRange && products.length > 0
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

  const listNavigationState = createProductsListNavigationState(
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
          Products
        </Typography>
        <Button component={RouterLink} to="/products/create" variant="contained">
          Create Product
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
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
          <InputLabel id="product-gst-filter-label">GST %</InputLabel>
          <Select
            labelId="product-gst-filter-label"
            label="GST %"
            value={gstPercent}
            onChange={handleGstPercentChange}
            inputProps={{ 'aria-label': 'Filter by GST percent' }}
          >
            <MenuItem value="">
              Any
            </MenuItem>
            {gstOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}%
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
          <InputLabel id="product-unit-filter-label">Unit</InputLabel>
          <Select
            labelId="product-unit-filter-label"
            label="Unit"
            value={unit}
            onChange={handleUnitChange}
            inputProps={{ 'aria-label': 'Filter by unit' }}
          >
            <MenuItem value="">
              Any
            </MenuItem>
            {unitOptions.map((option) => (
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

      {isLoadingNewQuery && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading products" />
        </Box>
      )}

      {showError && <Alert severity="error">{error}</Alert>}

      {showEmpty && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <Typography color="text.secondary">No products yet</Typography>
            <Button component={RouterLink} to="/products/create" variant="contained">
              Create Product
            </Button>
          </Stack>
        </Paper>
      )}

      {showNoMatch && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No products match the current search or filters
          </Typography>
        </Paper>
      )}

      {showTable && (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ flex: 1, minHeight: 0 }}
        >
          <Table stickyHeader aria-label="products table">
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>HSN Code</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>GST %</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>{product.product_name}</TableCell>
                  <TableCell>{product.hsn_code}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>{formatGstPercent(product.gst_percent)}</TableCell>
                  <TableCell align="right">
                    <RowActionsMenu
                      entityId={product.id}
                      getPaths={getProductActionPaths}
                      ariaLabel={`Actions for ${product.product_name}`}
                      navigationState={listNavigationState}
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
