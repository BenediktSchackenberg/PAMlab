const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// GET fragment
router.get('/fragments/:ddName/:fragmentId', (req, res) => {
  const { ddName, fragmentId } = req.params;
  const list = store.objects[ddName];
  if (!list) return res.status(404).json({ error: `Unknown DD: ${ddName}` });
  const obj = list.find(o => o.ID === fragmentId);
  if (!obj) return res.status(404).json({ error: 'Fragment not found' });
  res.json(obj);
});

// GET fragment with schema
router.get('/fragments/:ddName/:fragmentId/schema-info', (req, res) => {
  const { ddName, fragmentId } = req.params;
  const list = store.objects[ddName];
  const dd = store.dataDefinitions[ddName];
  if (!list || !dd) return res.status(404).json({ error: `Unknown DD: ${ddName}` });
  const obj = list.find(o => o.ID === fragmentId);
  if (!obj) return res.status(404).json({ error: 'Fragment not found' });
  res.json({ fragment: obj, schema: dd });
});

// PUT update fragment
router.put('/fragments/:ddName/:fragmentId', (req, res) => {
  const { ddName, fragmentId } = req.params;
  const list = store.objects[ddName];
  if (!list) return res.status(404).json({ error: `Unknown DD: ${ddName}` });
  const idx = list.findIndex(o => o.ID === fragmentId);
  if (idx === -1) return res.status(404).json({ error: 'Fragment not found' });
  list[idx] = { ...list[idx], ...req.body, ID: fragmentId };
  res.json(list[idx]);
});

// POST create fragment
router.post('/fragments/:ddName', (req, res) => {
  const { ddName } = req.params;
  if (!store.objects[ddName]) store.objects[ddName] = [];
  const obj = { ID: uuidv4(), ...req.body };
  store.objects[ddName].push(obj);
  res.status(201).json(obj);
});

// GET object
router.get('/objects/:ddName/:objectId', (req, res) => {
  const { ddName, objectId } = req.params;
  const list = store.objects[ddName];
  if (!list) return res.status(404).json({ error: `Unknown DD: ${ddName}` });
  const obj = list.find(o => o.ID === objectId);
  if (!obj) return res.status(404).json({ error: 'Object not found' });
  res.json(obj);
});

// POST create object
router.post('/objects/:ddName', (req, res) => {
  const { ddName } = req.params;
  if (!store.objects[ddName]) store.objects[ddName] = [];
  const obj = { ID: uuidv4(), ...req.body };
  store.objects[ddName].push(obj);
  res.status(201).json(obj);
});

// PUT update object
router.put('/objects/:ddName/:objectId', (req, res) => {
  const { ddName, objectId } = req.params;
  const list = store.objects[ddName];
  if (!list) return res.status(404).json({ error: `Unknown DD: ${ddName}` });
  const idx = list.findIndex(o => o.ID === objectId);
  if (idx === -1) return res.status(404).json({ error: 'Object not found' });
  list[idx] = { ...list[idx], ...req.body, ID: objectId };
  res.json(list[idx]);
});

// DELETE object
router.delete('/objects/:ddName/:objectId', (req, res) => {
  const { ddName, objectId } = req.params;
  const list = store.objects[ddName];
  if (!list) return res.status(404).json({ error: `Unknown DD: ${ddName}` });
  const idx = list.findIndex(o => o.ID === objectId);
  if (idx === -1) return res.status(404).json({ error: 'Object not found' });
  const deleted = list.splice(idx, 1)[0];
  res.json({ deleted: true, object: deleted });
});

// POST query objects
router.post('/objects/query', (req, res) => {
  const { ddName, columns, filter, pageSize = 50, page = 1 } = req.body;
  const list = store.objects[ddName];
  if (!list) return res.status(404).json({ error: `Unknown DD: ${ddName}` });
  
  let results = [...list];
  if (filter) {
    const f = filter.toLowerCase();
    results = results.filter(o => JSON.stringify(o).toLowerCase().includes(f));
  }
  
  const total = results.length;
  const start = (page - 1) * pageSize;
  results = results.slice(start, start + pageSize);
  
  if (columns && columns.length > 0) {
    results = results.map(o => {
      const picked = {};
      columns.forEach(c => { if (o[c] !== undefined) picked[c] = o[c]; });
      return picked;
    });
  }
  
  res.json({ Total: total, Page: page, PageSize: pageSize, Columns: columns || Object.keys(list[0] || {}), Data: results });
});

module.exports = router;
