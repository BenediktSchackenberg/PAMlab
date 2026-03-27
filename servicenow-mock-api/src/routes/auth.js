const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');

// POST /api/now/auth/token
router.post('/token', (req, res) => {
  const authHeader = req.headers.authorization;
  let username = null;

  if (authHeader && authHeader.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
    username = decoded.split(':')[0];
  } else if (req.body && req.body.username) {
    username = req.body.username;
  }

  if (!username) {
    return res.status(400).json({ error: { message: 'Provide Basic auth or username/password in body' } });
  }

  const user = store.tables.sys_user.find(u => u.user_name === username);
  if (!user) {
    return res.status(401).json({ error: { message: 'Invalid credentials' } });
  }

  const token = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
  store.tokens.push({ token, user: username, created: new Date().toISOString() });

  res.json({ result: { token, expires_in: 86400, user: username } });
});

module.exports = router;
