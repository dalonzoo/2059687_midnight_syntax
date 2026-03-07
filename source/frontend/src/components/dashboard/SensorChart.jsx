import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function SensorChart({ history = [], metric, unit = "" }) {
  const data = useMemo(() => {
    return history
      .map((event) => {
        const measurement = event?.measurements?.find((m) => m.metric === metric);
        if (!measurement) return null;

        const date = event?.timestamp ? new Date(event.timestamp) : null;

        return {
          value: typeof measurement.value === "number" ? measurement.value : null,
          label: date
            ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "--:--",
          fullTime: date ? date.toLocaleTimeString() : "Unknown time",
        };
      })
      .filter(Boolean);
  }, [history, metric]);

  if (!data.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-border bg-background/30">
        <span className="text-sm text-muted-foreground">Waiting for telemetry history...</span>
      </div>
    );
  }

  return (
    <div className="h-32 w-full rounded-2xl border border-border bg-background/30 px-2 pt-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="telemetryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--sub))" stopOpacity={0.5} />
              <stop offset="95%" stopColor="hsl(var(--sub))" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="label"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={20}
          />

          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
            domain={["auto", "auto"]}
          />

          <Tooltip
            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "16px",
              color: "white",
            }}
            formatter={(value) => [
              typeof value === "number" ? `${value.toFixed(2)} ${unit}` : value,
              metric,
            ]}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullTime || label}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--sub))"
            strokeWidth={2.5}
            fill="url(#telemetryFill)"
            dot={false}
            activeDot={{
              r: 4,
              stroke: "hsl(var(--sub))",
              strokeWidth: 2,
              fill: "hsl(var(--card))",
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SensorChart;