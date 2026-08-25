import { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'

export default function Navbar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Invoice Manager
        </Typography>
        <IconButton
          onClick={handleOpenMenu}
          size="small"
          aria-label="account menu"
          aria-controls={menuOpen ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? 'true' : undefined}
        >
          <Avatar sx={{ width: 32, height: 32 }} />
        </IconButton>
        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem component={RouterLink} to="/" onClick={handleCloseMenu}>
            Company
          </MenuItem>
          <MenuItem onClick={handleCloseMenu}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
