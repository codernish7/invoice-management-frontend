export type InvoicesListNavigationState = {
  invoicesListSearch: string
}

export function isInvoicesListNavigationState(
  value: unknown,
): value is InvoicesListNavigationState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'invoicesListSearch' in value &&
    typeof (value as { invoicesListSearch: unknown }).invoicesListSearch === 'string'
  )
}

export function createInvoicesListNavigationState(
  search: string,
): InvoicesListNavigationState {
  return { invoicesListSearch: search }
}

export function getInvoicesListPath(state: unknown): string {
  if (isInvoicesListNavigationState(state)) {
    return `/invoices${state.invoicesListSearch}`
  }
  return '/invoices'
}
