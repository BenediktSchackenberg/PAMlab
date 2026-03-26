const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');

const router = Router();

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const items = db.users.slice(offset, offset + limit);
  res.json({ total: db.users.length, limit, offset, items });
});

router.get('/:id', (req, res) => {
  const u = db.users.find(u => u.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Not Found', message: 'User not found' });
  res.json(u);
});

router.post('/', (req, res) => {
  const { login, name, email, role } = req.body || {};
  if (!login || !name) return res.status(422).json({ error: 'Validation Error', message: 'login and name are required' });
  if (db.users.find(u => u.login === login)) return res.status(409).json({ error: 'Conflict', message: 'Login already exists' });
  const now = new Date().toISOString();
  const user = { id: uuidv4(), login, name, email: email || '', role: role || 'user', status: 'active', blocked: false, created_at: now, modified_at: now };
  db.users.push(user);
  res.status(201).json(user);
});

router.put('/:id', (req, res) => {
  const u = db.users.find(u => u.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Not Found', message: 'User not found' });
  const { name, email, role, status } = req.body || {};
  if (name !== undefined) u.name = name;
  if (email !== undefined) u.email = email;
  if (role !== undefined) u.role = role;
  if (status !== undefined) u.status = status;
  u.modified_at = new Date().toISOString();
  res.json(u);
});

router.delete('/:id', (req, res) => {
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'User not found' });
  db.users.splice(idx, 1);
  res.status(204).end();
});

router.get('/:id/auth_methods', (req, res) => {
  if (!db.users.find(u => u.id === req.params.id)) return res.status(404).json({ error: 'Not Found', message: 'User not found' });
  res.json({ items: db.authMethods.filter(a => a.user_id === req.params.id) });
});

router.post('/:id/auth_methods', (req, res) => {
  if (!db.users.find(u => u.id === req.params.id)) return res.status(404).json({ error: 'Not Found', message: 'User not found' });
  const { type, public_key } = req.body || {};
  if (!type || !['password', 'ssh_key'].includes(type)) return res.status(422).json({ error: 'Validation Error', message: 'type must be password or ssh_key' });
  const method = { id: uuidv4(), user_id: req.params.id, type, created_at: new Date().toISOString() };
  if (type === 'ssh_key') method.public_key = public_key || '';
  db.authMethods.push(method);
  res.status(201).json(method);
});

router.delete('/:id/auth_methods/:method_id', (req, res) => {
  const idx = db.authMethods.findIndex(a => a.id === req.params.method_id && a.user_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Auth method not found' });
  db.authMethods.splice(idx, 1);
  res.status(204).end();
});

router.post('/:id/block', (req, res) => {
  const u = db.users.find(u => u.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Not Found', message: 'User not found' });
  u.blocked = true; u.status = 'blocked'; u.modified_at = new Date().toISOString();
  res.json(u);
});

router.post('/:id/unblock', (req, res) => {
  const u = db.users.find(u => u.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Not Found', message: 'User not found' });
  u.blocked = false; u.status = 'active'; u.modified_at = new Date().toISOString();
  res.json(u);
});

module.exports = router;
