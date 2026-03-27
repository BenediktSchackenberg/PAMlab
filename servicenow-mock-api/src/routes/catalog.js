const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');

function sysId() { return uuidv4().replace(/-/g, ''); }
function now() { return new Date().toISOString().replace('T', ' ').replace('Z', ''); }

const catalogItems = [
  { item_id: 'cat-priv-access', name: 'Privileged Access Request', category: 'Access', description: 'Request privileged access to a server via Fudo PAM', delivery_time: '2 business days' },
  { item_id: 'cat-access-revoke', name: 'Emergency Access Revocation', category: 'Access', description: 'Immediately revoke all privileged access for a user', delivery_time: '1 hour' },
  { item_id: 'cat-vault-onboard', name: 'Password Vault Onboarding', category: 'Security', description: 'Onboard service account into Fudo PAM password vault', delivery_time: '3 business days' },
  { item_id: 'cat-new-server', name: 'New Server PAM Enrollment', category: 'Infrastructure', description: 'Enroll a new server into PAM monitoring and session recording', delivery_time: '5 business days' },
];

// GET /api/now/catalog/items
router.get('/items', (req, res) => {
  res.json({ result: catalogItems });
});

// POST /api/now/catalog/items/:item_id/order
router.post('/items/:item_id/order', (req, res) => {
  const item = catalogItems.find(i => i.item_id === req.params.item_id);
  if (!item) return res.status(404).json({ error: { message: 'Catalog item not found' } });

  const ts = now();
  const reqId = sysId();
  const reqNum = `REQ${String(store.tables.sc_request.length + 1).padStart(4, '0')}`;
  const ritmNum = `RITM${String(store.tables.sc_req_item.length + 1).padStart(4, '0')}`;

  const request = {
    sys_id: reqId, number: reqNum, short_description: `Order: ${item.name}`,
    description: req.body.description || '', state: 1, priority: 3,
    requested_for: req.body.requested_for || '', opened_by: req.body.opened_by || 'api',
    approval: 'requested', stage: 'waiting_for_approval',
    sys_created_on: ts, sys_updated_on: ts, sys_created_by: 'api',
  };
  store.tables.sc_request.push(request);

  const reqItem = {
    sys_id: sysId(), number: ritmNum, request: reqId,
    short_description: item.name, state: 1, catalog_item: req.params.item_id,
    assigned_to: '', assignment_group: '', stage: 'waiting_for_approval',
    variables: req.body.variables || {},
    sys_created_on: ts, sys_updated_on: ts, sys_created_by: 'api', priority: 3,
  };
  store.tables.sc_req_item.push(reqItem);

  res.status(201).json({ result: { request, items: [reqItem] } });
});

// GET /api/now/catalog/requests/:req_id/status
router.get('/requests/:req_id/status', (req, res) => {
  const request = store.tables.sc_request.find(r => r.sys_id === req.params.req_id || r.number === req.params.req_id);
  if (!request) return res.status(404).json({ error: { message: 'Request not found' } });

  const items = store.tables.sc_req_item.filter(i => i.request === request.sys_id);
  res.json({ result: { request, items } });
});

module.exports = router;
