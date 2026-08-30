import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useParams } from 'react-router-dom'
import { downloadInvoicePdf, getInvoice } from '../api/invoices'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import type { InvoiceDetails } from '../types/invoice'
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

export default function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [details, setDetails] = useState<InvoiceDetails | null>(null)
  const [isLoading, setIsLoading] = useState(id !== undefined)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    if (id === undefined) {
      return
    }

    const invoiceId = id
    let cancelled = false

    async function loadInvoice() {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const data = await getInvoice(invoiceId)
        if (cancelled) {
          return
        }
        setDetails(data)
      } catch (error) {
        if (cancelled) {
          return
        }
        setDetails(null)
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
  }, [id])

  if (id === undefined) {
    return <Alert severity="error">Invoice ID is missing.</Alert>
  }

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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress aria-label="Loading invoice details" />
      </Box>
    )
  }

  if (errorMessage !== null || details === null) {
    return <Alert severity="error">{errorMessage ?? 'Invoice not found.'}</Alert>
  }

  const { company, client, invoice, items, total_items } = details
  const canDownload = invoice.status === 'COMPLETE'

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
            Invoice {invoice.invoice_number}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip
              label={invoice.status}
              color={invoice.status === 'COMPLETE' ? 'success' : 'info'}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              {invoice.invoice_type} · {formatInvoiceDate(invoice.invoice_date)}
            </Typography>
          </Stack>
        </Stack>
        <Button
          variant="contained"
          onClick={() => {
            void handleDownload()
          }}
          disabled={!canDownload || isDownloading}
        >
          {isDownloading ? 'Downloading…' : 'Download'}
        </Button>
      </Stack>

      {downloadError !== null && <Alert severity="error">{downloadError}</Alert>}

      

      <SectionCard title="Client Information">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Client Name" value={client.name} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Business" value={client.client_business} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Email" value={client.email} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Phone" value={displayNullable(client.phone)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="GSTIN" value={displayNullable(client.gstin)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="PAN" value={displayNullable(client.pan)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="State" value={displayNullable(client.state)} />
          </Grid>
          <Grid size={12}>
            <DetailField label="Address" value={displayNullable(client.address)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Bank Name" value={displayNullable(client.bank_name)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Branch" value={displayNullable(client.branch)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField
              label="Account Number"
              value={displayNullable(client.account_number)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="IFSC" value={displayNullable(client.ifsc_code)} />
          </Grid>
        </Grid>
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
            <DetailField
              label="Invoice Date"
              value={formatInvoiceDate(invoice.invoice_date)}
            />
          </Grid>
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
            <DetailField label="Grand Total" value={formatMoney(invoice.grand_total)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Total Items" value={String(total_items)} />
          </Grid>
        </Grid>
      </SectionCard>

      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Invoice Items
          </Typography>
        </Box>
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
                  <TableCell align="right">{formatMoney(item.gst_amount)}</TableCell>
                  <TableCell align="right">{formatMoney(item.line_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  )
}
