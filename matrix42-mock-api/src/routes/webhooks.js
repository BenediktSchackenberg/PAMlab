const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// Register webhook
router.post('/', (req, res) => {
  const { url, events, secret } = req.body;
  const wh = { id: uuidv4(), url, events: events || [], secret: secret || null, created_at: new Date().toISOString() };
  store.webhooks.push(wh);
  res.status(201).json(wh);
});

// List webhooks
router.get('/', (req, res) => {
  res.json(store.webhooks);
});

// Delete webhook
router.delete('/:id', (req, res) => {
  const idx = store.webhooks.findIndex(w => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Webhook not found' });
  const deleted = store.webhooks.splice(idx, 1)[0];
  res.json({ deleted: true, webhook: deleted });
});

// Test webhook
router.post('/test/:id', (req, res) => {
  const wh = store.webhooks.find(w => w.id === req.params.id);
  if (!wh) return res.status(404).json({ error: 'Webhook not found' });
  console.log(`[WEBHOOK TEST] Would POST to ${wh.url}:`, { event: 'test', timestamp: new Date().toISOString() });
  res.json({ status: 'test_sent', webhook: wh });
});

// Receive webhook from external system
router.post('/receive', (req, res) => {
  console.log('[WEBHOOK RECEIVED]', JSON.stringify(req.body));
  res.json({ status: 'received', timestamp: new Date().toISOString() });
});

module.exports = router;
