const tokens = new Map();

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header with Bearer token required' });
  }
  const token = auth.slice(7);
  const session = tokens.get(token);
  if (!session) return res.status(401).json({ error: 'Invalid or expired token' });
  req.bindDN = session.bind_dn;
  next();
}

module.exports = { authMiddleware, tokens };
