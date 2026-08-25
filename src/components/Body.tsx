import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { fetchCurrentCompany } from '../api/auth'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  hydrateCompany,
  hydrateUnauthenticated,
} from '../store/companySlice'
import { selectCompany, selectIsInitialized } from '../store/store'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

function isAuthRoute(pathname: string): boolean {
  return pathname === '/auth/login' || pathname === '/auth/signup'
}

export default function Body() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const company = useAppSelector(selectCompany)
  const isInitialized = useAppSelector(selectIsInitialized)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function hydrateAuth() {
      try {
        const currentCompany = await fetchCurrentCompany()
        if (cancelled) {
          return
        }
        dispatch(hydrateCompany(currentCompany))
      } catch {
        if (cancelled) {
          return
        }
        dispatch(hydrateUnauthenticated())
      }
    }

    void hydrateAuth()

    return () => {
      cancelled = true
    }
  }, [dispatch])

  if (!isInitialized) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress aria-label="Loading authentication" />
      </Box>
    )
  }

  const onAuthRoute = isAuthRoute(location.pathname)

  if (company === null && !onAuthRoute) {
    return <Navigate to="/auth/login" replace />
  }

  if (company !== null && onAuthRoute) {
    return <Navigate to="/" replace />
  }

  if (company === null) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Outlet />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded((open) => !open)}
        />
        <Box component="main" sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
