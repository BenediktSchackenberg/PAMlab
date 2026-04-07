const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const {
  graphCollection,
  applyTop,
  applySearch,
  createRoleAssignment,
} = require('./utils');

const router = Router();

router.get('/roleAssignments', (req, res) => {
  const assignments = applyTop(
    applySearch(store.roleAssignments, req.query, [
      'principalDisplayName',
      'roleDefinitionDisplayName',
    ]),
    req.query,
  );
  res.json(graphCollection('roleManagement/directory/roleAssignments', assignments));
});

router.get('/roleEligibilityScheduleRequests', (req, res) => {
  const eligibilities = applyTop(
    applySearch(store.roleEligibilityScheduleRequests, req.query, [
      'principalDisplayName',
      'roleDefinitionDisplayName',
      'status',
    ]),
    req.query,
  );
  res.json(
    graphCollection('roleManagement/directory/roleEligibilityScheduleRequests', eligibilities),
  );
});

router.get('/roleAssignmentScheduleRequests', (req, res) => {
  const requests = applyTop(
    applySearch(store.roleAssignmentScheduleRequests, req.query, [
      'principalDisplayName',
      'roleDefinitionDisplayName',
      'status',
    ]),
    req.query,
  );
  res.json(
    graphCollection('roleManagement/directory/roleAssignmentScheduleRequests', requests),
  );
});

router.post('/roleAssignmentScheduleRequests', (req, res) => {
  const principal = store.findUser(req.body.principalId) || store.findServicePrincipal(req.body.principalId);
  const role = store.findRoleDefinition(req.body.roleDefinitionId);

  if (!principal || !role) {
    return res.status(400).json({
      error: {
        code: 'Request_BadRequest',
        message: 'principalId and roleDefinitionId must reference existing objects.',
      },
    });
  }

  const eligibility = store.roleEligibilityScheduleRequests.find(
    (item) => item.principalId === principal.id && item.roleDefinitionId === role.id,
  );
  if (!eligibility) {
    return res.status(400).json({
      error: {
        code: 'RoleAssignmentNotEligible',
        message: `${principal.displayName} is not eligible for ${role.displayName}.`,
      },
    });
  }

  const now = new Date().toISOString();
  const request = {
    id: uuidv4(),
    requestType: req.body.requestType || 'AdminAssign',
    action: req.body.action || 'selfActivate',
    principalId: principal.id,
    principalDisplayName: principal.displayName,
    roleDefinitionId: role.id,
    roleDefinitionDisplayName: role.displayName,
    directoryScopeId: req.body.directoryScopeId || '/',
    status: 'Provisioned',
    createdDateTime: now,
    scheduleInfo: req.body.scheduleInfo || {
      startDateTime: now,
      expiration: { type: 'AfterDuration', duration: 'PT2H' },
    },
    justification: req.body.justification || 'Activated via PAMlab Entra mock.',
  };

  store.roleAssignmentScheduleRequests.push(request);
  store.roleAssignments.push(
    createRoleAssignment({
      principal,
      role,
      directoryScopeId: request.directoryScopeId,
    }),
  );

  res.status(201).json(request);
});

router.get('/roleDefinitions', (req, res) => {
  const roleDefinitions = applyTop(
    applySearch(store.roleDefinitions, req.query, ['displayName', 'description']),
    req.query,
  );
  res.json(graphCollection('roleManagement/directory/roleDefinitions', roleDefinitions));
});

module.exports = router;
