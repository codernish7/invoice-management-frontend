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
import { loginCompany } from '../api/auth'
import { setCompanyFromAuth } from '../store/companySlice'
import { useAppDispatch } from '../store/hooks'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const company = await loginCompany({ email, password })
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
          Login
        </Typography>
        {errorMessage !== null && <Alert severity="error">{errorMessage}</Alert>}
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
          autoComplete="current-password"
        />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Login'}
        </Button>
        <Typography>
          Don&apos;t have an account?{' '}
          <Link component={RouterLink} to="/auth/signup">
            Sign up
          </Link>
        </Typography>
      </Stack>
    </Box>
  )
}
