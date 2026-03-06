/**
 * SensorCard.jsx — Displays the latest reading for a single sensor.
 *
 * Shows sensor name, primary measurement value + unit, status badge,
 * and timestamp.
 */
import React from 'react';
import { Card, CardContent, Typography, Chip, Stack } from '@mui/material';
import StatusBadge from './StatusBadge';

function SensorCard({ sensorId, event }) {
  // Use the first measurement as the primary display value
  const primary = event?.measurements?.[0];

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        {/* Sensor name */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {sensorId}
        </Typography>

        {/* Primary value */}
        {primary ? (
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="h4" component="span">
              {typeof primary.value === 'number' ? primary.value.toFixed(2) : primary.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {primary.unit}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="h4" color="text.secondary">—</Typography>
        )}

        {/* Additional measurements (if any) */}
        {event?.measurements?.slice(1).map((m, i) => (
          <Typography key={i} variant="body2" color="text.secondary">
            {m.metric}: {m.value.toFixed(2)} {m.unit}
          </Typography>
        ))}

        {/* Status + timestamp */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
          <StatusBadge status={event?.status} />
          <Typography variant="caption" color="text.secondary">
            {event?.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default SensorCard;
