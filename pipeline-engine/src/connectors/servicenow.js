const BaseConnector = require('./BaseConnector');

class ServiceNowConnector extends BaseConnector {
  constructor(baseUrl = 'http://localhost:8447') {
    super('servicenow', baseUrl);
    this.credentials = { username: 'admin', password: 'admin' };
    this._defineActions();
  }

  _defineActions() {
    this.defineAction('auth.token', {
      method: 'POST',
      path: '/api/now/auth/token',
      description: 'Generate a ServiceNow API token',
    });

    this.defineAction('table.list', {
      method: 'GET',
      path: '/api/now/table/{tableName}',
      description: 'List records from any ServiceNow table',
    });
    this.defineAction('table.get', {
      method: 'GET',
      path: '/api/now/table/{tableName}/{sys_id}',
      description: 'Get a single ServiceNow table record',
    });
    this.defineAction('table.create', {
      method: 'POST',
      path: '/api/now/table/{tableName}',
      description: 'Create a record in any ServiceNow table',
    });
    this.defineAction('table.update', {
      method: 'PUT',
      path: '/api/now/table/{tableName}/{sys_id}',
      description: 'Replace a ServiceNow table record',
    });
    this.defineAction('table.patch', {
      method: 'PATCH',
      path: '/api/now/table/{tableName}/{sys_id}',
      description: 'Partially update a ServiceNow table record',
    });
    this.defineAction('table.delete', {
      method: 'DELETE',
      path: '/api/now/table/{tableName}/{sys_id}',
      description: 'Delete a ServiceNow table record',
    });

    this.defineAction('incidents.list', {
      method: 'GET',
      path: '/api/now/table/incident',
      description: 'List incidents',
    });
    this.defineAction('incidents.get', {
      method: 'GET',
      path: '/api/now/table/incident/{sys_id}',
      description: 'Get an incident',
    });
    this.defineAction('incidents.create', {
      method: 'POST',
      path: '/api/now/table/incident',
      description: 'Create an incident',
    });
    this.defineAction('incidents.update', {
      method: 'PATCH',
      path: '/api/now/table/incident/{sys_id}',
      description: 'Update an incident',
    });
    this.defineAction('incidents.resolve', {
      method: 'POST',
      path: '/api/now/incident/resolve/{sys_id}',
      description: 'Resolve an incident',
    });
    this.defineAction('incidents.close', {
      method: 'POST',
      path: '/api/now/incident/close/{sys_id}',
      description: 'Close an incident',
    });
    this.defineAction('incidents.stats', {
      method: 'GET',
      path: '/api/now/incident/stats',
      description: 'Fetch incident statistics',
    });

    this.defineAction('changes.list', {
      method: 'GET',
      path: '/api/now/table/change_request',
      description: 'List change requests',
    });
    this.defineAction('changes.get', {
      method: 'GET',
      path: '/api/now/table/change_request/{sys_id}',
      description: 'Get a change request',
    });
    this.defineAction('changes.create', {
      method: 'POST',
      path: '/api/now/table/change_request',
      description: 'Create a change request',
    });
    this.defineAction('changes.update', {
      method: 'PATCH',
      path: '/api/now/table/change_request/{sys_id}',
      description: 'Update a change request',
    });
    this.defineAction('changes.approve', {
      method: 'POST',
      path: '/api/now/change/approve/{sys_id}',
      description: 'Approve a change request',
    });
    this.defineAction('changes.reject', {
      method: 'POST',
      path: '/api/now/change/reject/{sys_id}',
      description: 'Reject a change request',
    });
    this.defineAction('changes.implement', {
      method: 'POST',
      path: '/api/now/change/implement/{sys_id}',
      description: 'Move a change into implementation',
    });
    this.defineAction('changes.schedule', {
      method: 'GET',
      path: '/api/now/change/schedule',
      description: 'List scheduled changes',
    });

    this.defineAction('cmdb.servers.list', {
      method: 'GET',
      path: '/api/now/table/cmdb_ci_server',
      description: 'List CMDB server CIs',
    });
    this.defineAction('cmdb.servers.get', {
      method: 'GET',
      path: '/api/now/table/cmdb_ci_server/{sys_id}',
      description: 'Get a CMDB server CI',
    });
    this.defineAction('cmdb.relations.list', {
      method: 'GET',
      path: '/api/now/cmdb/ci/{sys_id}/relations',
      description: 'List relationships for a CI',
    });
    this.defineAction('cmdb.relations.create', {
      method: 'POST',
      path: '/api/now/cmdb/ci/{sys_id}/relations',
      description: 'Create a relationship for a CI',
    });
    this.defineAction('cmdb.topology', {
      method: 'GET',
      path: '/api/now/cmdb/topology',
      description: 'Fetch the CMDB topology map',
    });

    this.defineAction('catalog.items.list', {
      method: 'GET',
      path: '/api/now/catalog/items',
      description: 'List catalog items',
    });
    this.defineAction('catalog.items.order', {
      method: 'POST',
      path: '/api/now/catalog/items/{item_id}/order',
      description: 'Order a catalog item',
    });
    this.defineAction('catalog.requests.status', {
      method: 'GET',
      path: '/api/now/catalog/requests/{req_id}/status',
      description: 'Get catalog request status',
    });

    this.defineAction('events.register', {
      method: 'POST',
      path: '/api/now/events/register',
      description: 'Register a ServiceNow event webhook',
    });
    this.defineAction('events.list', {
      method: 'GET',
      path: '/api/now/events/list',
      description: 'List registered event webhooks',
    });
    this.defineAction('events.delete', {
      method: 'DELETE',
      path: '/api/now/events/{id}',
      description: 'Delete an event webhook',
    });
  }

  async authenticate() {
    const result = await this.execute('auth.token', this.credentials);
    const token = result && result.result && result.result.token;
    if (!token) {
      throw new Error('ServiceNow Auth fehlgeschlagen: Token fehlt in der Antwort');
    }
    this.token = token;
    return result;
  }

  getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }
}

module.exports = ServiceNowConnector;
