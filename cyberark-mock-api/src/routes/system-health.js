const express = require('express');
const db = require('../data/store');
const router = express.Router();

// GET /api/ComponentsMonitoringDetails/:componentId
router.get('/:componentId', (req, res) => {
  const components = db.systemHealth.filter(c => c.ComponentID === req.params.componentId);
  if (components.length === 0) return res.status(404).json({ ErrorCode: 'PASWS018E', ErrorMessage: 'Component not found' });
  res.json({ Components: components, Total: components.length });
});

// GET /api/ComponentsMonitoringDetails
router.get('/', (req, res) => {
  res.json({ Components: db.systemHealth, Total: db.systemHealth.length });
});

module.exports = router;
