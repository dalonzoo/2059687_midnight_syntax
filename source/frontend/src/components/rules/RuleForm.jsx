/**
 * RuleForm.jsx — Dialog form for creating or editing an automation rule.
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Stack,
} from '@mui/material';

/** Available operators for rule conditions. */
const OPERATORS = ['<', '<=', '=', '>', '>='];

/** Known actuators (from simulator). */
const ACTUATORS = ['cooling_fan', 'entrance_humidifier', 'hall_ventilation', 'habitat_heater'];

/** Actuator states. */
const STATES = ['ON', 'OFF'];

function RuleForm({ open, rule, onSave, onClose }) {
  const isEditing = !!rule?.id;

  const [form, setForm] = useState({
    sensor_name: '',
    metric: '',
    operator: '>',
    threshold: 0,
    unit: '',
    actuator_name: ACTUATORS[0],
    actuator_state: 'ON',
  });

  // Pre-fill form when editing an existing rule
  useEffect(() => {
    if (rule?.id) {
      setForm({
        sensor_name: rule.sensor_name || '',
        metric: rule.metric || '',
        operator: rule.operator || '>',
        threshold: rule.threshold || 0,
        unit: rule.unit || '',
        actuator_name: rule.actuator_name || ACTUATORS[0],
        actuator_state: rule.actuator_state || 'ON',
      });
    }
  }, [rule]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = () => {
    onSave({
      ...form,
      threshold: parseFloat(form.threshold),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Sensor Name"
            value={form.sensor_name}
            onChange={handleChange('sensor_name')}
            placeholder="e.g., greenhouse_temperature"
            fullWidth
          />
          <TextField
            label="Metric"
            value={form.metric}
            onChange={handleChange('metric')}
            placeholder="e.g., temperature"
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Operator"
              value={form.operator}
              onChange={handleChange('operator')}
              sx={{ minWidth: 100 }}
            >
              {OPERATORS.map((op) => (
                <MenuItem key={op} value={op}>{op}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Threshold"
              type="number"
              value={form.threshold}
              onChange={handleChange('threshold')}
              fullWidth
            />
            <TextField
              label="Unit (optional)"
              value={form.unit}
              onChange={handleChange('unit')}
              placeholder="°C"
              sx={{ minWidth: 120 }}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Actuator"
              value={form.actuator_name}
              onChange={handleChange('actuator_name')}
              fullWidth
            >
              {ACTUATORS.map((a) => (
                <MenuItem key={a} value={a}>{a.replace(/_/g, ' ')}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Set to"
              value={form.actuator_state}
              onChange={handleChange('actuator_state')}
              sx={{ minWidth: 100 }}
            >
              {STATES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {isEditing ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RuleForm;
