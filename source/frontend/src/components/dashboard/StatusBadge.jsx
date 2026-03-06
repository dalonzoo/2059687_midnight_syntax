/**
 * StatusBadge.jsx — Visual indicator for sensor status (ok / warning).
 */
import React from 'react';
import { Chip } from '@mui/material';

function StatusBadge({ status }) {
  const color = status === 'warning' ? 'warning' : 'success';
  const label = status || 'ok';

  return (
    <Chip
      label={label.toUpperCase()}
      color={color}
      size="small"
      variant="outlined"
    />
  );
}

export default StatusBadge;
