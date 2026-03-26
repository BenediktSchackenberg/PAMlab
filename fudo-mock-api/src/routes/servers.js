const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');

const router = Router();

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  res.json({ total: db.servers.length, limit, offset, items: db.servers.slice(offset, offset + limit) });
});

router.get('/:id', (req, res) => {
  const s = db.servers.find(s => s.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Not Found', message: 'Server not found' });
  res.json(s);
});

router.post('/', (req, res) => {
  const { name, address, port, protocol, description, os } = req.body || {};
  if (!name || !address) return res.status(422).json({ error: 'Validation Error', message: 'name and address are required' });
  const now = new Date().toISOString();
  const server = { id: uuidv4(), name, address, port: port || 22, protocol: protocol || 'ssh', description: description || '', os: os || '', status: 'online', created_at: now, modified_at: now };
  db.servers.push(server);
  res.status(201).json(server);
});

router.put('/:id', (req, res) => {
  const s = db.servers.find(s => s.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Not Found', message: 'Server not found' });
  for (const key of ['name', 'address', 'port', 'protocol', 'description', 'os', 'status']) {
    if (req.body[key] !== undefined) s[key] = req.body[key];
  }
  s.modified_at = new Date().toISOString();
  res.json(s);
});

router.delete('/:id', (req, res) => {
  const idx = db.servers.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Server not found' });
  db.servers.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
