import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function formatText(value = "") {
  return String(value).replace(/_/g, " ");
}

function RuleCard({ rule, onEdit, onDelete, onToggle }) {
  const isEnabled = !!rule?.enabled;

  return (
    <article
      className={`rounded-[28px] border border-border bg-card/80 p-6 backdrop-blur-sm transition-colors duration-500 ${
        isEnabled ? "opacity-100" : "opacity-70"
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sub">
            Automation Rule
          </p>

          <p className="text-xl leading-8 text-white">
            <span className="font-semibold">IF </span>
            <span className="text-muted-foreground">
              {formatText(rule.sensor_name)} {" "}
            </span>
            <span className="font-medium text-white">
              {rule.operator} {rule.threshold}
              {rule.unit ? ` ${rule.unit}` : ""} {" "}
            </span>
            <span className="font-semibold">THEN {" "} </span>
            set{" "}
            <span className="italic text-white">
              {formatText(rule.actuator_name)} {" "}
            </span>
            to{" "}
            <span className="font-semibold text-white">
              {rule.actuator_state}
            </span>
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
              Sensor: {formatText(rule.sensor_name)}
            </span>
            <span className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
              Actuator: {formatText(rule.actuator_name)}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                isEnabled
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 bg-white/5 text-muted-foreground"
              }`}
            >
              {isEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            // button container before toggle
            className={`relative inline-flex h-8 w-16 items-center rounded-full border transition-color duration-300 cursor-pointer  ${
              isEnabled
                ? "border-success/40 bg-success/20"
                : "border-border bg-background/60"
            }`}
            aria-label={isEnabled ? "Disable rule" : "Enable rule"}
          >
            <span
              className={`inline-block h-6 w-6 rounded-full shadow-md transition-color duration-300 cursor-pointer ${
                isEnabled
                  ? "translate-x-8 bg-success"
                  : "translate-x-1 bg-muted-foreground"
              }`}
            />
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/40 text-muted-foreground transition hover:bg-card hover:text-white"
            aria-label="Edit rule"
          >
            <EditIcon fontSize="small" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 transition hover:bg-rose-500/10"
            aria-label="Delete rule"
          >
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default RuleCard;