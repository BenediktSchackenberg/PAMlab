const { Router } = require('express');
const { v4: uuid } = require('uuid');
const { tokens } = require('../middleware/auth');
const store = require('../data/store');
const router = Router();

router.post('/bind', (req, res) => {
  const { dn, password } = req.body;
  if (!dn || !password) return res.status(400).json({ error: 'dn and password required' });

  // Validate credentials against known users
  // Accept bind by DN (e.g. "CN=Administrator,...") or simple name (e.g. "CN=admin")
  const cnMatch = dn.match(/^CN=([^,]+)/i);
  const cnValue = cnMatch ? cnMatch[1].trim() : dn;

  const user = store.users.find(u =>
    u.distinguishedName === dn ||
    u.cn.toLowerCase() === cnValue.toLowerCase() ||
    u.sAMAccountName.toLowerCase() === cnValue.toLowerCase()
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials', message: 'LDAP bind failed: user not found' });
  }

  if (!user.enabled) {
    return res.status(401).json({ error: 'Account disabled', message: 'LDAP bind failed: account is disabled' });
  }

  // Mock password validation: accept "admin", "admin123", "Password1!", or the sAMAccountName as password
  const validPasswords = ['admin', 'admin123', 'Password1!', user.sAMAccountName];
  if (!validPasswords.includes(password)) {
    return res.status(401).json({ error: 'Invalid credentials', message: 'LDAP bind failed: wrong password' });
  }

  const token = uuid();
  const session = { bind_dn: user.distinguishedName, user: user.sAMAccountName, created: new Date().toISOString() };
  tokens.set(token, session);
  res.json({ token, bind_dn: user.distinguishedName, message: 'Bind successful' });
});

module.exports = router;
