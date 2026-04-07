const { Router } = require('express');
const store = require('../data/store');
const { issueToken } = require('../middleware/auth');

const router = Router();

function tokenError(res, status, error, description) {
  return res.status(status).json({
    error,
    error_description: description,
  });
}

router.post('/', (req, res) => {
  const body = req.body || {};
  const grantType = body.grant_type || body.grantType;
  const scope = body.scope || 'https://graph.microsoft.com/.default';

  if (!grantType) {
    return tokenError(res, 400, 'invalid_request', 'grant_type is required.');
  }

  if (grantType === 'client_credentials') {
    const clientId = body.client_id || body.clientId;
    const clientSecret = body.client_secret || body.clientSecret;
    const servicePrincipal = store.findServicePrincipal(clientId);

    if (!servicePrincipal || servicePrincipal.mockClientSecret !== clientSecret) {
      return tokenError(res, 401, 'invalid_client', 'Invalid client credentials.');
    }

    const accessToken = issueToken(
      { type: 'servicePrincipal', actor: servicePrincipal },
      scope,
    );

    return res.json({
      token_type: 'Bearer',
      expires_in: 3600,
      ext_expires_in: 3600,
      access_token: accessToken,
      scope,
    });
  }

  if (grantType === 'password') {
    const username = body.username;
    const password = body.password;
    const user = store.findUser(username);

    if (!user || ![user.mockPassword, 'admin', 'Password1!'].includes(password)) {
      return tokenError(res, 401, 'invalid_grant', 'Invalid username or password.');
    }

    const accessToken = issueToken({ type: 'user', actor: user }, scope);
    return res.json({
      token_type: 'Bearer',
      expires_in: 3600,
      ext_expires_in: 3600,
      access_token: accessToken,
      scope,
    });
  }

  return tokenError(
    res,
    400,
    'unsupported_grant_type',
    `Grant type "${grantType}" is not supported by this mock.`,
  );
});

module.exports = router;
