const express = require('express');
const db = require('../data/store');
const router = express.Router();

// GET /api/Safes
router.get('/', (req, res) => {
  const { search, offset = 0, limit = 25 } = req.query;
  let result = [...db.safes];
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(s => s.SafeName.toLowerCase().includes(q) || (s.Description || '').toLowerCase().includes(q));
  }
  const total = result.length;
  const paged = result.slice(Number(offset), Number(offset) + Number(limit));
  res.json({ value: paged, count: total });
});

// GET /api/Safes/:safeUrlId
router.get('/:safeUrlId', (req, res) => {
  const safe = db.safes.find(s => s.SafeUrlId === req.params.safeUrlId);
  if (!safe) return res.status(404).json({ ErrorCode: 'PASWS012E', ErrorMessage: `Safe ${req.params.safeUrlId} not found` });
  res.json(safe);
});

// POST /api/Safes
router.post('/', (req, res) => {
  const { SafeName, Description, ManagingCPM, NumberOfVersionsRetention, NumberOfDaysRetention, OLACEnabled, AutoPurgeEnabled } = req.body;
  if (!SafeName) return res.status(400).json({ ErrorCode: 'PASWS003E', ErrorMessage: 'SafeName is required' });
  if (db.safes.find(s => s.SafeUrlId === SafeName)) return res.status(409).json({ ErrorCode: 'PASWS007E', ErrorMessage: `Safe ${SafeName} already exists` });
  const safe = {
    SafeUrlId: SafeName, SafeName, Description: Description || '', ManagingCPM: ManagingCPM || 'PasswordManager',
    NumberOfVersionsRetention: NumberOfVersionsRetention || 5, NumberOfDaysRetention: NumberOfDaysRetention || 30,
    OLACEnabled: OLACEnabled || false, AutoPurgeEnabled: AutoPurgeEnabled || false,
    Location: '\\', Creator: { Id: req.userId, Name: req.username },
    CreationTime: Date.now() / 1000 | 0, LastModificationTime: Date.now() / 1000 | 0,
  };
  db.safes.push(safe);
  res.status(201).json(safe);
});

// PUT /api/Safes/:safeUrlId
router.put('/:safeUrlId', (req, res) => {
  const safe = db.safes.find(s => s.SafeUrlId === req.params.safeUrlId);
  if (!safe) return res.status(404).json({ ErrorCode: 'PASWS012E', ErrorMessage: `Safe ${req.params.safeUrlId} not found` });
  Object.assign(safe, req.body, { SafeUrlId: safe.SafeUrlId, SafeName: safe.SafeName, LastModificationTime: Date.now() / 1000 | 0 });
  res.json(safe);
});

// DELETE /api/Safes/:safeUrlId
router.delete('/:safeUrlId', (req, res) => {
  const idx = db.safes.findIndex(s => s.SafeUrlId === req.params.safeUrlId);
  if (idx === -1) return res.status(404).json({ ErrorCode: 'PASWS012E', ErrorMessage: `Safe ${req.params.safeUrlId} not found` });
  db.safes.splice(idx, 1);
  db.safeMembers = db.safeMembers.filter(m => m.SafeUrlId !== req.params.safeUrlId);
  res.status(204).end();
});

// GET /api/Safes/:safeUrlId/Members
router.get('/:safeUrlId/Members', (req, res) => {
  const safe = db.safes.find(s => s.SafeUrlId === req.params.safeUrlId);
  if (!safe) return res.status(404).json({ ErrorCode: 'PASWS012E', ErrorMessage: `Safe ${req.params.safeUrlId} not found` });
  const members = db.safeMembers.filter(m => m.SafeUrlId === req.params.safeUrlId);
  res.json({ value: members, count: members.length });
});

// POST /api/Safes/:safeUrlId/Members
router.post('/:safeUrlId/Members', (req, res) => {
  const safe = db.safes.find(s => s.SafeUrlId === req.params.safeUrlId);
  if (!safe) return res.status(404).json({ ErrorCode: 'PASWS012E', ErrorMessage: `Safe ${req.params.safeUrlId} not found` });
  const { MemberName, MemberType, Permissions } = req.body;
  if (!MemberName) return res.status(400).json({ ErrorCode: 'PASWS003E', ErrorMessage: 'MemberName is required' });
  const existing = db.safeMembers.find(m => m.SafeUrlId === req.params.safeUrlId && m.MemberName === MemberName);
  if (existing) return res.status(409).json({ ErrorCode: 'PASWS007E', ErrorMessage: `Member ${MemberName} already exists in safe` });
  const member = { SafeUrlId: req.params.safeUrlId, MemberId: `m${Date.now()}`, MemberName, MemberType: MemberType || 'User', Permissions: Permissions || {} };
  db.safeMembers.push(member);
  res.status(201).json(member);
});

// PUT /api/Safes/:safeUrlId/Members/:memberName
router.put('/:safeUrlId/Members/:memberName', (req, res) => {
  const member = db.safeMembers.find(m => m.SafeUrlId === req.params.safeUrlId && m.MemberName === req.params.memberName);
  if (!member) return res.status(404).json({ ErrorCode: 'PASWS012E', ErrorMessage: 'Member not found' });
  if (req.body.Permissions) member.Permissions = req.body.Permissions;
  if (req.body.MemberType) member.MemberType = req.body.MemberType;
  res.json(member);
});

// DELETE /api/Safes/:safeUrlId/Members/:memberName
router.delete('/:safeUrlId/Members/:memberName', (req, res) => {
  const idx = db.safeMembers.findIndex(m => m.SafeUrlId === req.params.safeUrlId && m.MemberName === req.params.memberName);
  if (idx === -1) return res.status(404).json({ ErrorCode: 'PASWS012E', ErrorMessage: 'Member not found' });
  db.safeMembers.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
