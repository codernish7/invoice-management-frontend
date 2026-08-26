import { useEffect } from 'react'
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
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { getProducts } from '../api/products'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import RowActionsMenu from '../components/RowActionsMenu'
import {
  productsFetchFailed,
  productsFetchStarted,
  productsFetchSucceeded,
} from '../store/productsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  selectProducts,
  selectProductsError,
  selectProductsHasFetched,
  selectProductsStatus,
} from '../store/store'

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

export default function ProductsPage() {
  const dispatch = useAppDispatch()
  const products = useAppSelector(selectProducts)
  const status = useAppSelector(selectProductsStatus)
  const error = useAppSelector(selectProductsError)
  const hasFetched = useAppSelector(selectProductsHasFetched)

  useEffect(() => {
    if (hasFetched) {
      return
    }

    let cancelled = false

    async function loadProducts() {
      dispatch(productsFetchStarted())
      try {
        const data = await getProducts()
        if (cancelled) {
          return
        }
        dispatch(productsFetchSucceeded(data))
      } catch (err) {
        if (cancelled) {
          return
        }
        dispatch(productsFetchFailed(getApiErrorMessage(err)))
      }
    }

    void loadProducts()

    return () => {
      cancelled = true
    }
  }, [dispatch, hasFetched])

  const isLoading = !hasFetched && status === 'loading'
  const showError = !hasFetched && status === 'failed' && error !== null
  const showEmpty = hasFetched && products.length === 0
  const showTable = hasFetched && products.length > 0

  return (
    <Stack spacing={3}>
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

      {isLoading && (
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

      {showTable && (
        <TableContainer component={Paper} variant="outlined">
          <Table aria-label="products table">
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
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  )
}
