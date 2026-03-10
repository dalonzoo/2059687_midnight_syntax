import useSensorData from "../../hooks/useSensorData";
import StatCard from "./StatCard";
import SensorCard from "./SensorCard";
import FeaturedSensorCard from "./FeaturedSensorCard";
import SectionHeader from "./SectionHeader";
import useWebSocket from "../../hooks/useWebSocket";



const featuredSensors = [
  "greenhouse_temperature",
  "entrance_humidity",
  "co2_hall",
  "corridor_pressure",
];

function Dashboard() {

  const { isConnected } = useWebSocket();

  const { sensors, history, loading } = useSensorData();
  
  // Debugging
  // console.log("SENSORS OBJECT:", sensors);
  // console.log("FIRST SENSOR:", Object.values(sensors)[0]);

  const allSensors = Object.entries(sensors || {});

  // useful for segregation
  const restSensors = allSensors.filter(
    ([, event]) => event?.source_type === "rest"
  );

  const telemetrySensors = allSensors.filter(
    ([, event]) => event?.source_type === "telemetry"
  );
  const featured = allSensors.filter(([id]) => featuredSensors.includes(id));
  const rest = allSensors.filter(([id]) => !featuredSensors.includes(id));

  const warningCount = allSensors.filter(
    ([, event]) => String(event?.status || "").toLowerCase() === "warning"
  ).length;

  const okCount = allSensors.filter(
    ([, event]) => String(event?.status || "").toLowerCase() === "ok"
  ).length;

  if (loading) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card/70 p-8">
        <p className="text-muted-foreground">Loading sensor data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="border border-border/70 bg-card/50 p-6 backdrop-blur md:p-8 opacity-0 animate-fade-in-delay-1">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-sub">
              Mars Habitat
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Sensor Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Real-time habitat monitoring across environmental, energy, air
              quality, and life-support systems.
            </p>
          </div>

          <div
            className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm transition-colors ${
              isConnected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isConnected
                  ? "bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.9)]"
                  : "bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.8)]"
              }`}
            />
            {isConnected ? "Connected" : "Disconnected"}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Sensors"
            value={allSensors.length}
            subtext="Streaming in real time"
          />
          <StatCard
            label="Healthy Sensors"
            value={okCount}
            subtext="Operating within range"
          />
          <StatCard
            label="Warnings"
            value={warningCount}
            subtext="Require attention"
          />
          <StatCard
            label="Telemetry Feed"
            value= {isConnected ? "Live" : "Offline"}
            subtext="WebSocket + Backend"
          />
        </div>
      </section>

      {featured.length > 0 && (
        <section className="space-y-4 opacity-0 animate-fade-in-delay-3">
          <SectionHeader
            title="Priority Readings"
            subtitle="Key habitat metrics surfaced first for quick decisions."
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {featured.map(([sensorId, event]) => (
              <FeaturedSensorCard
                key={sensorId}
                sensorId={sensorId}
                event={event}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4 opacity-0 animate-fade-in-delay-4">
        <SectionHeader
          title="REST Sensors"
          subtitle="Current readings from environmental and subsystem sensors."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {restSensors.map(([sensorId, event]) => (
            <SensorCard key={sensorId} sensor={event} history={history?.[sensorId]}/>
          ))}
        </div>
      </section>

      <section className="space-y-4 opacity-0 animate-fade-in-delay-5">
        <SectionHeader
          title="Telemetry Topics"
          subtitle="Telemetry data streams paired with live monitoring charts."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {telemetrySensors.map(([sensorId, event]) => (
            <SensorCard key={sensorId} sensor={event} history={history?.[sensorId]}/>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;