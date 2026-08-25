import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useAppSelector } from '../store/hooks'
import { selectCompany } from '../store/store'

function displayValue(value: string | null): string {
  if (value === null || value.trim() === '') {
    return '—'
  }
  return value
}

export default function CompanyPage() {
  const company = useAppSelector(selectCompany)

  if (company === null) {
    return null
  }

  const fields = [
    { label: 'Company name', value: company.name },
    { label: 'Owner', value: company.owner },
    { label: 'Email', value: company.email },
    { label: 'Phone', value: displayValue(company.phone) },
    { label: 'PAN', value: displayValue(company.pan) },
    { label: 'GSTIN', value: displayValue(company.gstin) },
    { label: 'Address', value: displayValue(company.address) },
    { label: 'State', value: displayValue(company.state) },
    { label: 'Invoice prefix', value: company.invoice_prefix },
    { label: 'Bank name', value: displayValue(company.bank_name) },
    { label: 'Branch', value: displayValue(company.branch) },
  ]

  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">
        Company
      </Typography>
      {fields.map((field) => (
        <Stack key={field.label} spacing={0.5}>
          <Typography variant="subtitle2" color="text.secondary">
            {field.label}
          </Typography>
          <Typography>{field.value}</Typography>
        </Stack>
      ))}
    </Stack>
  )
}
