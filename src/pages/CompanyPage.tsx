import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import { selectCompany } from '../store/store'

function displayValue(value: string | null): string {
  if (value === null || value.trim() === '') {
    return 'Not provided'
  }
  return value
}

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

export default function CompanyPage() {
  const company = useAppSelector(selectCompany)

  if (company === null) {
    return null
  }

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
          Company
        </Typography>
        <Button component={RouterLink} to="/edit" variant="contained">
          Edit Company
        </Button>
      </Stack>

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
            <DetailField label="Phone" value={displayValue(company.phone)} />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Business / Tax Information">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="PAN" value={displayValue(company.pan)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="GSTIN" value={displayValue(company.gstin)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="State" value={displayValue(company.state)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Invoice Prefix" value={company.invoice_prefix} />
          </Grid>
          <Grid size={12}>
            <DetailField label="Address" value={displayValue(company.address)} />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Bank Information">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Bank Name" value={displayValue(company.bank_name)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="Branch" value={displayValue(company.branch)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField
              label="Account Number"
              value={displayValue(company.account_number)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DetailField label="IFSC Code" value={displayValue(company.ifsc_code)} />
          </Grid>
        </Grid>
      </SectionCard>
    </Stack>
  )
}
