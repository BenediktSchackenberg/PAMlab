import type { ApiEndpointGroup } from '../types';

export const apiEndpoints: ApiEndpointGroup[] = [
  {
    api: 'Fudo PAM',
    baseUrl: 'http://localhost:8443',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check', exampleResponse: { status: 'ok' } },
      { method: 'GET', path: '/api/v2/users', description: 'List all PAM users', exampleResponse: [{ id: 1, name: 'admin' }] },
      { method: 'POST', path: '/api/v2/users', description: 'Create PAM user', parameters: [{ name: 'name', type: 'string', required: true, description: 'Username' }, { name: 'email', type: 'string', required: false, description: 'Email address' }], exampleRequest: { name: 'jdoe', email: 'jdoe@corp.local' } },
      { method: 'GET', path: '/api/v2/servers', description: 'List servers', exampleResponse: [{ id: 1, name: 'prod-db-01' }] },
      { method: 'POST', path: '/api/v2/servers', description: 'Create server', parameters: [{ name: 'name', type: 'string', required: true, description: 'Server name' }, { name: 'address', type: 'string', required: true, description: 'Server address' }], exampleRequest: { name: 'prod-db-01', address: '10.0.1.10' } },
      { method: 'GET', path: '/api/v2/sessions', description: 'List sessions', exampleResponse: [{ id: 1, user_id: 1, server_id: 1, status: 'active' }] },
      { method: 'GET', path: '/api/v2/access-requests', description: 'List access requests', exampleResponse: [{ id: 1, status: 'pending' }] },
      { method: 'POST', path: '/api/v2/access-requests', description: 'Create access request', parameters: [{ name: 'user_id', type: 'number', required: true, description: 'User ID' }, { name: 'server_id', type: 'number', required: true, description: 'Server ID' }, { name: 'justification', type: 'string', required: true, description: 'Reason' }], exampleRequest: { user_id: 1, server_id: 1, justification: 'Maintenance' } },
      { method: 'POST', path: '/api/v2/access-requests/{id}/approve', description: 'Approve access request', parameters: [{ name: 'id', type: 'number', required: true, description: 'Request ID' }] },
      { method: 'GET', path: '/api/v2/events/stream', description: 'SSE event stream (Server-Sent Events)' },
    ],
  },
  {
    api: 'Matrix42 ESM',
    baseUrl: 'http://localhost:8444',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check', exampleResponse: { status: 'ok' } },
      { method: 'GET', path: '/api/tickets', description: 'List all tickets', exampleResponse: [{ id: 1, title: 'Onboarding', status: 'open' }] },
      { method: 'POST', path: '/api/tickets', description: 'Create ticket', parameters: [{ name: 'title', type: 'string', required: true, description: 'Ticket title' }, { name: 'description', type: 'string', required: false, description: 'Description' }, { name: 'priority', type: 'string', required: false, description: 'low/medium/high' }, { name: 'category', type: 'string', required: false, description: 'Category' }], exampleRequest: { title: 'Onboarding: Jane', priority: 'medium', category: 'onboarding' } },
      { method: 'GET', path: '/api/tickets/{id}', description: 'Get ticket by ID', parameters: [{ name: 'id', type: 'number', required: true, description: 'Ticket ID' }] },
      { method: 'PUT', path: '/api/tickets/{id}', description: 'Update ticket', parameters: [{ name: 'id', type: 'number', required: true, description: 'Ticket ID' }, { name: 'status', type: 'string', required: false, description: 'Status' }] },
      { method: 'GET', path: '/api/services', description: 'List service catalog', exampleResponse: [{ id: 1, name: 'VPN Access' }] },
    ],
  },
  {
    api: 'Active Directory',
    baseUrl: 'http://localhost:8445',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check', exampleResponse: { status: 'ok' } },
      { method: 'GET', path: '/api/users', description: 'List all users', exampleResponse: [{ username: 'jdoe', firstName: 'John' }] },
      { method: 'POST', path: '/api/users', description: 'Create user', parameters: [{ name: 'username', type: 'string', required: true, description: 'Username' }, { name: 'firstName', type: 'string', required: true, description: 'First name' }, { name: 'lastName', type: 'string', required: true, description: 'Last name' }, { name: 'email', type: 'string', required: false, description: 'Email' }], exampleRequest: { username: 'jdoe', firstName: 'John', lastName: 'Doe', email: 'jdoe@corp.local' } },
      { method: 'GET', path: '/api/groups', description: 'List all groups', exampleResponse: [{ name: 'engineers', members: ['jdoe'] }] },
      { method: 'POST', path: '/api/groups/{name}/members', description: 'Add member to group', parameters: [{ name: 'name', type: 'string', required: true, description: 'Group name' }, { name: 'username', type: 'string', required: true, description: 'Username to add' }] },
      { method: 'DELETE', path: '/api/groups/{name}/members/{username}', description: 'Remove member from group', parameters: [{ name: 'name', type: 'string', required: true, description: 'Group name' }, { name: 'username', type: 'string', required: true, description: 'Username' }] },
      { method: 'POST', path: '/api/users/{username}/disable', description: 'Disable user account', parameters: [{ name: 'username', type: 'string', required: true, description: 'Username' }] },
      { method: 'POST', path: '/api/users/{username}/reset-password', description: 'Reset password', parameters: [{ name: 'username', type: 'string', required: true, description: 'Username' }, { name: 'newPassword', type: 'string', required: true, description: 'New password' }] },
    ],
  },
  {
    api: 'ServiceNow ITSM',
    baseUrl: 'http://localhost:8447',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check', exampleResponse: { status: 'ok', service: 'servicenow-mock-api' } },
      // Authentication
      { method: 'POST', path: '/api/now/auth/token', description: 'Get auth token (Basic Auth or username/password)', parameters: [{ name: 'username', type: 'string', required: true, description: 'Username' }, { name: 'password', type: 'string', required: true, description: 'Password' }], exampleRequest: { username: 'admin', password: 'admin' }, exampleResponse: { result: { token: 'eyJ...', expires_in: 3600 } } },
      // Table API — Incidents
      { method: 'GET', path: '/api/now/table/incident', description: 'List incidents (supports sysparm_query, sysparm_fields, sysparm_limit, sysparm_offset)', exampleResponse: { result: [{ sys_id: 'abc123', number: 'INC0001', short_description: 'DB server down', priority: 1 }] } },
      { method: 'GET', path: '/api/now/table/incident/{sys_id}', description: 'Get incident by sys_id', parameters: [{ name: 'sys_id', type: 'string', required: true, description: 'Record sys_id (32-char hex)' }], exampleResponse: { result: { sys_id: 'abc123', number: 'INC0001', state: 1 } } },
      { method: 'POST', path: '/api/now/table/incident', description: 'Create incident', parameters: [{ name: 'short_description', type: 'string', required: true, description: 'Short description' }, { name: 'impact', type: 'number', required: false, description: 'Impact (1=High, 2=Medium, 3=Low)' }, { name: 'urgency', type: 'number', required: false, description: 'Urgency (1=High, 2=Medium, 3=Low)' }, { name: 'assignment_group', type: 'string', required: false, description: 'Assignment group' }], exampleRequest: { short_description: 'Fudo PAM anomaly detected', description: 'Unusual session pattern from svc-integration', impact: 1, urgency: 1, category: 'Security' } },
      { method: 'PUT', path: '/api/now/table/incident/{sys_id}', description: 'Update incident', parameters: [{ name: 'sys_id', type: 'string', required: true, description: 'Record sys_id' }], exampleRequest: { state: 2, assigned_to: 'b.wilson' } },
      { method: 'DELETE', path: '/api/now/table/incident/{sys_id}', description: 'Delete incident', parameters: [{ name: 'sys_id', type: 'string', required: true, description: 'Record sys_id' }] },
      // Incident convenience
      { method: 'POST', path: '/api/now/incident/resolve/{sys_id}', description: 'Resolve incident', parameters: [{ name: 'sys_id', type: 'string', required: true, description: 'Record sys_id' }, { name: 'close_notes', type: 'string', required: true, description: 'Resolution notes' }], exampleRequest: { close_notes: 'Root cause identified and fixed' } },
      { method: 'POST', path: '/api/now/incident/close/{sys_id}', description: 'Close incident', parameters: [{ name: 'sys_id', type: 'string', required: true, description: 'Record sys_id' }, { name: 'close_code', type: 'string', required: true, description: 'Close code' }], exampleRequest: { close_code: 'Solved (Permanently)', close_notes: 'Confirmed fix deployed' } },
      { method: 'GET', path: '/api/now/incident/stats', description: 'Incident statistics by priority and state', exampleResponse: { result: { total: 6, by_priority: { 1: 1, 2: 2, 3: 2, 4: 1 } } } },
      // Table API — Change Requests
      { method: 'GET', path: '/api/now/table/change_request', description: 'List change requests', exampleResponse: { result: [{ sys_id: 'def456', number: 'CHG0001', type: 'Normal' }] } },
      { method: 'POST', path: '/api/now/table/change_request', description: 'Create change request', parameters: [{ name: 'short_description', type: 'string', required: true, description: 'Short description' }, { name: 'type', type: 'string', required: false, description: 'Normal/Standard/Emergency' }, { name: 'assignment_group', type: 'string', required: false, description: 'Assignment group' }], exampleRequest: { short_description: 'Upgrade Fudo PAM to v6.2', type: 'Normal', description: 'Scheduled upgrade with new features', risk: 'Moderate' } },
      // Change convenience
      { method: 'POST', path: '/api/now/change/approve/{sys_id}', description: 'Approve change request (CAB simulation)', parameters: [{ name: 'sys_id', type: 'string', required: true, description: 'Record sys_id' }], exampleRequest: { approval_notes: 'CAB approved — low risk' } },
      { method: 'POST', path: '/api/now/change/reject/{sys_id}', description: 'Reject change request', parameters: [{ name: 'sys_id', type: 'string', required: true, description: 'Record sys_id' }], exampleRequest: { rejection_reason: 'Insufficient testing evidence' } },
      { method: 'POST', path: '/api/now/change/implement/{sys_id}', description: 'Mark change as implementing', parameters: [{ name: 'sys_id', type: 'string', required: true, description: 'Record sys_id' }] },
      { method: 'GET', path: '/api/now/change/schedule', description: 'Get upcoming change schedule', exampleResponse: { result: [{ number: 'CHG0001', planned_start: '2026-04-01', state: 'Scheduled' }] } },
      // CMDB
      { method: 'GET', path: '/api/now/table/cmdb_ci_server', description: 'List CMDB servers', exampleResponse: { result: [{ sys_id: 'ghi789', name: 'DC01', ip_address: '10.0.1.10' }] } },
      { method: 'GET', path: '/api/now/cmdb/ci/{sys_id}/relations', description: 'Get CI relationships', parameters: [{ name: 'sys_id', type: 'string', required: true, description: 'CI sys_id' }], exampleResponse: { result: { inbound: [], outbound: [{ type: 'Depends on', target: { name: 'DC01' } }] } } },
      { method: 'POST', path: '/api/now/cmdb/ci/{sys_id}/relations', description: 'Create CI relationship', parameters: [{ name: 'sys_id', type: 'string', required: true, description: 'Source CI sys_id' }, { name: 'target_sys_id', type: 'string', required: true, description: 'Target CI sys_id' }, { name: 'type', type: 'string', required: true, description: 'Relationship type' }], exampleRequest: { target_sys_id: 'abc123', type: 'Depends on::Used by' } },
      { method: 'GET', path: '/api/now/cmdb/topology', description: 'Get CMDB topology map', exampleResponse: { result: { nodes: [], edges: [] } } },
      // Service Catalog
      { method: 'GET', path: '/api/now/catalog/items', description: 'List service catalog items', exampleResponse: { result: [{ sys_id: 'cat001', name: 'Privileged Access Request' }] } },
      { method: 'POST', path: '/api/now/catalog/items/{item_id}/order', description: 'Order catalog item', parameters: [{ name: 'item_id', type: 'string', required: true, description: 'Catalog item sys_id' }, { name: 'variables', type: 'object', required: false, description: 'Request variables' }], exampleRequest: { requested_for: 'j.doe', variables: { server: 'DB-PROD', access_level: 'admin', justification: 'Database migration' } } },
      // Users & Groups
      { method: 'GET', path: '/api/now/table/sys_user', description: 'List ServiceNow users', exampleResponse: { result: [{ sys_id: 'usr001', user_name: 'admin', name: 'Administrator' }] } },
      { method: 'GET', path: '/api/now/table/sys_user_group', description: 'List user groups', exampleResponse: { result: [{ sys_id: 'grp001', name: 'IT Operations' }] } },
      // Events/Webhooks
      { method: 'POST', path: '/api/now/events/register', description: 'Register webhook for record changes', parameters: [{ name: 'table', type: 'string', required: true, description: 'Table to watch' }, { name: 'url', type: 'string', required: true, description: 'Callback URL' }, { name: 'events', type: 'string', required: false, description: 'insert,update,delete' }], exampleRequest: { table: 'incident', url: 'http://fudo-mock:8443/api/v2/events/webhook', events: 'insert,update' } },
      { method: 'GET', path: '/api/now/events/list', description: 'List registered webhooks', exampleResponse: { result: [] } },
    ],
  },
];
