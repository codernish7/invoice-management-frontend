import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useParams } from 'react-router-dom'

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>()

  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">
        Edit Invoice
      </Typography>
      <Typography color="text.secondary">
        Invoice ID: {id ?? '—'}
      </Typography>
      <Typography>
        Invoice editing will be implemented later.
      </Typography>
    </Stack>
  )
}
