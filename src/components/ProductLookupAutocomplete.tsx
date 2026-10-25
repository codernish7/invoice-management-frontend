import { useMemo, useRef, useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import { getProducts } from '../api/products'
import { useRemotePaginatedLookup } from '../hooks/useRemotePaginatedLookup'
import type { Product } from '../types/product'

type ProductLookupAutocompleteProps = {
  value: Product | null
  onChange: (product: Product | null) => void
  excludedIds?: string[]
  disabled?: boolean
  label?: string
  size?: 'small' | 'medium'
}

function productLabel(product: Product): string {
  return `${product.product_name} (${product.hsn_code})`
}

export default function ProductLookupAutocomplete({
  value,
  onChange,
  excludedIds = [],
  disabled = false,
  label = 'Product',
  size = 'small',
}: ProductLookupAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const lookup = useRemotePaginatedLookup<Product>({
    getId: (product) => product.id,
    fetchPage: async ({ page, search, limit, signal }) => {
      const result = await getProducts(
        { page, limit, search: search === '' ? undefined : search },
        { signal },
      )
      return {
        items: result.products,
        hasNextPage: result.pagination.hasNextPage,
        page: result.pagination.page,
      }
    },
  })

  const options = useMemo(() => {
    const excluded = new Set(excludedIds.filter((id) => id !== value?.id))
    const merged =
      value !== null && !lookup.items.some((product) => product.id === value.id)
        ? [value, ...lookup.items]
        : lookup.items
    return merged.filter((product) => !excluded.has(product.id))
  }, [excludedIds, lookup.items, value])

  const valueLabel = value === null ? '' : productLabel(value)
  const [inputValue, setInputValue] = useState(valueLabel)
  const [prevValueLabel, setPrevValueLabel] = useState(valueLabel)
  const pendingInputRef = useRef<string | null>(null)

  if (!open && valueLabel !== prevValueLabel) {
    setPrevValueLabel(valueLabel)
    setInputValue(valueLabel)
  }

  let noOptionsText = 'No products'
  if (lookup.loading) {
    noOptionsText = 'Loading…'
  } else if (lookup.error !== null && lookup.items.length === 0) {
    noOptionsText = `${lookup.error} Type or reopen to retry.`
  } else if (lookup.typedSearch.trim() !== '') {
    noOptionsText = 'No matching products'
  }

  return (
    <Autocomplete
      open={open}
      onOpen={() => {
        setOpen(true)
        lookup.handleOpen()
      }}
      onClose={() => {
        setOpen(false)
        lookup.setTypedSearch('')
        const pending = pendingInputRef.current
        pendingInputRef.current = null
        setInputValue(pending ?? valueLabel)
      }}
      options={options}
      value={value}
      inputValue={inputValue}
      onInputChange={(_event, nextInput, reason) => {
        if (reason === 'input') {
          setInputValue(nextInput)
          lookup.setTypedSearch(nextInput)
          return
        }
        if (reason === 'clear') {
          pendingInputRef.current = ''
          setInputValue('')
          lookup.setTypedSearch('')
        }
      }}
      onChange={(_event, nextValue) => {
        const nextLabel = nextValue === null ? '' : productLabel(nextValue)
        pendingInputRef.current = nextLabel
        setInputValue(nextLabel)
        onChange(nextValue)
      }}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      getOptionLabel={productLabel}
      filterOptions={(current) => current}
      loading={lookup.loading || lookup.loadingMore}
      disabled={disabled}
      fullWidth
      size={size}
      slotProps={{
        listbox: {
          onScroll: lookup.handleListScroll,
          sx: { maxHeight: 280 },
        },
      }}
      noOptionsText={noOptionsText}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props
        return (
          <li key={key ?? option.id} {...optionProps}>
            {productLabel(option)}
          </li>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={lookup.error !== null && lookup.items.length === 0}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {lookup.loading || lookup.loadingMore ? (
                    <CircularProgress color="inherit" size={16} />
                  ) : null}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  )
}
