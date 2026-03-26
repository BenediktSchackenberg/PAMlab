const { Router } = require('express');
const db = require('../data/store');

const router = Router();

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  let items = [...db.sessions];
  if (req.query.user_id) items = items.filter(s => s.user_id === req.query.user_id);
  if (req.query.account_id) items = items.filter(s => s.account_id === req.query.account_id);
  if (req.query.from) items = items.filter(s => s.started_at >= req.query.from);
  if (req.query.to) items = items.filter(s => s.started_at <= req.query.to);
  const total = items.length;
  res.json({ total, limit, offset, items: items.slice(offset, offset + limit) });
});

router.get('/:id', (req, res) => {
  const s = db.sessions.find(s => s.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Not Found', message: 'Session not found' });
  res.json(s);
});

module.exports = router;
