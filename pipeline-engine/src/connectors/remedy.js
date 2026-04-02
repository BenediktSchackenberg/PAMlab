const BaseConnector = require('./BaseConnector');

class RemedyConnector extends BaseConnector {
  constructor(baseUrl = 'http://localhost:8449') {
    super('remedy', baseUrl);
    this.apiToken = 'pamlab-dev-token';
    this._defineActions();
  }

  _defineActions() {
    this.defineAction('auth.login', {
      method: 'POST',
      path: '/api/jwt/login',
      description: 'Create a Remedy JWT session',
    });
    this.defineAction('auth.logout', {
      method: 'DELETE',
      path: '/api/jwt/logout',
      description: 'Delete the current Remedy JWT session',
    });

    this.defineAction('entry.list', {
      method: 'GET',
      path: '/api/arsys/v1/entry/{formName}',
      description: 'List entries from a Remedy form',
    });
    this.defineAction('entry.get', {
      method: 'GET',
      path: '/api/arsys/v1/entry/{formName}/{entryId}',
      description: 'Get a single Remedy form entry',
    });
    this.defineAction('entry.create', {
      method: 'POST',
      path: '/api/arsys/v1/entry/{formName}',
      description: 'Create a Remedy form entry',
    });
    this.defineAction('entry.update', {
      method: 'PUT',
      path: '/api/arsys/v1/entry/{formName}/{entryId}',
      description: 'Update a Remedy form entry',
    });
    this.defineAction('entry.delete', {
      method: 'DELETE',
      path: '/api/arsys/v1/entry/{formName}/{entryId}',
      description: 'Delete a Remedy form entry',
    });

    this.defineAction('incidents.list', {
      method: 'GET',
      path: '/api/arsys/v1/incidents',
      description: 'List incidents',
    });
    this.defineAction('incidents.stats', {
      method: 'GET',
      path: '/api/arsys/v1/incidents/stats',
      description: 'Fetch incident statistics',
    });
    this.defineAction('incidents.get', {
      method: 'GET',
      path: '/api/arsys/v1/incidents/{id}',
      description: 'Get an incident',
    });
    this.defineAction('incidents.assign', {
      method: 'POST',
      path: '/api/arsys/v1/incidents/{id}/assign',
      description: 'Assign an incident',
    });
    this.defineAction('incidents.resolve', {
      method: 'POST',
      path: '/api/arsys/v1/incidents/{id}/resolve',
      description: 'Resolve an incident',
    });
    this.defineAction('incidents.reopen', {
      method: 'POST',
      path: '/api/arsys/v1/incidents/{id}/reopen',
      description: 'Reopen an incident',
    });
    this.defineAction('incidents.worknotes', {
      method: 'POST',
      path: '/api/arsys/v1/incidents/{id}/worknotes',
      description: 'Add work notes to an incident',
    });

    this.defineAction('changes.list', {
      method: 'GET',
      path: '/api/arsys/v1/changes',
      description: 'List changes',
    });
    this.defineAction('changes.get', {
      method: 'GET',
      path: '/api/arsys/v1/changes/{id}',
      description: 'Get a change',
    });
    this.defineAction('changes.schedule', {
      method: 'POST',
      path: '/api/arsys/v1/changes/{id}/schedule',
      description: 'Schedule a change',
    });
    this.defineAction('changes.approve', {
      method: 'POST',
      path: '/api/arsys/v1/changes/{id}/approve',
      description: 'Approve a change',
    });
    this.defineAction('changes.reject', {
      method: 'POST',
      path: '/api/arsys/v1/changes/{id}/reject',
      description: 'Reject a change',
    });
    this.defineAction('changes.implement', {
      method: 'POST',
      path: '/api/arsys/v1/changes/{id}/implement',
      description: 'Start implementing a change',
    });
    this.defineAction('changes.complete', {
      method: 'POST',
      path: '/api/arsys/v1/changes/{id}/complete',
      description: 'Complete a change',
    });
    this.defineAction('changes.tasks', {
      method: 'GET',
      path: '/api/arsys/v1/changes/{id}/tasks',
      description: 'List tasks for a change',
    });

    this.defineAction('assets.list', {
      method: 'GET',
      path: '/api/arsys/v1/assets',
      description: 'List assets',
    });
    this.defineAction('assets.get', {
      method: 'GET',
      path: '/api/arsys/v1/assets/{id}',
      description: 'Get an asset',
    });
    this.defineAction('assets.topology', {
      method: 'GET',
      path: '/api/arsys/v1/assets/{id}/topology',
      description: 'Fetch the topology for an asset',
    });

    this.defineAction('people.list', {
      method: 'GET',
      path: '/api/arsys/v1/people',
      description: 'List people',
    });
    this.defineAction('people.groups', {
      method: 'GET',
      path: '/api/arsys/v1/people/groups',
      description: 'List support groups',
    });
    this.defineAction('people.group-members', {
      method: 'GET',
      path: '/api/arsys/v1/people/groups/{name}/members',
      description: 'List members of a support group',
    });
    this.defineAction('people.get', {
      method: 'GET',
      path: '/api/arsys/v1/people/{id}',
      description: 'Get a person',
    });

    this.defineAction('workorders.list', {
      method: 'GET',
      path: '/api/arsys/v1/workorders',
      description: 'List work orders',
    });
    this.defineAction('workorders.get', {
      method: 'GET',
      path: '/api/arsys/v1/workorders/{id}',
      description: 'Get a work order',
    });
    this.defineAction('workorders.assign', {
      method: 'POST',
      path: '/api/arsys/v1/workorders/{id}/assign',
      description: 'Assign a work order',
    });
    this.defineAction('workorders.complete', {
      method: 'POST',
      path: '/api/arsys/v1/workorders/{id}/complete',
      description: 'Complete a work order',
    });

    this.defineAction('sla.list', {
      method: 'GET',
      path: '/api/arsys/v1/sla',
      description: 'List SLA definitions',
    });
    this.defineAction('sla.status', {
      method: 'GET',
      path: '/api/arsys/v1/sla/status/{incidentId}',
      description: 'Get SLA status for an incident',
    });

    this.defineAction('webhooks.create', {
      method: 'POST',
      path: '/api/arsys/v1/webhooks',
      description: 'Create a webhook',
    });
    this.defineAction('webhooks.list', {
      method: 'GET',
      path: '/api/arsys/v1/webhooks',
      description: 'List webhooks',
    });
    this.defineAction('webhooks.delete', {
      method: 'DELETE',
      path: '/api/arsys/v1/webhooks/{id}',
      description: 'Delete a webhook',
    });
  }

  async authenticate() {
    this.token = this.apiToken;
    return { token: this.token, mode: 'ar-jwt' };
  }

  getAuthHeaders() {
    return this.token ? { Authorization: `AR-JWT ${this.token}` } : {};
  }
}

module.exports = RemedyConnector;
