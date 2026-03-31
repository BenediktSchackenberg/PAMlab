// =============================================================================
// PAMlab Pipeline Engine — REST API (Port 8446)
// =============================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const PipelineRunner = require('./engine/PipelineRunner');
const ConnectorRegistry = require('./connectors/ConnectorRegistry');
const FudoPamConnector = require('./connectors/fudo-pam');
const Matrix42EsmConnector = require('./connectors/matrix42-esm');
const ActiveDirectoryConnector = require('./connectors/active-directory');

const app = express();
const PORT = process.env.PORT || 8446;
const PIPELINES_DIR = path.join(__dirname, '../pipelines');

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Registry ---
const registry = new ConnectorRegistry();
registry.register('fudo-pam', new FudoPamConnector(process.env.FUDO_URL || 'http://localhost:8443'));
registry.register('matrix42-esm', new Matrix42EsmConnector(process.env.M42_URL || 'http://localhost:8444'));
registry.register('active-directory', new ActiveDirectoryConnector(process.env.AD_URL || 'http://localhost:8445'));

const runner = new PipelineRunner(registry);

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pipeline-engine', timestamp: new Date().toISOString() });
});

// --- GET /pipelines — Verfügbare Pipelines auflisten ---
app.get('/pipelines', async (req, res) => {
  try {
    const pipelines = await runner.listPipelines(PIPELINES_DIR);
    res.json({ pipelines });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET /pipelines/runs — Letzte Runs auflisten (BEFORE :name to avoid conflict) ---
app.get('/pipelines/runs', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const runs = runner.getRuns(limit);
  res.json({ runs });
});

// --- GET /pipelines/runs/:id — Run-Details ---
app.get('/pipelines/runs/:id', (req, res) => {
  const run = runner.getRun(req.params.id);
  if (!run) {
    return res.status(404).json({ error: `Run "${req.params.id}" nicht gefunden` });
  }
  res.json(run);
});

// --- GET /pipelines/:name — Pipeline-Definition abrufen ---
app.get('/pipelines/:name', async (req, res) => {
  try {
    const filePath = path.join(PIPELINES_DIR, req.params.name);
    try {
      await fs.promises.access(filePath);
    } catch {
      return res.status(404).json({ error: `Pipeline "${req.params.name}" nicht gefunden` });
    }
    const content = await fs.promises.readFile(filePath, 'utf8');
    const pipeline = yaml.load(content);
    res.json({ pipeline, raw: content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- POST /pipelines/validate — Pipeline validieren ---
app.post('/pipelines/validate', async (req, res) => {
  try {
    const { file, yaml: yamlContent } = req.body;

    if (yamlContent) {
      const pipeline = yaml.load(yamlContent);
      if (!pipeline.name) return res.status(400).json({ valid: false, errors: ['Pipeline benötigt ein "name" Feld'] });
      if (!pipeline.steps) return res.status(400).json({ valid: false, errors: ['Pipeline benötigt ein "steps" Array'] });
      return res.json({ valid: true, name: pipeline.name, steps: pipeline.steps.length });
    }

    if (file) {
      const filePath = path.join(PIPELINES_DIR, file);
      const result = await runner.validate(filePath);
      return res.json(result);
    }

    res.status(400).json({ error: '"file" oder "yaml" Parameter erforderlich' });
  } catch (error) {
    res.status(400).json({ valid: false, errors: [error.message] });
  }
});

// --- POST /pipelines/run — Pipeline ausführen ---
app.post('/pipelines/run', async (req, res) => {
  try {
    const { file, vars = {}, dryRun = false } = req.body;

    if (!file) {
      return res.status(400).json({ error: '"file" Parameter erforderlich' });
    }

    const filePath = path.join(PIPELINES_DIR, file);
    try {
      await fs.promises.access(filePath);
    } catch {
      return res.status(404).json({ error: `Pipeline "${file}" nicht gefunden` });
    }

    const result = await runner.run(filePath, vars, { dryRun });
    const statusCode = result.status === 'completed' ? 200 : 500;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET /connectors — Registrierte Connectors ---
app.get('/connectors', (req, res) => {
  const connectors = registry.listDetailed();
  res.json({ connectors });
});

// --- GET /connectors/:name/actions — Actions eines Connectors ---
app.get('/connectors/:name/actions', (req, res) => {
  try {
    const connector = registry.get(req.params.name);
    const actions = {};
    for (const [name, action] of Object.entries(connector.actions)) {
      actions[name] = {
        method: action.method,
        path: action.path,
        description: action.description
      };
    }
    res.json({ connector: req.params.name, actions });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// --- Start ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🔗 PAMlab Pipeline Engine läuft auf Port ${PORT}`);
    console.log(`   Connectors: ${registry.list().join(', ')}`);
    console.log(`   Pipelines:  ${PIPELINES_DIR}`);
    console.log(`   Health:     http://localhost:${PORT}/health\n`);
  });
}

module.exports = app;
