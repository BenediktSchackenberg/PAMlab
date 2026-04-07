const request = require('supertest');
const app = require('../src/server');

describe('Azure AD / Entra ID Mock API', () => {
  let accessToken;

  beforeAll(async () => {
    await request(app).post('/reset');
    const res = await request(app).post('/oauth2/v2.0/token').type('form').send({
      grant_type: 'client_credentials',
      client_id: '11111111-2222-3333-4444-555555555551',
      client_secret: 'PAMlab-Secret-1!',
      scope: 'https://graph.microsoft.com/.default',
    });
    accessToken = res.body.access_token;
  });

  test('POST /oauth2/v2.0/token returns bearer token', async () => {
    const res = await request(app).post('/oauth2/v2.0/token').type('form').send({
      grant_type: 'client_credentials',
      client_id: '11111111-2222-3333-4444-555555555551',
      client_secret: 'PAMlab-Secret-1!',
    });
    expect(res.status).toBe(200);
    expect(res.body.token_type).toBe('Bearer');
    expect(res.body.access_token).toBeDefined();
  });

  test('GET /v1.0/users without auth returns 401', async () => {
    const res = await request(app).get('/v1.0/users');
    expect(res.status).toBe(401);
  });

  test('GET /v1.0/users returns seeded users', async () => {
    const res = await request(app).get('/v1.0/users').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.value)).toBe(true);
    expect(res.body.value.length).toBeGreaterThan(0);
  });

  test('POST /v1.0/users creates user', async () => {
    const res = await request(app)
      .post('/v1.0/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userPrincipalName: 'new.cloud.user@corp.local',
        displayName: 'New Cloud User',
        givenName: 'New',
        surname: 'User',
        department: 'Cloud Platform',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.userPrincipalName).toBe('new.cloud.user@corp.local');
  });

  test('GET /v1.0/users/:id/memberOf returns group memberships', async () => {
    const res = await request(app)
      .get('/v1.0/users/b.wilson@corp.local/memberOf')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.value.some((group) => group.displayName === 'Cloud-Admins')).toBe(true);
  });

  test('POST /v1.0/users/:id/revokeSignInSessions returns success', async () => {
    const res = await request(app)
      .post('/v1.0/users/b.wilson@corp.local/revokeSignInSessions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.value).toBe(true);
  });

  test('POST /v1.0/groups creates group and adds member', async () => {
    const created = await request(app)
      .post('/v1.0/groups')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ displayName: 'Emergency-Responders', description: 'Temporary responders' });

    expect(created.status).toBe(201);

    const added = await request(app)
      .post(`/v1.0/groups/${created.body.id}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ memberId: '20000000-0000-0000-0000-000000000004' });

    expect(added.status).toBe(201);
    expect(added.body.value[0].displayName).toBe('Bob Wilson');
  });

  test('GET /v1.0/servicePrincipals returns app registrations', async () => {
    const res = await request(app)
      .get('/v1.0/servicePrincipals')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.value.some((sp) => sp.displayName === 'svc-pam-integration')).toBe(true);
  });

  test('POST /v1.0/identity/conditionalAccess/policies creates policy', async () => {
    const res = await request(app)
      .post('/v1.0/identity/conditionalAccess/policies')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        displayName: 'Require compliant device for admins',
        state: 'enabled',
        grantControls: { operator: 'OR', builtInControls: ['compliantDevice'] },
      });

    expect(res.status).toBe(201);
    expect(res.body.displayName).toBe('Require compliant device for admins');
  });

  test('GET /v1.0/roleManagement/directory/roleDefinitions returns roles', async () => {
    const res = await request(app)
      .get('/v1.0/roleManagement/directory/roleDefinitions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.value.some((role) => role.displayName === 'Global Administrator')).toBe(true);
  });

  test('POST /v1.0/roleManagement/directory/roleAssignmentScheduleRequests activates eligible role', async () => {
    const res = await request(app)
      .post('/v1.0/roleManagement/directory/roleAssignmentScheduleRequests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        action: 'selfActivate',
        principalId: '20000000-0000-0000-0000-000000000004',
        roleDefinitionId: 'e8611ab8-c189-46e8-94e1-60213ab1f814',
        justification: 'Emergency admin access for PAM maintenance',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Provisioned');

    const assignments = await request(app)
      .get('/v1.0/roleManagement/directory/roleAssignments')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(
      assignments.body.value.some(
        (assignment) =>
          assignment.principalDisplayName === 'Bob Wilson' &&
          assignment.roleDefinitionDisplayName === 'Privileged Role Administrator',
      ),
    ).toBe(true);
  });

  test('GET /v1.0/me returns current app context', async () => {
    const res = await request(app)
      .get('/v1.0/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('svc-pam-integration');
    expect(res.body.accountType).toBe('servicePrincipal');
  });
});
