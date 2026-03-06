/**
 * EventLog.jsx — Real-time event log.
 *
 * Displays a scrolling list of actuator trigger events received via WebSocket.
 */
import React from 'react';
import {
  Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import useSensorData from '../../hooks/useSensorData';

function EventLog() {
  const { actuatorEvents } = useSensorData();

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Event Log
      </Typography>
      {actuatorEvents.length === 0 ? (
        <Typography color="text.secondary">
          No events yet. Rule-triggered actuator changes will appear here.
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Actuator</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Rule #</TableCell>
                <TableCell>Triggered By Sensor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {actuatorEvents.slice().reverse().map((evt, i) => (
                <TableRow key={i}>
                  <TableCell>
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : '—'}
                  </TableCell>
                  <TableCell>{evt.actuator_name}</TableCell>
                  <TableCell>{evt.state}</TableCell>
                  <TableCell>{evt.triggered_by_rule ?? '—'}</TableCell>
                  <TableCell>{evt.sensor_id ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}

export default EventLog;
