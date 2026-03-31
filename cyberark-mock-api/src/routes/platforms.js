const express = require('express');
const db = require('../data/store');
const router = express.Router();

// GET /api/Platforms
router.get('/', (req, res) => {
  const { search, Active } = req.query;
  let result = [...db.platforms];
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(p => p.PlatformName.toLowerCase().includes(q) || p.PlatformID.toLowerCase().includes(q));
  }
  if (Active !== undefined) {
    result = result.filter(p => p.Active === (Active === 'true'));
  }
  res.json({ Platforms: result, Total: result.length });
});

// GET /api/Platforms/:platformId
router.get('/:platformId', (req, res) => {
  const p = db.platforms.find(p => p.PlatformID === req.params.platformId);
  if (!p) return res.status(404).json({ ErrorCode: 'PASWS014E', ErrorMessage: 'Platform not found' });
  res.json(p);
});

// POST /api/Platforms/:platformId/Activate
router.post('/:platformId/Activate', (req, res) => {
  const p = db.platforms.find(p => p.PlatformID === req.params.platformId);
  if (!p) return res.status(404).json({ ErrorCode: 'PASWS014E', ErrorMessage: 'Platform not found' });
  p.Active = true;
  res.json(p);
});

// POST /api/Platforms/:platformId/Deactivate
router.post('/:platformId/Deactivate', (req, res) => {
  const p = db.platforms.find(p => p.PlatformID === req.params.platformId);
  if (!p) return res.status(404).json({ ErrorCode: 'PASWS014E', ErrorMessage: 'Platform not found' });
  p.Active = false;
  res.json(p);
});

module.exports = router;
