const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// POST /provisioning/workflows — create workflow
router.post('/workflows', (req, res) => {
  const { type, userId, params } = req.body;
  const user = store.objects.SPSUserClassBase.find(u => u.ID === userId);
  const wf = {
    id: uuidv4(), type, userId, userName: user ? user.AccountName : userId,
    status: 'pending', createdDate: new Date().toISOString(), completedDate: null, params: params || {}
  };
  store.provisioningWorkflows.push(wf);

  let stepNames;
  switch (type) {
    case 'onboarding': stepNames = ['Create AD account', 'Add to security groups', 'Configure PAM access', 'Assign assets', 'Send welcome email']; break;
    case 'offboarding': stepNames = ['Disable AD account', 'Remove from security groups', 'Revoke PAM access', 'Reclaim assets', 'Archive mailbox']; break;
    case 'access-change': stepNames = ['Validate request approval', 'Add to security groups', 'Configure PAM access', 'Notify user']; break;
    case 'asset-assignment': stepNames = ['Validate asset availability', 'Configure asset', 'Assign to user', 'Install required software']; break;
    default: stepNames = ['Execute workflow'];
  }

  const steps = stepNames.map((name, i) => {
    const step = { id: uuidv4(), workflowId: wf.id, stepNumber: i + 1, name, status: 'pending', completedDate: null };
    store.workflowSteps.push(step);
    return step;
  });

  res.status(201).json({ workflow: wf, steps });
});

// GET /provisioning/workflows
router.get('/workflows', (req, res) => {
  let results = [...store.provisioningWorkflows];
  const { status, type, userId } = req.query;
  if (status) results = results.filter(w => w.status === status);
  if (type) results = results.filter(w => w.type === type);
  if (userId) results = results.filter(w => w.userId === userId);
  res.json({ total: results.length, data: results });
});

// GET /provisioning/workflows/:id
router.get('/workflows/:id', (req, res) => {
  const wf = store.provisioningWorkflows.find(w => w.id === req.params.id);
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });
  const steps = store.workflowSteps.filter(s => s.workflowId === req.params.id).sort((a, b) => a.stepNumber - b.stepNumber);
  res.json({ ...wf, steps });
});

// POST /provisioning/workflows/:id/execute — execute next step
router.post('/workflows/:id/execute', (req, res) => {
  const wf = store.provisioningWorkflows.find(w => w.id === req.params.id);
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });
  if (wf.status === 'completed' || wf.status === 'cancelled') return res.status(400).json({ error: `Workflow is ${wf.status}` });

  wf.status = 'in-progress';
  const steps = store.workflowSteps.filter(s => s.workflowId === req.params.id).sort((a, b) => a.stepNumber - b.stepNumber);
  const nextStep = steps.find(s => s.status === 'pending');
  if (!nextStep) {
    wf.status = 'completed';
    wf.completedDate = new Date().toISOString();
    return res.json({ workflow: wf, message: 'All steps completed' });
  }
  nextStep.status = 'in-progress';
  res.json({ workflow: wf, currentStep: nextStep });
});

// POST /provisioning/workflows/:id/cancel
router.post('/workflows/:id/cancel', (req, res) => {
  const wf = store.provisioningWorkflows.find(w => w.id === req.params.id);
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });
  wf.status = 'cancelled';
  res.json(wf);
});

// GET /provisioning/workflows/:id/steps
router.get('/workflows/:id/steps', (req, res) => {
  const steps = store.workflowSteps.filter(s => s.workflowId === req.params.id).sort((a, b) => a.stepNumber - b.stepNumber);
  res.json(steps);
});

// POST /provisioning/workflows/:id/steps/:stepId/complete
router.post('/workflows/:id/steps/:stepId/complete', (req, res) => {
  const step = store.workflowSteps.find(s => s.id === req.params.stepId && s.workflowId === req.params.id);
  if (!step) return res.status(404).json({ error: 'Step not found' });
  step.status = 'completed';
  step.completedDate = new Date().toISOString();

  // Check if all steps completed
  const allSteps = store.workflowSteps.filter(s => s.workflowId === req.params.id);
  if (allSteps.every(s => s.status === 'completed')) {
    const wf = store.provisioningWorkflows.find(w => w.id === req.params.id);
    if (wf) { wf.status = 'completed'; wf.completedDate = new Date().toISOString(); }
  }
  res.json(step);
});

// POST /provisioning/workflows/:id/steps/:stepId/fail
router.post('/workflows/:id/steps/:stepId/fail', (req, res) => {
  const step = store.workflowSteps.find(s => s.id === req.params.stepId && s.workflowId === req.params.id);
  if (!step) return res.status(404).json({ error: 'Step not found' });
  step.status = 'failed';
  step.error = req.body.error || 'Unknown error';
  const wf = store.provisioningWorkflows.find(w => w.id === req.params.id);
  if (wf) wf.status = 'failed';
  res.json(step);
});

module.exports = router;
