const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');

const router = Router();
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

router.post('/login', (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password) {
    return res.status(422).json({ error: 'Validation Error', message: 'login and password are required' });
  }
  const user = db.users.find(u => u.login === login);
  if (!user || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
  }
  if (user.blocked) {
    return res.status(403).json({ error: 'Forbidden', message: 'User account is blocked' });
  }
  const session_token = uuidv4();
  db.tokens.set(session_token, { user_id: user.id, login: user.login, created_at: new Date().toISOString() });
  res.json({ session_token });
});

router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    db.tokens.delete(authHeader.slice(7));
  }
  res.json({ message: 'Logged out' });
});

module.exports = router;
