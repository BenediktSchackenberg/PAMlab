const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');

function sysId() { return uuidv4().replace(/-/g, ''); }

// GET /api/now/cmdb/ci/:sys_id/relations
router.get('/ci/:sys_id/relations', (req, res) => {
  const ci = store.tables.cmdb_ci_server.find(r => r.sys_id === req.params.sys_id);
  if (!ci) return res.status(404).json({ error: { message: 'CI not found' } });

  const rels = store.tables.cmdb_rel_ci.filter(r => r.parent === req.params.sys_id || r.child === req.params.sys_id);
  const outbound = rels.filter(r => r.parent === req.params.sys_id).map(r => ({
    ...r,
    target: store.tables.cmdb_ci_server.find(s => s.sys_id === r.child),
  }));
  const inbound = rels.filter(r => r.child === req.params.sys_id).map(r => ({
    ...r,
    target: store.tables.cmdb_ci_server.find(s => s.sys_id === r.parent),
  }));

  res.json({ result: { outbound_relations: outbound, inbound_relations: inbound } });
});

// POST /api/now/cmdb/ci/:sys_id/relations
router.post('/ci/:sys_id/relations', (req, res) => {
  const { child, type } = req.body;
  if (!child || !type) return res.status(400).json({ error: { message: 'child and type are required' } });

  const rel = {
    sys_id: sysId(),
    parent: req.params.sys_id,
    child,
    type,
    type_display: type,
    sys_created_on: new Date().toISOString().replace('T', ' ').replace('Z', ''),
    sys_updated_on: new Date().toISOString().replace('T', ' ').replace('Z', ''),
    sys_created_by: 'api',
  };
  store.tables.cmdb_rel_ci.push(rel);
  res.status(201).json({ result: rel });
});

// GET /api/now/cmdb/topology
router.get('/topology', (req, res) => {
  const nodes = store.tables.cmdb_ci_server.map(s => ({
    sys_id: s.sys_id,
    name: s.name,
    ip_address: s.ip_address,
    os: s.os,
    operational_status: s.operational_status,
    category: s.subcategory || s.category,
  }));
  const edges = store.tables.cmdb_rel_ci.map(r => ({
    source: r.parent,
    target: r.child,
    type: r.type,
    type_display: r.type_display,
  }));
  res.json({ result: { nodes, edges } });
});

module.exports = router;
