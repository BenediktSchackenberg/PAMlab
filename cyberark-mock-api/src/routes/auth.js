const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');
const router = express.Router();

// POST /api/auth/Cyberark/Logon
router.post('/Cyberark/Logon', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ErrorCode: 'PASWS003E', ErrorMessage: 'username and password are required' });
  }

  const user = db.users.find(u => u.username === username && u.enableUser);
  if (!user) {
    return res.status(403).json({ ErrorCode: 'PASWS005E', ErrorMessage: 'Authentication failure. Invalid credentials.' });
  }

  const token = uuidv4().replace(/-/g, '');
  db.tokens.set(token, { userId: user.id, username: user.username, created_at: new Date().toISOString() });
  // CyberArk returns the token as a plain quoted string
  res.json(token);
});

// POST /api/auth/Logoff
router.post('/Logoff', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    db.tokens.delete(token);
  }
  res.status(200).json({ message: 'Logged off successfully' });
});

module.exports = router;
