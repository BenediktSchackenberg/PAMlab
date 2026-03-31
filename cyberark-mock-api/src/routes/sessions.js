const express = require('express');
const db = require('../data/store');
const router = express.Router();

// GET /api/LiveSessions
router.get('/', (req, res) => {
  const { Limit = 25, Offset = 0, Safe, FromTime, ToTime, Activities } = req.query;
  let result = [...db.psmSessions];
  if (Safe) result = result.filter(s => s.SafeName === Safe);
  if (Activities === 'active') result = result.filter(s => s.IsLive);
  const total = result.length;
  const paged = result.slice(Number(Offset), Number(Offset) + Number(Limit));
  res.json({ LiveSessions: paged, Total: total });
});

// GET /api/LiveSessions/:sessionId
router.get('/:sessionId', (req, res) => {
  const session = db.psmSessions.find(s => s.SessionID === req.params.sessionId);
  if (!session) return res.status(404).json({ ErrorCode: 'PASWS017E', ErrorMessage: 'Session not found' });
  res.json(session);
});

// POST /api/LiveSessions/:sessionId/Terminate
router.post('/:sessionId/Terminate', (req, res) => {
  const session = db.psmSessions.find(s => s.SessionID === req.params.sessionId);
  if (!session) return res.status(404).json({ ErrorCode: 'PASWS017E', ErrorMessage: 'Session not found' });
  session.SessionStatus = 'Terminated';
  session.IsLive = false;
  session.End = new Date().toISOString();
  res.json({ message: 'Session terminated', session });
});

module.exports = router;
