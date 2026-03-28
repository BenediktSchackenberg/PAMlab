const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');

const router = Router();

// Access Policies: bind a group → safe → listener with time restrictions
// This is the core Fudo logic: "Group X can access Safe Y via Listener Z"

// Initialize policies store
if (!db.accessPolicies) db.accessPolicies = [];

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const items = db.accessPolicies.slice(offset, offset + limit);
  res.json({ total: db.accessPolicies.length, limit, offset, items });
});

router.get('/:id', (req, res) => {
  const p = db.accessPolicies.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not Found', message: 'Access policy not found' });
  res.json(p);
});

router.post('/', (req, res) => {
  const { name, group_id, safe_id, listener_id, time_restriction, require_approval, max_duration_hours, record_session } = req.body || {};
  if (!name) return res.status(422).json({ error: 'Validation Error', message: 'name is required' });
  if (!group_id) return res.status(422).json({ error: 'Validation Error', message: 'group_id is required' });
  if (!safe_id) return res.status(422).json({ error: 'Validation Error', message: 'safe_id is required' });

  // Validate references
  if (!db.groups.find(g => g.id === group_id)) return res.status(422).json({ error: 'Validation Error', message: 'Group not found' });
  if (!db.safes.find(s => s.id === safe_id)) return res.status(422).json({ error: 'Validation Error', message: 'Safe not found' });
  if (listener_id && !db.listeners.find(l => l.id === listener_id)) return res.status(422).json({ error: 'Validation Error', message: 'Listener not found' });

  const now = new Date().toISOString();
  const policy = {
    id: uuidv4(),
    name,
    group_id,
    group_name: db.groups.find(g => g.id === group_id)?.name || null,
    safe_id,
    safe_name: db.safes.find(s => s.id === safe_id)?.name || null,
    listener_id: listener_id || null,
    listener_name: listener_id ? (db.listeners.find(l => l.id === listener_id)?.name || null) : null,
    time_restriction: time_restriction || null, // e.g. { days: ["mon","tue","wed","thu","fri"], start: "08:00", end: "18:00" }
    require_approval: require_approval ?? false,
    max_duration_hours: max_duration_hours || null,
    record_session: record_session ?? true,
    status: 'active',
    created_at: now,
    modified_at: now,
  };

  db.accessPolicies.push(policy);

  // Also ensure group → safe link exists
  if (!db.groupSafes.find(gs => gs.group_id === group_id && gs.safe_id === safe_id)) {
    db.groupSafes.push({ group_id, safe_id });
  }

  res.status(201).json(policy);
});

router.put('/:id', (req, res) => {
  const p = db.accessPolicies.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not Found', message: 'Access policy not found' });
  const fields = ['name', 'group_id', 'safe_id', 'listener_id', 'time_restriction', 'require_approval', 'max_duration_hours', 'record_session', 'status'];
  for (const f of fields) {
    if (req.body[f] !== undefined) p[f] = req.body[f];
  }
  // Refresh names
  if (p.group_id) p.group_name = db.groups.find(g => g.id === p.group_id)?.name || null;
  if (p.safe_id) p.safe_name = db.safes.find(s => s.id === p.safe_id)?.name || null;
  if (p.listener_id) p.listener_name = db.listeners.find(l => l.id === p.listener_id)?.name || null;
  p.modified_at = new Date().toISOString();
  res.json(p);
});

router.delete('/:id', (req, res) => {
  const idx = db.accessPolicies.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not Found', message: 'Access policy not found' });
  db.accessPolicies.splice(idx, 1);
  res.status(204).end();
});

// Check access: does a user have access to a specific safe?
router.get('/check/:user_id/:safe_id', (req, res) => {
  const { user_id, safe_id } = req.params;
  const user = db.users.find(u => u.id === user_id);
  if (!user) return res.status(404).json({ error: 'Not Found', message: 'User not found' });

  // Find all groups the user belongs to
  const userGroupIds = db.groupUsers.filter(gu => gu.user_id === user_id).map(gu => gu.group_id);
  
  // Find policies that match group + safe
  const policies = db.accessPolicies.filter(p => 
    p.safe_id === safe_id && 
    userGroupIds.includes(p.group_id) && 
    p.status === 'active'
  );

  // Also check direct safe-user assignment
  const directAccess = db.safeUsers.find(su => su.safe_id === safe_id && su.user_id === user_id);

  res.json({
    user_id,
    user_login: user.login,
    safe_id,
    has_access: policies.length > 0 || !!directAccess,
    access_via: [
      ...policies.map(p => ({ type: 'policy', policy_id: p.id, policy_name: p.name, group: p.group_name })),
      ...(directAccess ? [{ type: 'direct', reason: 'Direct safe assignment' }] : []),
    ],
  });
});

module.exports = router;
