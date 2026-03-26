const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');

const router = Router();

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  res.json({ total: db.pools.length, limit, offset, items: db.pools.slice(offset, offset + limit) });
});

router.get('/:id', (req, res) => {
  const p = db.pools.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not Found', message: 'Pool not found' });
  res.json(p);
});

router.post('/', (req, res) => {
  const { name, description, server_ids } = req.body || {};
  if (!name) return res.status(422).json({ error: 'Validation Error', message: 'name is required' });
  const now = new Date().toISOString();
  const pool = { id: uuidv4(), name, description: description || '', server_ids: server_ids || [], created_at: now, modified_at: now };
  db.pools.push(pool);
  res.status(201).json(pool);
});

router.put('/:id', (req, res) => {
  const p = db.pools.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not Found', message: 'Pool not found' });
  for (const key of ['name', 'description', 'server_ids']) {
    if (req.body[key] !== undefined) p[key] = req.body[key];
  }
  p.modified_at = new Date().toISOString();
  res.json(p);
});

router.delete('/:id', (req, res) => {
  const idx = db.pools.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Pool not found' });
  db.pools.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
