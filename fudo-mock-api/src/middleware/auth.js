const db = require('../data/store');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.slice(7);
  const session = db.tokens.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired session token' });
  }
  req.userId = session.user_id;
  req.userLogin = session.login;
  next();
}

module.exports = authMiddleware;
