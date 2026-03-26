const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');

const router = Router();

// GET / — list policies
router.get('/', (req, res) => {
  res.json({ total: db.passwordPolicies.length, items: db.passwordPolicies });
});

// GET /:id
router.get('/:id', (req, res) => {
  const p = db.passwordPolicies.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not Found', message: 'Password policy not found' });
  res.json(p);
});

// POST / — create policy
router.post('/', (req, res) => {
  const { name, rotation_interval_days, min_length, require_special, accounts } = req.body;
  if (!name) return res.status(400).json({ error: 'Bad Request', message: 'name is required' });
  const policy = { id: uuidv4(), name, rotation_interval_days: rotation_interval_days || 90, min_length: min_length || 16, require_special: require_special !== false, accounts: accounts || [], created_at: new Date().toISOString(), modified_at: new Date().toISOString(), last_rotation: null };
  db.passwordPolicies.push(policy);
  res.status(201).json(policy);
});

// PUT /:id
router.put('/:id', (req, res) => {
  const p = db.passwordPolicies.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not Found', message: 'Password policy not found' });
  Object.assign(p, req.body, { modified_at: new Date().toISOString() });
  res.json(p);
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  const idx = db.passwordPolicies.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Password policy not found' });
  db.passwordPolicies.splice(idx, 1);
  res.status(204).end();
});

// POST /:id/rotate-now
router.post('/:id/rotate-now', (req, res) => {
  const p = db.passwordPolicies.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not Found', message: 'Password policy not found' });
  const now = new Date().toISOString();
  const rotated = p.accounts.map(account_id => {
    const account = db.accounts.find(a => a.id === account_id);
    const entry = { id: uuidv4(), policy_id: p.id, account_id, account_name: account ? account.name : 'unknown', status: 'success', rotated_at: now };
    db.passwordRotationHistory.push(entry);
    if (db.events) {
      db.events.push({ id: uuidv4(), type: 'account.password_rotation', timestamp: now, details: { policy: p.name, account: account ? account.name : account_id } });
    }
    return { account_id, account_name: account ? account.name : 'unknown', status: 'success', rotated_at: now };
  });
  p.last_rotation = now;
  p.modified_at = now;
  res.json({ policy_id: p.id, rotated });
});

// GET /:id/history
router.get('/:id/history', (req, res) => {
  const history = db.passwordRotationHistory.filter(h => h.policy_id === req.params.id);
  res.json({ total: history.length, items: history });
});

module.exports = router;
