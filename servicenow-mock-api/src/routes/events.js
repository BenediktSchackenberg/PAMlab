const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');

// POST /api/now/events/register
router.post('/register', (req, res) => {
  const { url, table, events } = req.body;
  if (!url) return res.status(400).json({ error: { message: 'url is required' } });

  const webhook = {
    id: uuidv4().replace(/-/g, ''),
    url,
    table: table || '*',
    events: events || ['insert', 'update', 'delete'],
    created: new Date().toISOString(),
  };
  store.webhooks.push(webhook);
  res.status(201).json({ result: webhook });
});

// GET /api/now/events/list
router.get('/list', (req, res) => {
  res.json({ result: store.webhooks });
});

// DELETE /api/now/events/:id
router.delete('/:id', (req, res) => {
  const idx = store.webhooks.findIndex(w => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: { message: 'Webhook not found' } });
  store.webhooks.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
