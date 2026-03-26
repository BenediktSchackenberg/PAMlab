const store = require('../data/store');

function authMiddleware(req, res, next) {
  // Skip auth for token generation endpoint
  if (req.path.includes('/ApiToken')) return next();
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  
  const token = authHeader.split(' ')[1];
  const valid = store.tokens.some(t => t.RawToken === token || t.apiToken === token);
  if (!valid) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
  
  next();
}

module.exports = authMiddleware;
