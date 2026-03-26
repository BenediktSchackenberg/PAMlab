const { Router } = require('express');
const store = require('../data/store');
const router = Router();

router.post('/group-membership', (req, res) => {
  const { action, group, users } = req.body;
  if (!action || !group || !Array.isArray(users)) return res.status(400).json({ error: 'action, group, and users[] required' });
  const g = store.findGroup(group);
  if (!g) return res.status(404).json({ error: 'Group not found' });
  const results = [];
  for (const sam of users) {
    const u = store.findUser(sam);
    if (!u) { results.push({ user: sam, status: 'not_found' }); continue; }
    if (action === 'add') {
      if (!g.members.includes(u.distinguishedName)) g.members.push(u.distinguishedName);
      if (!u.memberOf.includes(g.distinguishedName)) u.memberOf.push(g.distinguishedName);
      results.push({ user: sam, status: 'added' });
    } else if (action === 'remove') {
      g.members = g.members.filter(m => m !== u.distinguishedName);
      u.memberOf = u.memberOf.filter(x => x !== g.distinguishedName);
      results.push({ user: sam, status: 'removed' });
    }
  }
  g.whenChanged = new Date().toISOString();
  res.json({ group, action, results });
});

module.exports = router;
