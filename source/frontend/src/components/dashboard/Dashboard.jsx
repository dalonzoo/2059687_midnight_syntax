/**
 * Dashboard.jsx — Main sensor monitoring dashboard.
 *
 * Displays a grid of SensorCard components with live values,
 * updated in real-time via WebSocket.
 */
import React from 'react';
import { Grid, Typography } from '@mui/material';
import SensorCard from './SensorCard';
import useSensorData from '../../hooks/useSensorData';

function Dashboard() {
  const { sensors } = useSensorData();
  const sensorIds = Object.keys(sensors);

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Sensor Dashboard
      </Typography>
      {sensorIds.length === 0 ? (
        <Typography color="text.secondary">
          Waiting for sensor data...
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {sensorIds.map((id) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={id}>
              <SensorCard sensorId={id} event={sensors[id]} />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}

export default Dashboard;
