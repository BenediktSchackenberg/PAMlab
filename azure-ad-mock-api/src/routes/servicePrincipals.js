const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const { omitSecrets, graphCollection, applySearch, applyTop } = require('./utils');

const router = Router();

router.get('/', (req, res) => {
  const servicePrincipals = applyTop(
    applySearch(
      store.servicePrincipals.map((servicePrincipal) => omitSecrets(servicePrincipal)),
      req.query,
      ['displayName', 'appId'],
    ),
    req.query,
  );

  res.json(graphCollection('servicePrincipals', servicePrincipals));
});

router.post('/', (req, res) => {
  const displayName = req.body.displayName;
  if (!displayName) {
    return res.status(400).json({
      error: {
        code: 'Request_BadRequest',
        message: 'displayName is required.',
      },
    });
  }

  const servicePrincipal = {
    id: uuidv4(),
    appId: req.body.appId || uuidv4(),
    displayName,
    servicePrincipalType: req.body.servicePrincipalType || 'Application',
    accountEnabled: req.body.accountEnabled !== false,
    appOwnerOrganizationId: 'corp.local',
    createdDateTime: new Date().toISOString(),
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    appRoleAssignmentRequired: Boolean(req.body.appRoleAssignmentRequired),
    mockClientSecret: req.body.clientSecret || 'Generated-Secret-1!',
  };

  store.servicePrincipals.push(servicePrincipal);
  res.status(201).json(omitSecrets(servicePrincipal));
});

router.get('/:id', (req, res) => {
  const servicePrincipal = store.findServicePrincipal(req.params.id);
  if (!servicePrincipal) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'Service principal not found.',
      },
    });
  }

  res.json(omitSecrets(servicePrincipal));
});

module.exports = router;
