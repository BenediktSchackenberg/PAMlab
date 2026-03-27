const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');

function sysId() {
  return uuidv4().replace(/-/g, '');
}

function now() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

// Fire webhooks on changes
function fireWebhooks(tableName, action, record) {
  store.webhooks.forEach(wh => {
    if (wh.table === tableName || wh.table === '*') {
      try {
        const payload = JSON.stringify({ table: tableName, action, sys_id: record.sys_id, record });
        // Fire-and-forget HTTP POST (best effort, no external deps)
        const url = new URL(wh.url);
        const mod = url.protocol === 'https:' ? require('https') : require('http');
        const req = mod.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        req.on('error', () => {});
        req.write(payload);
        req.end();
      } catch (_) {}
    }
  });
}

// Parse sysparm_query into filter function
function parseQuery(queryStr) {
  if (!queryStr) return () => true;

  let orderBy = null;
  let orderDesc = false;

  // Extract ORDERBY/ORDERBYDESC
  const parts = queryStr.split('^');
  const conditions = [];
  for (const part of parts) {
    if (part.startsWith('ORDERBY')) {
      orderBy = part.replace('ORDERBY', '');
      orderDesc = false;
    } else if (part.startsWith('ORDERBYDESC')) {
      orderBy = part.replace('ORDERBYDESC', '');
      orderDesc = true;
    } else if (part.trim()) {
      conditions.push(part);
    }
  }

  const filters = conditions.map(cond => {
    // Support operators: !=, LIKE, STARTSWITH, ENDSWITH, IN, =
    let m;
    if ((m = cond.match(/^(.+?)!=(.*)$/))) {
      return (r) => String(r[m[1]] ?? '') !== m[2];
    }
    if ((m = cond.match(/^(.+?)LIKE(.*)$/))) {
      const val = m[2].toLowerCase();
      return (r) => String(r[m[1]] ?? '').toLowerCase().includes(val);
    }
    if ((m = cond.match(/^(.+?)STARTSWITH(.*)$/))) {
      const val = m[2].toLowerCase();
      return (r) => String(r[m[1]] ?? '').toLowerCase().startsWith(val);
    }
    if ((m = cond.match(/^(.+?)ENDSWITH(.*)$/))) {
      const val = m[2].toLowerCase();
      return (r) => String(r[m[1]] ?? '').toLowerCase().endsWith(val);
    }
    if ((m = cond.match(/^(.+?)IN(.*)$/))) {
      const vals = m[2].split(',');
      return (r) => vals.includes(String(r[m[1]] ?? ''));
    }
    if ((m = cond.match(/^(.+?)>=(.*)$/))) {
      return (r) => r[m[1]] >= (isNaN(m[2]) ? m[2] : Number(m[2]));
    }
    if ((m = cond.match(/^(.+?)<=(.*)$/))) {
      return (r) => r[m[1]] <= (isNaN(m[2]) ? m[2] : Number(m[2]));
    }
    if ((m = cond.match(/^(.+?)>(.*)$/))) {
      return (r) => r[m[1]] > (isNaN(m[2]) ? m[2] : Number(m[2]));
    }
    if ((m = cond.match(/^(.+?)<(.*)$/))) {
      return (r) => r[m[1]] < (isNaN(m[2]) ? m[2] : Number(m[2]));
    }
    if ((m = cond.match(/^(.+?)=(.*)$/))) {
      return (r) => {
        const val = r[m[1]];
        if (val === undefined || val === null) return m[2] === '';
        return String(val) === m[2];
      };
    }
    return () => true;
  });

  return { filter: (r) => filters.every(f => f(r)), orderBy, orderDesc };
}

function filterFields(record, fields) {
  if (!fields) return record;
  const list = fields.split(',').map(f => f.trim());
  const out = {};
  list.forEach(f => { if (f in record) out[f] = record[f]; });
  // Always include sys_id
  out.sys_id = record.sys_id;
  return out;
}

// GET /api/now/table/:tableName
router.get('/:tableName', (req, res) => {
  const table = store.tables[req.params.tableName];
  if (!table) return res.status(404).json({ error: { message: `Table '${req.params.tableName}' not found` } });

  const { sysparm_query, sysparm_fields, sysparm_limit, sysparm_offset } = req.query;
  const limit = parseInt(sysparm_limit) || 20;
  const offset = parseInt(sysparm_offset) || 0;

  const parsed = parseQuery(sysparm_query);
  const filter = typeof parsed === 'function' ? parsed : parsed.filter;
  let results = table.filter(filter);

  // Sort
  if (parsed.orderBy) {
    const field = parsed.orderBy;
    results.sort((a, b) => {
      if (a[field] < b[field]) return parsed.orderDesc ? 1 : -1;
      if (a[field] > b[field]) return parsed.orderDesc ? -1 : 1;
      return 0;
    });
  }

  const total = results.length;
  results = results.slice(offset, offset + limit);

  if (sysparm_fields) {
    results = results.map(r => filterFields(r, sysparm_fields));
  }

  res.set('X-Total-Count', String(total));
  res.json({ result: results });
});

// GET /api/now/table/:tableName/:sys_id
router.get('/:tableName/:sys_id', (req, res) => {
  const table = store.tables[req.params.tableName];
  if (!table) return res.status(404).json({ error: { message: `Table '${req.params.tableName}' not found` } });

  const record = table.find(r => r.sys_id === req.params.sys_id);
  if (!record) return res.status(404).json({ error: { message: 'Record not found', detail: `sys_id: ${req.params.sys_id}` } });

  const { sysparm_fields } = req.query;
  const result = sysparm_fields ? filterFields(record, sysparm_fields) : record;
  res.json({ result });
});

// POST /api/now/table/:tableName
router.post('/:tableName', (req, res) => {
  if (!store.tables[req.params.tableName]) {
    store.tables[req.params.tableName] = [];
  }
  const table = store.tables[req.params.tableName];
  const ts = now();
  const record = {
    sys_id: sysId(),
    ...req.body,
    sys_created_on: ts,
    sys_updated_on: ts,
    sys_created_by: req.snowUser?.user_name || 'api',
  };
  table.push(record);
  fireWebhooks(req.params.tableName, 'insert', record);
  res.status(201).json({ result: record });
});

// PUT /api/now/table/:tableName/:sys_id
router.put('/:tableName/:sys_id', (req, res) => {
  const table = store.tables[req.params.tableName];
  if (!table) return res.status(404).json({ error: { message: `Table '${req.params.tableName}' not found` } });

  const idx = table.findIndex(r => r.sys_id === req.params.sys_id);
  if (idx === -1) return res.status(404).json({ error: { message: 'Record not found' } });

  const ts = now();
  const updated = { ...req.body, sys_id: req.params.sys_id, sys_updated_on: ts, sys_created_on: table[idx].sys_created_on, sys_created_by: table[idx].sys_created_by };
  table[idx] = updated;
  fireWebhooks(req.params.tableName, 'update', updated);
  res.json({ result: updated });
});

// PATCH /api/now/table/:tableName/:sys_id
router.patch('/:tableName/:sys_id', (req, res) => {
  const table = store.tables[req.params.tableName];
  if (!table) return res.status(404).json({ error: { message: `Table '${req.params.tableName}' not found` } });

  const idx = table.findIndex(r => r.sys_id === req.params.sys_id);
  if (idx === -1) return res.status(404).json({ error: { message: 'Record not found' } });

  const ts = now();
  table[idx] = { ...table[idx], ...req.body, sys_updated_on: ts };
  fireWebhooks(req.params.tableName, 'update', table[idx]);
  res.json({ result: table[idx] });
});

// DELETE /api/now/table/:tableName/:sys_id
router.delete('/:tableName/:sys_id', (req, res) => {
  const table = store.tables[req.params.tableName];
  if (!table) return res.status(404).json({ error: { message: `Table '${req.params.tableName}' not found` } });

  const idx = table.findIndex(r => r.sys_id === req.params.sys_id);
  if (idx === -1) return res.status(404).json({ error: { message: 'Record not found' } });

  const deleted = table.splice(idx, 1)[0];
  fireWebhooks(req.params.tableName, 'delete', deleted);
  res.status(204).end();
});

module.exports = router;
