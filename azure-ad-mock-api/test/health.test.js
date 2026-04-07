const request = require('supertest');
const app = require('../src/server');

describe('Azure AD Mock health', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('azure-ad-mock-api');
  });
});
