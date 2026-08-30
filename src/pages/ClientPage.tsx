import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getClientById, updateClient } from '../api/clients'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import { clientUpdated } from '../store/clientsSlice'
import { useAppDispatch } from '../store/hooks'
import type { Client, UpdateClientInput } from '../types/client'

type ClientFormState = {
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

function nullableToInput(value: string | null): string {
  return value ?? ''
}

function inputToNullable(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
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

function createFormState(client: Client): ClientFormState {
  return {
    name: client.name,
    email: client.email,
    phone: nullableToInput(client.phone),
    pan: nullableToInput(client.pan),
    gstin: nullableToInput(client.gstin),
    address: nullableToInput(client.address),
    client_business: client.client_business,
    onboarding_date: toDateInputValue(client.onboarding_date),
    state: nullableToInput(client.state),
  }
}

function buildUpdatePayload(form: ClientFormState): UpdateClientInput {
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

export default function ClientPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isEditMode = /\/edit\/?$/.test(location.pathname)

  const [form, setForm] = useState<ClientFormState | null>(null)
  const [isLoading, setIsLoading] = useState(id !== undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id === undefined) {
      return
    }

    const clientId = id
    let cancelled = false

    async function loadClient() {
      setIsLoading(true)
      setLoadError(null)
      setSubmitError(null)
      try {
        const client = await getClientById(clientId)
        if (cancelled) {
          return
        }
        setForm(createFormState(client))
      } catch (error) {
        if (cancelled) {
          return
        }
        setForm(null)
        setLoadError(getApiErrorMessage(error))
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadClient()

    return () => {
      cancelled = true
    }
  }, [id, isEditMode])

  if (id === undefined) {
    return <Alert severity="error">Client ID is missing.</Alert>
  }

  const updateField =
    (field: keyof ClientFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!isEditMode) {
        return
      }
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
    navigate(`/clients`)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isEditMode || form === null) {
      return
    }

    setSubmitError(null)
    const payload = buildUpdatePayload(form)

    if (
      payload.name === '' ||
      payload.email === '' ||
      payload.client_business === '' ||
      payload.onboarding_date === ''
    ) {
      setSubmitError('Name, email, business, and onboarding date are required.')
      return
    }

    setIsSubmitting(true)

    try {
      const updatedClient = await updateClient(id, payload)
      dispatch(clientUpdated(updatedClient))
      navigate(`/clients/${id}`, { replace: true })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress aria-label="Loading client" />
      </Box>
    )
  }

  if (loadError !== null || form === null) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{loadError ?? 'Client not found.'}</Alert>
        <Box>
          <Button component={RouterLink} to="/clients" variant="outlined">
            Back to Clients
          </Button>
        </Box>
      </Stack>
    )
  }

  return (
    <Stack
      spacing={3}
      component={isEditMode ? 'form' : 'div'}
      onSubmit={isEditMode ? handleSubmit : undefined}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit Client' : 'Client Details'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditMode
              ? 'Update client information'
              : 'View-only client information'}
          </Typography>
        </Stack>

        {!isEditMode && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button component={RouterLink} to="/clients" variant="outlined">
              Back
            </Button>
            <Button component={RouterLink} to={`/clients/${id}/edit`} variant="contained">
              Edit Client
            </Button>
          </Stack>
        )}
      </Stack>

      {isEditMode && submitError !== null && (
        <Alert severity="error">{submitError}</Alert>
      )}

      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Name"
                name="name"
                value={form.name}
                onChange={updateField('name')}
                required={isEditMode}
                fullWidth
                slotProps={{
                  input: { readOnly: !isEditMode },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Business"
                name="client_business"
                value={form.client_business}
                onChange={updateField('client_business')}
                required={isEditMode}
                fullWidth
                slotProps={{
                  input: { readOnly: !isEditMode },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Email"
                type="email"
                name="email"
                value={form.email}
                onChange={updateField('email')}
                required={isEditMode}
                fullWidth
                slotProps={{
                  input: { readOnly: !isEditMode },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={updateField('phone')}
                fullWidth
                slotProps={{
                  input: { readOnly: !isEditMode },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="PAN"
                name="pan"
                value={form.pan}
                onChange={updateField('pan')}
                fullWidth
                slotProps={{
                  input: { readOnly: !isEditMode },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="GSTIN"
                name="gstin"
                value={form.gstin}
                onChange={updateField('gstin')}
                fullWidth
                slotProps={{
                  input: { readOnly: !isEditMode },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="State"
                name="state"
                value={form.state}
                onChange={updateField('state')}
                fullWidth
                slotProps={{
                  input: { readOnly: !isEditMode },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Onboarding date"
                type="date"
                name="onboarding_date"
                value={form.onboarding_date}
                onChange={updateField('onboarding_date')}
                required={isEditMode}
                fullWidth
                slotProps={{
                  input: { readOnly: !isEditMode },
                  inputLabel: { shrink: true },
                }}
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
                slotProps={{
                  input: { readOnly: !isEditMode },
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {isEditMode && (
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
      )}
    </Stack>
  )
}
