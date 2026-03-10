import useSensorData from "../../hooks/useSensorData";

function formatTime(timestamp) {
  if (!timestamp) return "—";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(timestamp) {
  if (!timestamp) return "—";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StateBadge({ state }) {
  const normalized = String(state || "").toUpperCase();
  const isOn = normalized === "ON";

  return (
    <span
      className={`inline-flex min-w-[64px] items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${
        isOn
          ? "border-success/30 bg-success/10 text-success"
          : "border-warning/30 bg-warning/10 text-warning"
      }`}
    >
      {normalized || "—"}
    </span>
  );
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function EventLog() {
  const { actuatorEvents } = useSensorData();
  const events = actuatorEvents.slice().reverse();

  return (
    <section className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-card-foreground">
            Event Log
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time actuator activity triggered by automation rules.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-sub" />
          <span className="text-sm text-muted-foreground">
            {events.length} {events.length === 1 ? "event" : "events"}
          </span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card/70 p-10 shadow-sm">
          <div className="mx-auto flex max-w-xl flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-primary/40">
              <span className="text-2xl">📡</span>
            </div>

            <h2 className="text-xl font-semibold text-card-foreground">
              No events yet
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Rule-triggered actuator changes will appear here once the system
              starts reacting to sensor conditions.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill>Live activity</Pill>
              <Pill>Newest first</Pill>
              <Pill>Rules + actuators</Pill>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-muted/60">
                  <th className="border-b border-border px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Time
                  </th>
                  <th className="border-b border-border px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Date
                  </th>
                  <th className="border-b border-border px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Actuator
                  </th>
                  <th className="border-b border-border px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    State
                  </th>
                  <th className="border-b border-border px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Rule #
                  </th>
                  <th className="border-b border-border px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Triggered By Sensor
                  </th>
                </tr>
              </thead>

              <tbody>
                {events.map((evt, index) => (
                  <tr
                    key={`${evt.timestamp ?? "event"}-${index}`}
                    className="transition-colors hover:bg-primary/20"
                  >
                    <td className="border-b border-border px-5 py-4 text-sm font-medium whitespace-nowrap text-card-foreground">
                      {formatTime(evt.timestamp)}
                    </td>

                    <td className="border-b border-border px-5 py-4 text-sm whitespace-nowrap text-muted-foreground">
                      {formatDate(evt.timestamp)}
                    </td>

                    <td className="border-b border-border px-5 py-4 text-sm">
                      <span className="inline-flex rounded-xl border border-border bg-background/70 px-3 py-1.5 font-mono text-xs text-card-foreground">
                        {evt.actuator_name || "—"}
                      </span>
                    </td>

                    <td className="border-b border-border px-5 py-4 text-sm">
                      <StateBadge state={evt.state} />
                    </td>

                    <td className="border-b border-border px-5 py-4 text-sm text-card-foreground">
                      {evt.triggered_by_rule != null ? (
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-sub/30 bg-sub/10 px-2 text-xs font-semibold text-sub">
                          {evt.triggered_by_rule}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="border-b border-border px-5 py-4 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">
                        {evt.sensor_id || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default EventLog;