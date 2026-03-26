const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// GET /tickets/stats — must be before /:id
router.get('/stats', (req, res) => {
  const tickets = store.objects.SPSActivityClassBase;
  const open = tickets.filter(t => ['New', 'InProgress'].includes(t.Status)).length;
  const resolved = tickets.filter(t => t.Status === 'Resolved').length;
  const resolvedTickets = tickets.filter(t => t.ResolvedDate && t.CreatedDate);
  let avgResolutionMs = 0;
  if (resolvedTickets.length > 0) {
    const totalMs = resolvedTickets.reduce((sum, t) => sum + (new Date(t.ResolvedDate) - new Date(t.CreatedDate)), 0);
    avgResolutionMs = totalMs / resolvedTickets.length;
  }
  res.json({ total: tickets.length, open, resolved, closed: tickets.filter(t => t.Status === 'Closed').length, avgResolutionHours: Math.round(avgResolutionMs / 3600000 * 10) / 10 });
});

// GET /tickets
router.get('/', (req, res) => {
  let results = [...store.objects.SPSActivityClassBase];
  const { status, priority, assignedTo, category, search, limit, offset } = req.query;
  if (status) results = results.filter(t => t.Status === status);
  if (priority) results = results.filter(t => t.Priority === parseInt(priority));
  if (assignedTo) results = results.filter(t => t.AssignedTo === assignedTo);
  if (category) results = results.filter(t => t.Category === category);
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(t => `${t.Title} ${t.Description} ${t.TicketNumber}`.toLowerCase().includes(s));
  }
  const total = results.length;
  const off = parseInt(offset) || 0;
  const lim = parseInt(limit) || 50;
  results = results.slice(off, off + lim);
  res.json({ total, offset: off, limit: lim, data: results });
});

// GET /tickets/:id
router.get('/:id', (req, res) => {
  const ticket = store.objects.SPSActivityClassBase.find(t => t.ID === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

// POST /tickets
router.post('/', (req, res) => {
  const count = store.objects.SPSActivityClassBase.length + 1;
  const ticket = {
    ID: uuidv4(), TicketNumber: `INC${String(count).padStart(3, '0')}`, Status: 'New', Priority: 3,
    CreatedDate: new Date().toISOString(), ModifiedDate: new Date().toISOString(), ResolvedDate: null,
    ...req.body
  };
  store.objects.SPSActivityClassBase.push(ticket);
  res.status(201).json(ticket);
});

// PUT /tickets/:id
router.put('/:id', (req, res) => {
  const list = store.objects.SPSActivityClassBase;
  const idx = list.findIndex(t => t.ID === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ticket not found' });
  list[idx] = { ...list[idx], ...req.body, ID: req.params.id, ModifiedDate: new Date().toISOString() };
  res.json(list[idx]);
});

// DELETE /tickets/:id — close/cancel
router.delete('/:id', (req, res) => {
  const list = store.objects.SPSActivityClassBase;
  const idx = list.findIndex(t => t.ID === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ticket not found' });
  list[idx].Status = 'Closed';
  list[idx].ModifiedDate = new Date().toISOString();
  res.json({ closed: true, ticket: list[idx] });
});

// POST /tickets/:id/assign
router.post('/:id/assign', (req, res) => {
  const list = store.objects.SPSActivityClassBase;
  const idx = list.findIndex(t => t.ID === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ticket not found' });
  list[idx].AssignedTo = req.body.assignedTo;
  list[idx].Status = 'InProgress';
  list[idx].ModifiedDate = new Date().toISOString();
  res.json(list[idx]);
});

// POST /tickets/:id/comment
router.post('/:id/comment', (req, res) => {
  const comment = { id: uuidv4(), ticketId: req.params.id, text: req.body.text, author: req.body.author, createdDate: new Date().toISOString() };
  store.ticketComments.push(comment);
  res.status(201).json(comment);
});

// GET /tickets/:id/comments
router.get('/:id/comments', (req, res) => {
  res.json(store.ticketComments.filter(c => c.ticketId === req.params.id));
});

// POST /tickets/:id/resolve
router.post('/:id/resolve', (req, res) => {
  const list = store.objects.SPSActivityClassBase;
  const idx = list.findIndex(t => t.ID === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ticket not found' });
  list[idx].Status = 'Resolved';
  list[idx].ResolvedDate = new Date().toISOString();
  list[idx].ModifiedDate = new Date().toISOString();
  if (req.body.resolution) {
    store.ticketComments.push({ id: uuidv4(), ticketId: req.params.id, text: `Resolution: ${req.body.resolution}`, author: 'system', createdDate: new Date().toISOString() });
  }
  res.json(list[idx]);
});

// POST /tickets/:id/reopen
router.post('/:id/reopen', (req, res) => {
  const list = store.objects.SPSActivityClassBase;
  const idx = list.findIndex(t => t.ID === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ticket not found' });
  list[idx].Status = 'InProgress';
  list[idx].ResolvedDate = null;
  list[idx].ModifiedDate = new Date().toISOString();
  res.json(list[idx]);
});

// POST /tickets/:id/escalate
router.post('/:id/escalate', (req, res) => {
  const list = store.objects.SPSActivityClassBase;
  const idx = list.findIndex(t => t.ID === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ticket not found' });
  if (req.body.priority) list[idx].Priority = req.body.priority;
  list[idx].ModifiedDate = new Date().toISOString();
  if (req.body.reason) {
    store.ticketComments.push({ id: uuidv4(), ticketId: req.params.id, text: `Escalation: ${req.body.reason}`, author: 'system', createdDate: new Date().toISOString() });
  }
  res.json(list[idx]);
});

module.exports = router;
