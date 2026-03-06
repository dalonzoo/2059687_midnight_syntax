/**
 * RuleManager.jsx — CRUD interface for automation rules.
 *
 * Displays a list of all rules and provides a form to create/edit them.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RuleCard from './RuleCard';
import RuleForm from './RuleForm';
import api from '../../services/api';

function RuleManager() {
  const [rules, setRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);   // null = closed, {} = new, {id:...} = edit
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Automation Rules</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditingRule({}); setShowForm(true); }}
        >
          Add Rule
        </Button>
      </Stack>

      {/* Rule list */}
      {rules.length === 0 ? (
        <Typography color="text.secondary">No rules configured yet.</Typography>
      ) : (
        <Stack spacing={2}>
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => { setEditingRule(rule); setShowForm(true); }}
              onDelete={() => handleDelete(rule.id)}
              onToggle={() => handleToggleEnabled(rule)}
            />
          ))}
        </Stack>
      )}

      {/* Create/Edit form dialog */}
      {showForm && (
        <RuleForm
          open={showForm}
          rule={editingRule}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingRule(null); }}
        />
      )}
    </>
  );
}

export default RuleManager;
