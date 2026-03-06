/**
 * ActuatorCard.jsx — Displays a single actuator with a toggle switch.
 */
import React from 'react';
import { Card, CardContent, Typography, Switch, Stack } from '@mui/material';

function ActuatorCard({ name, state, onToggle }) {
  const isOn = state === 'ON';

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {name.replace(/_/g, ' ').toUpperCase()}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" color={isOn ? 'success.main' : 'text.secondary'}>
            {state}
          </Typography>
          <Switch
            checked={isOn}
            onChange={onToggle}
            color="primary"
            inputProps={{ 'aria-label': `Toggle ${name}` }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default ActuatorCard;
