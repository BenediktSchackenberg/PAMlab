const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// Create access request
router.post('/', (req, res) => {
  const { user, target_type, target, access_type, justification, duration } = req.body;
  const ar = {
    id: uuidv4(), user, target_type, target, access_type,
    justification, duration, status: 'pending',
    created_at: new Date().toISOString(), decided_at: null, expires_at: null
  };
  store.accessRequests.push(ar);
  res.status(201).json(ar);
});

// List access requests
router.get('/', (req, res) => {
  let results = store.accessRequests;
  if (req.query.status) {
    results = results.filter(r => r.status === req.query.status);
  }
  res.json(results);
});

// Get access request detail
router.get('/:id', (req, res) => {
  const ar = store.accessRequests.find(r => r.id === req.params.id);
  if (!ar) return res.status(404).json({ error: 'Access request not found' });
  res.json(ar);
});

// Approve
router.post('/:id/approve', (req, res) => {
  const ar = store.accessRequests.find(r => r.id === req.params.id);
  if (!ar) return res.status(404).json({ error: 'Access request not found' });
  if (ar.status !== 'pending') return res.status(400).json({ error: `Cannot approve request in status: ${ar.status}` });
  ar.status = 'approved';
  ar.approved_by = req.body.approved_by || 'system';
  ar.comment = req.body.comment || '';
  ar.decided_at = new Date().toISOString();
  // Calculate expiry from duration
  const days = parseInt(ar.duration) || 30;
  ar.expires_at = new Date(Date.now() + days * 86400000).toISOString();
  res.json(ar);
});

// Deny
router.post('/:id/deny', (req, res) => {
  const ar = store.accessRequests.find(r => r.id === req.params.id);
  if (!ar) return res.status(404).json({ error: 'Access request not found' });
  if (ar.status !== 'pending') return res.status(400).json({ error: `Cannot deny request in status: ${ar.status}` });
  ar.status = 'denied';
  ar.denied_by = req.body.denied_by || 'system';
  ar.reason = req.body.reason || '';
  ar.decided_at = new Date().toISOString();
  res.json(ar);
});

// Revoke
router.post('/:id/revoke', (req, res) => {
  const ar = store.accessRequests.find(r => r.id === req.params.id);
  if (!ar) return res.status(404).json({ error: 'Access request not found' });
  if (ar.status !== 'approved') return res.status(400).json({ error: `Cannot revoke request in status: ${ar.status}` });
  ar.status = 'revoked';
  ar.decided_at = new Date().toISOString();
  res.json(ar);
});

module.exports = router;
