import StatusBadge from "./StatusBadge";
import { formatTime } from "../../utils/formatters";

function getMetricValue(event) {
  const measurement = event?.measurements?.[0];

  if (!measurement) {
    return { value: "--", unit: "" };
  }

  const rawValue = measurement.value;

  if (typeof rawValue === "number") {
    return {
      value: rawValue.toFixed(2),
      unit: measurement.unit || "",
    };
  }

  return {
    value: rawValue ?? "--",
    unit: measurement.unit || "",
  };
}

function FeaturedSensorCard({ sensorId, event }) {
  const metric = getMetricValue(event);

  return (
    <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-lg shadow-black/10 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium capitalize text-muted-foreground">
            {sensorId.replaceAll("_", " ")}
          </p>

          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-semibold tracking-tight text-white">
              {metric.value}
            </span>
            <span className="mb-1 text-lg text-muted-foreground">
              {metric.unit}
            </span>
          </div>
        </div>

        <StatusBadge status={event?.status} />
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>Last Update</span>
        <span>{formatTime(event?.timestamp)}</span>
      </div>
    </div>
  );
}

export default FeaturedSensorCard;