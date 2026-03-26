const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// GET /assets
router.get('/', (req, res) => {
  let results = [...store.objects.SPSAssetClassBase];
  const { type, status, assignedUser, location, search, limit, offset } = req.query;
  if (type) results = results.filter(a => a.AssetType === type);
  if (status) results = results.filter(a => a.Status === status);
  if (assignedUser) results = results.filter(a => a.AssignedUser === assignedUser);
  if (location) results = results.filter(a => a.Location === location);
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(a => `${a.Name} ${a.SerialNumber} ${a.AssetTag} ${a.Manufacturer} ${a.Model}`.toLowerCase().includes(s));
  }
  const total = results.length;
  const off = parseInt(offset) || 0;
  const lim = parseInt(limit) || 50;
  results = results.slice(off, off + lim);
  res.json({ total, offset: off, limit: lim, data: results });
});

// GET /assets/:id
router.get('/:id', (req, res) => {
  const asset = store.objects.SPSAssetClassBase.find(a => a.ID === req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  res.json(asset);
});

// POST /assets
router.post('/', (req, res) => {
  const asset = { ID: uuidv4(), Status: 'Active', Location: 'HQ Frankfurt', LastSeen: new Date().toISOString(), ...req.body };
  store.objects.SPSAssetClassBase.push(asset);
  res.status(201).json(asset);
});

// PUT /assets/:id
router.put('/:id', (req, res) => {
  const list = store.objects.SPSAssetClassBase;
  const idx = list.findIndex(a => a.ID === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Asset not found' });
  list[idx] = { ...list[idx], ...req.body, ID: req.params.id };
  res.json(list[idx]);
});

// DELETE /assets/:id — retire
router.delete('/:id', (req, res) => {
  const list = store.objects.SPSAssetClassBase;
  const idx = list.findIndex(a => a.ID === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Asset not found' });
  list[idx].Status = 'Retired';
  res.json({ retired: true, asset: list[idx] });
});

// GET /assets/:id/software
router.get('/:id/software', (req, res) => {
  const installations = store.softwareInstallations.filter(si => si.assetId === req.params.id);
  const result = installations.map(si => {
    const sw = store.objects.SPSSoftwareType.find(s => s.ID === si.softwareId);
    return { ...si, software: sw };
  });
  res.json(result);
});

// POST /assets/:id/software — deploy
router.post('/:id/software', (req, res) => {
  const inst = { id: uuidv4(), softwareId: req.body.softwareId, assetId: req.params.id, installedDate: new Date().toISOString(), status: 'Installed' };
  store.softwareInstallations.push(inst);
  res.status(201).json(inst);
});

// DELETE /assets/:id/software/:softwareId
router.delete('/:id/software/:softwareId', (req, res) => {
  const idx = store.softwareInstallations.findIndex(si => si.assetId === req.params.id && si.softwareId === req.params.softwareId);
  if (idx === -1) return res.status(404).json({ error: 'Installation not found' });
  store.softwareInstallations.splice(idx, 1);
  res.json({ removed: true });
});

// GET /assets/:id/user
router.get('/:id/user', (req, res) => {
  const asset = store.objects.SPSAssetClassBase.find(a => a.ID === req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  if (!asset.AssignedUser) return res.json({ assigned: false, user: null });
  const user = store.objects.SPSUserClassBase.find(u => u.AccountName === asset.AssignedUser);
  res.json({ assigned: true, user: user || { AccountName: asset.AssignedUser } });
});

// POST /assets/:id/assign
router.post('/:id/assign', (req, res) => {
  const asset = store.objects.SPSAssetClassBase.find(a => a.ID === req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  const user = store.objects.SPSUserClassBase.find(u => u.ID === req.body.userId);
  asset.AssignedUser = user ? user.AccountName : req.body.userId;
  const assignment = { id: uuidv4(), userId: req.body.userId, assetId: req.params.id, assignedDate: new Date().toISOString(), status: 'Active' };
  store.assetAssignments.push(assignment);
  res.json({ assigned: true, assignment });
});

// POST /assets/:id/unassign
router.post('/:id/unassign', (req, res) => {
  const asset = store.objects.SPSAssetClassBase.find(a => a.ID === req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  const idx = store.assetAssignments.findIndex(a => a.assetId === req.params.id && a.status === 'Active');
  if (idx !== -1) store.assetAssignments[idx].status = 'Removed';
  asset.AssignedUser = null;
  res.json({ unassigned: true });
});

// GET /assets/:id/compliance
router.get('/:id/compliance', (req, res) => {
  const compliance = store.assetCompliance.find(c => c.assetId === req.params.id);
  if (!compliance) return res.json({ assetId: req.params.id, status: 'Unknown', complianceScore: null });
  res.json(compliance);
});

// GET /assets/:id/history
router.get('/:id/history', (req, res) => {
  const assignments = store.assetAssignments.filter(a => a.assetId === req.params.id);
  const installations = store.softwareInstallations.filter(si => si.assetId === req.params.id);
  res.json({ assignments, softwareChanges: installations });
});

module.exports = router;
