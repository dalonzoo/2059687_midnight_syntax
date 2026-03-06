/**
 * Header.jsx — Top application bar.
 *
 * Displays the page title and a WebSocket connection status indicator.
 */
import React from 'react';
import { AppBar, Toolbar, Typography, Chip } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import useWebSocket from '../../hooks/useWebSocket';

function Header() {
  const { isConnected } = useWebSocket();

  return (
    <AppBar position="static" color="inherit" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Mars Habitat Monitoring
        </Typography>
        <Chip
          icon={<FiberManualRecordIcon sx={{ fontSize: 12 }} />}
          label={isConnected ? 'Live' : 'Disconnected'}
          color={isConnected ? 'success' : 'error'}
          size="small"
          variant="outlined"
        />
      </Toolbar>
    </AppBar>
  );
}

export default Header;
