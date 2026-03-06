/**
 * SensorChart.jsx — Line chart widget for a sensor's recent values.
 *
 * Accumulates data points while the page is open and displays them
 * as a live-updating Recharts LineChart.
 */
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

/**
 * @param {string} sensorId - The sensor identifier.
 * @param {Array} history - Array of UnifiedEvent objects (chronological).
 * @param {string} [metric] - Which measurement metric to chart (default: first).
 */
function SensorChart({ sensorId, history = [], metric }) {
  // Transform history into chart data points
  const chartData = history.map((event) => {
    const m = metric
      ? event.measurements?.find((mm) => mm.metric === metric)
      : event.measurements?.[0];
    return {
      time: new Date(event.timestamp).toLocaleTimeString(),
      value: m?.value ?? 0,
    };
  });

  const displayMetric = metric || history[0]?.measurements?.[0]?.metric || 'value';
  const unit = history[0]?.measurements?.find((m) => m.metric === displayMetric)?.unit || '';

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          {sensorId} — {displayMetric} ({unit})
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#e65100"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default SensorChart;
