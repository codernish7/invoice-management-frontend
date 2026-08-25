import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useParams } from 'react-router-dom'

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">
        Edit Client
      </Typography>
      <Typography color="text.secondary">
        Client ID: {id ?? '—'}
      </Typography>
      <Typography>This is the edit client page.</Typography>
    </Stack>
  )
}
