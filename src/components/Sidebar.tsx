import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import { NavLink } from 'react-router-dom'

const COLLAPSED_WIDTH = 56
const EXPANDED_WIDTH = 220

const navItems = [
  { label: 'Invoices', to: '/invoices' },
  { label: 'Clients', to: '/clients' },
  { label: 'Products', to: '/products' },
] as const

type SidebarProps = {
  expanded: boolean
  onToggle: () => void
}

export default function Sidebar({ expanded, onToggle }: SidebarProps) {
  return (
    <Box
      component="nav"
      aria-label="main navigation"
      sx={{
        width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        flexShrink: 0,
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: expanded ? 'flex-end' : 'center', p: 0.5 }}>
        <IconButton
          onClick={onToggle}
          aria-label={expanded ? 'collapse sidebar' : 'expand sidebar'}
          size="small"
        >
          {expanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
      {expanded && (
        <List disablePadding>
          {navItems.map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              sx={{
                '&.active': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  )
}
