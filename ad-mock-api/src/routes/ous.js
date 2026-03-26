const { Router } = require('express');
const store = require('../data/store');
const router = Router();

function buildTree(ous) {
  const baseDN = 'DC=corp,DC=local';
  const tree = { dn: baseDN, name: 'corp.local', children: [] };
  const sorted = [...ous].sort((a, b) => a.distinguishedName.split(',').length - b.distinguishedName.split(',').length);
  for (const ou of sorted) {
    const parts = ou.distinguishedName.replace(`,${baseDN}`, '').split(',').reverse();
    let node = tree;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i].replace('OU=', '');
      let child = node.children.find(c => c.name === name);
      if (!child) { child = { dn: ou.distinguishedName, name, description: i === parts.length - 1 ? ou.description : '', children: [] }; node.children.push(child); }
      node = child;
    }
  }
  return tree;
}

router.get('/', (req, res) => { res.json(buildTree(store.ous)); });

router.get('/:path', (req, res) => {
  const dn = decodeURIComponent(req.params.path);
  const ou = store.ous.find(o => o.distinguishedName === dn);
  if (!ou) return res.status(404).json({ error: 'OU not found' });
  const users = store.users.filter(u => u.distinguishedName.includes(ou.distinguishedName));
  const groups = store.groups.filter(g => g.distinguishedName.includes(ou.distinguishedName));
  res.json({ ...ou, users: users.length, groups: groups.length, userList: users.map(u => u.sAMAccountName), groupList: groups.map(g => g.sAMAccountName) });
});

router.post('/', (req, res) => {
  const { name, parentDN, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const parent = parentDN || 'DC=corp,DC=local';
  const dn = `OU=${name},${parent}`;
  if (store.ous.find(o => o.distinguishedName === dn)) return res.status(409).json({ error: 'OU already exists' });
  const ou = { distinguishedName: dn, name, description: description || '' };
  store.ous.push(ou);
  res.status(201).json(ou);
});

module.exports = router;
