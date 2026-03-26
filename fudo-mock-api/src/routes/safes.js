const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');

const router = Router();

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const items = db.safes.slice(offset, offset + limit);
  res.json({ total: db.safes.length, limit, offset, items });
});

router.get('/:id', (req, res) => {
  const s = db.safes.find(s => s.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Not Found', message: 'Safe not found' });
  res.json(s);
});

router.post('/', (req, res) => {
  const { name, description, policy } = req.body || {};
  if (!name) return res.status(422).json({ error: 'Validation Error', message: 'name is required' });
  const now = new Date().toISOString();
  const safe = { id: uuidv4(), name, description: description || '', policy: policy || 'default', created_at: now, modified_at: now };
  db.safes.push(safe);
  res.status(201).json(safe);
});

router.put('/:id', (req, res) => {
  const s = db.safes.find(s => s.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Not Found', message: 'Safe not found' });
  const { name, description, policy } = req.body || {};
  if (name !== undefined) s.name = name;
  if (description !== undefined) s.description = description;
  if (policy !== undefined) s.policy = policy;
  s.modified_at = new Date().toISOString();
  res.json(s);
});

router.delete('/:id', (req, res) => {
  const idx = db.safes.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Safe not found' });
  db.safes.splice(idx, 1);
  res.status(204).end();
});

router.get('/:id/users', (req, res) => {
  if (!db.safes.find(s => s.id === req.params.id)) return res.status(404).json({ error: 'Not Found', message: 'Safe not found' });
  const userIds = db.safeUsers.filter(su => su.safe_id === req.params.id).map(su => su.user_id);
  res.json({ items: db.users.filter(u => userIds.includes(u.id)) });
});

router.post('/:id/users', (req, res) => {
  if (!db.safes.find(s => s.id === req.params.id)) return res.status(404).json({ error: 'Not Found', message: 'Safe not found' });
  const { user_id } = req.body || {};
  if (!user_id || !db.users.find(u => u.id === user_id)) return res.status(422).json({ error: 'Validation Error', message: 'Valid user_id required' });
  if (db.safeUsers.find(su => su.safe_id === req.params.id && su.user_id === user_id)) return res.status(409).json({ error: 'Conflict', message: 'User already assigned' });
  db.safeUsers.push({ safe_id: req.params.id, user_id });
  res.status(201).json({ message: 'User assigned to safe' });
});

router.delete('/:id/users/:user_id', (req, res) => {
  const idx = db.safeUsers.findIndex(su => su.safe_id === req.params.id && su.user_id === req.params.user_id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Assignment not found' });
  db.safeUsers.splice(idx, 1);
  res.status(204).end();
});

router.get('/:id/accounts', (req, res) => {
  if (!db.safes.find(s => s.id === req.params.id)) return res.status(404).json({ error: 'Not Found', message: 'Safe not found' });
  const accountIds = db.safeAccounts.filter(sa => sa.safe_id === req.params.id).map(sa => sa.account_id);
  res.json({ items: db.accounts.filter(a => accountIds.includes(a.id)) });
});

router.post('/:id/accounts', (req, res) => {
  if (!db.safes.find(s => s.id === req.params.id)) return res.status(404).json({ error: 'Not Found', message: 'Safe not found' });
  const { account_id } = req.body || {};
  if (!account_id || !db.accounts.find(a => a.id === account_id)) return res.status(422).json({ error: 'Validation Error', message: 'Valid account_id required' });
  if (db.safeAccounts.find(sa => sa.safe_id === req.params.id && sa.account_id === account_id)) return res.status(409).json({ error: 'Conflict', message: 'Account already in safe' });
  db.safeAccounts.push({ safe_id: req.params.id, account_id });
  res.status(201).json({ message: 'Account added to safe' });
});

router.delete('/:id/accounts/:account_id', (req, res) => {
  const idx = db.safeAccounts.findIndex(sa => sa.safe_id === req.params.id && sa.account_id === req.params.account_id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Assignment not found' });
  db.safeAccounts.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
