const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const express = require('express');
const router = express.Router();

// POST /api/jwt/login — returns plain text JWT token
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).send('Username is required');
  }
  // Validate against known users in CTM:People
  const person = store.forms['CTM:People'].find(p => p['Login ID'] === username);
  if (!person) {
    return res.status(401).send('Authentication failed');
  }
  // Mock password validation: accept "admin", "admin123", "Password1!", or the login ID as password
  const validPasswords = ['admin', 'admin123', 'Password1!', username];
  if (!password || !validPasswords.includes(password)) {
    return res.status(401).send('Authentication failed: invalid password');
  }
  const token = uuidv4();
  store.jwt_sessions.push({ token, user: username, created: new Date().toISOString() });
  // Remedy returns plain text token, not JSON
  res.type('text/plain').send(token);
});

// DELETE /api/jwt/logout
router.delete('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('AR-JWT ')) {
    const token = authHeader.slice(7);
    const idx = store.jwt_sessions.findIndex(s => s.token === token);
    if (idx >= 0) store.jwt_sessions.splice(idx, 1);
  }
  res.status(204).send();
});

module.exports = router;
