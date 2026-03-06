/**
 * theme.js — MUI theme configuration.
 *
 * Mars-inspired color palette using warm tones (rust, amber, deep space).
 */
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#e65100', // Mars rust orange
    },
    secondary: {
      main: '#ffab00', // Amber accent
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    success: {
      main: '#66bb6a', // Green for "ok" status
    },
    warning: {
      main: '#ffa726', // Amber for "warning" status
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default theme;
