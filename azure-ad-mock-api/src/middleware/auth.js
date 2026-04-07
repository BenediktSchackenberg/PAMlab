const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');

function issueToken(identity, scope = 'https://graph.microsoft.com/.default') {
  const token = `entra-${uuidv4()}`;
  store.tokens.set(token, {
    token,
    identity,
    scope,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
  return token;
}

function resolveBasicIdentity(authHeader) {
  const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
  const [username, ...rest] = decoded.split(':');
  const password = rest.join(':');

  const user = store.findUser(username);
  if (user && [user.mockPassword, 'admin', 'Password1!'].includes(password)) {
    return { type: 'user', actor: user };
  }

  const servicePrincipal = store.findServicePrincipal(username);
  if (servicePrincipal && servicePrincipal.mockClientSecret === password) {
    return { type: 'servicePrincipal', actor: servicePrincipal };
  }

  return null;
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: {
        code: 'InvalidAuthenticationToken',
        message: 'Provide a Bearer token or Basic credentials.',
      },
    });
  }

  if (authHeader.startsWith('Basic ')) {
    const identity = resolveBasicIdentity(authHeader);
    if (!identity) {
      return res.status(401).json({
        error: {
          code: 'InvalidAuthenticationToken',
          message: 'Invalid basic credentials.',
        },
      });
    }

    req.identity = identity;
    return next();
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'InvalidAuthenticationToken',
        message: 'Unsupported authentication scheme.',
      },
    });
  }

  const token = authHeader.slice(7);
  if (token === store.devToken) {
    req.identity = { type: 'user', actor: store.findUser('admin@corp.local') };
    return next();
  }

  const session = store.tokens.get(token);
  if (!session) {
    return res.status(401).json({
      error: {
        code: 'InvalidAuthenticationToken',
        message: 'Invalid or expired token.',
      },
    });
  }

  req.identity = session.identity;
  next();
}

module.exports = { authMiddleware, issueToken };
