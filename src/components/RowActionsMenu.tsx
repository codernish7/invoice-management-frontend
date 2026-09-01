import { useState, type MouseEvent } from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useNavigate } from 'react-router-dom'

export type RowActionPaths = {
  viewPath: string
  editPath: string
}

type RowActionsMenuProps = {
  entityId: string
  getPaths: (entityId: string) => RowActionPaths
  ariaLabel?: string
  onDownload?: () => void
  downloadDisabled?: boolean
  editDisabled?: boolean
}

export default function RowActionsMenu({
  entityId,
  getPaths,
  ariaLabel = 'Open actions menu',
  onDownload,
  downloadDisabled = false,
  editDisabled = false,
}: RowActionsMenuProps) {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleView = () => {
    const { viewPath } = getPaths(entityId)
    handleClose()
    navigate(viewPath)
  }

  const handleEdit = () => {
    if (editDisabled) {
      return
    }
    const { editPath } = getPaths(entityId)
    handleClose()
    navigate(editPath)
  }

  const handleDownload = () => {
    if (downloadDisabled || onDownload === undefined) {
      return
    }
    handleClose()
    onDownload()
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label={ariaLabel}
        aria-controls={menuOpen ? `row-actions-${entityId}` : undefined}
        aria-haspopup="true"
        aria-expanded={menuOpen ? 'true' : undefined}
        onClick={handleOpen}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        id={`row-actions-${entityId}`}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleView}>View</MenuItem>
        <MenuItem onClick={handleEdit} disabled={editDisabled}>
          Edit
        </MenuItem>
        {onDownload !== undefined && (
          <MenuItem onClick={handleDownload} disabled={downloadDisabled}>
            Download
          </MenuItem>
        )}
      </Menu>
    </>
  )
}
