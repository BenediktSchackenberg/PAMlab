const express = require('express');
const cors = require('cors');
const seed = require('./data/seed');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8447;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'servicenow-mock-api', timestamp: new Date().toISOString() });
});

// Auth routes (public)
app.use('/api/now/auth', require('./routes/auth'));

// Auth middleware for all other /api routes
app.use('/api', authMiddleware);

// Generic Table API
app.use('/api/now/table', require('./routes/table'));

// Convenience module routes
app.use('/api/now/incident', require('./routes/incident'));
app.use('/api/now/change', require('./routes/change'));
app.use('/api/now/cmdb', require('./routes/cmdb'));
app.use('/api/now/catalog', require('./routes/catalog'));
app.use('/api/now/events', require('./routes/events'));

// 404
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found', detail: `${req.method} ${req.path} is not a valid endpoint` } });
});

// Seed data
seed();

app.listen(PORT, () => {
  console.log(`ServiceNow Mock API running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Table API: http://localhost:${PORT}/api/now/table/{tableName}`);
});
