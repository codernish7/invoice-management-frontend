import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
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
import { downloadInvoicePdf, getInvoices } from '../api/invoices'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import RowActionsMenu from '../components/RowActionsMenu'
import {
  invoicesFetchFailed,
  invoicesFetchStarted,
  invoicesFetchSucceeded,
} from '../store/invoicesSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  selectInvoices,
  selectInvoicesError,
  selectInvoicesHasFetched,
  selectInvoicesStatus,
} from '../store/store'
import { formatInvoiceDate, formatMoney, triggerBlobDownload } from '../utils/format'

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

export default function InvoicesPage() {
  const dispatch = useAppDispatch()
  const invoices = useAppSelector(selectInvoices)
  const status = useAppSelector(selectInvoicesStatus)
  const error = useAppSelector(selectInvoicesError)
  const hasFetched = useAppSelector(selectInvoicesHasFetched)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    if (hasFetched) {
      return
    }

    let cancelled = false

    async function loadInvoices() {
      dispatch(invoicesFetchStarted())
      try {
        const data = await getInvoices()
        if (cancelled) {
          return
        }
        dispatch(invoicesFetchSucceeded(data))
      } catch (err) {
        if (cancelled) {
          return
        }
        dispatch(invoicesFetchFailed(getApiErrorMessage(err)))
      }
    }

    void loadInvoices()

    return () => {
      cancelled = true
    }
  }, [dispatch, hasFetched])

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

  const isLoading = !hasFetched && status === 'loading'
  const showError = !hasFetched && status === 'failed' && error !== null
  const showEmpty = hasFetched && invoices.length === 0
  const showTable = hasFetched && invoices.length > 0

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
          Invoices
        </Typography>
        <Button component={RouterLink} to="/invoices/create" variant="contained">
          Create Invoice
        </Button>
      </Stack>

      {downloadError !== null && <Alert severity="error">{downloadError}</Alert>}

      {isLoading && (
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

      {showTable && (
        <TableContainer component={Paper} variant="outlined">
          <Table aria-label="invoices table">
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
    </Stack>
  )
}
