const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const router = express.Router();

// Generate access token from API token
router.post('/GenerateAccessTokenFromApiToken/', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'API token required in Authorization header' });
  }
  const apiToken = authHeader.split(' ')[1];
  const entry = store.tokens.find(t => t.apiToken === apiToken);
  if (!entry) {
    return res.status(403).json({ error: 'Invalid API token' });
  }
  const rawToken = 'access-' + uuidv4();
  const validTo = new Date(Date.now() + 3600000).toISOString();
  entry.RawToken = rawToken;
  entry.ValidTo = validTo;
  // Also add as a valid token for auth middleware
  store.tokens.push({ apiToken: null, RawToken: rawToken, ValidTo: validTo, UserName: entry.UserName });
  res.json({ RawToken: rawToken, ValidTo: validTo, UserName: entry.UserName });
});

module.exports = router;
