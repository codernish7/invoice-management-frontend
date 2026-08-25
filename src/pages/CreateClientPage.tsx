import { useState, type ChangeEvent, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import { createClient } from '../api/clients'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import { clientCreated } from '../store/clientsSlice'
import { useAppDispatch } from '../store/hooks'
import type { CreateClientRequest } from '../types/client'

type CreateClientFormState = {
  name: string
  email: string
  phone: string
  pan: string
  gstin: string
  address: string
  client_business: string
  onboarding_date: string
  state: string
}

const initialFormState: CreateClientFormState = {
  name: '',
  email: '',
  phone: '',
  pan: '',
  gstin: '',
  address: '',
  client_business: '',
  onboarding_date: '',
  state: '',
}

function inputToNullable(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function buildCreatePayload(form: CreateClientFormState): CreateClientRequest {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: inputToNullable(form.phone),
    pan: inputToNullable(form.pan),
    gstin: inputToNullable(form.gstin),
    address: inputToNullable(form.address),
    client_business: form.client_business.trim(),
    onboarding_date: form.onboarding_date,
    state: inputToNullable(form.state),
  }
}

export default function CreateClientPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [form, setForm] = useState<CreateClientFormState>(initialFormState)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField =
    (field: keyof CreateClientFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }

  const handleCancel = () => {
    navigate('/clients')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    const payload = buildCreatePayload(form)

    if (
      payload.name === '' ||
      payload.email === '' ||
      payload.client_business === '' ||
      payload.onboarding_date === ''
    ) {
      setErrorMessage('Name, email, business, and onboarding date are required.')
      return
    }

    setIsSubmitting(true)

    try {
      const client = await createClient(payload)
      dispatch(clientCreated(client))
      navigate('/clients', { replace: true })
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Stack spacing={3} component="form" onSubmit={handleSubmit}>
      <Typography variant="h4" component="h1">
        Create Client
      </Typography>

      {errorMessage !== null && <Alert severity="error">{errorMessage}</Alert>}

      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Name"
                name="name"
                value={form.name}
                onChange={updateField('name')}
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Business"
                name="client_business"
                value={form.client_business}
                onChange={updateField('client_business')}
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Email"
                type="email"
                name="email"
                value={form.email}
                onChange={updateField('email')}
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
                label="Onboarding date"
                type="date"
                name="onboarding_date"
                value={form.onboarding_date}
                onChange={updateField('onboarding_date')}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
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
