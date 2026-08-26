import { useState, type ChangeEvent, type FormEvent } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import { createProducts } from '../api/products'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import { productsCreated } from '../store/productsSlice'
import { useAppDispatch } from '../store/hooks'
import type { CreateProductInput } from '../types/product'

type ProductFormRow = {
  keyId: string
  product_name: string
  hsn_code: string
  unit: string
  gst_percent: string
}

type ProductFormField = Exclude<keyof ProductFormRow, 'keyId'>

function createBlankRow(): ProductFormRow {
  return {
    keyId: crypto.randomUUID(),
    product_name: '',
    hsn_code: '',
    unit: '',
    gst_percent: '',
  }
}

function isRowCompletelyBlank(row: ProductFormRow): boolean {
  return (
    row.product_name.trim() === '' &&
    row.hsn_code.trim() === '' &&
    row.unit.trim() === '' &&
    row.gst_percent.trim() === ''
  )
}

function parseGstPercent(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }
  const parsed = Number(trimmed)
  if (Number.isNaN(parsed)) {
    return null
  }
  return parsed
}

function buildCreatePayload(
  rows: ProductFormRow[],
): { payload: CreateProductInput[] } | { error: string } {
  const activeRows = rows.filter((row) => !isRowCompletelyBlank(row))

  if (activeRows.length === 0) {
    return { error: 'Add at least one product before saving.' }
  }

  const payload: CreateProductInput[] = []

  for (const [index, row] of activeRows.entries()) {
    const productName = row.product_name.trim()
    const hsnCode = row.hsn_code.trim()
    const unit = row.unit.trim()
    const gstPercent = parseGstPercent(row.gst_percent)

    if (productName === '' || hsnCode === '' || unit === '' || gstPercent === null) {
      return {
        error: `Row ${index + 1} is incomplete. Fill product name, HSN code, unit, and a valid GST %.`,
      }
    }

    if (gstPercent < 0) {
      return {
        error: `Row ${index + 1} has an invalid GST %. Use a number of 0 or greater.`,
      }
    }

    payload.push({
      product_name: productName,
      hsn_code: hsnCode,
      unit,
      gst_percent: gstPercent,
    })
  }

  return { payload }
}

export default function CreateProductsPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [rows, setRows] = useState<ProductFormRow[]>([createBlankRow()])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField =
    (keyId: string, field: ProductFormField) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      setRows((current) =>
        current.map((row) =>
          row.keyId === keyId
            ? {
                ...row,
                [field]: value,
              }
            : row,
        ),
      )
    }

  const handleAddRow = () => {
    setRows((current) => [...current, createBlankRow()])
  }

  const handleRemoveRow = (keyId: string) => {
    setRows((current) => {
      if (current.length <= 1) {
        return current
      }
      return current.filter((row) => row.keyId !== keyId)
    })
  }

  const handleCancel = () => {
    navigate('/products')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    const result = buildCreatePayload(rows)
    if ('error' in result) {
      setErrorMessage(result.error)
      return
    }

    setIsSubmitting(true)

    try {
      const created = await createProducts(result.payload)
      dispatch(productsCreated(created))
      navigate('/products', { replace: true })
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Stack spacing={3} component="form" onSubmit={handleSubmit}>
      <Typography variant="h4" component="h1">
        Create Products
      </Typography>

      {errorMessage !== null && <Alert severity="error">{errorMessage}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="create products form">
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>HSN Code</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>GST %</TableCell>
              <TableCell align="right" width={72}>
                Remove
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.keyId}>
                <TableCell>
                  <TextField
                    name={`product_name-${row.keyId}`}
                    value={row.product_name}
                    onChange={updateField(row.keyId, 'product_name')}
                    size="small"
                    fullWidth
                    placeholder="Product name"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    name={`hsn_code-${row.keyId}`}
                    value={row.hsn_code}
                    onChange={updateField(row.keyId, 'hsn_code')}
                    size="small"
                    fullWidth
                    placeholder="HSN code"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    name={`unit-${row.keyId}`}
                    value={row.unit}
                    onChange={updateField(row.keyId, 'unit')}
                    size="small"
                    fullWidth
                    placeholder="Unit"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    name={`gst_percent-${row.keyId}`}
                    type="number"
                    value={row.gst_percent}
                    onChange={updateField(row.keyId, 'gst_percent')}
                    size="small"
                    fullWidth
                    placeholder="0"
                    slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    aria-label="Remove product row"
                    onClick={() => handleRemoveRow(row.keyId)}
                    disabled={rows.length <= 1 || isSubmitting}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box>
        <Button
          type="button"
          variant="outlined"
          onClick={handleAddRow}
          disabled={isSubmitting}
        >
          + Add Row
        </Button>
      </Box>

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
          {isSubmitting ? 'Saving…' : 'Save Products'}
        </Button>
      </Box>
    </Stack>
  )
}
