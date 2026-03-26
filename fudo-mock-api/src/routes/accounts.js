const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');

const router = Router();

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const items = db.accounts.slice(offset, offset + limit);
  res.json({ total: db.accounts.length, limit, offset, items });
});

router.get('/:id', (req, res) => {
  const a = db.accounts.find(a => a.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Not Found', message: 'Account not found' });
  res.json(a);
});

router.post('/', (req, res) => {
  const { name, login, server_id, type } = req.body || {};
  if (!name || !login || !server_id) return res.status(422).json({ error: 'Validation Error', message: 'name, login, and server_id are required' });
  const server = db.servers.find(s => s.id === server_id);
  if (!server) return res.status(422).json({ error: 'Validation Error', message: 'Server not found' });
  const now = new Date().toISOString();
  const account = { id: uuidv4(), name, login, server_id, server_name: server.name, type: type || 'regular', status: 'active', password_change_required: false, created_at: now, modified_at: now };
  db.accounts.push(account);
  res.status(201).json(account);
});

router.put('/:id', (req, res) => {
  const a = db.accounts.find(a => a.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Not Found', message: 'Account not found' });
  const { name, login, status, type } = req.body || {};
  if (name !== undefined) a.name = name;
  if (login !== undefined) a.login = login;
  if (status !== undefined) a.status = status;
  if (type !== undefined) a.type = type;
  a.modified_at = new Date().toISOString();
  res.json(a);
});

router.delete('/:id', (req, res) => {
  const idx = db.accounts.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Account not found' });
  db.accounts.splice(idx, 1);
  res.status(204).end();
});

router.get('/:id/managers', (req, res) => {
  if (!db.accounts.find(a => a.id === req.params.id)) return res.status(404).json({ error: 'Not Found', message: 'Account not found' });
  const userIds = db.accountManagers.filter(m => m.account_id === req.params.id).map(m => m.user_id);
  res.json({ items: db.users.filter(u => userIds.includes(u.id)) });
});

router.post('/:id/managers', (req, res) => {
  if (!db.accounts.find(a => a.id === req.params.id)) return res.status(404).json({ error: 'Not Found', message: 'Account not found' });
  const { user_id } = req.body || {};
  if (!user_id || !db.users.find(u => u.id === user_id)) return res.status(422).json({ error: 'Validation Error', message: 'Valid user_id required' });
  if (db.accountManagers.find(m => m.account_id === req.params.id && m.user_id === user_id)) return res.status(409).json({ error: 'Conflict', message: 'Already a manager' });
  db.accountManagers.push({ account_id: req.params.id, user_id });
  res.status(201).json({ message: 'Manager added' });
});

router.delete('/:id/managers/:user_id', (req, res) => {
  const idx = db.accountManagers.findIndex(m => m.account_id === req.params.id && m.user_id === req.params.user_id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Manager assignment not found' });
  db.accountManagers.splice(idx, 1);
  res.status(204).end();
});

router.get('/:id/safes', (req, res) => {
  if (!db.accounts.find(a => a.id === req.params.id)) return res.status(404).json({ error: 'Not Found', message: 'Account not found' });
  const safeIds = db.safeAccounts.filter(sa => sa.account_id === req.params.id).map(sa => sa.safe_id);
  res.json({ items: db.safes.filter(s => safeIds.includes(s.id)) });
});

router.post('/:id/password', (req, res) => {
  const a = db.accounts.find(a => a.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Not Found', message: 'Account not found' });
  const { password } = req.body || {};
  if (!password) return res.status(422).json({ error: 'Validation Error', message: 'password is required' });
  a.password_change_required = false;
  a.modified_at = new Date().toISOString();
  res.json({ message: 'Password updated' });
});

module.exports = router;
