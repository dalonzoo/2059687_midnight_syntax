
function formatActuatorName(name = "") {
  return name.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function ActuatorCard({ name, state, onToggle }) {
  const isOn = state === "ON";

  return (
    <article className="rounded-[28px] border border-border bg-card/80 p-6 backdrop-blur-sm transition-all duration-200 hover:border-border/80 hover:bg-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {formatActuatorName(name)}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Habitat Actuator Controller
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            isOn
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-white/10 bg-white/5 text-muted-foreground"
          }`}
        >
          {isOn ? "Active" : "Idle"}
        </span>
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p
            className={`text-4xl font-semibold ${
              isOn ? "text-emerald-400" : "text-muted-foreground"
            }`}
          >
            {state}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-label={`Toggle ${name}`}
          className={`relative inline-flex h-8 w-16 items-center rounded-full border transition-all duration-300 ${
            isOn
              ? "border-sub/40 bg-sub/20"
              : "border-border bg-background/60"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 rounded-full shadow-md transition-transform duration-300 ${
              isOn
                ? "translate-x-8 bg-sub"
                : "translate-x-1 bg-muted-foreground"
            }`}
          />
        </button>
      </div>
    </article>
  );
}

export default ActuatorCard;