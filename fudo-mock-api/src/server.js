const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// Public routes
app.use('/api/v2/auth', require('./routes/auth'));

// Protected routes
app.use('/api/v2/users', authMiddleware, require('./routes/users'));
app.use('/api/v2/accounts', authMiddleware, require('./routes/accounts'));
app.use('/api/v2/safes', authMiddleware, require('./routes/safes'));
app.use('/api/v2/servers', authMiddleware, require('./routes/servers'));
app.use('/api/v2/sessions', authMiddleware, require('./routes/sessions'));
app.use('/api/v2/listeners', authMiddleware, require('./routes/listeners'));
app.use('/api/v2/pools', authMiddleware, require('./routes/pools'));
app.use('/api/v2/groups', authMiddleware, require('./routes/groups'));
app.use('/api/v2/user-directory', authMiddleware, require('./routes/user-directory'));
app.use('/api/v2/session-control', authMiddleware, require('./routes/session-control'));
app.use('/api/v2/events', authMiddleware, require('./routes/events'));
app.use('/api/v2/password-policies', authMiddleware, require('./routes/password-policy'));
app.use('/api/v2/access-requests', authMiddleware, require('./routes/access-requests'));
app.use('/api/v2/access-policies', authMiddleware, require('./routes/access-policies'));

// Health check
app.get('/api/v2/health', (req, res) => res.json({ status: 'ok', version: '2.0.0-mock' }));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'fudo-mock-api', version: '2.0.0-mock' }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.path} not found` }));

app.listen(PORT, () => {
  console.log(`🔐 Fudo PAM Mock API v2 running on http://localhost:${PORT}`);
  console.log(`   Login: POST /api/v2/auth/login {"login":"admin","password":"admin123"}`);
});
