import { useEffect, useState } from "react";

const OPERATORS = ["<", "<=", "=", ">", ">="];
const ACTUATORS = [
  "cooling_fan",
  "entrance_humidifier",
  "hall_ventilation",
  "habitat_heater",
];

const UNITS = [
  "",
  "°C",
  "%",
  "ppm",
  "ppb",
  "kPa",
  "kW",
  "µg/m³",
  "pH"
];
const STATES = ["ON", "OFF"];

const initialForm = {
  sensor_name: "",
  metric: "",
  operator: ">",
  threshold: "",
  unit: "",
  actuator_name: ACTUATORS[0],
  actuator_state: "ON",
  enabled: true,
};

function RuleForm({ open, rule, onSave, onClose }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (rule && Object.keys(rule).length > 0) {
      setForm({
        sensor_name: rule.sensor_name ?? "",
        metric: rule.metric ?? "",
        operator: rule.operator ?? ">",
        threshold: rule.threshold ?? "",
        unit: rule.unit ?? "",
        actuator_name: rule.actuator_name ?? ACTUATORS[0],
        actuator_state: rule.actuator_state ?? "ON",
        enabled: rule.enabled ?? true,
      });
    } else {
      setForm(initialForm);
    }
  }, [rule, open]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave({
      ...form,
      threshold: Number(form.threshold),
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[28px] border border-border bg-card/95 p-6 shadow-2xl">
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sub">
            Automation
          </p>
          <h2 className="text-3xl font-semibold text-white">
            {rule?.id ? "Edit Rule" : "Create Rule"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Define a sensor condition that automatically changes an actuator state.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Sensor Name"
              value={form.sensor_name}
              onChange={handleChange("sensor_name")}
              placeholder="e.g. greenhouse_temperature"
            />
            <Input
              label="Metric"
              value={form.metric}
              onChange={handleChange("metric")}
              placeholder="e.g. temperature_c"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[140px_1fr_180px]">
            <Select
              label="Operator"
              value={form.operator}
              onChange={handleChange("operator")}
              options={OPERATORS}
            />
            <Input
              label="Threshold"
              type="number"
              value={form.threshold}
              onChange={handleChange("threshold")}
              placeholder="0"
            />
            <Select
              label="Unit (optional)"
              value={form.unit}
              onChange={handleChange("unit")}
              options={UNITS}
              placeholder="°C"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
            <Select
                label="Actuator"
                value={form.actuator_name}
                onChange={handleChange("actuator_name")}
                options={ACTUATORS}
              />
            <Select
              label="Set To"
              value={form.actuator_state}
              onChange={handleChange("actuator_state")}
              options={STATES}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl cursor-pointer border border-border bg-background/40 px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors duration 500 hover:bg-card hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-2xl cursor-pointer bg-button px-5 py-3 text-sm font-semibold text-white transition-colors duration-500 hover:opacity-90 border"
            >
              {rule?.id ? "Update Rule" : "Create Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Creating Custom Input Fields
function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <input
        {...props}
        className="w-full cursor-pointer rounded-2xl border border-border bg-background/40 px-4 py-3 text-white outline-none transition placeholder:text-muted-foreground/60 focus:border-sub/40"
      />
    </label>
  );
}

// Also Creating Custom Select Fields
function Select({ label, options, formatOption, ...props }) {
  return (
    <label className="block relative">
      <span className="mb-2 block text-sm font-medium text-muted-foreground">
        {label}
      </span>

      <select
        {...props}
        className="
          w-full rounded-2xl border border-border 
          bg-background/40 px-4 py-3 pr-10
          text-white outline-none transition
          focus:border-sub/40
          appearance-none cursor-pointer
        "
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-card text-white">
            {formatOption ? formatOption(option) : option || "No Unit"}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute top-1/2 right-4 text-muted-foreground">
        ▾
      </span>
    </label>
  );
}

export default RuleForm;