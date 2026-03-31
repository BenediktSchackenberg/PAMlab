const tokens = new Map();

// Dev token always accepted for local development
const DEV_TOKEN = 'pamlab-dev-token';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  // Accept Basic auth (from PAMlab Studio) — validate credentials
  if (auth && auth.startsWith('Basic ')) {
    const decoded = Buffer.from(auth.slice(6), 'base64').toString();
    const [username, ...rest] = decoded.split(':');
    const password = rest.join(':');
    const store = require('../data/store');
    const user = store.findUser(username);
    const validPasswords = ['admin', 'admin123', 'Password1!'];
    if (user) validPasswords.push(user.sAMAccountName);
    if (!user || !validPasswords.includes(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.bindDN = user.distinguishedName || 'cn=admin,dc=corp,dc=local';
    return next();
  }
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header with Bearer token required' });
  }
  const token = auth.slice(7);
  // Accept dev token
  if (token === DEV_TOKEN) {
    req.bindDN = 'cn=admin,dc=corp,dc=local';
    return next();
  }
  const session = tokens.get(token);
  if (!session) return res.status(401).json({ error: 'Invalid or expired token' });
  req.bindDN = session.bind_dn;
  next();
}

module.exports = { authMiddleware, tokens };
