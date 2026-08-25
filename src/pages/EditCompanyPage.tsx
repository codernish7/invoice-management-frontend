import { useState, type ChangeEvent, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import { updateCompany } from '../api/company'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import { setCompany } from '../store/companySlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectCompany } from '../store/store'
import type { Company, UpdateCompanyRequest } from '../types/company'

type EditCompanyFormState = {
  owner: string
  name: string
  phone: string
  pan: string
  gstin: string
  address: string
  state: string
  invoice_prefix: string
  bank_name: string
  account_number: string
  ifsc_code: string
  branch: string
}

function nullableToInput(value: string | null): string {
  return value ?? ''
}

function inputToNullable(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function createFormState(company: Company): EditCompanyFormState {
  return {
    owner: company.owner,
    name: company.name,
    phone: nullableToInput(company.phone),
    pan: nullableToInput(company.pan),
    gstin: nullableToInput(company.gstin),
    address: nullableToInput(company.address),
    state: nullableToInput(company.state),
    invoice_prefix: company.invoice_prefix,
    bank_name: nullableToInput(company.bank_name),
    account_number: nullableToInput(company.account_number),
    ifsc_code: nullableToInput(company.ifsc_code),
    branch: nullableToInput(company.branch),
  }
}

function buildUpdatePayload(form: EditCompanyFormState): UpdateCompanyRequest {
  return {
    owner: form.owner.trim(),
    name: form.name.trim(),
    phone: inputToNullable(form.phone),
    pan: inputToNullable(form.pan),
    gstin: inputToNullable(form.gstin),
    address: inputToNullable(form.address),
    state: inputToNullable(form.state),
    invoice_prefix: form.invoice_prefix.trim(),
    bank_name: inputToNullable(form.bank_name),
    account_number: inputToNullable(form.account_number),
    ifsc_code: inputToNullable(form.ifsc_code),
    branch: inputToNullable(form.branch),
  }
}

export default function EditCompanyPage() {
  const company = useAppSelector(selectCompany)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [form, setForm] = useState<EditCompanyFormState | null>(() =>
    company === null ? null : createFormState(company),
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (company === null || form === null) {
    return null
  }

  const updateField =
    (field: keyof EditCompanyFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) =>
        current === null
          ? current
          : {
              ...current,
              [field]: event.target.value,
            },
      )
    }

  const handleCancel = () => {
    navigate('/')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    const payload = buildUpdatePayload(form)

    if (payload.owner === '' || payload.name === '' || payload.invoice_prefix === '') {
      setErrorMessage('Owner, company name, and invoice prefix are required.')
      return
    }

    setIsSubmitting(true)

    try {
      const updatedCompany = await updateCompany(payload)
      dispatch(setCompany(updatedCompany))
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Stack spacing={3} component="form" onSubmit={handleSubmit}>
      <Typography variant="h4" component="h1">
        Edit Company
      </Typography>

      {errorMessage !== null && <Alert severity="error">{errorMessage}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Company Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Owner"
                name="owner"
                value={form.owner}
                onChange={updateField('owner')}
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Company name"
                name="name"
                value={form.name}
                onChange={updateField('name')}
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={updateField('phone')}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Business / Tax Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="PAN"
                name="pan"
                value={form.pan}
                onChange={updateField('pan')}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="GSTIN"
                name="gstin"
                value={form.gstin}
                onChange={updateField('gstin')}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="State"
                name="state"
                value={form.state}
                onChange={updateField('state')}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Invoice prefix"
                name="invoice_prefix"
                value={form.invoice_prefix}
                onChange={updateField('invoice_prefix')}
                required
                fullWidth
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Address"
                name="address"
                value={form.address}
                onChange={updateField('address')}
                fullWidth
                multiline
                minRows={2}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Bank Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Bank name"
                name="bank_name"
                value={form.bank_name}
                onChange={updateField('bank_name')}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Branch"
                name="branch"
                value={form.branch}
                onChange={updateField('branch')}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Account number"
                name="account_number"
                value={form.account_number}
                onChange={updateField('account_number')}
                fullWidth
                helperText="Enter the plaintext account number. The backend encrypts it."
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="IFSC code"
                name="ifsc_code"
                value={form.ifsc_code}
                onChange={updateField('ifsc_code')}
                fullWidth
                helperText="Enter the plaintext IFSC code. The backend encrypts it."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save'}
        </Button>
      </Box>
    </Stack>
  )
}
