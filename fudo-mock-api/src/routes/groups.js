const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');

const router = Router();

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const items = db.groups.slice(offset, offset + limit);
  res.json({ total: db.groups.length, limit, offset, items });
});

router.get('/:id', (req, res) => {
  const g = db.groups.find(g => g.id === req.params.id);
  if (!g) return res.status(404).json({ error: 'Not Found', message: 'Group not found' });
  res.json(g);
});

router.post('/', (req, res) => {
  const { name, description, ad_group_dn } = req.body || {};
  if (!name) return res.status(422).json({ error: 'Validation Error', message: 'name is required' });
  const now = new Date().toISOString();
  const group = { id: uuidv4(), name, description: description || '', ad_group_dn: ad_group_dn || null, created_at: now, modified_at: now };
  db.groups.push(group);
  res.status(201).json(group);
});

router.put('/:id', (req, res) => {
  const g = db.groups.find(g => g.id === req.params.id);
  if (!g) return res.status(404).json({ error: 'Not Found', message: 'Group not found' });
  const { name, description, ad_group_dn } = req.body || {};
  if (name !== undefined) g.name = name;
  if (description !== undefined) g.description = description;
  if (ad_group_dn !== undefined) g.ad_group_dn = ad_group_dn;
  g.modified_at = new Date().toISOString();
  res.json(g);
});

router.delete('/:id', (req, res) => {
  const idx = db.groups.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Group not found' });
  db.groups.splice(idx, 1);
  db.groupUsers.splice(0, db.groupUsers.length, ...db.groupUsers.filter(gu => gu.group_id !== req.params.id));
  db.groupSafes.splice(0, db.groupSafes.length, ...db.groupSafes.filter(gs => gs.group_id !== req.params.id));
  res.status(204).end();
});

// Group users
router.get('/:id/users', (req, res) => {
  if (!db.groups.find(g => g.id === req.params.id)) return res.status(404).json({ error: 'Not Found', message: 'Group not found' });
  const userIds = db.groupUsers.filter(gu => gu.group_id === req.params.id).map(gu => gu.user_id);
  res.json({ items: db.users.filter(u => userIds.includes(u.id)) });
});

router.post('/:id/users', (req, res) => {
  if (!db.groups.find(g => g.id === req.params.id)) return res.status(404).json({ error: 'Not Found', message: 'Group not found' });
  const { user_id } = req.body || {};
  if (!user_id || !db.users.find(u => u.id === user_id)) return res.status(422).json({ error: 'Validation Error', message: 'Valid user_id required' });
  if (db.groupUsers.find(gu => gu.group_id === req.params.id && gu.user_id === user_id)) return res.status(409).json({ error: 'Conflict', message: 'User already in group' });
  db.groupUsers.push({ group_id: req.params.id, user_id });
  res.status(201).json({ message: 'User added to group' });
});

router.delete('/:id/users/:user_id', (req, res) => {
  const idx = db.groupUsers.findIndex(gu => gu.group_id === req.params.id && gu.user_id === req.params.user_id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Assignment not found' });
  db.groupUsers.splice(idx, 1);
  res.status(204).end();
});

// Group safes
router.get('/:id/safes', (req, res) => {
  if (!db.groups.find(g => g.id === req.params.id)) return res.status(404).json({ error: 'Not Found', message: 'Group not found' });
  const safeIds = db.groupSafes.filter(gs => gs.group_id === req.params.id).map(gs => gs.safe_id);
  res.json({ items: db.safes.filter(s => safeIds.includes(s.id)) });
});

router.post('/:id/safes', (req, res) => {
  if (!db.groups.find(g => g.id === req.params.id)) return res.status(404).json({ error: 'Not Found', message: 'Group not found' });
  const { safe_id } = req.body || {};
  if (!safe_id || !db.safes.find(s => s.id === safe_id)) return res.status(422).json({ error: 'Validation Error', message: 'Valid safe_id required' });
  if (db.groupSafes.find(gs => gs.group_id === req.params.id && gs.safe_id === safe_id)) return res.status(409).json({ error: 'Conflict', message: 'Safe already assigned to group' });
  db.groupSafes.push({ group_id: req.params.id, safe_id });
  res.status(201).json({ message: 'Safe assigned to group' });
});

router.delete('/:id/safes/:safe_id', (req, res) => {
  const idx = db.groupSafes.findIndex(gs => gs.group_id === req.params.id && gs.safe_id === req.params.safe_id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Assignment not found' });
  db.groupSafes.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
