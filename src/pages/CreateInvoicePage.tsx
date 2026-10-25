import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
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
import { createInvoice } from '../api/invoices'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import ClientLookupAutocomplete from '../components/ClientLookupAutocomplete'
import ProductLookupAutocomplete from '../components/ProductLookupAutocomplete'
import { invoiceCreated } from '../store/invoicesSlice'
import { useAppDispatch } from '../store/hooks'
import type { Client } from '../types/client'
import type {
  CreateInvoiceInput,
  InvoiceSummary,
  InvoiceWritableStatus,
} from '../types/invoice'
import type { Product } from '../types/product'
import { formatMoney } from '../utils/format'

type InvoiceItemFormRow = {
  keyId: string
  product_id: string
  quantity: string
  rate: string
  productSnapshot: Product | null
}

function createBlankItemRow(): InvoiceItemFormRow {
  return {
    keyId: crypto.randomUUID(),
    product_id: '',
    quantity: '1',
    rate: '',
    productSnapshot: null,
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

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [invoiceDate, setInvoiceDate] = useState(todayInputValue())
  const [items, setItems] = useState<InvoiceItemFormRow[]>([createBlankItemRow()])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const updateItemField =
    (keyId: string, field: 'quantity' | 'rate') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleProductChange = (keyId: string, product: Product | null) => {
    setItems((current) =>
      current.map((item) =>
        item.keyId === keyId
          ? {
              ...item,
              product_id: product?.id ?? '',
              productSnapshot: product,
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
    if (selectedClient === null) {
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
        client_id: selectedClient.id,
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

    if (selectedClient === null) {
      setErrorMessage('Select a client.')
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

  return (
    <Stack
      spacing={2}
      component="form"
      sx={{ flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}
    >
      <Typography variant="h4" component="h1">
        Create Invoice
      </Typography>

      {errorMessage !== null && <Alert severity="error">{errorMessage}</Alert>}

      <Paper variant="outlined" sx={{ p: 2, flexShrink: 0 }}>
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            Invoice details
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <ClientLookupAutocomplete
              value={selectedClient}
              onChange={setSelectedClient}
              disabled={isSubmitting}
              required
            />
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

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Stack spacing={2} sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Typography variant="h6" component="h2">
            Items
          </Typography>
          <TableContainer sx={{ flex: 1, minHeight: 0 }}>
            <Table stickyHeader aria-label="invoice items form">
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
                  const selectedProduct =
                    item.productSnapshot !== null &&
                    item.productSnapshot.id === item.product_id
                      ? item.productSnapshot
                      : null
                  const gstPercent =
                    selectedProduct === null
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
                      <TableCell sx={{ minWidth: 240 }}>
                        <ProductLookupAutocomplete
                          value={selectedProduct}
                          onChange={(product) => {
                            handleProductChange(item.keyId, product)
                          }}
                          excludedIds={selectedProductIds.filter(
                            (id) => id !== item.product_id,
                          )}
                          disabled={isSubmitting}
                        />
                      </TableCell>
                      <TableCell>
                        {selectedProduct?.hsn_code ?? '—'}
                      </TableCell>
                      <TableCell>{selectedProduct?.unit ?? '—'}</TableCell>
                      <TableCell align="right">
                        {selectedProduct === null
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
          flexShrink: 0,
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
