import Typography from '@mui/material/Typography'
import { useParams } from 'react-router-dom'

export default function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Invoice details
      </Typography>
      <Typography color="text.secondary">
        Invoice details placeholder for /invoices/{id ?? ':id'}.
      </Typography>
    </>
  )
}
