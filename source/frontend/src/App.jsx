/**
 * App.jsx — Root application component.
 *
 * Sets up the MUI theme, defines routes, and provides the
 * layout shell (Sidebar + Header + content area).
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme from './theme';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import ActuatorPanel from './components/actuators/ActuatorPanel';
import RuleManager from './components/rules/RuleManager';
import EventLog from './components/events/EventLog';

/** Width of the sidebar navigation drawer (px). */
const SIDEBAR_WIDTH = 240;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar navigation */}
        <Sidebar width={SIDEBAR_WIDTH} />

        {/* Main content area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: `${SIDEBAR_WIDTH}px`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Header />
          <Box sx={{ p: 3, flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/actuators" element={<ActuatorPanel />} />
              <Route path="/rules" element={<RuleManager />} />
              <Route path="/events" element={<EventLog />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
