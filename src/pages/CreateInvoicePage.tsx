import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
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
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import { getClients } from '../api/clients'
import { createInvoice } from '../api/invoices'
import { getProducts } from '../api/products'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import {
  clientsFetchFailed,
  clientsFetchStarted,
  clientsFetchSucceeded,
} from '../store/clientsSlice'
import { invoiceCreated } from '../store/invoicesSlice'
import {
  productsFetchFailed,
  productsFetchStarted,
  productsFetchSucceeded,
} from '../store/productsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  selectClients,
  selectClientsHasFetched,
  selectClientsStatus,
  selectProducts,
  selectProductsHasFetched,
  selectProductsStatus,
} from '../store/store'
import type {
  CreateInvoiceInput,
  InvoiceSummary,
  InvoiceWritableStatus,
} from '../types/invoice'
import { formatMoney } from '../utils/format'

type InvoiceItemFormRow = {
  keyId: string
  product_id: string
  quantity: string
  rate: string
}

function createBlankItemRow(): InvoiceItemFormRow {
  return {
    keyId: crypto.randomUUID(),
    product_id: '',
    quantity: '1',
    rate: '',
  }
}

function todayInputValue(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toNumber(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }
  const parsed = Number(trimmed)
  if (Number.isNaN(parsed)) {
    return null
  }
  return parsed
}

export default function CreateInvoicePage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const clients = useAppSelector(selectClients)
  const clientsHasFetched = useAppSelector(selectClientsHasFetched)
  const clientsStatus = useAppSelector(selectClientsStatus)
  const products = useAppSelector(selectProducts)
  const productsHasFetched = useAppSelector(selectProductsHasFetched)
  const productsStatus = useAppSelector(selectProductsStatus)

  const [clientId, setClientId] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(todayInputValue())
  const [items, setItems] = useState<InvoiceItemFormRow[]>([createBlankItemRow()])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [referenceError, setReferenceError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function ensureClients() {
      if (clientsHasFetched) {
        return
      }
      dispatch(clientsFetchStarted())
      try {
        const data = await getClients()
        if (cancelled) {
          return
        }
        dispatch(clientsFetchSucceeded(data))
      } catch (err) {
        if (cancelled) {
          return
        }
        const message = getApiErrorMessage(err)
        dispatch(clientsFetchFailed(message))
        setReferenceError(message)
      }
    }

    async function ensureProducts() {
      if (productsHasFetched) {
        return
      }
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
        const message = getApiErrorMessage(err)
        dispatch(productsFetchFailed(message))
        setReferenceError(message)
      }
    }

    void ensureClients()
    void ensureProducts()

    return () => {
      cancelled = true
    }
  }, [clientsHasFetched, dispatch, productsHasFetched])

  const selectedProductIds = useMemo(
    () => items.map((item) => item.product_id).filter((id) => id !== ''),
    [items],
  )

  const previewSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = toNumber(item.quantity)
      const rate = toNumber(item.rate)
      if (quantity === null || rate === null) {
        return sum
      }
      return sum + quantity * rate
    }, 0)
  }, [items])

  const isReferenceLoading =
    (!clientsHasFetched && clientsStatus === 'loading') ||
    (!productsHasFetched && productsStatus === 'loading')

  const getAvailableProductsForRow = (row: InvoiceItemFormRow) => {
    const selectedElsewhere = new Set(
      selectedProductIds.filter((id) => id !== row.product_id),
    )
    return products.filter(
      (product) =>
        !selectedElsewhere.has(product.id) || product.id === row.product_id,
    )
  }

  const updateItemField =
    (keyId: string, field: 'product_id' | 'quantity' | 'rate') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
      const value = event.target.value
      setItems((current) =>
        current.map((item) =>
          item.keyId === keyId
            ? {
                ...item,
                [field]: value,
              }
            : item,
        ),
      )
    }

  const handleAddItem = () => {
    setItems((current) => [...current, createBlankItemRow()])
  }

  const handleRemoveItem = (keyId: string) => {
    setItems((current) => {
      if (current.length <= 1) {
        return current
      }
      return current.filter((item) => item.keyId !== keyId)
    })
  }

  const buildPayload = (
    status: InvoiceWritableStatus,
  ): { payload: CreateInvoiceInput } | { error: string } => {
    if (clientId.trim() === '') {
      return { error: 'Select a client.' }
    }
    if (invoiceDate.trim() === '') {
      return { error: 'Select an invoice date.' }
    }

    const activeItems = items.filter(
      (item) =>
        item.product_id !== '' ||
        item.quantity.trim() !== '' ||
        item.rate.trim() !== '',
    )

    if (activeItems.length === 0) {
      return { error: 'Add at least one invoice item.' }
    }

    const createItems: CreateInvoiceInput['items'] = []

    for (const [index, item] of activeItems.entries()) {
      const quantity = toNumber(item.quantity)
      const rate = toNumber(item.rate)

      if (item.product_id === '' || quantity === null || rate === null) {
        return {
          error: `Item ${index + 1} is incomplete. Select a product and enter quantity and rate.`,
        }
      }

      if (quantity <= 0 || rate < 0) {
        return {
          error: `Item ${index + 1} has invalid quantity or rate.`,
        }
      }

      createItems.push({
        product_id: item.product_id,
        quantity,
        rate,
      })
    }

    const uniqueProductIds = new Set(createItems.map((item) => item.product_id))
    if (uniqueProductIds.size !== createItems.length) {
      return { error: 'Each product can only be used once per invoice.' }
    }

    return {
      payload: {
        client_id: clientId,
        invoice_type: 'SALE',
        invoice_date: invoiceDate,
        status,
        items: createItems,
      },
    }
  }

  const submitInvoice = async (status: InvoiceWritableStatus) => {
    setErrorMessage(null)

    const result = buildPayload(status)
    if ('error' in result) {
      setErrorMessage(result.error)
      return
    }

    const selectedClient = clients.find((client) => client.id === clientId)
    if (selectedClient === undefined) {
      setErrorMessage('Selected client was not found.')
      return
    }

    setIsSubmitting(true)

    try {
      const created = await createInvoice(result.payload)
      const summary: InvoiceSummary = {
        id: created.invoice_id,
        invoice_number: created.invoice_number,
        invoice_type: 'SALE',
        status: result.payload.status,
        invoice_date: result.payload.invoice_date,
        subtotal: String(created.subtotal),
        cgst_amount: String(created.cgstAmount),
        sgst_amount: String(created.sgstAmount),
        igst_amount: String(created.igstAmount),
        grand_total: String(created.grandTotal),
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        client_business: selectedClient.client_business,
      }
      dispatch(invoiceCreated(summary))
      navigate('/invoices', { replace: true })
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = (event: FormEvent) => {
    event.preventDefault()
    void submitInvoice('DRAFT')
  }

  const handleSaveComplete = (event: FormEvent) => {
    event.preventDefault()
    void submitInvoice('COMPLETE')
  }

  const handleCancel = () => {
    navigate('/invoices')
  }

  if (isReferenceLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress aria-label="Loading invoice form data" />
      </Box>
    )
  }

  return (
    <Stack spacing={3} component="form">
      <Typography variant="h4" component="h1">
        Create Invoice
      </Typography>

      {(errorMessage !== null || referenceError !== null) && (
        <Alert severity="error">{errorMessage ?? referenceError}</Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            Invoice details
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth required>
              <InputLabel id="invoice-client-label">Client</InputLabel>
              <Select
                labelId="invoice-client-label"
                label="Client"
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                disabled={isSubmitting}
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name} — {client.client_business}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Invoice date"
              type="date"
              value={invoiceDate}
              onChange={(event) => setInvoiceDate(event.target.value)}
              required
              fullWidth
              disabled={isSubmitting}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Invoice type"
              value="SALE"
              fullWidth
              disabled
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            Items
          </Typography>
          <TableContainer>
            <Table aria-label="invoice items form">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>HSN</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell align="right">GST %</TableCell>
                  <TableCell width={120}>Quantity</TableCell>
                  <TableCell width={140}>Rate</TableCell>
                  <TableCell width={140} align="right">
                    Line total
                  </TableCell>
                  <TableCell width={72} align="right">
                    Remove
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  const quantity = toNumber(item.quantity)
                  const rate = toNumber(item.rate)
                  const lineTotal =
                    quantity !== null && rate !== null ? quantity * rate : null
                  const availableProducts = getAvailableProductsForRow(item)
                  const selectedProduct = products.find(
                    (product) => product.id === item.product_id,
                  )
                  const gstPercent =
                    selectedProduct === undefined
                      ? null
                      : Number(selectedProduct.gst_percent)
                  const gstAmount =
                    lineTotal !== null &&
                    gstPercent !== null &&
                    !Number.isNaN(gstPercent)
                      ? (lineTotal * gstPercent) / 100
                      : null

                  return (
                    <TableRow key={item.keyId}>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <InputLabel id={`product-${item.keyId}`}>Product</InputLabel>
                          <Select
                            labelId={`product-${item.keyId}`}
                            label="Product"
                            value={item.product_id}
                            onChange={updateItemField(item.keyId, 'product_id')}
                            disabled={isSubmitting}
                          >
                            {availableProducts.map((product) => (
                              <MenuItem key={product.id} value={product.id}>
                                {product.product_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {selectedProduct?.hsn_code ?? '—'}
                      </TableCell>
                      <TableCell>{selectedProduct?.unit ?? '—'}</TableCell>
                      <TableCell align="right">
                        {selectedProduct === undefined
                          ? '—'
                          : `${selectedProduct.gst_percent}%`}
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={updateItemField(item.keyId, 'quantity')}
                          disabled={isSubmitting}
                          fullWidth
                          slotProps={{ htmlInput: { min: 1, step: 'any' } }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.rate}
                          onChange={updateItemField(item.keyId, 'rate')}
                          disabled={isSubmitting}
                          fullWidth
                          slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack spacing={0.25} sx={{ alignItems: 'flex-end' }}>
                          <Typography variant="body2">
                            {lineTotal === null ? '—' : formatMoney(lineTotal)}
                          </Typography>
                          {gstAmount !== null && (
                            <Typography variant="caption" color="text.secondary">
                              GST {formatMoney(gstAmount)}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label="Remove invoice item"
                          onClick={() => handleRemoveItem(item.keyId)}
                          disabled={items.length <= 1 || isSubmitting}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box>
            <Button
              type="button"
              variant="outlined"
              onClick={handleAddItem}
              disabled={isSubmitting}
            >
              + Add Item
            </Button>
          </Box>

          <Typography variant="subtitle1" sx={{ textAlign: 'right' }}>
            Subtotal preview: {formatMoney(previewSubtotal)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
            Final GST and totals are calculated by the backend.
          </Typography>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <Button
          type="button"
          variant="outlined"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outlined"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving…' : 'Save as Draft'}
        </Button>
        <Button
          type="button"
          variant="contained"
          onClick={handleSaveComplete}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving…' : 'Save'}
        </Button>
      </Box>
    </Stack>
  )
}
