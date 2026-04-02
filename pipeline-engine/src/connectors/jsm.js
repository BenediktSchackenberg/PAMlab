const BaseConnector = require('./BaseConnector');

class JsmConnector extends BaseConnector {
  constructor(baseUrl = 'http://localhost:8448') {
    super('jsm', baseUrl);
    this.apiToken = 'pamlab-dev-token';
    this._defineActions();
  }

  _defineActions() {
    this.defineAction('auth.session.create', {
      method: 'POST',
      path: '/rest/auth/1/session',
      description: 'Create a JSM session',
    });
    this.defineAction('auth.session.delete', {
      method: 'DELETE',
      path: '/rest/auth/1/session',
      description: 'Delete the current JSM session',
    });
    this.defineAction('auth.session.current', {
      method: 'GET',
      path: '/rest/auth/1/session/current',
      description: 'Inspect the current JSM session',
    });

    this.defineAction('issues.get', {
      method: 'GET',
      path: '/rest/api/2/issue/{issueIdOrKey}',
      description: 'Get an issue',
    });
    this.defineAction('issues.create', {
      method: 'POST',
      path: '/rest/api/2/issue',
      description: 'Create an issue',
    });
    this.defineAction('issues.update', {
      method: 'PUT',
      path: '/rest/api/2/issue/{issueIdOrKey}',
      description: 'Update an issue',
    });
    this.defineAction('issues.delete', {
      method: 'DELETE',
      path: '/rest/api/2/issue/{issueIdOrKey}',
      description: 'Delete an issue',
    });
    this.defineAction('issues.comments.list', {
      method: 'GET',
      path: '/rest/api/2/issue/{issueIdOrKey}/comment',
      description: 'List comments for an issue',
    });
    this.defineAction('issues.comments.add', {
      method: 'POST',
      path: '/rest/api/2/issue/{issueIdOrKey}/comment',
      description: 'Add a comment to an issue',
    });
    this.defineAction('issues.worklogs.list', {
      method: 'GET',
      path: '/rest/api/2/issue/{issueIdOrKey}/worklog',
      description: 'List worklogs for an issue',
    });
    this.defineAction('issues.worklogs.add', {
      method: 'POST',
      path: '/rest/api/2/issue/{issueIdOrKey}/worklog',
      description: 'Add a worklog to an issue',
    });

    this.defineAction('transitions.list', {
      method: 'GET',
      path: '/rest/api/2/issue/{issueIdOrKey}/transitions',
      description: 'List available transitions for an issue',
    });
    this.defineAction('transitions.execute', {
      method: 'POST',
      path: '/rest/api/2/issue/{issueIdOrKey}/transitions',
      description: 'Execute a transition for an issue',
    });

    this.defineAction('search.query', {
      method: 'POST',
      path: '/rest/api/2/search',
      description: 'Search issues via JQL',
    });

    this.defineAction('approvals.list', {
      method: 'GET',
      path: '/rest/servicedeskapi/request/{requestId}/approval',
      description: 'List approvals for a request',
    });
    this.defineAction('approvals.create', {
      method: 'POST',
      path: '/rest/servicedeskapi/request/{requestId}/approval',
      description: 'Create an approval for a request',
    });
    this.defineAction('approvals.approve', {
      method: 'POST',
      path: '/rest/servicedeskapi/request/{requestId}/approval/{approvalId}/approve',
      description: 'Approve a request',
    });
    this.defineAction('approvals.decline', {
      method: 'POST',
      path: '/rest/servicedeskapi/request/{requestId}/approval/{approvalId}/decline',
      description: 'Decline a request',
    });

    this.defineAction('assets.schemas.list', {
      method: 'GET',
      path: '/rest/assets/1.0/objectschema/list',
      description: 'List JSM asset schemas',
    });
    this.defineAction('assets.objecttypes.list', {
      method: 'GET',
      path: '/rest/assets/1.0/objecttype/{schemaId}',
      description: 'List asset object types for a schema',
    });
    this.defineAction('assets.objects.get', {
      method: 'GET',
      path: '/rest/assets/1.0/object/{objectId}',
      description: 'Get an asset object',
    });
    this.defineAction('assets.objects.create', {
      method: 'POST',
      path: '/rest/assets/1.0/object/create',
      description: 'Create an asset object',
    });
    this.defineAction('assets.objects.update', {
      method: 'PUT',
      path: '/rest/assets/1.0/object/{objectId}',
      description: 'Update an asset object',
    });
    this.defineAction('assets.objects.search', {
      method: 'GET',
      path: '/rest/assets/1.0/object/aql',
      description: 'Search asset objects with AQL',
    });
    this.defineAction('assets.objects.list-by-type', {
      method: 'GET',
      path: '/rest/assets/1.0/objecttype/{typeId}/objects',
      description: 'List asset objects for an object type',
    });

    this.defineAction('customers.list', {
      method: 'GET',
      path: '/rest/servicedeskapi/customer',
      description: 'List customers',
    });
    this.defineAction('customers.create', {
      method: 'POST',
      path: '/rest/servicedeskapi/customer',
      description: 'Create a customer',
    });
    this.defineAction('organizations.list', {
      method: 'GET',
      path: '/rest/servicedeskapi/organization',
      description: 'List organizations',
    });
    this.defineAction('organizations.create', {
      method: 'POST',
      path: '/rest/servicedeskapi/organization',
      description: 'Create an organization',
    });
    this.defineAction('organizations.members', {
      method: 'GET',
      path: '/rest/servicedeskapi/organization/{orgId}/user',
      description: 'List organization members',
    });

    this.defineAction('queues.list', {
      method: 'GET',
      path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/queue',
      description: 'List queues for a service desk',
    });
    this.defineAction('queues.issues', {
      method: 'GET',
      path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/queue/{queueId}/issue',
      description: 'List issues for a queue',
    });
    this.defineAction('sla.get', {
      method: 'GET',
      path: '/rest/servicedeskapi/request/{requestId}/sla',
      description: 'Get SLA details for a request',
    });

    this.defineAction('webhooks.create', {
      method: 'POST',
      path: '/rest/api/2/webhook',
      description: 'Create a webhook',
    });
    this.defineAction('webhooks.list', {
      method: 'GET',
      path: '/rest/api/2/webhook',
      description: 'List webhooks',
    });
    this.defineAction('webhooks.delete', {
      method: 'DELETE',
      path: '/rest/api/2/webhook/{webhookId}',
      description: 'Delete a webhook',
    });
  }

  async authenticate() {
    this.token = this.apiToken;
    return { token: this.token, mode: 'bearer' };
  }

  getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }
}

module.exports = JsmConnector;
