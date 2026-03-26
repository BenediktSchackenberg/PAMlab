const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// GET /software
router.get('/', (req, res) => {
  let results = [...store.objects.SPSSoftwareType];
  const { vendor, category, search } = req.query;
  if (vendor) results = results.filter(s => s.Vendor === vendor);
  if (category) results = results.filter(s => s.Category === category);
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(s => `${s.Name} ${s.Vendor} ${s.Version}`.toLowerCase().includes(q));
  }
  res.json({ total: results.length, data: results });
});

// GET /software/:id
router.get('/:id', (req, res) => {
  const sw = store.objects.SPSSoftwareType.find(s => s.ID === req.params.id);
  if (!sw) return res.status(404).json({ error: 'Software not found' });
  res.json(sw);
});

// POST /software
router.post('/', (req, res) => {
  const sw = { ID: uuidv4(), Status: 'Active', ...req.body };
  store.objects.SPSSoftwareType.push(sw);
  res.status(201).json(sw);
});

// PUT /software/:id
router.put('/:id', (req, res) => {
  const list = store.objects.SPSSoftwareType;
  const idx = list.findIndex(s => s.ID === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Software not found' });
  list[idx] = { ...list[idx], ...req.body, ID: req.params.id };
  res.json(list[idx]);
});

// GET /software/:id/installations
router.get('/:id/installations', (req, res) => {
  const installations = store.softwareInstallations.filter(si => si.softwareId === req.params.id);
  const result = installations.map(si => {
    const asset = store.objects.SPSAssetClassBase.find(a => a.ID === si.assetId);
    return { ...si, asset };
  });
  res.json(result);
});

// GET /software/:id/licenses
router.get('/:id/licenses', (req, res) => {
  const sw = store.objects.SPSSoftwareType.find(s => s.ID === req.params.id);
  if (!sw) return res.status(404).json({ error: 'Software not found' });
  const installCount = store.softwareInstallations.filter(si => si.softwareId === req.params.id).length;
  res.json({
    softwareId: sw.ID, name: sw.Name, licenseType: sw.LicenseType,
    totalLicenses: sw.TotalLicenses || null, usedLicenses: installCount,
    available: sw.TotalLicenses ? sw.TotalLicenses - installCount : null,
    compliant: sw.TotalLicenses ? installCount <= sw.TotalLicenses : true
  });
});

module.exports = router;
