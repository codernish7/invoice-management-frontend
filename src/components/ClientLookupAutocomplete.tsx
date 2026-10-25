import { useMemo, useRef, useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import { getClients } from '../api/clients'
import { useRemotePaginatedLookup } from '../hooks/useRemotePaginatedLookup'
import type { Client } from '../types/client'

type ClientLookupAutocompleteProps = {
  value: Client | null
  onChange: (client: Client | null) => void
  disabled?: boolean
  label?: string
  required?: boolean
}

function clientLabel(client: Client): string {
  return `${client.name} — ${client.client_business}`
}

export default function ClientLookupAutocomplete({
  value,
  onChange,
  disabled = false,
  label = 'Client',
  required = false,
}: ClientLookupAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const lookup = useRemotePaginatedLookup<Client>({
    getId: (client) => client.id,
    fetchPage: async ({ page, search, limit, signal }) => {
      const result = await getClients(
        { page, limit, search: search === '' ? undefined : search },
        { signal },
      )
      return {
        items: result.clients,
        hasNextPage: result.pagination.hasNextPage,
        page: result.pagination.page,
      }
    },
  })

  const options = useMemo(() => {
    if (value === null) {
      return lookup.items
    }
    if (lookup.items.some((client) => client.id === value.id)) {
      return lookup.items
    }
    return [value, ...lookup.items]
  }, [lookup.items, value])

  const valueLabel = value === null ? '' : clientLabel(value)
  const [inputValue, setInputValue] = useState(valueLabel)
  const [prevValueLabel, setPrevValueLabel] = useState(valueLabel)
  const pendingInputRef = useRef<string | null>(null)

  if (!open && valueLabel !== prevValueLabel) {
    setPrevValueLabel(valueLabel)
    setInputValue(valueLabel)
  }

  let noOptionsText = 'No clients'
  if (lookup.loading) {
    noOptionsText = 'Loading…'
  } else if (lookup.error !== null && lookup.items.length === 0) {
    noOptionsText = `${lookup.error} Type or reopen to retry.`
  } else if (lookup.typedSearch.trim() !== '') {
    noOptionsText = 'No matching clients'
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
        const nextLabel = nextValue === null ? '' : clientLabel(nextValue)
        pendingInputRef.current = nextLabel
        setInputValue(nextLabel)
        onChange(nextValue)
      }}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      getOptionLabel={clientLabel}
      filterOptions={(current) => current}
      loading={lookup.loading || lookup.loadingMore}
      disabled={disabled}
      fullWidth
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
            {clientLabel(option)}
          </li>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
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
