const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const { graphCollection, applySearch, applyTop } = require('./utils');

const router = Router();

router.get('/', (req, res) => {
  const policies = applyTop(
    applySearch(store.conditionalAccessPolicies, req.query, ['displayName', 'state']),
    req.query,
  );
  res.json(graphCollection('identity/conditionalAccess/policies', policies));
});

router.post('/', (req, res) => {
  if (!req.body.displayName) {
    return res.status(400).json({
      error: {
        code: 'Request_BadRequest',
        message: 'displayName is required.',
      },
    });
  }

  const now = new Date().toISOString();
  const policy = {
    id: uuidv4(),
    displayName: req.body.displayName,
    state: req.body.state || 'enabled',
    conditions: req.body.conditions || {},
    grantControls: req.body.grantControls || { operator: 'OR', builtInControls: [] },
    sessionControls: req.body.sessionControls || {},
    createdDateTime: now,
    modifiedDateTime: now,
  };

  store.conditionalAccessPolicies.push(policy);
  res.status(201).json(policy);
});

router.get('/:id', (req, res) => {
  const policy = store.conditionalAccessPolicies.find((item) => item.id === req.params.id);
  if (!policy) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'Conditional Access policy not found.',
      },
    });
  }

  res.json(policy);
});

router.patch('/:id', (req, res) => {
  const policy = store.conditionalAccessPolicies.find((item) => item.id === req.params.id);
  if (!policy) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'Conditional Access policy not found.',
      },
    });
  }

  for (const field of ['displayName', 'state', 'conditions', 'grantControls', 'sessionControls']) {
    if (req.body[field] !== undefined) {
      policy[field] = req.body[field];
    }
  }
  policy.modifiedDateTime = new Date().toISOString();

  res.json(policy);
});

router.delete('/:id', (req, res) => {
  const index = store.conditionalAccessPolicies.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'Conditional Access policy not found.',
      },
    });
  }

  store.conditionalAccessPolicies.splice(index, 1);
  res.status(204).send();
});

module.exports = router;
