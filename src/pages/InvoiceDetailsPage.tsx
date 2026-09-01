import type { ReactNode, ChangeEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
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
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getClients } from '../api/clients'
import {
  downloadInvoicePdf,
  getInvoice,
  updateInvoice,
} from '../api/invoices'
import { getProducts } from '../api/products'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import {
  clientsFetchFailed,
  clientsFetchStarted,
  clientsFetchSucceeded,
} from '../store/clientsSlice'
import { invoiceUpdated } from '../store/invoicesSlice'
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
  selectInvoices,
  selectProducts,
  selectProductsHasFetched,
  selectProductsStatus,
} from '../store/store'
import type {
  InvoiceDetails,
  InvoiceSummary,
  InvoiceWritableStatus,
  UpdateInvoiceInput,
} from '../types/invoice'
import {
  displayNullable,
  formatInvoiceDate,
  formatMoney,
  triggerBlobDownload,
} from '../utils/format'

type DetailFieldProps = {
  label: string
  value: string
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ wordBreak: 'break-word' }}>{value}</Typography>
    </Stack>
  )
}

type SectionCardProps = {
  title: string
  children: ReactNode
}

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  )
}

type InvoiceItemFormRow = {
  keyId: string
  product_id: string
  quantity: string
  rate: string
}

type EditableInvoiceForm = {
  client_id: string
  invoice_type: 'SALE'
  invoice_date: string
  items: InvoiceItemFormRow[]
}

function toDateInputValue(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createBlankItemRow(): InvoiceItemFormRow {
  return {
    keyId: crypto.randomUUID(),
    product_id: '',
    quantity: '1',
    rate: '',
  }
}

function createEditableForm(details: InvoiceDetails): EditableInvoiceForm {
  return {
    client_id: details.client.id,
    invoice_type: 'SALE',
    invoice_date: toDateInputValue(details.invoice.invoice_date),
    items:
      details.items.length === 0
        ? [createBlankItemRow()]
        : details.items.map((item) => ({
            keyId: item.id,
            product_id: item.product_id,
            quantity: String(item.quantity),
            rate: String(Number(item.rate)),
          })),
  }
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

function moneyToSummaryString(value: string | number): string {
  return String(value)
}

export default function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isEditMode = /\/edit\/?$/.test(location.pathname)

  const clients = useAppSelector(selectClients)
  const clientsHasFetched = useAppSelector(selectClientsHasFetched)
  const clientsStatus = useAppSelector(selectClientsStatus)
  const products = useAppSelector(selectProducts)
  const productsHasFetched = useAppSelector(selectProductsHasFetched)
  const productsStatus = useAppSelector(selectProductsStatus)
  const invoiceSummaries = useAppSelector(selectInvoices)

  const [details, setDetails] = useState<InvoiceDetails | null>(null)
  const [editForm, setEditForm] = useState<EditableInvoiceForm | null>(null)
  const [isLoading, setIsLoading] = useState(id !== undefined)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [referenceError, setReferenceError] = useState<string | null>(null)

  useEffect(() => {
    if (id === undefined) {
      return
    }

    const invoiceId = id
    let cancelled = false

    async function loadInvoice() {
      setIsLoading(true)
      setErrorMessage(null)
      setSubmitError(null)
      setDownloadError(null)
      try {
        const data = await getInvoice(invoiceId)
        if (cancelled) {
          return
        }
        setDetails(data)
        if (isEditMode && data.invoice.status === 'DRAFT') {
          setEditForm(createEditableForm(data))
        } else {
          setEditForm(null)
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        setDetails(null)
        setEditForm(null)
        setErrorMessage(getApiErrorMessage(error))
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInvoice()

    return () => {
      cancelled = true
    }
  }, [id, isEditMode])

  useEffect(() => {
    if (!isEditMode) {
      return
    }

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
  }, [clientsHasFetched, dispatch, isEditMode, productsHasFetched])

  const isReferenceLoading =
    isEditMode &&
    ((!clientsHasFetched && clientsStatus === 'loading') ||
      (!productsHasFetched && productsStatus === 'loading'))

  const selectedProductIds = useMemo(
    () =>
      editForm === null
        ? []
        : editForm.items.map((item) => item.product_id).filter((pid) => pid !== ''),
    [editForm],
  )

  if (id === undefined) {
    return <Alert severity="error">Invoice ID is missing.</Alert>
  }

  const getAvailableProductsForRow = (row: InvoiceItemFormRow) => {
    const selectedElsewhere = new Set(
      selectedProductIds.filter((pid) => pid !== row.product_id),
    )
    return products.filter(
      (product) =>
        !selectedElsewhere.has(product.id) || product.id === row.product_id,
    )
  }

  const selectedClient =
    editForm === null
      ? null
      : (clients.find((client) => client.id === editForm.client_id) ?? null)

  const displayClient =
    isEditMode && selectedClient !== null
      ? {
          id: selectedClient.id,
          name: selectedClient.name,
          email: selectedClient.email,
          phone: selectedClient.phone,
          gstin: selectedClient.gstin,
          pan: selectedClient.pan,
          address: selectedClient.address,
          state: selectedClient.state,
          client_business: selectedClient.client_business,
          bank_name: null as string | null,
          account_number: null as string | null,
          ifsc_code: null as string | null,
          branch: null as string | null,
        }
      : details?.client ?? null

  const handleDownload = async () => {
    if (details === null || isDownloading) {
      return
    }
    if (details.invoice.status !== 'COMPLETE') {
      return
    }

    setDownloadError(null)
    setIsDownloading(true)

    try {
      const blob = await downloadInvoicePdf(details.invoice.id)
      triggerBlobDownload(blob, `${details.invoice.invoice_number}.pdf`)
    } catch (error) {
      setDownloadError(getApiErrorMessage(error))
    } finally {
      setIsDownloading(false)
    }
  }

  const updateItemField =
    (keyId: string, field: 'product_id' | 'quantity' | 'rate') =>
    (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent,
    ) => {
      const value = event.target.value
      setEditForm((current) =>
        current === null
          ? current
          : {
              ...current,
              items: current.items.map((item) =>
                item.keyId === keyId
                  ? {
                      ...item,
                      [field]: value,
                    }
                  : item,
              ),
            },
      )
    }

  const handleAddItem = () => {
    setEditForm((current) =>
      current === null
        ? current
        : {
            ...current,
            items: [...current.items, createBlankItemRow()],
          },
    )
  }

  const handleRemoveItem = (keyId: string) => {
    setEditForm((current) => {
      if (current === null || current.items.length <= 1) {
        return current
      }
      return {
        ...current,
        items: current.items.filter((item) => item.keyId !== keyId),
      }
    })
  }

  const buildUpdatePayload = (
    status: InvoiceWritableStatus,
  ): { payload: UpdateInvoiceInput } | { error: string } => {
    if (editForm === null) {
      return { error: 'Invoice form is not ready.' }
    }
    if (editForm.client_id.trim() === '') {
      return { error: 'Select a client.' }
    }
    if (editForm.invoice_date.trim() === '') {
      return { error: 'Select an invoice date.' }
    }

    const activeItems = editForm.items.filter(
      (item) =>
        item.product_id !== '' ||
        item.quantity.trim() !== '' ||
        item.rate.trim() !== '',
    )

    if (activeItems.length === 0) {
      return { error: 'Add at least one invoice item.' }
    }

    const updateItems: UpdateInvoiceInput['items'] = []

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

      updateItems.push({
        product_id: item.product_id,
        quantity,
        rate,
      })
    }

    const uniqueProductIds = new Set(updateItems.map((item) => item.product_id))
    if (uniqueProductIds.size !== updateItems.length) {
      return { error: 'Each product can only be used once per invoice.' }
    }

    return {
      payload: {
        client_id: editForm.client_id,
        invoice_type: 'SALE',
        invoice_date: editForm.invoice_date,
        status,
        items: updateItems,
      },
    }
  }

  const submitUpdate = async (status: InvoiceWritableStatus) => {
    if (details === null || editForm === null) {
      return
    }

    setSubmitError(null)

    const result = buildUpdatePayload(status)
    if ('error' in result) {
      setSubmitError(result.error)
      return
    }

    const clientForSummary =
      clients.find((client) => client.id === result.payload.client_id) ?? null
    const existingSummary = invoiceSummaries.find(
      (invoice) => invoice.id === details.invoice.id,
    )

    setIsSubmitting(true)

    try {
      const updated = await updateInvoice(details.invoice.id, result.payload)

      const clientId = result.payload.client_id
      const clientName =
        clientForSummary?.name ??
        (clientId === details.client.id
          ? details.client.name
          : (existingSummary?.client_name ?? ''))
      const clientBusiness =
        clientForSummary?.client_business ??
        (clientId === details.client.id
          ? details.client.client_business
          : (existingSummary?.client_business ?? ''))

      const summary: InvoiceSummary = {
        id: updated.invoice_id,
        invoice_number: updated.invoice_number,
        invoice_type: updated.invoice_type,
        status: updated.status,
        invoice_date: updated.invoice_date,
        subtotal: moneyToSummaryString(updated.subtotal),
        cgst_amount: moneyToSummaryString(updated.cgstAmount),
        sgst_amount: moneyToSummaryString(updated.sgstAmount),
        igst_amount: moneyToSummaryString(updated.igstAmount),
        grand_total: moneyToSummaryString(updated.grandTotal),
        client_id: clientId,
        client_name: clientName,
        client_business: clientBusiness,
      }

      dispatch(invoiceUpdated(summary))
      navigate(`/invoices/${details.invoice.id}`, { replace: true })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    if (details === null) {
      navigate('/invoices')
      return
    }
    navigate(`/invoices/${details.invoice.id}`)
  }

  if (isLoading || isReferenceLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress aria-label="Loading invoice details" />
      </Box>
    )
  }

  if (errorMessage !== null || details === null) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{errorMessage ?? 'Invoice not found.'}</Alert>
        <Box>
          <Button component={RouterLink} to="/invoices" variant="outlined">
            Back to Invoices
          </Button>
        </Box>
      </Stack>
    )
  }

  if (isEditMode && details.invoice.status !== 'DRAFT') {
    return (
      <Stack spacing={2}>
        <Alert severity="warning">
          Only draft invoices can be edited. This invoice is{' '}
          {details.invoice.status}.
        </Alert>
        <Stack direction="row" spacing={2}>
          <Button
            component={RouterLink}
            to={`/invoices/${details.invoice.id}`}
            variant="contained"
          >
            View Invoice
          </Button>
          <Button component={RouterLink} to="/invoices" variant="outlined">
            Back to Invoices
          </Button>
        </Stack>
      </Stack>
    )
  }

  if (isEditMode && editForm === null) {
    return <Alert severity="error">Unable to open invoice for editing.</Alert>
  }

  const { company, invoice, items, total_items } = details
  const canDownload = !isEditMode && invoice.status === 'COMPLETE'
  const clientInfo = displayClient ?? details.client

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
        <Stack spacing={1}>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit Invoice' : 'Invoice'} {invoice.invoice_number}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip
              label={invoice.status}
              color={invoice.status === 'COMPLETE' ? 'success' : 'info'}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              {invoice.invoice_type}
              {!isEditMode && ` · ${formatInvoiceDate(invoice.invoice_date)}`}
            </Typography>
          </Stack>
        </Stack>

        {isEditMode ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                void submitUpdate('DRAFT')
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Save as Draft'}
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                void submitUpdate('COMPLETE')
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </Stack>
        ) : (
          <Button
            variant="contained"
            onClick={() => {
              void handleDownload()
            }}
            disabled={!canDownload || isDownloading}
          >
            {isDownloading ? 'Downloading…' : 'Download'}
          </Button>
        )}
      </Stack>

      {(downloadError !== null ||
        submitError !== null ||
        referenceError !== null) && (
        <Alert severity="error">
          {submitError ?? downloadError ?? referenceError}
        </Alert>
      )}

      <SectionCard title="Client Information">
        {isEditMode && editForm !== null ? (
          <Stack spacing={2}>
            <FormControl fullWidth required>
              <InputLabel id="edit-invoice-client-label">Client</InputLabel>
              <Select
                labelId="edit-invoice-client-label"
                label="Client"
                value={editForm.client_id}
                onChange={(event) =>
                  setEditForm((current) =>
                    current === null
                      ? current
                      : {
                          ...current,
                          client_id: event.target.value,
                        },
                  )
                }
                disabled={isSubmitting}
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name} — {client.client_business}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField label="Client Name" value={clientInfo.name} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField label="Business" value={clientInfo.client_business} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField label="Email" value={clientInfo.email} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField
                  label="Phone"
                  value={displayNullable(clientInfo.phone)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField
                  label="GSTIN"
                  value={displayNullable(clientInfo.gstin)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField label="PAN" value={displayNullable(clientInfo.pan)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField
                  label="State"
                  value={displayNullable(clientInfo.state)}
                />
              </Grid>
              <Grid size={12}>
                <DetailField
                  label="Address"
                  value={displayNullable(clientInfo.address)}
                />
              </Grid>
            </Grid>
          </Stack>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Client Name" value={clientInfo.name} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Business" value={clientInfo.client_business} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="Email" value={clientInfo.email} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Phone"
                value={displayNullable(clientInfo.phone)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="GSTIN"
                value={displayNullable(clientInfo.gstin)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField label="PAN" value={displayNullable(clientInfo.pan)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="State"
                value={displayNullable(clientInfo.state)}
              />
            </Grid>
            <Grid size={12}>
              <DetailField
                label="Address"
                value={displayNullable(clientInfo.address)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Bank Name"
                value={displayNullable(clientInfo.bank_name)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Branch"
                value={displayNullable(clientInfo.branch)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="Account Number"
                value={displayNullable(clientInfo.account_number)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailField
                label="IFSC"
                value={displayNullable(clientInfo.ifsc_code)}
              />
            </Grid>
          </Grid>
        )}
      </SectionCard>

      <SectionCard title="Company Information">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Company Name" value={company.name} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Owner" value={company.owner} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Email" value={company.email} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Phone" value={displayNullable(company.phone)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="GSTIN" value={displayNullable(company.gstin)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="PAN" value={displayNullable(company.pan)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="State" value={displayNullable(company.state)} />
          </Grid>
          <Grid size={12}>
            <DetailField label="Address" value={displayNullable(company.address)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Bank Name" value={displayNullable(company.bank_name)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Branch" value={displayNullable(company.branch)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField
              label="Account Number"
              value={displayNullable(company.account_number)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="IFSC" value={displayNullable(company.ifsc_code)} />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Invoice Information">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Invoice Number" value={invoice.invoice_number} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Invoice Type" value={invoice.invoice_type} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Status" value={invoice.status} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            {isEditMode && editForm !== null ? (
              <TextField
                label="Invoice Date"
                type="date"
                value={editForm.invoice_date}
                onChange={(event) =>
                  setEditForm((current) =>
                    current === null
                      ? current
                      : {
                          ...current,
                          invoice_date: event.target.value,
                        },
                  )
                }
                required
                fullWidth
                disabled={isSubmitting}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            ) : (
              <DetailField
                label="Invoice Date"
                value={formatInvoiceDate(invoice.invoice_date)}
              />
            )}
          </Grid>
          {!isEditMode && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField label="Subtotal" value={formatMoney(invoice.subtotal)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField label="CGST" value={formatMoney(invoice.cgst_amount)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField label="SGST" value={formatMoney(invoice.sgst_amount)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField label="IGST" value={formatMoney(invoice.igst_amount)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField
                  label="Grand Total"
                  value={formatMoney(invoice.grand_total)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField label="Total Items" value={String(total_items)} />
              </Grid>
            </>
          )}
          {isEditMode && (
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">
                Totals are recalculated by the backend when you save.
              </Typography>
            </Grid>
          )}
        </Grid>
      </SectionCard>

      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Invoice Items
          </Typography>
        </Box>
        {isEditMode && editForm !== null ? (
          <>
            <TableContainer>
              <Table aria-label="editable invoice items">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>HSN</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right">GST %</TableCell>
                    <TableCell width={120}>Qty</TableCell>
                    <TableCell width={140}>Rate</TableCell>
                    <TableCell align="right">Line Total</TableCell>
                    <TableCell width={72} align="right">
                      Remove
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editForm.items.map((item) => {
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
                            <InputLabel id={`edit-product-${item.keyId}`}>
                              Product
                            </InputLabel>
                            <Select
                              labelId={`edit-product-${item.keyId}`}
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
                        <TableCell>{selectedProduct?.hsn_code ?? '—'}</TableCell>
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
                            disabled={editForm.items.length <= 1 || isSubmitting}
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
            <Box sx={{ p: 2 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={handleAddItem}
                disabled={isSubmitting}
              >
                + Add Item
              </Button>
            </Box>
          </>
        ) : (
          <TableContainer>
            <Table aria-label="invoice items">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>HSN</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">GST %</TableCell>
                  <TableCell align="right">GST Amount</TableCell>
                  <TableCell align="right">Line Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.hsn_code}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">{formatMoney(item.rate)}</TableCell>
                    <TableCell align="right">{item.gst_percent}%</TableCell>
                    <TableCell align="right">
                      {formatMoney(item.gst_amount)}
                    </TableCell>
                    <TableCell align="right">
                      {formatMoney(item.line_total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Stack>
  )
}
