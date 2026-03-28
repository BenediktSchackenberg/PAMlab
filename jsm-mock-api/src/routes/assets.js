const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const router = express.Router();

// --- Shared AQL filter logic ---
function filterByAql(aql) {
  let results = [...store.assets.objects];
  // Support basic attribute=value
  const match = aql.match(/(\w[\w\s]*?)\s*=\s*"?([^"]+)"?/);
  if (match) {
    const [, attrName, attrValue] = match;
    results = results.filter(o => o.attributes && o.attributes.some(a => a.name.toLowerCase() === attrName.trim().toLowerCase() && a.value.toLowerCase().includes(attrValue.trim().toLowerCase())));
  }
  // Support objectType filter
  const typeMatch = aql.match(/objectType\s*=\s*"?([^"]+)"?/i);
  if (typeMatch) {
    results = results.filter(o => o.objectType && o.objectType.name.toLowerCase() === typeMatch[1].trim().toLowerCase());
  }
  // Support Name filter
  const nameMatch = aql.match(/Name\s*=\s*"?([^"]+)"?/i);
  if (nameMatch) {
    results = results.filter(o => o.name.toLowerCase().includes(nameMatch[1].trim().toLowerCase()));
  }
  return results;
}

// List schemas
router.get('/objectschema/list', (req, res) => {
  res.json({ objectschemas: store.assets.schemas });
});

// List object types by schema
router.get('/objecttype/:schemaId', (req, res) => {
  const types = store.assets.object_types.filter(t => t.schemaId === req.params.schemaId);
  res.json(types);
});

// Get object
router.get('/object/:objectId', (req, res) => {
  const obj = store.assets.objects.find(o => o.id === req.params.objectId);
  if (!obj) return res.status(404).json({ errorMessages: ['Object not found'], errors: {} });
  res.json(obj);
});

// Create object
router.post('/object/create', (req, res) => {
  const obj = { id: String(store.assets.objects.length + 1), ...req.body };
  store.assets.objects.push(obj);
  res.status(201).json(obj);
});

// Update object
router.put('/object/:objectId', (req, res) => {
  const obj = store.assets.objects.find(o => o.id === req.params.objectId);
  if (!obj) return res.status(404).json({ errorMessages: ['Object not found'], errors: {} });
  Object.assign(obj, req.body);
  res.json(obj);
});

// AQL search — GET
router.get('/object/aql', (req, res) => {
  const aql = req.query.aql || '';
  const results = filterByAql(aql);
  res.json({ objectEntries: results, totalFilterCount: results.length });
});

// AQL search — POST (same logic, AQL in body)
router.post('/object/aql', (req, res) => {
  const aql = req.body.aql || req.body.qlQuery || '';
  const results = filterByAql(aql);
  res.json({ objectEntries: results, totalFilterCount: results.length });
});

// List objects by type
router.get('/objecttype/:typeId/objects', (req, res) => {
  const objects = store.assets.objects.filter(o => o.objectType && o.objectType.id === req.params.typeId);
  res.json(objects);
});

module.exports = router;
