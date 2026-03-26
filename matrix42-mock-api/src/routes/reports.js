const express = require('express');
const store = require('../data/store');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// GET /reports/inventory
router.get('/inventory', (req, res) => {
  const assets = store.objects.SPSAssetClassBase;
  const byType = {};
  const byStatus = {};
  assets.forEach(a => {
    byType[a.AssetType] = (byType[a.AssetType] || 0) + 1;
    byStatus[a.Status] = (byStatus[a.Status] || 0) + 1;
  });
  res.json({ totalAssets: assets.length, byType, byStatus });
});

// GET /reports/compliance
router.get('/compliance', (req, res) => {
  const compliance = store.assetCompliance;
  const compliant = compliance.filter(c => c.status === 'Compliant').length;
  const nonCompliant = compliance.filter(c => c.status === 'NonCompliant').length;
  const avgScore = compliance.length > 0 ? Math.round(compliance.reduce((s, c) => s + c.complianceScore, 0) / compliance.length) : 0;
  res.json({ totalScanned: compliance.length, compliant, nonCompliant, averageScore: avgScore, details: compliance });
});

// GET /reports/licenses
router.get('/licenses', (req, res) => {
  const result = store.objects.SPSSoftwareType.map(sw => {
    const installCount = store.softwareInstallations.filter(si => si.softwareId === sw.ID).length;
    return {
      softwareId: sw.ID, name: sw.Name, vendor: sw.Vendor, licenseType: sw.LicenseType,
      totalLicenses: sw.TotalLicenses || null, usedLicenses: installCount,
      compliant: sw.TotalLicenses ? installCount <= sw.TotalLicenses : true
    };
  });
  const overLicensed = result.filter(r => !r.compliant);
  res.json({ total: result.length, overLicensed: overLicensed.length, details: result });
});

// GET /reports/user-access
router.get('/user-access', (req, res) => {
  const users = store.objects.SPSUserClassBase.filter(u => u.Status === 'Active');
  const matrix = users.map(u => {
    const groups = store.userGroupMappings.filter(g => g.userId === u.ID).map(g => g.groupName);
    const assetCount = store.assetAssignments.filter(a => a.userId === u.ID && a.status === 'Active').length;
    const accessReqs = store.accessRequests.filter(r => r.user === u.AccountName);
    return { userId: u.ID, name: `${u.FirstName} ${u.LastName}`, account: u.AccountName, department: u.Department, groups, assetCount, pendingRequests: accessReqs.filter(r => r.status === 'pending').length };
  });
  res.json(matrix);
});

// GET /reports/provisioning
router.get('/provisioning', (req, res) => {
  const workflows = store.provisioningWorkflows;
  const byType = {};
  const byStatus = {};
  workflows.forEach(w => {
    byType[w.type] = (byType[w.type] || 0) + 1;
    byStatus[w.status] = (byStatus[w.status] || 0) + 1;
  });
  res.json({ totalWorkflows: workflows.length, byType, byStatus, workflows });
});

module.exports = router;
