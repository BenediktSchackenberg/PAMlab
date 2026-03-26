const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');

const router = Router();

// POST / — create access request
router.post('/', (req, res) => {
  const { user_id, safe_id, account_id, justification, duration_hours, start_time } = req.body;
  if (!user_id || (!safe_id && !account_id) || !justification) {
    return res.status(400).json({ error: 'Bad Request', message: 'user_id, safe_id or account_id, and justification are required' });
  }
  const user = db.users.find(u => u.id === user_id);
  const request = {
    id: uuidv4(),
    user_id,
    requester: user ? user.name : user_id,
    safe_id: safe_id || null,
    account_id: account_id || null,
    target: safe_id ? (db.safes.find(s => s.id === safe_id) || {}).name || safe_id : (db.accounts.find(a => a.id === account_id) || {}).name || account_id,
    justification,
    duration_hours: duration_hours || 4,
    start_time: start_time || null,
    status: 'pending',
    created_at: new Date().toISOString(),
    decided_at: null,
    decided_by: null,
    expires_at: null,
    comment: null,
  };
  db.accessRequests.push(request);
  res.status(201).json(request);
});

// GET / — list requests
router.get('/', (req, res) => {
  let items = [...db.accessRequests];
  if (req.query.status) items = items.filter(r => r.status === req.query.status);
  if (req.query.user_id) items = items.filter(r => r.user_id === req.query.user_id);
  items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json({ total: items.length, items });
});

// GET /:id
router.get('/:id', (req, res) => {
  const r = db.accessRequests.find(r => r.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Not Found', message: 'Access request not found' });
  res.json(r);
});

// POST /:id/approve
router.post('/:id/approve', (req, res) => {
  const r = db.accessRequests.find(r => r.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Not Found', message: 'Access request not found' });
  if (r.status !== 'pending') return res.status(409).json({ error: 'Conflict', message: `Request is ${r.status}` });
  const now = new Date();
  r.status = 'approved';
  r.decided_at = now.toISOString();
  r.decided_by = req.body.approved_by || 'admin';
  r.comment = req.body.comment || null;
  r.expires_at = new Date(now.getTime() + r.duration_hours * 3600000).toISOString();

  if (db.events) {
    db.events.push({ id: uuidv4(), type: 'access.granted', timestamp: now.toISOString(), details: { request_id: r.id, user: r.requester, target: r.target, approved_by: r.decided_by } });
  }
  res.json(r);
});

// POST /:id/deny
router.post('/:id/deny', (req, res) => {
  const r = db.accessRequests.find(r => r.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Not Found', message: 'Access request not found' });
  if (r.status !== 'pending') return res.status(409).json({ error: 'Conflict', message: `Request is ${r.status}` });
  r.status = 'denied';
  r.decided_at = new Date().toISOString();
  r.decided_by = req.body.denied_by || 'admin';
  r.comment = req.body.reason || null;

  if (db.events) {
    db.events.push({ id: uuidv4(), type: 'access.denied', timestamp: r.decided_at, details: { request_id: r.id, user: r.requester, target: r.target, denied_by: r.decided_by, reason: r.comment } });
  }
  res.json(r);
});

// POST /:id/revoke
router.post('/:id/revoke', (req, res) => {
  const r = db.accessRequests.find(r => r.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Not Found', message: 'Access request not found' });
  if (r.status !== 'approved') return res.status(409).json({ error: 'Conflict', message: 'Only approved requests can be revoked' });
  r.status = 'revoked';
  r.decided_at = new Date().toISOString();

  if (db.events) {
    db.events.push({ id: uuidv4(), type: 'access.denied', timestamp: r.decided_at, details: { request_id: r.id, user: r.requester, target: r.target, action: 'revoked' } });
  }
  res.json(r);
});

module.exports = router;
