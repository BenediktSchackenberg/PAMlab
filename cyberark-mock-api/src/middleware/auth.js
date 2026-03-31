const db = require('../data/store');

const DEV_TOKEN = 'pamlab-dev-token';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // Accept Basic auth for dev/studio
  if (authHeader && authHeader.startsWith('Basic ')) {
    req.userId = 2;
    req.username = 'Administrator';
    return next();
  }

  if (!authHeader) {
    return res.status(401).json({ ErrorCode: 'PASWS001E', ErrorMessage: 'Missing Authorization header' });
  }

  // CyberArk uses raw token in Authorization header (no Bearer prefix typically)
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (token === DEV_TOKEN) {
    req.userId = 2;
    req.username = 'Administrator';
    return next();
  }

  const session = db.tokens.get(token);
  if (!session) {
    return res.status(401).json({ ErrorCode: 'PASWS004E', ErrorMessage: 'Invalid or expired session token' });
  }

  req.userId = session.userId;
  req.username = session.username;
  next();
}

module.exports = authMiddleware;
