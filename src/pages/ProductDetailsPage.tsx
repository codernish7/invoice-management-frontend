import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useParams } from 'react-router-dom'

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">
        Product Details
      </Typography>
      <Typography color="text.secondary">
        Product ID: {id ?? '—'}
      </Typography>
      <Typography>This is the individual product page.</Typography>
    </Stack>
  )
}
