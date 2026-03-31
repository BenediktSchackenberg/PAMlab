const express = require('express');
const cors = require('cors');
const seed = require('./data/seed');
const authMiddleware = require('./middleware/auth');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Request Logging ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- Health & Admin ---
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'jsm-mock-api', timestamp: new Date().toISOString() });
});

app.post('/reset', (req, res) => {
  seed();
  res.json({ status: 'reset', service: 'jsm-mock-api' });
});

// --- Public Routes ---
app.use('/rest/auth/1/session', require('./routes/auth'));

// --- Auth Middleware ---
app.use('/rest', authMiddleware);

// --- Protected Routes (Jira REST API v2) ---
app.use('/rest/api/2/issue', require('./routes/issues'));
app.use('/rest/api/2/issue', require('./routes/transitions'));
app.use('/rest/api/2/search', require('./routes/search'));
app.use('/rest/api/2/webhook', require('./routes/webhooks'));
app.use('/rest/webhooks/1.0/webhook', require('./routes/webhooks'));

// --- Protected Routes (JSM Service Desk API) ---
app.use('/rest/servicedeskapi', require('./routes/approvals'));
app.use('/rest/servicedeskapi', require('./routes/customers'));
app.use('/rest/servicedeskapi', require('./routes/queues'));

// --- Protected Routes (Assets API) ---
app.use('/rest/assets/1.0', require('./routes/assets'));

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({ errorMessages: [`${req.method} ${req.path} is not a valid endpoint`], errors: {} });
});

// --- Seed Data ---
seed();

// --- Start ---
const PORT = process.env.PORT || 8448;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`JSM Mock API running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
  });
}

module.exports = app;
