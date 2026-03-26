const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');

const router = Router();

const EVENT_TYPES = ['session.started', 'session.ended', 'session.terminated', 'session.paused', 'session.anomaly_detected', 'user.blocked', 'user.unblocked', 'user.created', 'user.deleted', 'account.password_changed', 'account.password_rotation', 'access.denied', 'access.granted', 'sync.completed', 'system.alert'];

// GET /webhooks — list registered webhooks (must be before /:id)
router.get('/webhooks', (req, res) => {
  res.json({ total: db.webhooks.length, items: db.webhooks });
});

// POST /webhooks — register webhook
router.post('/webhooks', (req, res) => {
  const { url, events, secret } = req.body;
  if (!url || !events) return res.status(400).json({ error: 'Bad Request', message: 'url and events are required' });
  const webhook = { id: uuidv4(), url, events, secret: secret || null, created_at: new Date().toISOString(), status: 'active' };
  db.webhooks.push(webhook);
  res.status(201).json(webhook);
});

// DELETE /webhooks/:id
router.delete('/webhooks/:id', (req, res) => {
  const idx = db.webhooks.findIndex(w => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Webhook not found' });
  db.webhooks.splice(idx, 1);
  res.status(204).end();
});

// POST /webhooks/:id/test
router.post('/webhooks/:id/test', (req, res) => {
  const webhook = db.webhooks.find(w => w.id === req.params.id);
  if (!webhook) return res.status(404).json({ error: 'Not Found', message: 'Webhook not found' });
  const testEvent = { id: uuidv4(), type: 'system.alert', timestamp: new Date().toISOString(), details: { message: 'Test event from Fudo PAM' }, test: true };
  res.json({ status: 'sent', webhook_id: webhook.id, url: webhook.url, event: testEvent });
});

// GET /stream — SSE endpoint
router.get('/stream', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.write('data: {"type":"connected","message":"Event stream connected"}\n\n');

  const interval = setInterval(() => {
    const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const event = { id: uuidv4(), type, timestamp: new Date().toISOString(), details: { message: `Simulated ${type} event` } };
    db.events.push(event);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }, 10000);

  req.on('close', () => clearInterval(interval));
});

// GET / — list events
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  let items = [...db.events];
  if (req.query.type) items = items.filter(e => e.type === req.query.type);
  if (req.query.from) items = items.filter(e => e.timestamp >= req.query.from);
  if (req.query.to) items = items.filter(e => e.timestamp <= req.query.to);
  items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  res.json({ total: items.length, limit, items: items.slice(0, limit) });
});

// GET /:id — event detail
router.get('/:id', (req, res) => {
  const event = db.events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Not Found', message: 'Event not found' });
  res.json(event);
});

module.exports = router;
