const store = require('../data/store');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: [{ messageType: 'ERROR', messageText: 'Missing Authorization header', messageNumber: 401 }] });
  }

  // AR-JWT token auth (Remedy native)
  if (authHeader.startsWith('AR-JWT ')) {
    const token = authHeader.slice(7);
    const session = store.jwt_sessions.find(s => s.token === token);
    const validDefault = token === store.defaultToken;
    if (session || validDefault) return next();
    return res.status(401).json({ error: [{ messageType: 'ERROR', messageText: 'Invalid or expired AR-JWT token', messageNumber: 401 }] });
  }

  // Bearer token (convenience for PAMlab)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (store.tokens.some(t => t.token === token)) return next();
    return res.status(401).json({ error: [{ messageType: 'ERROR', messageText: 'Invalid Bearer token', messageNumber: 401 }] });
  }

  // Basic auth
  if (authHeader.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [username, ...rest] = decoded.split(':');
    const password = rest.join(':');
    const validPasswords = ['admin', 'admin123', 'Password1!', username];
    if (!validPasswords.includes(password)) {
      return res.status(401).json({ error: [{ messageType: 'ERROR', messageText: 'Invalid credentials', messageNumber: 401 }] });
    }
    const person = store.forms['CTM:People'].find(p => p['Login ID'] === username);
    if (person) {
      req.remedyUser = person;
      return next();
    }
    return res.status(401).json({ error: [{ messageType: 'ERROR', messageText: 'Invalid credentials', messageNumber: 401 }] });
  }

  return res.status(401).json({ error: [{ messageType: 'ERROR', messageText: 'Unsupported authentication method', messageNumber: 401 }] });
}

module.exports = authMiddleware;
