const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');

const router = Router();

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  res.json({ total: db.listeners.length, limit, offset, items: db.listeners.slice(offset, offset + limit) });
});

router.get('/:id', (req, res) => {
  const l = db.listeners.find(l => l.id === req.params.id);
  if (!l) return res.status(404).json({ error: 'Not Found', message: 'Listener not found' });
  res.json(l);
});

router.post('/', (req, res) => {
  const { name, address, port, protocol } = req.body || {};
  if (!name || !port) return res.status(422).json({ error: 'Validation Error', message: 'name and port are required' });
  const now = new Date().toISOString();
  const listener = { id: uuidv4(), name, address: address || '0.0.0.0', port, protocol: protocol || 'ssh', status: 'active', created_at: now, modified_at: now };
  db.listeners.push(listener);
  res.status(201).json(listener);
});

router.put('/:id', (req, res) => {
  const l = db.listeners.find(l => l.id === req.params.id);
  if (!l) return res.status(404).json({ error: 'Not Found', message: 'Listener not found' });
  for (const key of ['name', 'address', 'port', 'protocol', 'status']) {
    if (req.body[key] !== undefined) l[key] = req.body[key];
  }
  l.modified_at = new Date().toISOString();
  res.json(l);
});

router.delete('/:id', (req, res) => {
  const idx = db.listeners.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Listener not found' });
  db.listeners.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
