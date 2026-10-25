import { useCallback, useEffect, useRef, useState, type UIEvent } from 'react'
import axios from 'axios'
import { getApiErrorMessage } from '../api/getApiErrorMessage'

export const LOOKUP_PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export type RemotePageResult<T> = {
  items: T[]
  hasNextPage: boolean
  page: number
}

type UseRemotePaginatedLookupArgs<T> = {
  fetchPage: (params: {
    page: number
    search: string
    limit: number
    signal: AbortSignal
  }) => Promise<RemotePageResult<T>>
  getId: (item: T) => string
}

function mergeUnique<T>(current: T[], incoming: T[], getId: (item: T) => string): T[] {
  const seen = new Set(current.map(getId))
  const next = [...current]
  for (const item of incoming) {
    const id = getId(item)
    if (!seen.has(id)) {
      seen.add(id)
      next.push(item)
    }
  }
  return next
}

export function useRemotePaginatedLookup<T>({
  fetchPage,
  getId,
}: UseRemotePaginatedLookupArgs<T>) {
  const [typedSearch, setTypedSearchState] = useState('')
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const inFlightKeyRef = useRef<string | null>(null)
  const committedSearchRef = useRef('')
  const loadedPageRef = useRef(0)
  const hasNextPageRef = useRef(false)
  const getIdRef = useRef(getId)
  const fetchPageRef = useRef(fetchPage)
  const hasOpenedRef = useRef(false)
  const errorRef = useRef<string | null>(null)
  const debounceRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    getIdRef.current = getId
    fetchPageRef.current = fetchPage
  }, [fetchPage, getId])

  useEffect(() => {
    errorRef.current = error
  }, [error])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (debounceRef.current !== undefined) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const loadPage = useCallback(async (page: number, search: string, append: boolean) => {
    const requestKey = `${search}::${page}`
    if (inFlightKeyRef.current === requestKey) {
      return
    }

    if (!append) {
      abortRef.current?.abort()
    } else if (loadingMoreRef.current) {
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    inFlightKeyRef.current = requestKey
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    if (append) {
      loadingMoreRef.current = true
      setLoadingMore(true)
    } else {
      loadingMoreRef.current = false
      setLoadingMore(false)
      setLoading(true)
    }
    setError(null)

    try {
      const result = await fetchPageRef.current({
        page,
        search,
        limit: LOOKUP_PAGE_SIZE,
        signal: controller.signal,
      })
      if (requestId !== requestIdRef.current) {
        return
      }

      setItems((current) =>
        append ? mergeUnique(current, result.items, getIdRef.current) : result.items,
      )
      loadedPageRef.current = result.page
      hasNextPageRef.current = result.hasNextPage
    } catch (err) {
      if (controller.signal.aborted || axios.isCancel(err)) {
        return
      }
      if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') {
        return
      }
      if (requestId !== requestIdRef.current) {
        return
      }
      if (!append) {
        setItems([])
        loadedPageRef.current = 0
        hasNextPageRef.current = false
      }
      setError(getApiErrorMessage(err))
    } finally {
      const isCurrent = requestId === requestIdRef.current
      if (inFlightKeyRef.current === requestKey) {
        inFlightKeyRef.current = null
      }
      if (isCurrent) {
        if (append) {
          loadingMoreRef.current = false
          setLoadingMore(false)
        } else {
          setLoading(false)
        }
      }
    }
  }, [])

  const handleOpen = useCallback(() => {
    const firstOpen = !hasOpenedRef.current
    hasOpenedRef.current = true
    if (firstOpen) {
      void loadPage(1, committedSearchRef.current, false)
      return
    }
    if (errorRef.current !== null) {
      const append = loadedPageRef.current > 0
      void loadPage(
        append ? loadedPageRef.current + 1 : 1,
        committedSearchRef.current,
        append,
      )
    }
  }, [loadPage])

  const setTypedSearch = useCallback(
    (next: string) => {
      setTypedSearchState(next)
      if (debounceRef.current !== undefined) {
        window.clearTimeout(debounceRef.current)
      }
      debounceRef.current = window.setTimeout(() => {
        const nextSearch = next.trim()
        if (nextSearch === committedSearchRef.current) {
          return
        }
        committedSearchRef.current = nextSearch
        if (!hasOpenedRef.current) {
          return
        }
        void loadPage(1, nextSearch, false)
      }, SEARCH_DEBOUNCE_MS)
    },
    [loadPage],
  )

  const loadMore = useCallback(() => {
    if (!hasNextPageRef.current || loadingMoreRef.current || inFlightKeyRef.current !== null) {
      return
    }
    void loadPage(loadedPageRef.current + 1, committedSearchRef.current, true)
  }, [loadPage])

  const retry = useCallback(() => {
    const append = loadedPageRef.current > 0
    void loadPage(
      append ? loadedPageRef.current + 1 : 1,
      committedSearchRef.current,
      append,
    )
  }, [loadPage])

  const handleListScroll = useCallback(
    (event: UIEvent<HTMLUListElement>) => {
      const listbox = event.currentTarget
      const remaining = listbox.scrollHeight - listbox.scrollTop - listbox.clientHeight
      if (remaining < 64) {
        loadMore()
      }
    },
    [loadMore],
  )

  return {
    items,
    loading,
    loadingMore,
    error,
    typedSearch,
    setTypedSearch,
    handleOpen,
    loadMore,
    retry,
    handleListScroll,
  }
}
