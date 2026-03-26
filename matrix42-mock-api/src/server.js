const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const metaRoutes = require('./routes/meta');
const webhookRoutes = require('./routes/webhooks');
const accessRequestRoutes = require('./routes/access-requests');

const app = express();
const PORT = process.env.PORT || 8444;

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/m42Services/api/ApiToken', authRoutes);
app.use('/m42Services/api/data', dataRoutes);
app.use('/m42Services/api/meta', metaRoutes);
app.use('/m42Services/api/webhooks', webhookRoutes);
app.use('/m42Services/api/access-requests', accessRequestRoutes);

// Health
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'matrix42-mock-api' }));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`Matrix42 ESM Mock API running on port ${PORT}`);
});
