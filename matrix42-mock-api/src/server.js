const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const metaRoutes = require('./routes/meta');
const webhookRoutes = require('./routes/webhooks');
const accessRequestRoutes = require('./routes/access-requests');
const userRoutes = require('./routes/users');
const assetRoutes = require('./routes/assets');
const ticketRoutes = require('./routes/tickets');
const softwareRoutes = require('./routes/software');
const provisioningRoutes = require('./routes/provisioning');
const reportRoutes = require('./routes/reports');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Request Logging ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- Routes ---
app.use('/m42Services/api/ApiToken', authRoutes);
app.use('/m42Services/api/data', dataRoutes);
app.use('/m42Services/api/meta', metaRoutes);
app.use('/m42Services/api/webhooks', webhookRoutes);
app.use('/m42Services/api/access-requests', accessRequestRoutes);
app.use('/m42Services/api/users', userRoutes);
app.use('/m42Services/api/assets', assetRoutes);
app.use('/m42Services/api/tickets', ticketRoutes);
app.use('/m42Services/api/software', softwareRoutes);
app.use('/m42Services/api/provisioning', provisioningRoutes);
app.use('/m42Services/api/reports', reportRoutes);

// --- Alias Routes ---
app.use('/api/tickets', ticketRoutes);

// --- Health & Admin ---
app.post('/reset', (req, res) => {
  delete require.cache[require.resolve('./data/seed')];
  const freshSeed = require('./data/seed');
  const store = require('./data/store');
  store.objects = {
    SPSUserClassBase: [...freshSeed.employees],
    SPSAssetClassBase: [...freshSeed.assets],
    SPSSoftwareType: [...freshSeed.software],
    SPSActivityClassBase: [...freshSeed.tickets],
    SPSScCategoryClassBase: [...freshSeed.categories],
  };
  store.webhooks = [];
  store.accessRequests = [...freshSeed.accessRequests];
  store.dataDefinitions = freshSeed.dataDefinitions;
  store.assetAssignments = [...freshSeed.assetAssignments];
  store.softwareInstallations = [...freshSeed.softwareInstallations];
  store.ticketComments = [...freshSeed.ticketComments];
  store.provisioningWorkflows = [...freshSeed.provisioningWorkflows];
  store.workflowSteps = [...freshSeed.workflowSteps];
  store.userGroupMappings = [...freshSeed.userGroupMappings];
  store.assetCompliance = [...freshSeed.assetCompliance];
  res.json({ status: 'reset', service: 'matrix42-mock-api' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'matrix42-mock-api' });
});

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// --- Start ---
const PORT = process.env.PORT || 8444;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Matrix42 ESM Mock API running on port ${PORT}`));
}

module.exports = app;
