const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// GET /users — list employees
router.get('/', (req, res) => {
  let results = [...store.objects.SPSUserClassBase];
  const { department, status, search, limit, offset } = req.query;
  if (department) results = results.filter(u => u.Department === department);
  if (status) results = results.filter(u => u.Status === status);
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(u => `${u.FirstName} ${u.LastName} ${u.AccountName} ${u.Email}`.toLowerCase().includes(s));
  }
  const total = results.length;
  const off = parseInt(offset) || 0;
  const lim = parseInt(limit) || 50;
  results = results.slice(off, off + lim);
  res.json({ total, offset: off, limit: lim, data: results });
});

// GET /users/:id
router.get('/:id', (req, res) => {
  const user = store.objects.SPSUserClassBase.find(u => u.ID === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST /users — create employee
router.post('/', (req, res) => {
  const user = { ID: uuidv4(), Status: 'Onboarding', CreatedDate: new Date().toISOString(), ModifiedDate: new Date().toISOString(), ...req.body };
  store.objects.SPSUserClassBase.push(user);
  // Auto-create onboarding workflow
  const wf = {
    id: uuidv4(), type: 'onboarding', userId: user.ID, userName: user.AccountName || `${user.FirstName}.${user.LastName}`.toLowerCase(),
    status: 'pending', createdDate: new Date().toISOString(), completedDate: null, params: { department: user.Department, manager: user.Manager }
  };
  store.provisioningWorkflows.push(wf);
  const steps = ['Create AD account', 'Add to security groups', 'Configure PAM access', 'Assign assets', 'Send welcome email'];
  steps.forEach((name, i) => {
    store.workflowSteps.push({ id: uuidv4(), workflowId: wf.id, stepNumber: i + 1, name, status: 'pending', completedDate: null });
  });
  res.status(201).json({ user, workflow: wf });
});

// PUT /users/:id
router.put('/:id', (req, res) => {
  const list = store.objects.SPSUserClassBase;
  const idx = list.findIndex(u => u.ID === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  list[idx] = { ...list[idx], ...req.body, ID: req.params.id, ModifiedDate: new Date().toISOString() };
  res.json(list[idx]);
});

// DELETE /users/:id — soft delete
router.delete('/:id', (req, res) => {
  const list = store.objects.SPSUserClassBase;
  const idx = list.findIndex(u => u.ID === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  list[idx].Status = 'Inactive';
  list[idx].ModifiedDate = new Date().toISOString();
  res.json({ deactivated: true, user: list[idx] });
});

// GET /users/:id/assets
router.get('/:id/assets', (req, res) => {
  const assignments = store.assetAssignments.filter(a => a.userId === req.params.id && a.status === 'Active');
  const assets = assignments.map(a => {
    const asset = store.objects.SPSAssetClassBase.find(as => as.ID === a.assetId);
    return { ...a, asset };
  });
  res.json(assets);
});

// POST /users/:id/assets — assign asset
router.post('/:id/assets', (req, res) => {
  const { assetId } = req.body;
  const assignment = { id: uuidv4(), userId: req.params.id, assetId, assignedDate: new Date().toISOString(), status: 'Active' };
  store.assetAssignments.push(assignment);
  const asset = store.objects.SPSAssetClassBase.find(a => a.ID === assetId);
  if (asset) {
    const user = store.objects.SPSUserClassBase.find(u => u.ID === req.params.id);
    asset.AssignedUser = user ? user.AccountName : req.params.id;
  }
  res.status(201).json(assignment);
});

// DELETE /users/:id/assets/:assetId
router.delete('/:id/assets/:assetId', (req, res) => {
  const idx = store.assetAssignments.findIndex(a => a.userId === req.params.id && a.assetId === req.params.assetId && a.status === 'Active');
  if (idx === -1) return res.status(404).json({ error: 'Assignment not found' });
  store.assetAssignments[idx].status = 'Removed';
  const asset = store.objects.SPSAssetClassBase.find(a => a.ID === req.params.assetId);
  if (asset) asset.AssignedUser = null;
  res.json({ removed: true });
});

// GET /users/:id/groups
router.get('/:id/groups', (req, res) => {
  res.json(store.userGroupMappings.filter(g => g.userId === req.params.id));
});

// POST /users/:id/groups
router.post('/:id/groups', (req, res) => {
  const mapping = { id: uuidv4(), userId: req.params.id, groupName: req.body.groupName, status: 'Pending', assignedDate: null };
  store.userGroupMappings.push(mapping);
  res.status(201).json(mapping);
});

// GET /users/:id/tickets
router.get('/:id/tickets', (req, res) => {
  const user = store.objects.SPSUserClassBase.find(u => u.ID === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const tickets = store.objects.SPSActivityClassBase.filter(t => t.Reporter === user.AccountName || t.AssignedTo === user.AccountName);
  res.json(tickets);
});

// GET /users/:id/software
router.get('/:id/software', (req, res) => {
  const userAssets = store.assetAssignments.filter(a => a.userId === req.params.id && a.status === 'Active');
  const assetIds = userAssets.map(a => a.assetId);
  const installations = store.softwareInstallations.filter(si => assetIds.includes(si.assetId));
  const result = installations.map(si => {
    const sw = store.objects.SPSSoftwareType.find(s => s.ID === si.softwareId);
    return { ...si, software: sw };
  });
  res.json(result);
});

// POST /users/:id/onboard
router.post('/:id/onboard', (req, res) => {
  const user = store.objects.SPSUserClassBase.find(u => u.ID === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.Status = 'Onboarding';
  const wf = {
    id: uuidv4(), type: 'onboarding', userId: user.ID, userName: user.AccountName,
    status: 'pending', createdDate: new Date().toISOString(), completedDate: null, params: req.body || {}
  };
  store.provisioningWorkflows.push(wf);
  const steps = ['Create AD account', 'Add to security groups', 'Configure PAM access', 'Assign assets', 'Send welcome email'];
  steps.forEach((name, i) => {
    store.workflowSteps.push({ id: uuidv4(), workflowId: wf.id, stepNumber: i + 1, name, status: 'pending', completedDate: null });
  });
  res.status(201).json({ workflow: wf });
});

// POST /users/:id/offboard
router.post('/:id/offboard', (req, res) => {
  const user = store.objects.SPSUserClassBase.find(u => u.ID === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.Status = 'Offboarding';
  const wf = {
    id: uuidv4(), type: 'offboarding', userId: user.ID, userName: user.AccountName,
    status: 'pending', createdDate: new Date().toISOString(), completedDate: null, params: req.body || {}
  };
  store.provisioningWorkflows.push(wf);
  const steps = ['Disable AD account', 'Remove from security groups', 'Revoke PAM access', 'Reclaim assets', 'Archive mailbox'];
  steps.forEach((name, i) => {
    store.workflowSteps.push({ id: uuidv4(), workflowId: wf.id, stepNumber: i + 1, name, status: 'pending', completedDate: null });
  });
  res.status(201).json({ workflow: wf });
});

// GET /users/:id/access-history
router.get('/:id/access-history', (req, res) => {
  const user = store.objects.SPSUserClassBase.find(u => u.ID === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const requests = store.accessRequests.filter(r => r.user === user.AccountName);
  const groups = store.userGroupMappings.filter(g => g.userId === req.params.id);
  const workflows = store.provisioningWorkflows.filter(w => w.userId === req.params.id);
  res.json({ accessRequests: requests, groupMemberships: groups, workflows });
});

module.exports = router;
