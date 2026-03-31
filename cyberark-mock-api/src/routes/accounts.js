const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');
const router = express.Router();

// Helper: format account for response (exclude secret)
function formatAccount(acc) {
  const { secret, ...rest } = acc;
  return rest;
}

// GET /api/Accounts  — search/filter with pagination
router.get('/', (req, res) => {
  const { search, searchType, filter, offset = 0, limit = 50, SafeName } = req.query;
  let result = [...db.accounts];

  if (SafeName) result = result.filter(a => a.safeName === SafeName);
  if (search) {
    const q = search.toLowerCase();
    if (searchType === 'contains') {
      result = result.filter(a => JSON.stringify(a).toLowerCase().includes(q));
    } else {
      // startswith (default CyberArk behavior)
      result = result.filter(a =>
        a.userName.toLowerCase().includes(q) ||
        a.address.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q)
      );
    }
  }
  if (filter) {
    // Simple filter: safeName eq 'X'
    const m = filter.match(/safeName\s+eq\s+'([^']+)'/i);
    if (m) result = result.filter(a => a.safeName === m[1]);
    const pm = filter.match(/platformId\s+eq\s+'([^']+)'/i);
    if (pm) result = result.filter(a => a.platformId === pm[1]);
  }

  const total = result.length;
  const paged = result.slice(Number(offset), Number(offset) + Number(limit));
  res.json({ value: paged.map(formatAccount), count: total });
});

// GET /api/Accounts/:id
router.get('/:id', (req, res) => {
  const acc = db.accounts.find(a => a.id === req.params.id);
  if (!acc) return res.status(404).json({ ErrorCode: 'PASWS013E', ErrorMessage: 'Account not found' });
  res.json(formatAccount(acc));
});

// POST /api/Accounts
router.post('/', (req, res) => {
  const { name, address, userName, safeName, platformId, secret, secretType, platformAccountProperties } = req.body;
  if (!safeName || !platformId || !address || !userName) {
    return res.status(400).json({ ErrorCode: 'PASWS003E', ErrorMessage: 'safeName, platformId, address, userName are required' });
  }
  if (!db.safes.find(s => s.SafeUrlId === safeName)) {
    return res.status(404).json({ ErrorCode: 'PASWS012E', ErrorMessage: `Safe ${safeName} not found` });
  }
  const acc = {
    id: `acc-${uuidv4().slice(0, 8)}`,
    name: name || `${platformId}-${address}-${userName}`,
    address, userName, safeName, platformId,
    secretType: secretType || 'password',
    secret: secret || '',
    platformAccountProperties: platformAccountProperties || {},
    secretManagement: { automaticManagementEnabled: true, lastModifiedTime: Date.now() / 1000 | 0 },
    createdTime: Date.now() / 1000 | 0,
    checkedOut: false, checkedOutBy: null,
  };
  db.accounts.push(acc);
  res.status(201).json(formatAccount(acc));
});

// PUT /api/Accounts/:id  (PATCH-style update)
router.put('/:id', (req, res) => {
  const acc = db.accounts.find(a => a.id === req.params.id);
  if (!acc) return res.status(404).json({ ErrorCode: 'PASWS013E', ErrorMessage: 'Account not found' });
  const { secret, ...updates } = req.body;
  Object.assign(acc, updates);
  if (secret) acc.secret = secret;
  res.json(formatAccount(acc));
});
router.patch('/:id', (req, res) => {
  const acc = db.accounts.find(a => a.id === req.params.id);
  if (!acc) return res.status(404).json({ ErrorCode: 'PASWS013E', ErrorMessage: 'Account not found' });
  // CyberArk PATCH uses op-based array
  const ops = req.body;
  if (Array.isArray(ops)) {
    for (const op of ops) {
      if (op.op === 'replace' && op.path) {
        const key = op.path.replace(/^\//, '');
        acc[key] = op.value;
      }
    }
  } else {
    const { secret, ...updates } = req.body;
    Object.assign(acc, updates);
    if (secret) acc.secret = secret;
  }
  res.json(formatAccount(acc));
});

// DELETE /api/Accounts/:id
router.delete('/:id', (req, res) => {
  const idx = db.accounts.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ErrorCode: 'PASWS013E', ErrorMessage: 'Account not found' });
  db.accounts.splice(idx, 1);
  res.status(204).end();
});

// POST /api/Accounts/:id/Password/Retrieve  — Get Password Value
router.post('/:id/Password/Retrieve', (req, res) => {
  const acc = db.accounts.find(a => a.id === req.params.id);
  if (!acc) return res.status(404).json({ ErrorCode: 'PASWS013E', ErrorMessage: 'Account not found' });
  // Return password as plain string (CyberArk style)
  res.json(acc.secret);
});

// POST /api/Accounts/:id/CheckIn
router.post('/:id/CheckIn', (req, res) => {
  const acc = db.accounts.find(a => a.id === req.params.id);
  if (!acc) return res.status(404).json({ ErrorCode: 'PASWS013E', ErrorMessage: 'Account not found' });
  acc.checkedOut = false;
  acc.checkedOutBy = null;
  res.status(200).json({ message: 'Account checked in successfully' });
});

// POST /api/Accounts/:id/Change
router.post('/:id/Change', (req, res) => {
  const acc = db.accounts.find(a => a.id === req.params.id);
  if (!acc) return res.status(404).json({ ErrorCode: 'PASWS013E', ErrorMessage: 'Account not found' });
  acc.secret = req.body.NewCredentials || `Changed_${Date.now()}`;
  acc.secretManagement.lastModifiedTime = Date.now() / 1000 | 0;
  res.status(200).json({ message: 'Password change initiated' });
});

// POST /api/Accounts/:id/Verify
router.post('/:id/Verify', (req, res) => {
  const acc = db.accounts.find(a => a.id === req.params.id);
  if (!acc) return res.status(404).json({ ErrorCode: 'PASWS013E', ErrorMessage: 'Account not found' });
  res.status(200).json({ message: 'Password verification initiated' });
});

// POST /api/Accounts/:id/Reconcile
router.post('/:id/Reconcile', (req, res) => {
  const acc = db.accounts.find(a => a.id === req.params.id);
  if (!acc) return res.status(404).json({ ErrorCode: 'PASWS013E', ErrorMessage: 'Account not found' });
  res.status(200).json({ message: 'Password reconciliation initiated' });
});

module.exports = router;
