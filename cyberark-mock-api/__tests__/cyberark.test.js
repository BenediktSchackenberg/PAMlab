const request = require('supertest');
const app = require('../src/server');

const DEV_TOKEN = 'pamlab-dev-token';
const auth = { Authorization: `Bearer ${DEV_TOKEN}` };

beforeEach(async () => {
  await request(app).post('/reset');
});

// ── Auth ────────────────────────────────────────────────────────────
describe('Authentication', () => {
  test('POST /api/auth/Cyberark/Logon returns token', async () => {
    const res = await request(app).post('/api/auth/Cyberark/Logon')
      .send({ username: 'Administrator', password: 'Cyberark1!' });
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('string');
    expect(res.body.length).toBeGreaterThan(10);
  });

  test('POST /api/auth/Cyberark/Logon rejects invalid user', async () => {
    const res = await request(app).post('/api/auth/Cyberark/Logon')
      .send({ username: 'nobody', password: 'wrong' });
    expect(res.status).toBe(403);
  });

  test('POST /api/auth/Logoff succeeds', async () => {
    const login = await request(app).post('/api/auth/Cyberark/Logon')
      .send({ username: 'Administrator', password: 'Cyberark1!' });
    const res = await request(app).post('/api/auth/Logoff')
      .set('Authorization', login.body);
    expect(res.status).toBe(200);
  });

  test('Protected route rejects without token', async () => {
    const res = await request(app).get('/api/Safes');
    expect(res.status).toBe(401);
  });
});

// ── Safes ───────────────────────────────────────────────────────────
describe('Safes', () => {
  test('GET /api/Safes lists safes', async () => {
    const res = await request(app).get('/api/Safes').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.value.length).toBeGreaterThanOrEqual(3);
    expect(res.body.count).toBeGreaterThanOrEqual(3);
  });

  test('POST /api/Safes creates a safe', async () => {
    const res = await request(app).post('/api/Safes').set(auth)
      .send({ SafeName: 'Test-Safe', Description: 'A test safe' });
    expect(res.status).toBe(201);
    expect(res.body.SafeUrlId).toBe('Test-Safe');
  });

  test('GET /api/Safes/:id returns safe', async () => {
    const res = await request(app).get('/api/Safes/IT-Admins').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.SafeName).toBe('IT-Admins');
  });

  test('DELETE /api/Safes/:id deletes safe', async () => {
    const res = await request(app).delete('/api/Safes/Cloud-Keys').set(auth);
    expect(res.status).toBe(204);
    const check = await request(app).get('/api/Safes/Cloud-Keys').set(auth);
    expect(check.status).toBe(404);
  });

  test('GET /api/Safes/:id/Members lists members', async () => {
    const res = await request(app).get('/api/Safes/IT-Admins/Members').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.value.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Accounts ────────────────────────────────────────────────────────
describe('Accounts', () => {
  test('GET /api/Accounts lists accounts', async () => {
    const res = await request(app).get('/api/Accounts').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.value.length).toBeGreaterThanOrEqual(10);
  });

  test('GET /api/Accounts with search', async () => {
    const res = await request(app).get('/api/Accounts?search=Administrator').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.value.length).toBeGreaterThanOrEqual(1);
  });

  test('POST /api/Accounts creates account', async () => {
    const res = await request(app).post('/api/Accounts').set(auth)
      .send({ address: 'test.local', userName: 'testuser', safeName: 'IT-Admins', platformId: 'UnixSSH' });
    expect(res.status).toBe(201);
    expect(res.body.userName).toBe('testuser');
  });

  test('POST /api/Accounts/:id/Password/Retrieve returns password', async () => {
    const res = await request(app).post('/api/Accounts/acc-001/Password/Retrieve').set(auth);
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('string');
  });

  test('POST /api/Accounts/:id/Change initiates password change', async () => {
    const res = await request(app).post('/api/Accounts/acc-001/Change').set(auth).send({});
    expect(res.status).toBe(200);
  });

  test('DELETE /api/Accounts/:id deletes account', async () => {
    const res = await request(app).delete('/api/Accounts/acc-012').set(auth);
    expect(res.status).toBe(204);
  });
});

// ── Users ───────────────────────────────────────────────────────────
describe('Users', () => {
  test('GET /api/Users lists users', async () => {
    const res = await request(app).get('/api/Users').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.Users.length).toBeGreaterThanOrEqual(5);
  });

  test('POST /api/Users creates user', async () => {
    const res = await request(app).post('/api/Users').set(auth)
      .send({ username: 'newuser', personalDetails: { firstName: 'New', lastName: 'User' } });
    expect(res.status).toBe(201);
    expect(res.body.username).toBe('newuser');
  });

  test('POST /api/Users/:id/ResetPassword resets password', async () => {
    const res = await request(app).post('/api/Users/10/ResetPassword').set(auth).send({});
    expect(res.status).toBe(200);
  });
});

// ── Sessions ────────────────────────────────────────────────────────
describe('Sessions', () => {
  test('GET /api/LiveSessions lists sessions', async () => {
    const res = await request(app).get('/api/LiveSessions').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.LiveSessions.length).toBeGreaterThanOrEqual(3);
  });

  test('POST /api/LiveSessions/:id/Terminate terminates session', async () => {
    const res = await request(app).post('/api/LiveSessions/psm-001/Terminate').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.session.SessionStatus).toBe('Terminated');
  });
});

// ── System Health ───────────────────────────────────────────────────
describe('System Health', () => {
  test('GET /api/ComponentsMonitoringDetails returns all components', async () => {
    const res = await request(app).get('/api/ComponentsMonitoringDetails').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.Components.length).toBeGreaterThanOrEqual(4);
  });
});
