const { Router } = require('express');
const { omitSecrets } = require('./utils');

const router = Router();

router.get('/', (req, res) => {
  const identity = req.identity;
  if (!identity) {
    return res.status(401).json({
      error: {
        code: 'InvalidAuthenticationToken',
        message: 'Authentication required.',
      },
    });
  }

  if (identity.type === 'servicePrincipal') {
    return res.json({
      id: identity.actor.id,
      displayName: identity.actor.displayName,
      appId: identity.actor.appId,
      accountType: 'servicePrincipal',
      tenant: 'corp.local',
    });
  }

  res.json(omitSecrets(identity.actor));
});

module.exports = router;
