const express = require('express');
const router = express.Router();
const store = require('../data/store');

function now() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

// POST /api/now/incident/resolve/:sys_id
router.post('/resolve/:sys_id', (req, res) => {
  const table = store.tables.incident;
  const idx = table.findIndex(r => r.sys_id === req.params.sys_id);
  if (idx === -1) return res.status(404).json({ error: { message: 'Incident not found' } });

  const ts = now();
  table[idx] = {
    ...table[idx],
    state: 6,
    resolved_at: ts,
    resolved_by: req.body.resolved_by || 'api',
    close_notes: req.body.close_notes || '',
    close_code: req.body.close_code || 'Solved (Permanently)',
    sys_updated_on: ts,
  };
  res.json({ result: table[idx] });
});

// POST /api/now/incident/close/:sys_id
router.post('/close/:sys_id', (req, res) => {
  const table = store.tables.incident;
  const idx = table.findIndex(r => r.sys_id === req.params.sys_id);
  if (idx === -1) return res.status(404).json({ error: { message: 'Incident not found' } });

  const ts = now();
  table[idx] = {
    ...table[idx],
    state: 7,
    closed_at: ts,
    closed_by: req.body.closed_by || 'api',
    close_notes: req.body.close_notes || table[idx].close_notes || '',
    close_code: req.body.close_code || table[idx].close_code || 'Solved (Permanently)',
    sys_updated_on: ts,
  };
  res.json({ result: table[idx] });
});

// GET /api/now/incident/stats
router.get('/stats', (req, res) => {
  const table = store.tables.incident;
  const byPriority = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const byState = { 1: 0, 2: 0, 3: 0, 6: 0, 7: 0 };
  table.forEach(i => {
    byPriority[i.priority] = (byPriority[i.priority] || 0) + 1;
    byState[i.state] = (byState[i.state] || 0) + 1;
  });
  res.json({
    result: {
      total: table.length,
      by_priority: { critical: byPriority[1], high: byPriority[2], medium: byPriority[3], low: byPriority[4] },
      by_state: { new: byState[1], in_progress: byState[2], on_hold: byState[3], resolved: byState[6], closed: byState[7] },
    },
  });
});

module.exports = router;
