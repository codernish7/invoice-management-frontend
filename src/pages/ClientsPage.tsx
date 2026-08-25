import { useEffect } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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
import { getClients } from '../api/clients'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import RowActionsMenu from '../components/RowActionsMenu'
import {
  clientsFetchFailed,
  clientsFetchStarted,
  clientsFetchSucceeded,
} from '../store/clientsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  selectClients,
  selectClientsError,
  selectClientsHasFetched,
  selectClientsStatus,
} from '../store/store'

function displayValue(value: string | null): string {
  if (value === null || value.trim() === '') {
    return '—'
  }
  return value
}

function getClientActionPaths(clientId: string) {
  return {
    viewPath: `/clients/${clientId}`,
    editPath: `/clients/${clientId}/edit`,
  }
}

export default function ClientsPage() {
  const dispatch = useAppDispatch()
  const clients = useAppSelector(selectClients)
  const status = useAppSelector(selectClientsStatus)
  const error = useAppSelector(selectClientsError)
  const hasFetched = useAppSelector(selectClientsHasFetched)

  useEffect(() => {
    if (hasFetched) {
      return
    }

    let cancelled = false

    async function loadClients() {
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
        dispatch(clientsFetchFailed(getApiErrorMessage(err)))
      }
    }

    void loadClients()

    return () => {
      cancelled = true
    }
  }, [dispatch, hasFetched])

  const isLoading = !hasFetched && status === 'loading'
  const showError = !hasFetched && status === 'failed' && error !== null
  const showEmpty = hasFetched && clients.length === 0
  const showTable = hasFetched && clients.length > 0

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
          Clients
        </Typography>
        <Button component={RouterLink} to="/clients/create" variant="contained">
          Create Client
        </Button>
      </Stack>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading clients" />
        </Box>
      )}

      {showError && <Alert severity="error">{error}</Alert>}

      {showEmpty && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <Typography color="text.secondary">No clients yet</Typography>
            <Button component={RouterLink} to="/clients/create" variant="contained">
              Create Client
            </Button>
          </Stack>
        </Paper>
      )}

      {showTable && (
        <TableContainer component={Paper} variant="outlined">
          <Table aria-label="clients table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Business</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>GSTIN</TableCell>
                <TableCell>State</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} hover>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.client_business}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{displayValue(client.phone)}</TableCell>
                  <TableCell>{displayValue(client.gstin)}</TableCell>
                  <TableCell>{displayValue(client.state)}</TableCell>
                  <TableCell align="right">
                    <RowActionsMenu
                      entityId={client.id}
                      getPaths={getClientActionPaths}
                      ariaLabel={`Actions for ${client.name}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  )
}
