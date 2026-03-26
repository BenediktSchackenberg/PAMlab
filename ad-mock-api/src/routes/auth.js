const { Router } = require('express');
const { v4: uuid } = require('uuid');
const { tokens } = require('../middleware/auth');
const store = require('../data/store');
const router = Router();

router.post('/bind', (req, res) => {
  const { dn, password } = req.body;
  if (!dn || !password) return res.status(400).json({ error: 'dn and password required' });
  // Accept any password for mock
  const token = uuid();
  const session = { bind_dn: dn, created: new Date().toISOString() };
  tokens.set(token, session);
  res.json({ token, bind_dn: dn, message: 'Bind successful' });
});

module.exports = router;
