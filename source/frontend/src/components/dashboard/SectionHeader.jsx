function SectionHeader({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

export default SectionHeader;