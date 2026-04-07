const BaseConnector = require('./BaseConnector');

class AzureAdConnector extends BaseConnector {
  constructor(baseUrl = 'http://localhost:8452') {
    super('azure-ad', baseUrl);
    this.credentials = {
      clientId: process.env.AZURE_AD_CLIENT_ID || '11111111-2222-3333-4444-555555555551',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || 'PAMlab-Secret-1!',
      scope: process.env.AZURE_AD_SCOPE || 'https://graph.microsoft.com/.default',
    };
    this._defineActions();
  }

  _defineActions() {
    this.defineAction('auth.token', {
      method: 'POST',
      path: '/oauth2/v2.0/token',
      description: 'Get OAuth token via client credentials',
    });

    this.defineAction('me.get', {
      method: 'GET',
      path: '/v1.0/me',
      description: 'Get current Graph identity',
    });

    this.defineAction('users.list', {
      method: 'GET',
      path: '/v1.0/users',
      description: 'List directory users',
    });
    this.defineAction('users.get', {
      method: 'GET',
      path: '/v1.0/users/{id}',
      description: 'Get user by object ID or UPN',
    });
    this.defineAction('users.create', {
      method: 'POST',
      path: '/v1.0/users',
      description: 'Create a directory user',
    });
    this.defineAction('users.update', {
      method: 'PATCH',
      path: '/v1.0/users/{id}',
      description: 'Update a directory user',
    });
    this.defineAction('users.delete', {
      method: 'DELETE',
      path: '/v1.0/users/{id}',
      description: 'Delete a directory user',
    });
    this.defineAction('users.member-of', {
      method: 'GET',
      path: '/v1.0/users/{id}/memberOf',
      description: 'List group memberships for a user',
    });
    this.defineAction('users.revoke-signin-sessions', {
      method: 'POST',
      path: '/v1.0/users/{id}/revokeSignInSessions',
      description: 'Invalidate user sign-in sessions',
    });

    this.defineAction('groups.list', {
      method: 'GET',
      path: '/v1.0/groups',
      description: 'List groups',
    });
    this.defineAction('groups.get', {
      method: 'GET',
      path: '/v1.0/groups/{id}',
      description: 'Get group by ID or displayName',
    });
    this.defineAction('groups.create', {
      method: 'POST',
      path: '/v1.0/groups',
      description: 'Create a group',
    });
    this.defineAction('groups.update', {
      method: 'PATCH',
      path: '/v1.0/groups/{id}',
      description: 'Update a group',
    });
    this.defineAction('groups.delete', {
      method: 'DELETE',
      path: '/v1.0/groups/{id}',
      description: 'Delete a group',
    });
    this.defineAction('groups.list-members', {
      method: 'GET',
      path: '/v1.0/groups/{id}/members',
      description: 'List group members',
    });
    this.defineAction('groups.add-member', {
      method: 'POST',
      path: '/v1.0/groups/{id}/members',
      description: 'Add directory object to group',
    });
    this.defineAction('groups.remove-member', {
      method: 'DELETE',
      path: '/v1.0/groups/{id}/members/{memberId}',
      description: 'Remove directory object from group',
    });

    this.defineAction('service-principals.list', {
      method: 'GET',
      path: '/v1.0/servicePrincipals',
      description: 'List service principals',
    });
    this.defineAction('service-principals.get', {
      method: 'GET',
      path: '/v1.0/servicePrincipals/{id}',
      description: 'Get service principal details',
    });
    this.defineAction('service-principals.create', {
      method: 'POST',
      path: '/v1.0/servicePrincipals',
      description: 'Create a service principal',
    });

    this.defineAction('conditional-access.list', {
      method: 'GET',
      path: '/v1.0/identity/conditionalAccess/policies',
      description: 'List Conditional Access policies',
    });
    this.defineAction('conditional-access.create', {
      method: 'POST',
      path: '/v1.0/identity/conditionalAccess/policies',
      description: 'Create Conditional Access policy',
    });
    this.defineAction('conditional-access.update', {
      method: 'PATCH',
      path: '/v1.0/identity/conditionalAccess/policies/{id}',
      description: 'Update Conditional Access policy',
    });
    this.defineAction('conditional-access.delete', {
      method: 'DELETE',
      path: '/v1.0/identity/conditionalAccess/policies/{id}',
      description: 'Delete Conditional Access policy',
    });

    this.defineAction('pim.role-assignments', {
      method: 'GET',
      path: '/v1.0/roleManagement/directory/roleAssignments',
      description: 'List active privileged role assignments',
    });
    this.defineAction('pim.eligible-roles', {
      method: 'GET',
      path: '/v1.0/roleManagement/directory/roleEligibilityScheduleRequests',
      description: 'List eligible PIM role requests',
    });
    this.defineAction('pim.activate-role', {
      method: 'POST',
      path: '/v1.0/roleManagement/directory/roleAssignmentScheduleRequests',
      description: 'Activate a privileged role',
    });
    this.defineAction('pim.role-definitions', {
      method: 'GET',
      path: '/v1.0/roleManagement/directory/roleDefinitions',
      description: 'List role definitions',
    });
  }

  async authenticate() {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.credentials.clientId,
      client_secret: this.credentials.clientSecret,
      scope: this.credentials.scope,
    });

    const res = await fetch(`${this.baseUrl}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Azure AD Auth fehlgeschlagen: ${JSON.stringify(data)}`);
    }

    this.token = data.access_token;
    return data;
  }

  getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }
}

module.exports = AzureAdConnector;
