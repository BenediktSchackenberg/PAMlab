const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/store');

const router = Router();

// POST /connect — initiate a session
router.post('/connect', (req, res) => {
  const { user_id, account_id, protocol } = req.body;
  if (!user_id || !account_id || !protocol) {
    return res.status(400).json({ error: 'Bad Request', message: 'user_id, account_id, and protocol are required' });
  }
  const user = db.users.find(u => u.id === user_id);
  if (!user) return res.status(404).json({ error: 'Not Found', message: 'User not found' });
  const account = db.accounts.find(a => a.id === account_id);
  if (!account) return res.status(404).json({ error: 'Not Found', message: 'Account not found' });

  const session = {
    id: uuidv4(),
    user_id,
    user_login: user.login,
    account_id,
    account_name: account.name,
    server_name: account.server_name,
    protocol,
    status: 'active',
    started_at: new Date().toISOString(),
    ended_at: null,
    duration_seconds: null,
    bytes_transferred: 0,
    recorded: true,
  };
  db.sessions.push(session);

  // Generate event
  if (db.events) {
    db.events.push({
      id: uuidv4(),
      type: 'session.started',
      timestamp: new Date().toISOString(),
      details: { session_id: session.id, user: user.login, account: account.name, protocol },
    });
  }

  res.status(201).json({ session_id: session.id, status: 'connecting', server: account.server_name, account: account.name, protocol });
});

// POST /:session_id/terminate
router.post('/:session_id/terminate', (req, res) => {
  const session = db.sessions.find(s => s.id === req.params.session_id);
  if (!session) return res.status(404).json({ error: 'Not Found', message: 'Session not found' });
  if (session.status === 'terminated' || session.status === 'completed') {
    return res.status(409).json({ error: 'Conflict', message: `Session already ${session.status}` });
  }
  const terminated_at = new Date().toISOString();
  session.status = 'terminated';
  session.ended_at = terminated_at;
  session.duration_seconds = Math.floor((new Date(terminated_at) - new Date(session.started_at)) / 1000);

  if (db.events) {
    db.events.push({ id: uuidv4(), type: 'session.terminated', timestamp: terminated_at, details: { session_id: session.id, terminated_by: req.body.terminated_by || 'admin', reason: req.body.reason || 'Manual termination' } });
  }

  res.json({ session_id: session.id, status: 'terminated', terminated_by: req.body.terminated_by || 'admin', terminated_at, reason: req.body.reason || 'Manual termination' });
});

// POST /:session_id/pause
router.post('/:session_id/pause', (req, res) => {
  const session = db.sessions.find(s => s.id === req.params.session_id);
  if (!session) return res.status(404).json({ error: 'Not Found', message: 'Session not found' });
  if (session.status !== 'active') return res.status(409).json({ error: 'Conflict', message: 'Session is not active' });
  session.status = 'paused';
  if (db.events) {
    db.events.push({ id: uuidv4(), type: 'session.paused', timestamp: new Date().toISOString(), details: { session_id: session.id } });
  }
  res.json({ session_id: session.id, status: 'paused' });
});

// POST /:session_id/resume
router.post('/:session_id/resume', (req, res) => {
  const session = db.sessions.find(s => s.id === req.params.session_id);
  if (!session) return res.status(404).json({ error: 'Not Found', message: 'Session not found' });
  if (session.status !== 'paused') return res.status(409).json({ error: 'Conflict', message: 'Session is not paused' });
  session.status = 'active';
  res.json({ session_id: session.id, status: 'active' });
});

// GET /live — list active sessions
router.get('/live', (req, res) => {
  const active = db.sessions.filter(s => s.status === 'active' || s.status === 'paused');
  const items = active.map(s => ({
    ...s,
    duration_seconds: Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000),
    bytes_transferred: s.bytes_transferred + Math.floor(Math.random() * 5000),
  }));
  res.json({ total: items.length, items });
});

// GET /:session_id/summary — AI-generated session summary (simulated)
router.get('/:session_id/summary', (req, res) => {
  const session = db.sessions.find(s => s.id === req.params.session_id);
  if (!session) return res.status(404).json({ error: 'Not Found', message: 'Session not found' });

  const summaries = {
    ssh: { summary: 'User performed system maintenance operations including log rotation and service restarts.', commands_executed: ['tail -f /var/log/syslog', 'systemctl restart nginx', 'pg_dump -U postgres production > backup.sql', 'df -h'], files_transferred: ['backup.sql (245 MB)'] },
    rdp: { summary: 'User accessed Active Directory management console and performed group policy updates.', commands_executed: ['gpupdate /force', 'Get-ADUser -Filter *', 'New-ADGroup -Name "Temp-Access"'], files_transferred: [] },
    vnc: { summary: 'User accessed graphical desktop for application monitoring.', commands_executed: [], files_transferred: [] },
    http: { summary: 'User accessed web management interface for configuration changes.', commands_executed: [], files_transferred: ['config-export.json (12 KB)'] },
  };
  const s = summaries[session.protocol] || summaries.ssh;
  res.json({ session_id: session.id, summary: s.summary, risk_score: +(Math.random() * 0.4).toFixed(2), commands_executed: s.commands_executed, files_transferred: s.files_transferred });
});

module.exports = router;
