const request = require('supertest');
const app = require('../src/api');

describe('Pipeline Engine', () => {
  // Health
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('pipeline-engine');
  });

  // Pipelines list
  test('GET /pipelines returns list', async () => {
    const res = await request(app).get('/pipelines');
    expect(res.status).toBe(200);
    expect(res.body.pipelines).toBeDefined();
    expect(Array.isArray(res.body.pipelines)).toBe(true);
  });

  // Pipeline runs
  test('GET /pipelines/runs returns runs', async () => {
    const res = await request(app).get('/pipelines/runs');
    expect(res.status).toBe(200);
    expect(res.body.runs).toBeDefined();
  });

  // Pipeline run not found
  test('GET /pipelines/runs/nonexistent returns 404', async () => {
    const res = await request(app).get('/pipelines/runs/nonexistent-id');
    expect(res.status).toBe(404);
  });

  // Connectors
  test('GET /connectors returns list', async () => {
    const res = await request(app).get('/connectors');
    expect(res.status).toBe(200);
    expect(res.body.connectors).toBeDefined();
  });

  // Connector actions
  test('GET /connectors/fudo-pam/actions returns actions', async () => {
    const res = await request(app).get('/connectors/fudo-pam/actions');
    expect(res.status).toBe(200);
    expect(res.body.actions).toBeDefined();
  });

  test('GET /connectors/nonexistent/actions returns 404', async () => {
    const res = await request(app).get('/connectors/nonexistent/actions');
    expect(res.status).toBe(404);
  });

  // Validate pipeline - yaml content
  test('POST /pipelines/validate with valid yaml', async () => {
    const res = await request(app).post('/pipelines/validate').send({
      yaml: 'name: test-pipeline\nsteps:\n  - name: step1\n    connector: fudo-pam\n    action: list-users',
    });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  test('POST /pipelines/validate rejects inline yaml without system or connector', async () => {
    const res = await request(app).post('/pipelines/validate').send({
      yaml: 'name: test-pipeline\nsteps:\n  - name: step1\n    action: list-users',
    });
    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  test('POST /pipelines/validate with invalid yaml (no name)', async () => {
    const res = await request(app).post('/pipelines/validate').send({
      yaml: 'steps:\n  - name: step1'
    });
    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  test('POST /pipelines/validate with invalid yaml (no steps)', async () => {
    const res = await request(app).post('/pipelines/validate').send({
      yaml: 'name: test'
    });
    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  test('POST /pipelines/validate without params returns 400', async () => {
    const res = await request(app).post('/pipelines/validate').send({});
    expect(res.status).toBe(400);
  });

  // Run pipeline - missing file
  test('POST /pipelines/run without file returns 400', async () => {
    const res = await request(app).post('/pipelines/run').send({});
    expect(res.status).toBe(400);
  });

  test('POST /pipelines/run with nonexistent file returns 404', async () => {
    const res = await request(app).post('/pipelines/run').send({ file: 'nonexistent.yaml' });
    expect(res.status).toBe(404);
  });

  test('POST /pipelines/run rejects path traversal attempts', async () => {
    const res = await request(app).post('/pipelines/run').send({ file: '../package.json' });
    expect(res.status).toBe(400);
  });

  // Pipeline definition - existing file
  test('GET /pipelines/:name for existing pipeline', async () => {
    const list = await request(app).get('/pipelines');
    if (list.body.pipelines.length > 0) {
      const name = list.body.pipelines[0].file || list.body.pipelines[0];
      const res = await request(app).get(`/pipelines/${name}`);
      expect(res.status).toBe(200);
      expect(res.body.pipeline).toBeDefined();
    }
  });

  test('GET /pipelines/nonexistent.yaml returns 404', async () => {
    const res = await request(app).get('/pipelines/nonexistent.yaml');
    expect(res.status).toBe(404);
  });

  test('GET /pipelines/:name rejects path traversal attempts', async () => {
    const res = await request(app).get('/pipelines/..%2Fpackage.json');
    expect(res.status).toBe(400);
  });

  test('POST /pipelines/validate rejects path traversal file names', async () => {
    const res = await request(app).post('/pipelines/validate').send({ file: '../package.json' });
    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });
});
