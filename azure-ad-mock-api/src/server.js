const express = require('express');
const cors = require('cors');
const store = require('./data/store');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8452;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('json spaces', 2);

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`,
    );
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'azure-ad-mock-api',
    graphVersion: 'v1.0',
    tenant: store.tenant.displayName,
  });
});

app.post('/reset', (req, res) => {
  store.reset();
  res.json({ status: 'reset', service: 'azure-ad-mock-api' });
});

app.use('/oauth2/v2.0/token', require('./routes/auth'));
app.use('/v1.0/me', authMiddleware, require('./routes/me'));
app.use('/v1.0/users', authMiddleware, require('./routes/users'));
app.use('/v1.0/groups', authMiddleware, require('./routes/groups'));
app.use('/v1.0/servicePrincipals', authMiddleware, require('./routes/servicePrincipals'));
app.use(
  '/v1.0/identity/conditionalAccess/policies',
  authMiddleware,
  require('./routes/conditionalAccess'),
);
app.use(
  '/v1.0/roleManagement/directory',
  authMiddleware,
  require('./routes/roleManagement'),
);

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'Request_ResourceNotFound',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Microsoft Entra ID Mock API running on http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Token:  POST http://localhost:${PORT}/oauth2/v2.0/token`);
  });
}

module.exports = app;
