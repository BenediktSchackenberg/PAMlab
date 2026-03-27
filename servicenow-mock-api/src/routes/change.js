const express = require('express');
const router = express.Router();
const store = require('../data/store');

function now() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

// POST /api/now/change/approve/:sys_id
router.post('/approve/:sys_id', (req, res) => {
  const table = store.tables.change_request;
  const idx = table.findIndex(r => r.sys_id === req.params.sys_id);
  if (idx === -1) return res.status(404).json({ error: { message: 'Change request not found' } });

  const ts = now();
  table[idx] = { ...table[idx], approval: 'approved', state: -2, sys_updated_on: ts };
  if (req.body.comments) table[idx].approval_comments = req.body.comments;
  res.json({ result: table[idx] });
});

// POST /api/now/change/reject/:sys_id
router.post('/reject/:sys_id', (req, res) => {
  const table = store.tables.change_request;
  const idx = table.findIndex(r => r.sys_id === req.params.sys_id);
  if (idx === -1) return res.status(404).json({ error: { message: 'Change request not found' } });

  const ts = now();
  table[idx] = { ...table[idx], approval: 'rejected', state: 4, sys_updated_on: ts };
  if (req.body.comments) table[idx].approval_comments = req.body.comments;
  res.json({ result: table[idx] });
});

// POST /api/now/change/implement/:sys_id
router.post('/implement/:sys_id', (req, res) => {
  const table = store.tables.change_request;
  const idx = table.findIndex(r => r.sys_id === req.params.sys_id);
  if (idx === -1) return res.status(404).json({ error: { message: 'Change request not found' } });

  if (table[idx].approval !== 'approved') {
    return res.status(400).json({ error: { message: 'Change must be approved before implementation' } });
  }

  const ts = now();
  table[idx] = { ...table[idx], state: -1, work_start: ts, sys_updated_on: ts };
  res.json({ result: table[idx] });
});

// GET /api/now/change/schedule
router.get('/schedule', (req, res) => {
  const upcoming = store.tables.change_request
    .filter(c => c.state <= -1 && c.state >= -3)
    .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
  res.json({ result: upcoming });
});

module.exports = router;
