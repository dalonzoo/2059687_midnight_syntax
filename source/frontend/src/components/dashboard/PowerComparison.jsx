import { useMemo } from "react";
import { Zap, AlertTriangle, CheckCircle2 } from "lucide-react";

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
    const solarKw = getMetric(solarArray, "power_kw")?.value ?? 0;

    if (busKw == null || consumptionKw == null) return null;

    // Calculating Power rules
    const totalSupplyKw = busKw + solarKw;
    const delta = totalSupplyKw - consumptionKw;
    const isDeficit = delta < 0;
    const isBalanced = Math.abs(delta) < 0.01;
    const previousDelta =
      (powerBus?.previous_measurements?.power_kw ?? busKw) +
      (solarArray?.previous_measurements?.power_kw ?? solarKw) -
      (powerConsumption?.previous_measurements?.power_kw ?? consumptionKw);

    const deltaChange = delta - previousDelta;
    const isImproving = deltaChange > 0;
    const isWorsening = deltaChange < 0;

    return {
      busKw,
      consumptionKw,
      solarKw,
      totalSupplyKw,
      delta,
      isDeficit,
      isBalanced,
      deltaChange,
      isImproving,
      isWorsening,
    };
  }, [powerBus, powerConsumption, solarArray]);

  if (!stats) return null;

  return (
    <div
      className={`rounded-[28px] border p-6 backdrop-blur-sm transition-all duration-300 ${
        stats.isDeficit
          ? "border-red-500/40 bg-red-500/5"
          : "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.08)]"
      }`}
    >
      {stats.isDeficit ? (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="text-red-400" size={20} />
          <div>
            <p className="text-sm font-semibold text-red-300">Power Deficit Detected -- WE MIGHT DIE SOON</p>
            <p className="text-xs text-red-400/80">
              Consumption exceeds total supply by{" "}
              <span className="font-bold">{Math.abs(stats.delta).toFixed(2)} kW</span>.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <CheckCircle2 className="text-emerald-400" size={20} />
          <div>
            <p className="text-sm font-semibold text-emerald-300">WE WONT DIE </p>
            <p className="text-xs text-emerald-400/80">
              Total supply exceeds consumption by{" "}
              <span className="font-bold">{stats.delta.toFixed(2)} kW</span>.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center gap-2">
        <Zap className={stats.isDeficit ? "text-amber-400" : "text-emerald-400"} size={18} />
        <h3 className="text-lg font-semibold text-white">Power Balance</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricBlock
          label="Power Bus"
          value={stats.busKw}
          unit="kW"
          color="text-blue-300"
        />
        <MetricBlock
          label="Solar Output"
          value={stats.solarKw}
          unit="kW"
          color="text-yellow-300"
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

      <div className="mt-4 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background/30 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Supply
          </p>
          <p className="text-2xl font-bold text-emerald-300">
            {stats.totalSupplyKw.toFixed(2)}{" "}
            <span className="text-sm font-normal text-muted-foreground">kW</span>
          </p>
        </div>

        
      </div>
    </div>
  );
}

function MetricBlock({ label, value, unit, color, prefix = "" }) {
  return (
    <div className="rounded-2xl border border-border bg-background/30 p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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