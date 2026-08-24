import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

function App() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography
        variant="h1"
        component="h1"
        gutterBottom
        sx={{ color: 'primary.main', fontWeight: 700 }}
      >
        Hello World
      </Typography>
      <Typography
        variant="body1"
        component="p"
        sx={{ color: 'text.secondary', lineHeight: 1.7 }}
      >
        This is a paragraph
      </Typography>
    </Container>
  )
}

export default App
