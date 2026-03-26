const { Router } = require('express');
const store = require('../data/store');
const router = Router();

router.get('/', (req, res) => { res.json({ total: store.computers.length, computers: store.computers }); });

router.get('/:name', (req, res) => {
  const c = store.findComputer(req.params.name);
  if (!c) return res.status(404).json({ error: 'Computer not found' });
  res.json(c);
});

router.post('/', (req, res) => {
  const { name, operatingSystem, ou, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  if (store.findComputer(name)) return res.status(409).json({ error: 'Computer already exists' });
  const now = new Date().toISOString();
  const compOU = ou || `OU=Servers,DC=corp,DC=local`;
  const comp = { distinguishedName: `CN=${name},${compOU}`, cn: name, sAMAccountName: `${name}$`, operatingSystem: operatingSystem || '', description: description || '', enabled: true, whenCreated: now, whenChanged: now };
  store.computers.push(comp);
  res.status(201).json(comp);
});

router.put('/:name', (req, res) => {
  const c = store.findComputer(req.params.name);
  if (!c) return res.status(404).json({ error: 'Computer not found' });
  for (const key of ['operatingSystem','description','enabled']) { if (req.body[key] !== undefined) c[key] = req.body[key]; }
  c.whenChanged = new Date().toISOString();
  res.json(c);
});

module.exports = router;
