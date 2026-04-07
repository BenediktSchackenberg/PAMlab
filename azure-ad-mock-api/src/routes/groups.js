const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const {
  omitSecrets,
  graphCollection,
  applySearch,
  applyTop,
  extractMemberIds,
} = require('./utils');

const router = Router();

router.get('/', (req, res) => {
  const groups = applyTop(
    applySearch(
      store.groups.map((group) => omitSecrets(group)),
      req.query,
      ['displayName', 'description', 'mailNickname'],
    ),
    req.query,
  );
  res.json(graphCollection('groups', groups));
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

  if (store.findGroup(displayName)) {
    return res.status(409).json({
      error: {
        code: 'Request_ResourceConflict',
        message: `Group "${displayName}" already exists.`,
      },
    });
  }

  const group = {
    id: uuidv4(),
    displayName,
    description: req.body.description || '',
    mailNickname:
      req.body.mailNickname || displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    securityEnabled: req.body.securityEnabled !== false,
    mailEnabled: Boolean(req.body.mailEnabled),
    groupTypes: Array.isArray(req.body.groupTypes) ? req.body.groupTypes : [],
    createdDateTime: new Date().toISOString(),
    members: [],
  };

  store.groups.push(group);
  res.status(201).json(omitSecrets(group));
});

router.get('/:id/members', (req, res) => {
  const group = store.findGroup(req.params.id);
  if (!group) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'Group not found.',
      },
    });
  }

  const members = group.members
    .map((memberId) => store.resolveDirectoryObject(memberId))
    .filter(Boolean)
    .map((member) => omitSecrets(member));

  res.json(graphCollection('directoryObjects', members));
});

router.post('/:id/members', (req, res) => {
  const group = store.findGroup(req.params.id);
  if (!group) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'Group not found.',
      },
    });
  }

  const memberIds = extractMemberIds(req.body);
  if (memberIds.length === 0) {
    return res.status(400).json({
      error: {
        code: 'Request_BadRequest',
        message: 'Provide memberId, members, or @odata.id.',
      },
    });
  }

  const addedMembers = [];
  for (const memberId of memberIds) {
    const directoryObject = store.resolveDirectoryObject(memberId);
    if (!directoryObject) continue;
    if (!group.members.includes(directoryObject.id)) {
      group.members.push(directoryObject.id);
    }
    addedMembers.push(omitSecrets(directoryObject));
  }

  res.status(201).json(graphCollection('directoryObjects', addedMembers));
});

router.delete('/:id/members/:memberId', (req, res) => {
  const group = store.findGroup(req.params.id);
  if (!group) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'Group not found.',
      },
    });
  }

  const member = store.resolveDirectoryObject(req.params.memberId);
  if (!member) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'Member not found.',
      },
    });
  }

  group.members = group.members.filter((memberId) => memberId !== member.id);
  res.status(204).send();
});

router.get('/:id', (req, res) => {
  const group = store.findGroup(req.params.id);
  if (!group) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'Group not found.',
      },
    });
  }

  res.json(omitSecrets(group));
});

router.patch('/:id', (req, res) => {
  const group = store.findGroup(req.params.id);
  if (!group) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'Group not found.',
      },
    });
  }

  for (const field of ['displayName', 'description', 'mailNickname', 'securityEnabled']) {
    if (req.body[field] !== undefined) {
      group[field] = req.body[field];
    }
  }

  res.json(omitSecrets(group));
});

router.delete('/:id', (req, res) => {
  const index = store.groups.findIndex(
    (group) =>
      group.id === req.params.id ||
      group.displayName === req.params.id ||
      group.mailNickname === req.params.id,
  );
  if (index === -1) {
    return res.status(404).json({
      error: {
        code: 'Request_ResourceNotFound',
        message: 'Group not found.',
      },
    });
  }

  store.groups.splice(index, 1);
  res.status(204).send();
});

module.exports = router;
