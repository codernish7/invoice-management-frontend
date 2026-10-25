export type ClientsListNavigationState = {
  clientsListSearch: string
}

export function isClientsListNavigationState(
  value: unknown,
): value is ClientsListNavigationState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'clientsListSearch' in value &&
    typeof (value as { clientsListSearch: unknown }).clientsListSearch === 'string'
  )
}

export function createClientsListNavigationState(
  search: string,
): ClientsListNavigationState {
  return { clientsListSearch: search }
}

export function getClientsListPath(state: unknown): string {
  if (isClientsListNavigationState(state)) {
    return `/clients${state.clientsListSearch}`
  }
  return '/clients'
}
