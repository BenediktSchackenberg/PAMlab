const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8450;

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
app.use('/api/auth', require('./routes/auth'));

// Protected routes
app.use('/api/Safes', authMiddleware, require('./routes/safes'));
app.use('/api/Accounts', authMiddleware, require('./routes/accounts'));
app.use('/api/Platforms', authMiddleware, require('./routes/platforms'));
app.use('/api/Users', authMiddleware, require('./routes/users'));
app.use('/api/UserGroups', authMiddleware, require('./routes/groups'));
app.use('/api/LiveSessions', authMiddleware, require('./routes/sessions'));
app.use('/api/ComponentsMonitoringDetails', authMiddleware, require('./routes/system-health'));

// Reset endpoint (for tests)
app.post('/reset', (req, res) => {
  delete require.cache[require.resolve('./data/seed')];
  const freshSeed = require('./data/seed');
  const store = require('./data/store');
  store.platforms = [...freshSeed.platforms];
  store.safes = [...freshSeed.safes];
  store.safeMembers = [...freshSeed.safeMembers];
  store.accounts = [...freshSeed.accounts];
  store.users = [...freshSeed.users];
  store.groups = freshSeed.groups.map(g => ({ ...g, members: [...g.members] }));
  store.psmSessions = [...freshSeed.psmSessions];
  store.systemHealth = [...freshSeed.systemHealth];
  store.tokens = new Map();
  res.json({ status: 'reset', service: 'cyberark-mock-api' });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '12.6.0-mock' }));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'cyberark-mock-api', version: '12.6.0-mock' }));

// Server info
app.get('/api/Server', authMiddleware, (req, res) => {
  res.json({ ServerName: 'CyberArk-Mock-PVWA', ServerId: 'mock-001', ServerVersion: '12.6.0-mock', AuthenticationMethods: [{ id: 'CyberArk', enabled: true }] });
});

// 404
app.use((req, res) => res.status(404).json({ ErrorCode: 'PASWS019E', ErrorMessage: `Route ${req.method} ${req.path} not found` }));

// Export for testing
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🔐 CyberArk PVWA Mock API v12.6 running on http://localhost:${PORT}`);
    console.log(`   Login: POST /api/auth/Cyberark/Logon {"username":"Administrator","password":"Cyberark1!"}`);
  });
}

module.exports = app;
