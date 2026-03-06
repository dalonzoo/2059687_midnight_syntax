/**
 * RuleCard.jsx — Displays a single automation rule with edit/delete actions.
 */
import React from 'react';
import {
  Card, CardContent, Typography, IconButton, Stack, Switch, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function RuleCard({ rule, onEdit, onDelete, onToggle }) {
  return (
    <Card variant="outlined" sx={{ opacity: rule.enabled ? 1 : 0.5 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          {/* Rule description in human-readable format */}
          <Typography variant="body1">
            <strong>IF</strong> {rule.sensor_name}.{rule.metric} {rule.operator} {rule.threshold}
            {rule.unit ? ` ${rule.unit}` : ''}{' '}
            <strong>THEN</strong> set <em>{rule.actuator_name}</em> to{' '}
            <strong>{rule.actuator_state}</strong>
          </Typography>

          {/* Actions */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title={rule.enabled ? 'Disable' : 'Enable'}>
              <Switch
                checked={rule.enabled}
                onChange={onToggle}
                size="small"
                color="primary"
              />
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={onEdit}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={onDelete}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default RuleCard;
