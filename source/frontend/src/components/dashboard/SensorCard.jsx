import SensorChart from "./SensorChart";


function SensorCard({ sensor, history = [] }) {

  const measurement = sensor?.measurements?.[0];
  const isTelemetry = sensor?.source_type?.includes("telemetry");
  // needed for name extraction
  const displayName =
  sensor?.raw_topic?.split("/").pop() || sensor?.sensor_id;


  const value = measurement?.value;
  const unit = measurement?.unit ?? "";
  const metric = measurement?.metric ?? "No data";
  const status = sensor?.status ?? "unknown";
  const timestamp = sensor?.timestamp ?? "";

  return (
    <article className="rounded-[28px] border border-border bg-card/80 p-6 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-semibold text-white">
          {displayName}
        </h3>

        <span
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold uppercase ${
            status === "warning"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-8">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-white">
            {value !== undefined && value !== null ? value : "--"}
          </span>

          {unit && (
            <span className="pb-1 text-sm text-muted-foreground">
              {unit}
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          {metric}
        </p>

        {isTelemetry && (
          <div className="mt-6">
            <SensorChart
              history={history}
              metric={metric}
              unit={unit}
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
        <span>Last Update</span>
        <span>{new Date(timestamp).toLocaleTimeString()}</span>
      </div>
    </article>
  );
}

export default SensorCard;