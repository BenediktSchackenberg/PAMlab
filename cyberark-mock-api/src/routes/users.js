const express = require('express');
const db = require('../data/store');
const router = express.Router();

// GET /api/Users
router.get('/', (req, res) => {
  const { search, filter, offset = 0, limit = 25, UserType, ComponentUser } = req.query;
  let result = [...db.users];
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(u => u.username.toLowerCase().includes(q) || (u.personalDetails.email || '').toLowerCase().includes(q));
  }
  if (UserType) result = result.filter(u => u.userType === UserType);
  if (ComponentUser !== undefined) result = result.filter(u => u.componentUser === (ComponentUser === 'true'));
  if (filter) {
    const m = filter.match(/userType\s+eq\s+'([^']+)'/i);
    if (m) result = result.filter(u => u.userType === m[1]);
  }
  const total = result.length;
  const paged = result.slice(Number(offset), Number(offset) + Number(limit));
  res.json({ Users: paged, Total: total });
});

// GET /api/Users/:id
router.get('/:id', (req, res) => {
  const user = db.users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ ErrorCode: 'PASWS015E', ErrorMessage: 'User not found' });
  res.json(user);
});

// POST /api/Users
router.post('/', (req, res) => {
  const { username, userType, initialPassword, personalDetails, enableUser, location, vaultAuthorization } = req.body;
  if (!username) return res.status(400).json({ ErrorCode: 'PASWS003E', ErrorMessage: 'username is required' });
  if (db.users.find(u => u.username === username)) return res.status(409).json({ ErrorCode: 'PASWS007E', ErrorMessage: `User ${username} already exists` });
  const user = {
    id: Math.max(...db.users.map(u => u.id)) + 1,
    username, source: 'CyberArk', userType: userType || 'EPVUser', componentUser: false,
    vaultAuthorization: vaultAuthorization || [], location: location || '\\Users',
    personalDetails: personalDetails || {}, enableUser: enableUser !== false, suspended: false,
    lastSuccessfulLoginDate: null,
  };
  db.users.push(user);
  res.status(201).json(user);
});

// PUT /api/Users/:id
router.put('/:id', (req, res) => {
  const user = db.users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ ErrorCode: 'PASWS015E', ErrorMessage: 'User not found' });
  const { username, id, ...updates } = req.body;
  Object.assign(user, updates);
  res.json(user);
});

// DELETE /api/Users/:id
router.delete('/:id', (req, res) => {
  const idx = db.users.findIndex(u => u.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ ErrorCode: 'PASWS015E', ErrorMessage: 'User not found' });
  db.users.splice(idx, 1);
  res.status(204).end();
});

// POST /api/Users/:id/Activate
router.post('/:id/Activate', (req, res) => {
  const user = db.users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ ErrorCode: 'PASWS015E', ErrorMessage: 'User not found' });
  user.enableUser = true;
  user.suspended = false;
  res.json(user);
});

// POST /api/Users/:id/Suspend  (CyberArk: Deactivate)
router.post('/:id/Deactivate', (req, res) => {
  const user = db.users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ ErrorCode: 'PASWS015E', ErrorMessage: 'User not found' });
  user.suspended = true;
  res.json(user);
});

// POST /api/Users/:id/ResetPassword
router.post('/:id/ResetPassword', (req, res) => {
  const user = db.users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ ErrorCode: 'PASWS015E', ErrorMessage: 'User not found' });
  res.json({ message: 'Password reset successfully' });
});

module.exports = router;
