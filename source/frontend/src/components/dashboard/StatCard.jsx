function StatCard({ label, value, subtext }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.01)] backdrop-blur">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <h3 className="mt-3 text-3xl font-semibold text-white">{value}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{subtext}</p>
    </div>
  );
}

export default StatCard;