import { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import RuleCard from "./RuleCard";
import RuleForm from "./RuleForm";
import api from "../../services/api";

function RuleManager() {
  const [rules, setRules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const fetchRules = async () => {
  try {
    const res = await api.get("/api/rules");
    // debugging
    console.log("GET /api/rules response:", res.data);
    setRules(Array.isArray(res.data) ? res.data : res.data.rules || []);
  } catch (error) {
    // debugging
    console.error("Failed to fetch rules:", error);
  }
};

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSaveRule = async (ruleData) => {
    try {
      console.log("Submitting rule:", ruleData);

      let res;
      if (editingRule?.id) {
        res = await api.put(`/api/rules/${editingRule.id}`, ruleData);
      } else {
        res = await api.post("/api/rules", ruleData);
      }

      console.log("Save rule response:", res?.data);

      setShowForm(false);
      setEditingRule(null);
      fetchRules();
    } catch (error) {
      console.error("Failed to save rule:", error);
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await api.delete(`/api/rules/${id}`);
      fetchRules();
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const handleToggleRule = async (rule) => {
    try {
      await api.put(`/api/rules/${rule.id}`, {
        ...rule,
        enabled: !rule.enabled,
      });
      fetchRules();
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };
  const sortedRules = [...rules].sort((a, b) => {
    if (a.enabled === b.enabled) return 0;
    return a.enabled ? -1 : 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="opacity-0 animate-fade-in-delay-1">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-sub">
            Mars Habitat
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Automation Rules
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Configure automated sensor conditions that switch actuators on or off.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingRule(null);
            setShowForm(true);
          }}
          className="inline-flex cursor-pointer items-center opacity-0 animate-fade-in-delay-2 gap-2 rounded-2xl bg-button px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
        >
          <AddIcon fontSize="small" />
          <span>Add Rule</span>
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-[28px] border border-border bg-card/70 p-8 text-center opacity-0 animate-fade-in-delay-3">
          <p className="text-lg font-medium text-white">No automation rules yet!</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a rule to automatically toggle an actuator when a sensor condition is met.
          </p>
        </div>
      ) : (
        <div className="space-y-4 opacity-0 animate-fade-in-delay-3">
          {sortedRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => {
                setEditingRule(rule);
                setShowForm(true);
              }}
              onDelete={() => handleDeleteRule(rule.id)}
              onToggle={() => handleToggleRule(rule)}
            />
          ))}
        </div>
      )}

      <RuleForm
        open={showForm}
        rule={editingRule}
        onClose={() => {
          setShowForm(false);
          setEditingRule(null);
        }}
        onSave={handleSaveRule}
      />
    </div>
  );
}

export default RuleManager;