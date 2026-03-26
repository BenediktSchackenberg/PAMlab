const express = require('express');
const store = require('../data/store');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// List all data definitions
router.get('/datadefinitions', (req, res) => {
  const dds = Object.values(store.dataDefinitions).map(dd => ({
    name: dd.name, displayName: dd.displayName, description: dd.description
  }));
  res.json(dds);
});

// Get DD schema
router.get('/datadefinitions/:ddName', (req, res) => {
  const dd = store.dataDefinitions[req.params.ddName];
  if (!dd) return res.status(404).json({ error: `Unknown DD: ${req.params.ddName}` });
  res.json(dd);
});

module.exports = router;
