/**
 * Sidebar.jsx — Navigation sidebar component.
 *
 * Provides links to the main sections: Dashboard, Actuators, Rules, Events.
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import RuleIcon from '@mui/icons-material/Rule';
import EventNoteIcon from '@mui/icons-material/EventNote';

/** Navigation items — path, label, and icon. */
const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/actuators', label: 'Actuators', icon: <ToggleOnIcon /> },
  { path: '/rules', label: 'Rules', icon: <RuleIcon /> },
  { path: '/events', label: 'Events', icon: <EventNoteIcon /> },
];

function Sidebar({ width }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width, boxSizing: 'border-box' },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ color: 'primary.main', fontWeight: 700 }}>
          🔴 Mars Habitat
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;
