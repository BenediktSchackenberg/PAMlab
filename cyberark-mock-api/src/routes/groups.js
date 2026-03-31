const express = require('express');
const db = require('../data/store');
const router = express.Router();

// GET /api/UserGroups
router.get('/', (req, res) => {
  const { search, filter } = req.query;
  let result = [...db.groups];
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(g => g.groupName.toLowerCase().includes(q));
  }
  res.json({ value: result, count: result.length });
});

// GET /api/UserGroups/:id
router.get('/:id', (req, res) => {
  const group = db.groups.find(g => g.id === Number(req.params.id));
  if (!group) return res.status(404).json({ ErrorCode: 'PASWS016E', ErrorMessage: 'Group not found' });
  res.json(group);
});

// POST /api/UserGroups
router.post('/', (req, res) => {
  const { groupName, description, groupType, location } = req.body;
  if (!groupName) return res.status(400).json({ ErrorCode: 'PASWS003E', ErrorMessage: 'groupName is required' });
  if (db.groups.find(g => g.groupName === groupName)) return res.status(409).json({ ErrorCode: 'PASWS007E', ErrorMessage: `Group ${groupName} already exists` });
  const group = {
    id: Math.max(...db.groups.map(g => g.id), 0) + 1,
    groupName, description: description || '', groupType: groupType || 'Vault',
    location: location || '\\Groups', members: [],
  };
  db.groups.push(group);
  res.status(201).json(group);
});

// PUT /api/UserGroups/:id
router.put('/:id', (req, res) => {
  const group = db.groups.find(g => g.id === Number(req.params.id));
  if (!group) return res.status(404).json({ ErrorCode: 'PASWS016E', ErrorMessage: 'Group not found' });
  if (req.body.description !== undefined) group.description = req.body.description;
  if (req.body.groupName) group.groupName = req.body.groupName;
  res.json(group);
});

// DELETE /api/UserGroups/:id
router.delete('/:id', (req, res) => {
  const idx = db.groups.findIndex(g => g.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ErrorCode: 'PASWS016E', ErrorMessage: 'Group not found' });
  db.groups.splice(idx, 1);
  res.status(204).end();
});

// POST /api/UserGroups/:id/Members
router.post('/:id/Members', (req, res) => {
  const group = db.groups.find(g => g.id === Number(req.params.id));
  if (!group) return res.status(404).json({ ErrorCode: 'PASWS016E', ErrorMessage: 'Group not found' });
  const { memberId, memberName } = req.body;
  if (!memberId && !memberName) return res.status(400).json({ ErrorCode: 'PASWS003E', ErrorMessage: 'memberId or memberName required' });
  
  let user;
  if (memberId) user = db.users.find(u => u.id === Number(memberId));
  else user = db.users.find(u => u.username === memberName);
  if (!user) return res.status(404).json({ ErrorCode: 'PASWS015E', ErrorMessage: 'User not found' });

  if (group.members.find(m => m.id === user.id)) return res.status(409).json({ ErrorCode: 'PASWS007E', ErrorMessage: 'User already a member' });
  group.members.push({ id: user.id, username: user.username });
  res.status(201).json({ id: user.id, username: user.username });
});

// DELETE /api/UserGroups/:id/Members/:memberId
router.delete('/:id/Members/:memberId', (req, res) => {
  const group = db.groups.find(g => g.id === Number(req.params.id));
  if (!group) return res.status(404).json({ ErrorCode: 'PASWS016E', ErrorMessage: 'Group not found' });
  const idx = group.members.findIndex(m => m.id === Number(req.params.memberId));
  if (idx === -1) return res.status(404).json({ ErrorCode: 'PASWS015E', ErrorMessage: 'Member not found in group' });
  group.members.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
