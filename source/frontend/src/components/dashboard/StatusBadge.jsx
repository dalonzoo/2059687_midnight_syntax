function getStatusTone(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "ok" || normalized === "normal") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  }

  if (normalized === "warning") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  }

  if (normalized === "error" || normalized === "critical") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-400";
  }

  return "border-white/10 bg-white/5 text-muted-foreground";
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusTone(
        status
      )}`}
    >
      {status || "Unknown"}
    </span>
  );
}

export default StatusBadge;