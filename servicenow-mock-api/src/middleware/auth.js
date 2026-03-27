const store = require('../data/store');

function authMiddleware(req, res, next) {
  // Skip auth for auth endpoints and health
  if (req.path.startsWith('/api/now/auth') || req.path === '/health') return next();

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: { message: 'Missing Authorization header', detail: 'Provide Bearer token or Basic auth' } });
  }

  // Bearer token auth
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const valid = store.tokens.some(t => t.token === token);
    if (!valid) {
      return res.status(401).json({ error: { message: 'Invalid or expired token' } });
    }
    return next();
  }

  // Basic auth (ServiceNow-style)
  if (authHeader.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
    const [username, password] = decoded.split(':');
    // Accept any user that exists in sys_user with password = username (mock)
    const user = store.tables.sys_user.find(u => u.user_name === username);
    if (user) {
      req.snowUser = user;
      return next();
    }
    return res.status(401).json({ error: { message: 'Invalid credentials' } });
  }

  return res.status(401).json({ error: { message: 'Unsupported authentication method' } });
}

module.exports = authMiddleware;
