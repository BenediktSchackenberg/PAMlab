const { Router } = require('express');
const store = require('../data/store');
const router = Router();

router.get('/', (req, res) => {
  let result = [...store.users];
  const { filter, ou, limit, offset } = req.query;
  if (filter) {
    const f = filter.toLowerCase();
    result = result.filter(u => u.cn.toLowerCase().includes(f) || u.sAMAccountName.toLowerCase().includes(f) || u.mail?.toLowerCase().includes(f));
  }
  if (ou) result = result.filter(u => u.distinguishedName.includes(ou));
  const total = result.length;
  const o = parseInt(offset) || 0;
  const l = parseInt(limit) || result.length;
  result = result.slice(o, o + l);
  res.json({ total, count: result.length, offset: o, users: result });
});

router.get('/by-dn/:dn', (req, res) => {
  const user = store.findUserByDN(decodeURIComponent(req.params.dn));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.get('/:sam', (req, res) => {
  const user = store.findUser(req.params.sam);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.post('/', (req, res) => {
  const { sAMAccountName, cn, givenName, sn, department, title, ou } = req.body;
  if (!sAMAccountName || !cn) return res.status(400).json({ error: 'sAMAccountName and cn required' });
  if (store.findUser(sAMAccountName)) return res.status(409).json({ error: 'User already exists' });
  const now = new Date().toISOString();
  const baseDN = 'DC=corp,DC=local';
  const userOU = ou || `OU=Users,${baseDN}`;
  const user = {
    distinguishedName: `CN=${cn},${userOU}`,
    sAMAccountName, userPrincipalName: `${sAMAccountName}@corp.local`,
    cn, givenName: givenName || '', sn: sn || '', displayName: cn,
    mail: `${sAMAccountName}@corp.local`, department: department || '', title: title || '',
    manager: req.body.manager || null, memberOf: [], enabled: true,
    lastLogon: null, whenCreated: now, whenChanged: now, accountExpires: null,
  };
  store.users.push(user);
  res.status(201).json(user);
});

router.put('/:sam', (req, res) => {
  const user = store.findUser(req.params.sam);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const allowed = ['givenName','sn','displayName','mail','department','title','manager','enabled','accountExpires'];
  for (const key of allowed) { if (req.body[key] !== undefined) user[key] = req.body[key]; }
  user.whenChanged = new Date().toISOString();
  res.json(user);
});

router.delete('/:sam', (req, res) => {
  const user = store.findUser(req.params.sam);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.enabled = false;
  user.whenChanged = new Date().toISOString();
  res.json({ message: `User ${req.params.sam} disabled`, user });
});

router.get('/:sam/groups', (req, res) => {
  const user = store.findUser(req.params.sam);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const groups = store.groups.filter(g => user.memberOf.includes(g.distinguishedName));
  res.json({ user: user.sAMAccountName, groups });
});

router.post('/:sam/groups', (req, res) => {
  const user = store.findUser(req.params.sam);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { groups } = req.body;
  if (!groups || !Array.isArray(groups)) return res.status(400).json({ error: 'groups array required' });
  const added = [];
  for (const gName of groups) {
    const group = store.findGroup(gName);
    if (!group) continue;
    if (!group.members.includes(user.distinguishedName)) { group.members.push(user.distinguishedName); group.whenChanged = new Date().toISOString(); }
    if (!user.memberOf.includes(group.distinguishedName)) { user.memberOf.push(group.distinguishedName); }
    added.push(gName);
  }
  user.whenChanged = new Date().toISOString();
  res.json({ message: 'Groups updated', added });
});

router.delete('/:sam/groups/:groupName', (req, res) => {
  const user = store.findUser(req.params.sam);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const group = store.findGroup(req.params.groupName);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  group.members = group.members.filter(m => m !== user.distinguishedName);
  user.memberOf = user.memberOf.filter(g => g !== group.distinguishedName);
  group.whenChanged = new Date().toISOString();
  user.whenChanged = new Date().toISOString();
  res.json({ message: `Removed ${req.params.sam} from ${req.params.groupName}` });
});

module.exports = router;
