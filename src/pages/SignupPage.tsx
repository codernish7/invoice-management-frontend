import { useState, type FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import { signupCompany } from '../api/auth'
import { setCompanyFromAuth } from '../store/companySlice'
import { useAppDispatch } from '../store/hooks'

export default function SignupPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [owner, setOwner] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invoicePrefix, setInvoicePrefix] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const company = await signupCompany({
        owner,
        name,
        email,
        password,
        invoice_prefix: invoicePrefix,
      })
      dispatch(setCompanyFromAuth(company))
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 420 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Sign Up
        </Typography>
        {errorMessage !== null && <Alert severity="error">{errorMessage}</Alert>}
        <TextField
          label="Owner"
          name="owner"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          required
          fullWidth
          autoComplete="name"
        />
        <TextField
          label="Company name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          fullWidth
          autoComplete="organization"
        />
        <TextField
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          fullWidth
          autoComplete="email"
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          fullWidth
          autoComplete="new-password"
        />
        <TextField
          label="Invoice prefix"
          name="invoice_prefix"
          value={invoicePrefix}
          onChange={(event) => setInvoicePrefix(event.target.value)}
          required
          fullWidth
        />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Signing up…' : 'Sign Up'}
        </Button>
        <Typography>
          Already have an account?{' '}
          <Link component={RouterLink} to="/auth/login">
            Login
          </Link>
        </Typography>
      </Stack>
    </Box>
  )
}
