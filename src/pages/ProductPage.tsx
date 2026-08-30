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
import { getProductById, updateProduct } from '../api/products'
import { getApiErrorMessage } from '../api/getApiErrorMessage'
import { productUpdated } from '../store/productsSlice'
import { useAppDispatch } from '../store/hooks'
import type { Product, UpdateProductInput } from '../types/product'

type ProductFormState = {
  product_name: string
  hsn_code: string
  unit: string
  gst_percent: string
}

function createFormState(product: Product): ProductFormState {
  const gstAsNumber = Number(product.gst_percent)
  return {
    product_name: product.product_name,
    hsn_code: product.hsn_code,
    unit: product.unit,
    gst_percent: Number.isNaN(gstAsNumber) ? '' : String(gstAsNumber),
  }
}

function buildUpdatePayload(
  form: ProductFormState,
): { payload: UpdateProductInput } | { error: string } {
  const productName = form.product_name.trim()
  const hsnCode = form.hsn_code.trim()
  const unit = form.unit.trim()
  const gstPercent = Number(form.gst_percent.trim())

  if (productName === '') {
    return { error: 'Product name is required.' }
  }
  if (hsnCode === '') {
    return { error: 'HSN code is required.' }
  }
  if (unit === '') {
    return { error: 'Unit is required.' }
  }
  if (form.gst_percent.trim() === '' || Number.isNaN(gstPercent)) {
    return { error: 'GST % must be a valid number.' }
  }
  if (gstPercent < 0) {
    return { error: 'GST % must be 0 or greater.' }
  }

  return {
    payload: {
      product_name: productName,
      hsn_code: hsnCode,
      unit,
      gst_percent: gstPercent,
    },
  }
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isEditMode = /\/edit\/?$/.test(location.pathname)

  const [form, setForm] = useState<ProductFormState | null>(null)
  const [isLoading, setIsLoading] = useState(id !== undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id === undefined) {
      return
    }

    const productId = id
    let cancelled = false

    async function loadProduct() {
      setIsLoading(true)
      setLoadError(null)
      setSubmitError(null)
      try {
        const product = await getProductById(productId)
        if (cancelled) {
          return
        }
        setForm(createFormState(product))
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

    void loadProduct()

    return () => {
      cancelled = true
    }
  }, [id, isEditMode])

  if (id === undefined) {
    return <Alert severity="error">Product ID is missing.</Alert>
  }

  const updateField =
    (field: keyof ProductFormState) =>
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
    navigate(`/products`)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isEditMode || form === null) {
      return
    }

    setSubmitError(null)
    const result = buildUpdatePayload(form)
    if ('error' in result) {
      setSubmitError(result.error)
      return
    }

    setIsSubmitting(true)

    try {
      const updatedProduct = await updateProduct(id, result.payload)
      dispatch(productUpdated(updatedProduct))
      navigate(`/products/${id}`, { replace: true })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress aria-label="Loading product" />
      </Box>
    )
  }

  if (loadError !== null || form === null) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{loadError ?? 'Product not found.'}</Alert>
        <Box>
          <Button component={RouterLink} to="/products" variant="outlined">
            Back to Products
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
            {isEditMode ? 'Edit Product' : 'Product Details'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditMode
              ? 'Update product information'
              : 'View-only product information'}
          </Typography>
        </Stack>

        {!isEditMode && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button component={RouterLink} to="/products" variant="outlined">
              Back to Products
            </Button>
            <Button
              component={RouterLink}
              to={`/products/${id}/edit`}
              variant="contained"
            >
              Edit Product
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
                label="Product name"
                name="product_name"
                value={form.product_name}
                onChange={updateField('product_name')}
                required={isEditMode}
                fullWidth
                slotProps={{
                  input: { readOnly: !isEditMode },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="HSN code"
                name="hsn_code"
                value={form.hsn_code}
                onChange={updateField('hsn_code')}
                required={isEditMode}
                fullWidth
                slotProps={{
                  input: { readOnly: !isEditMode },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Unit"
                name="unit"
                value={form.unit}
                onChange={updateField('unit')}
                required={isEditMode}
                fullWidth
                slotProps={{
                  input: { readOnly: !isEditMode },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="GST %"
                name="gst_percent"
                type={isEditMode ? 'number' : 'text'}
                value={form.gst_percent}
                onChange={updateField('gst_percent')}
                required={isEditMode}
                fullWidth
                slotProps={{
                  input: { readOnly: !isEditMode },
                  htmlInput: isEditMode ? { min: 0, step: 'any' } : undefined,
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
