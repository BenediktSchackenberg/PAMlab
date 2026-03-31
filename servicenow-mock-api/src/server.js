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
  res.json({ status: 'healthy', service: 'servicenow-mock-api', timestamp: new Date().toISOString() });
});

app.post('/reset', (req, res) => {
  seed();
  res.json({ status: 'reset', service: 'servicenow-mock-api' });
});

// --- Public Routes ---
app.use('/api/now/auth', require('./routes/auth'));

// --- Auth Middleware ---
app.use('/api', authMiddleware);

// --- Protected Routes ---
app.use('/api/now/table', require('./routes/table'));
app.use('/api/now/incident', require('./routes/incident'));
app.use('/api/now/change', require('./routes/change'));
app.use('/api/now/cmdb', require('./routes/cmdb'));
app.use('/api/now/catalog', require('./routes/catalog'));
app.use('/api/now/events', require('./routes/events'));

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found', detail: `${req.method} ${req.path} is not a valid endpoint` } });
});

// --- Seed Data ---
seed();

// --- Start ---
const PORT = process.env.PORT || 8447;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ServiceNow Mock API running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Table API: http://localhost:${PORT}/api/now/table/{tableName}`);
  });
}

module.exports = app;
