import { useMemo } from "react";
import { Zap, AlertTriangle } from "lucide-react";

function getMetric(sensor, metricName) {
  return sensor?.measurements?.find((m) => m.metric === metricName);
}

function PowerComparison({ sensors }) {
  const powerBus = sensors?.power_bus;
  const powerConsumption = sensors?.power_consumption;
  const solarArray = sensors?.solar_array;

  const stats = useMemo(() => {
    const busKw = getMetric(powerBus, "power_kw")?.value;
    const consumptionKw = getMetric(powerConsumption, "power_kw")?.value;
    const solarKw = getMetric(solarArray, "power_kw")?.value;

    if (busKw == null || consumptionKw == null) return null;

    const delta = busKw - consumptionKw;
    const isDeficit = delta < 0;

    return { busKw, consumptionKw, solarKw, delta, isDeficit };
  }, [powerBus, powerConsumption, solarArray]);

  if (!stats) return null;

  return (
    <div
      className={`rounded-[28px] border p-6 backdrop-blur-sm transition-colors ${
        stats.isDeficit
          ? "border-red-500/40 bg-red-500/5"
          : "border-emerald-500/30 bg-card/80"
      }`}
    >
      {stats.isDeficit && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="text-red-400" size={20} />
          <div>
            <p className="text-sm font-semibold text-red-300">Power Deficit Detected</p>
            <p className="text-xs text-red-400/80">
              Consumption exceeds bus supply by{" "}
              <span className="font-bold">{Math.abs(stats.delta).toFixed(2)} kW</span>.
              Consider reducing load or verifying solar output.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <Zap className="text-amber-400" size={18} />
        <h3 className="text-lg font-semibold text-white">Power Balance</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricBlock
          label="Power Bus"
          value={stats.busKw}
          unit="kW"
          color="text-blue-300"
        />
        <MetricBlock
          label="Consumption"
          value={stats.consumptionKw}
          unit="kW"
          color="text-amber-300"
        />
        <MetricBlock
          label="Balance"
          value={stats.delta}
          unit="kW"
          color={stats.isDeficit ? "text-red-400" : "text-emerald-400"}
          prefix={stats.delta > 0 ? "+" : ""}
        />
      </div>

      {stats.solarKw != null && (
        <div className="mt-4 border-t border-border pt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Solar Array Output</span>
          <span className="font-semibold text-yellow-300">
            {stats.solarKw.toFixed(2)} kW
          </span>
        </div>
      )}
    </div>
  );
}

function MetricBlock({ label, value, unit, color, prefix = "" }) {
  return (
    <div className="rounded-2xl border border-border bg-background/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </p>
      <p className={`text-2xl font-bold ${color}`}>
        {prefix}
        {value != null ? value.toFixed(2) : "--"}{" "}
        <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

export default PowerComparison;
