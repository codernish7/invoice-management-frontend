export type PaginationMeta = {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type PaginatedApiSuccess<T> = {
  success: true
  message: string
  data: T
  pagination: PaginationMeta
}

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
export const MAX_LIMIT = 100
