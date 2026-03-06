/**
 * ActuatorPanel.jsx — Displays all actuators with toggle switches.
 *
 * Fetches current actuator states on mount and allows manual toggling.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Grid } from '@mui/material';
import ActuatorCard from './ActuatorCard';
import api from '../../services/api';

function ActuatorPanel() {
  const [actuators, setActuators] = useState({});

  /** Fetch actuator states from the API. */
  const fetchActuators = useCallback(async () => {
    try {
      const res = await api.get('/api/actuators');
      setActuators(res.data.actuators || {});
    } catch (err) {
      console.error('Failed to fetch actuators:', err);
    }
  }, []);

  useEffect(() => {
    fetchActuators();
  }, [fetchActuators]);

  /** Toggle an actuator's state. */
  const handleToggle = async (name, currentState) => {
    const newState = currentState === 'ON' ? 'OFF' : 'ON';
    try {
      await api.post(`/api/actuators/${name}`, { state: newState });
      setActuators((prev) => ({ ...prev, [name]: newState }));
    } catch (err) {
      console.error(`Failed to toggle ${name}:`, err);
    }
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Actuator Control
      </Typography>
      <Grid container spacing={2}>
        {Object.entries(actuators).map(([name, state]) => (
          <Grid item xs={12} sm={6} md={3} key={name}>
            <ActuatorCard
              name={name}
              state={state}
              onToggle={() => handleToggle(name, state)}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
}

export default ActuatorPanel;
