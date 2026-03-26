const { Router } = require('express');
const store = require('../data/store');
const router = Router();

router.get('/', (req, res) => {
  let result = [...store.groups];
  const { filter, ou } = req.query;
  if (filter) { const f = filter.toLowerCase(); result = result.filter(g => g.cn.toLowerCase().includes(f) || g.description?.toLowerCase().includes(f)); }
  if (ou) result = result.filter(g => g.distinguishedName.includes(ou));
  res.json({ total: result.length, groups: result });
});

router.get('/:name', (req, res) => {
  const g = store.findGroup(req.params.name);
  if (!g) return res.status(404).json({ error: 'Group not found' });
  res.json(g);
});

router.post('/', (req, res) => {
  const { name, description, ou, groupType, groupScope } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  if (store.findGroup(name)) return res.status(409).json({ error: 'Group already exists' });
  const now = new Date().toISOString();
  const baseDN = 'DC=corp,DC=local';
  const groupOU = ou || `OU=Security Groups,${baseDN}`;
  const group = { distinguishedName: `CN=${name},${groupOU}`, cn: name, sAMAccountName: name, groupType: groupType || 'security', groupScope: groupScope || 'global', description: description || '', members: [], managedBy: req.body.managedBy || null, whenCreated: now, whenChanged: now };
  store.groups.push(group);
  res.status(201).json(group);
});

router.put('/:name', (req, res) => {
  const g = store.findGroup(req.params.name);
  if (!g) return res.status(404).json({ error: 'Group not found' });
  for (const key of ['description','managedBy','groupScope']) { if (req.body[key] !== undefined) g[key] = req.body[key]; }
  g.whenChanged = new Date().toISOString();
  res.json(g);
});

router.delete('/:name', (req, res) => {
  const idx = store.groups.findIndex(g => g.sAMAccountName === req.params.name);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });
  const [removed] = store.groups.splice(idx, 1);
  // Clean memberOf references
  for (const u of store.users) { u.memberOf = u.memberOf.filter(g => g !== removed.distinguishedName); }
  res.json({ message: `Group ${req.params.name} deleted` });
});

router.get('/:name/members', (req, res) => {
  const g = store.findGroup(req.params.name);
  if (!g) return res.status(404).json({ error: 'Group not found' });
  const members = g.members.map(dn => store.findUserByDN(dn)).filter(Boolean);
  res.json({ group: g.cn, total: members.length, members });
});

router.get('/:name/members/count', (req, res) => {
  const g = store.findGroup(req.params.name);
  if (!g) return res.status(404).json({ error: 'Group not found' });
  res.json({ group: g.cn, count: g.members.length });
});

router.post('/:name/members', (req, res) => {
  const g = store.findGroup(req.params.name);
  if (!g) return res.status(404).json({ error: 'Group not found' });
  const { members } = req.body;
  if (!members || !Array.isArray(members)) return res.status(400).json({ error: 'members array required' });
  const added = [];
  for (const sam of members) {
    const u = store.findUser(sam);
    if (!u) continue;
    if (!g.members.includes(u.distinguishedName)) { g.members.push(u.distinguishedName); }
    if (!u.memberOf.includes(g.distinguishedName)) { u.memberOf.push(g.distinguishedName); }
    added.push(sam);
  }
  g.whenChanged = new Date().toISOString();
  res.json({ message: 'Members added', added });
});

router.delete('/:name/members/:sam', (req, res) => {
  const g = store.findGroup(req.params.name);
  if (!g) return res.status(404).json({ error: 'Group not found' });
  const u = store.findUser(req.params.sam);
  if (!u) return res.status(404).json({ error: 'User not found' });
  g.members = g.members.filter(m => m !== u.distinguishedName);
  u.memberOf = u.memberOf.filter(x => x !== g.distinguishedName);
  g.whenChanged = new Date().toISOString();
  u.whenChanged = new Date().toISOString();
  res.json({ message: `Removed ${req.params.sam} from ${req.params.name}` });
});

// Timed membership
router.post('/:name/members/timed', (req, res) => {
  const g = store.findGroup(req.params.name);
  if (!g) return res.status(404).json({ error: 'Group not found' });
  const { user, expires_at } = req.body;
  if (!user || !expires_at) return res.status(400).json({ error: 'user and expires_at required' });
  const u = store.findUser(user);
  if (!u) return res.status(404).json({ error: 'User not found' });
  if (!g.members.includes(u.distinguishedName)) g.members.push(u.distinguishedName);
  if (!u.memberOf.includes(g.distinguishedName)) u.memberOf.push(g.distinguishedName);
  store.timedMemberships.push({ group: g.sAMAccountName, userDN: u.distinguishedName, userSAM: u.sAMAccountName, expiresAt: expires_at });
  g.whenChanged = new Date().toISOString();
  res.status(201).json({ message: `Timed membership added for ${user} in ${req.params.name}`, expires_at });
});

router.get('/:name/members/timed', (req, res) => {
  store.cleanExpired();
  const g = store.findGroup(req.params.name);
  if (!g) return res.status(404).json({ error: 'Group not found' });
  const timed = store.timedMemberships.filter(t => t.group === g.sAMAccountName);
  res.json({ group: g.cn, timed_members: timed });
});

module.exports = router;
