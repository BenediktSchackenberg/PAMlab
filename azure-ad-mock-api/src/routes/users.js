const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const { omitSecrets, graphCollection, applySearch, applyTop } = require('./utils');

const router = Router();

router.get('/', (req, res) => {
  const users = applyTop(
    applySearch(
      store.users.map((user) => omitSecrets(user)),
      req.query,
      ['displayName', 'userPrincipalName', 'mail', 'onPremisesSamAccountName'],
    ),
    req.query,
  );

  res.json(graphCollection('users', users));
});

router.post('/', (req, res) => {
  const userPrincipalName =
    req.body.userPrincipalName ||
    req.body.mail ||
    (req.body.onPremisesSamAccountName
      ? `${req.body.onPremisesSamAccountName}@corp.local`
      : null);
  const displayName = req.body.displayName || req.body.userPrincipalName;

  if (!userPrincipalName || !displayName) {
    return res.status(400).json({
      error: {
        code: 'Request_BadRequest',
        message: 'userPrincipalName (or mail) and displayName are required.',
      },
    });
  }

  if (store.findUser(userPrincipalName)) {
    return res.status(409).json({
      error: {
        code: 'Request_ResourceConflict',
        message: `User "${userPrincipalName}" already exists.`,
      },
    });
  }

  const now = new Date().toISOString();
  const localPart = userPrincipalName.split('@')[0];
  const user = {
    id: uuidv4(),
    userPrincipalName,
    displayName,
    givenName: req.body.givenName || '',
    surname: req.body.surname || '',
    mail: req.body.mail || userPrincipalName,
    department: req.body.department || '',
    jobTitle: req.body.jobTitle || '',
    accountEnabled: req.body.accountEnabled !== false,
    userType: req.body.userType || 'Member',
    onPremisesSyncEnabled: Boolean(req.body.onPremisesSamAccountName),
    onPremisesSamAccountName: req.body.onPremisesSamAccountName || null,
    signInSessionsValidFromDateTime: now,
    createdDateTime: now,
    lastSignInDateTime: null,
    passwordProfile: {
      forceChangePasswordNextSignIn: Boolean(
        req.body.passwordProfile?.forceChangePasswordNextSignIn,
      ),
    },
    mockPassword: req.body.password || 'Password1!',
  };

  if (!user.onPremisesSamAccountName) {
    user.onPremisesSamAccountName = localPart.includes('.') ? localPart : null;
  }

  store.users.push(user);
  res.status(201).json(omitSecrets(user));
});

router.get('/:id/memberOf', (req, res) => {
  const user = store.findUser(req.params.id);
  if (!user) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'User not found.',
      },
    });
  }

  const groups = store.groups
    .filter((group) => group.members.includes(user.id))
    .map((group) => omitSecrets(group));

  res.json(graphCollection('directoryObjects', groups));
});

router.post('/:id/revokeSignInSessions', (req, res) => {
  const user = store.findUser(req.params.id);
  if (!user) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'User not found.',
      },
    });
  }

  user.signInSessionsValidFromDateTime = new Date().toISOString();
  res.json({ value: true });
});

router.get('/:id', (req, res) => {
  const user = store.findUser(req.params.id);
  if (!user) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'User not found.',
      },
    });
  }

  res.json(omitSecrets(user));
});

router.patch('/:id', (req, res) => {
  const user = store.findUser(req.params.id);
  if (!user) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'User not found.',
      },
    });
  }

  for (const field of [
    'displayName',
    'givenName',
    'surname',
    'mail',
    'department',
    'jobTitle',
    'accountEnabled',
  ]) {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  }

  res.json(omitSecrets(user));
});

router.delete('/:id', (req, res) => {
  const index = store.users.findIndex(
    (user) =>
      user.id === req.params.id ||
      user.userPrincipalName === req.params.id ||
      user.onPremisesSamAccountName === req.params.id,
  );
  if (index === -1) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'User not found.',
      },
    });
  }

  const [removed] = store.users.splice(index, 1);
  store.groups.forEach((group) => {
    group.members = group.members.filter((memberId) => memberId !== removed.id);
  });
  store.roleAssignments = store.roleAssignments.filter(
    (assignment) => assignment.principalId !== removed.id,
  );
  store.roleEligibilityScheduleRequests = store.roleEligibilityScheduleRequests.filter(
    (request) => request.principalId !== removed.id,
  );
  store.roleAssignmentScheduleRequests = store.roleAssignmentScheduleRequests.filter(
    (request) => request.principalId !== removed.id,
  );

  res.status(204).send();
});

module.exports = router;
