/**
 * RuleManager.jsx — CRUD interface for automation rules.
 *
 * Displays a list of all rules and provides a form to create/edit them.
 */
import { useState, useEffect, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RuleCard from './RuleCard';
import RuleForm from './RuleForm';
import api from '../../services/api';

function RuleManager() {
  const [rules, setRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null); // null = closed, {} = new, {id:...} = edit
  const [showForm, setShowForm] = useState(false);

  /** Fetch all rules from the API. */
  const fetchRules = useCallback(async () => {
    try {
      const res = await api.get('/api/rules');
      setRules(res.data);
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  /** Handle rule creation or update. */
  const handleSave = async (data) => {
    try {
      if (editingRule?.id) {
        await api.put(`/api/rules/${editingRule.id}`, data);
      } else {
        await api.post('/api/rules', data);
      }
      setShowForm(false);
      setEditingRule(null);
      fetchRules();
    } catch (err) {
      console.error('Failed to save rule:', err);
    }
  };

  /** Handle rule deletion. */
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/rules/${id}`);
      fetchRules();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  /** Handle toggling rule enabled/disabled. */
  const handleToggleEnabled = async (rule) => {
    try {
      await api.put(`/api/rules/${rule.id}`, { enabled: !rule.enabled });
      fetchRules();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Automation Rules</h2>

        <button
          type="button"
          onClick={() => {
            setEditingRule({});
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-button px-4 py-2 text-sm font-medium 
          text-white shadow-md transition hover:opacity-90 cursor-pointer"
        >
          <AddIcon fontSize="small" />
          <span>Add Rule</span>
        </button>
      </div>

      {/* Rule list */}
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rules configured yet.</p>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => {
                setEditingRule(rule);
                setShowForm(true);
              }}
              onDelete={() => handleDelete(rule.id)}
              onToggle={() => handleToggleEnabled(rule)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit form dialog */}
      {showForm && (
        <RuleForm
          open={showForm}
          rule={editingRule}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingRule(null);
          }}
        />
      )}
    </>
  );
}

export default RuleManager;