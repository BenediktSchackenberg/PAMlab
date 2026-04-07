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
    api: 'Microsoft Entra ID',
    baseUrl: 'http://localhost:8452',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check', exampleResponse: { status: 'ok', service: 'azure-ad-mock-api' } },
      { method: 'POST', path: '/oauth2/v2.0/token', description: 'OAuth token endpoint for client credentials or password grant', parameters: [{ name: 'grant_type', type: 'string', required: true, description: 'client_credentials or password' }, { name: 'client_id', type: 'string', required: false, description: 'Application client ID' }, { name: 'client_secret', type: 'string', required: false, description: 'Application client secret' }, { name: 'scope', type: 'string', required: false, description: 'Requested Graph scope' }], exampleRequest: { grant_type: 'client_credentials', client_id: '11111111-2222-3333-4444-555555555551', client_secret: 'PAMlab-Secret-1!', scope: 'https://graph.microsoft.com/.default' }, exampleResponse: { token_type: 'Bearer', expires_in: 3600, access_token: 'entra-...' } },
      { method: 'GET', path: '/v1.0/users', description: 'List Entra directory users', exampleResponse: { value: [{ id: '20000000-0000-0000-0000-000000000004', userPrincipalName: 'b.wilson@corp.local', displayName: 'Bob Wilson' }] } },
      { method: 'POST', path: '/v1.0/users', description: 'Create Entra user', parameters: [{ name: 'userPrincipalName', type: 'string', required: true, description: 'Cloud user principal name' }, { name: 'displayName', type: 'string', required: true, description: 'Display name' }, { name: 'department', type: 'string', required: false, description: 'Department' }, { name: 'jobTitle', type: 'string', required: false, description: 'Job title' }], exampleRequest: { userPrincipalName: 'cloud.ops@corp.local', displayName: 'Cloud Operations', department: 'Cloud Platform', jobTitle: 'Cloud Engineer' } },
      { method: 'GET', path: '/v1.0/users/{id}/memberOf', description: 'List group memberships for a user', parameters: [{ name: 'id', type: 'string', required: true, description: 'Object ID or UPN' }], exampleResponse: { value: [{ id: '30000000-0000-0000-0000-000000000001', displayName: 'Cloud-Admins' }] } },
      { method: 'POST', path: '/v1.0/users/{id}/revokeSignInSessions', description: 'Revoke active sign-in sessions', parameters: [{ name: 'id', type: 'string', required: true, description: 'Object ID or UPN' }], exampleResponse: { value: true } },
      { method: 'GET', path: '/v1.0/groups', description: 'List Entra groups', exampleResponse: { value: [{ id: '30000000-0000-0000-0000-000000000003', displayName: 'PIM-Eligible' }] } },
      { method: 'POST', path: '/v1.0/groups', description: 'Create Entra group', parameters: [{ name: 'displayName', type: 'string', required: true, description: 'Group display name' }, { name: 'description', type: 'string', required: false, description: 'Group description' }], exampleRequest: { displayName: 'Emergency-Responders', description: 'Temporary response team' } },
      { method: 'GET', path: '/v1.0/groups/{id}/members', description: 'List group members', parameters: [{ name: 'id', type: 'string', required: true, description: 'Group ID or display name' }], exampleResponse: { value: [{ id: '20000000-0000-0000-0000-000000000004', displayName: 'Bob Wilson' }] } },
      { method: 'POST', path: '/v1.0/groups/{id}/members', description: 'Add member to group', parameters: [{ name: 'id', type: 'string', required: true, description: 'Group ID or display name' }, { name: 'memberId', type: 'string', required: true, description: 'Directory object ID' }], exampleRequest: { memberId: '20000000-0000-0000-0000-000000000004' } },
      { method: 'GET', path: '/v1.0/servicePrincipals', description: 'List app registrations / service principals', exampleResponse: { value: [{ id: '40000000-0000-0000-0000-000000000001', displayName: 'svc-pam-integration', appId: '11111111-2222-3333-4444-555555555551' }] } },
      { method: 'GET', path: '/v1.0/identity/conditionalAccess/policies', description: 'List Conditional Access policies', exampleResponse: { value: [{ id: '50000000-0000-0000-0000-000000000001', displayName: 'Require MFA for admins', state: 'enabled' }] } },
      { method: 'POST', path: '/v1.0/identity/conditionalAccess/policies', description: 'Create Conditional Access policy', parameters: [{ name: 'displayName', type: 'string', required: true, description: 'Policy name' }, { name: 'state', type: 'string', required: false, description: 'enabled, disabled, report-only' }], exampleRequest: { displayName: 'Require compliant device for admins', state: 'enabled', grantControls: { operator: 'OR', builtInControls: ['compliantDevice'] } } },
      { method: 'GET', path: '/v1.0/roleManagement/directory/roleDefinitions', description: 'List PIM role definitions', exampleResponse: { value: [{ id: 'e8611ab8-c189-46e8-94e1-60213ab1f814', displayName: 'Privileged Role Administrator' }] } },
      { method: 'GET', path: '/v1.0/roleManagement/directory/roleEligibilityScheduleRequests', description: 'List PIM eligibilities', exampleResponse: { value: [{ principalDisplayName: 'Bob Wilson', roleDefinitionDisplayName: 'Privileged Role Administrator', status: 'Provisioned' }] } },
      { method: 'POST', path: '/v1.0/roleManagement/directory/roleAssignmentScheduleRequests', description: 'Activate PIM role (JIT)', parameters: [{ name: 'principalId', type: 'string', required: true, description: 'Eligible user object ID' }, { name: 'roleDefinitionId', type: 'string', required: true, description: 'Role definition ID' }, { name: 'justification', type: 'string', required: false, description: 'Activation reason' }], exampleRequest: { action: 'selfActivate', principalId: '20000000-0000-0000-0000-000000000004', roleDefinitionId: 'e8611ab8-c189-46e8-94e1-60213ab1f814', justification: 'Emergency admin access for PAM maintenance' } },
      { method: 'GET', path: '/v1.0/me', description: 'Get current user or application identity', exampleResponse: { id: '40000000-0000-0000-0000-000000000001', displayName: 'svc-pam-integration', accountType: 'servicePrincipal' } },
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
  {
    api: 'Jira Service Management',
    baseUrl: 'http://localhost:8448',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check', exampleResponse: { status: 'ok', service: 'jsm-mock-api' } },
      // Authentication
      { method: 'POST', path: '/rest/auth/1/session', description: 'Login (returns JSESSIONID cookie)', parameters: [{ name: 'username', type: 'string', required: true, description: 'Username' }, { name: 'password', type: 'string', required: true, description: 'Password' }], exampleRequest: { username: 'admin', password: 'admin' }, exampleResponse: { session: { name: 'JSESSIONID', value: '...' } } },
      { method: 'DELETE', path: '/rest/auth/1/session', description: 'Logout (invalidate session)' },
      { method: 'GET', path: '/rest/auth/1/session/current', description: 'Get current session info' },
      // Issues (Jira REST API v2)
      { method: 'GET', path: '/rest/api/2/issue/{issueIdOrKey}', description: 'Get issue by ID or key (e.g. ITSM-1)', parameters: [{ name: 'issueIdOrKey', type: 'string', required: true, description: 'Issue ID or key' }], exampleResponse: { key: 'ITSM-1', fields: { summary: 'Database server unreachable', priority: { name: 'Blocker' } } } },
      { method: 'POST', path: '/rest/api/2/issue', description: 'Create issue', parameters: [{ name: 'fields.project.key', type: 'string', required: true, description: 'Project key (ITSM or SEC)' }, { name: 'fields.issuetype.name', type: 'string', required: true, description: 'Issue type (Incident, Service Request, Change, Problem, Task)' }, { name: 'fields.summary', type: 'string', required: true, description: 'Summary' }, { name: 'fields.priority.name', type: 'string', required: false, description: 'Priority (Blocker, Critical, Major, Minor, Trivial)' }], exampleRequest: { fields: { project: { key: 'ITSM' }, issuetype: { name: 'Incident' }, summary: 'Fudo PAM anomaly detected', priority: { name: 'Critical' } } } },
      { method: 'PUT', path: '/rest/api/2/issue/{issueIdOrKey}', description: 'Update issue', parameters: [{ name: 'issueIdOrKey', type: 'string', required: true, description: 'Issue key' }], exampleRequest: { fields: { assignee: { name: 'b.wilson' } } } },
      { method: 'DELETE', path: '/rest/api/2/issue/{issueIdOrKey}', description: 'Delete issue', parameters: [{ name: 'issueIdOrKey', type: 'string', required: true, description: 'Issue key' }] },
      // Comments
      { method: 'GET', path: '/rest/api/2/issue/{issueIdOrKey}/comment', description: 'List issue comments', parameters: [{ name: 'issueIdOrKey', type: 'string', required: true, description: 'Issue key' }] },
      { method: 'POST', path: '/rest/api/2/issue/{issueIdOrKey}/comment', description: 'Add comment to issue', parameters: [{ name: 'issueIdOrKey', type: 'string', required: true, description: 'Issue key' }, { name: 'body', type: 'string', required: true, description: 'Comment text' }], exampleRequest: { body: 'Investigating root cause' } },
      // Transitions (Workflow)
      { method: 'GET', path: '/rest/api/2/issue/{issueIdOrKey}/transitions', description: 'Get available transitions for issue', parameters: [{ name: 'issueIdOrKey', type: 'string', required: true, description: 'Issue key' }], exampleResponse: { transitions: [{ id: '2', name: 'In Progress' }] } },
      { method: 'POST', path: '/rest/api/2/issue/{issueIdOrKey}/transitions', description: 'Execute transition (change status)', parameters: [{ name: 'issueIdOrKey', type: 'string', required: true, description: 'Issue key' }, { name: 'transition.id', type: 'string', required: true, description: 'Transition ID' }], exampleRequest: { transition: { id: '2' } } },
      // Search (JQL)
      { method: 'POST', path: '/rest/api/2/search', description: 'Search issues with JQL (supports project, issuetype, priority, status, assignee + AND/OR)', parameters: [{ name: 'jql', type: 'string', required: true, description: 'JQL query string' }, { name: 'maxResults', type: 'number', required: false, description: 'Max results (default 50)' }, { name: 'startAt', type: 'number', required: false, description: 'Start index' }], exampleRequest: { jql: 'project = ITSM AND issuetype = Incident AND priority = Blocker ORDER BY created DESC', maxResults: 10 } },
      // Service Desk — Approvals
      { method: 'GET', path: '/rest/servicedeskapi/request/{requestId}/approval', description: 'List approvals for service request', parameters: [{ name: 'requestId', type: 'string', required: true, description: 'Request issue key' }] },
      { method: 'POST', path: '/rest/servicedeskapi/request/{requestId}/approval', description: 'Create approval request', parameters: [{ name: 'requestId', type: 'string', required: true, description: 'Request issue key' }, { name: 'approvers', type: 'string[]', required: true, description: 'List of approver usernames' }], exampleRequest: { approvers: ['c.jones', 'b.wilson'], required_count: 1 } },
      { method: 'POST', path: '/rest/servicedeskapi/request/{requestId}/approval/{approvalId}/approve', description: 'Approve request', parameters: [{ name: 'requestId', type: 'string', required: true, description: 'Request issue key' }, { name: 'approvalId', type: 'string', required: true, description: 'Approval ID' }] },
      { method: 'POST', path: '/rest/servicedeskapi/request/{requestId}/approval/{approvalId}/decline', description: 'Decline request', parameters: [{ name: 'requestId', type: 'string', required: true, description: 'Request issue key' }, { name: 'approvalId', type: 'string', required: true, description: 'Approval ID' }] },
      // Assets
      { method: 'GET', path: '/rest/assets/1.0/objectschema/list', description: 'List asset schemas', exampleResponse: { objectSchemas: [{ id: 1, name: 'PAMlab Infrastructure' }] } },
      { method: 'GET', path: '/rest/assets/1.0/objecttype/{schemaId}', description: 'List object types in schema', parameters: [{ name: 'schemaId', type: 'number', required: true, description: 'Schema ID' }] },
      { method: 'GET', path: '/rest/assets/1.0/object/{objectId}', description: 'Get asset object by ID', parameters: [{ name: 'objectId', type: 'number', required: true, description: 'Object ID' }] },
      { method: 'GET', path: '/rest/assets/1.0/object/aql', description: 'Search assets with AQL (attribute=value)', parameters: [{ name: 'qlQuery', type: 'string', required: true, description: 'AQL query (e.g. Name="DC01")' }], exampleRequest: { qlQuery: 'objectType = Server AND Name = "DC01"' } },
      // Customers & Organizations
      { method: 'GET', path: '/rest/servicedeskapi/customer', description: 'List customers' },
      { method: 'POST', path: '/rest/servicedeskapi/customer', description: 'Create customer', parameters: [{ name: 'displayName', type: 'string', required: true, description: 'Display name' }, { name: 'email', type: 'string', required: true, description: 'Email' }] },
      { method: 'GET', path: '/rest/servicedeskapi/organization', description: 'List organizations', exampleResponse: { values: [{ id: 1, name: 'PAMlab Corp' }] } },
      // Queues & SLA
      { method: 'GET', path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/queue', description: 'List queues', parameters: [{ name: 'serviceDeskId', type: 'number', required: true, description: 'Service desk ID' }], exampleResponse: { values: [{ id: 1, name: 'All Open' }] } },
      { method: 'GET', path: '/rest/servicedeskapi/servicedesk/{serviceDeskId}/queue/{queueId}/issue', description: 'Get issues in queue', parameters: [{ name: 'serviceDeskId', type: 'number', required: true, description: 'Service desk ID' }, { name: 'queueId', type: 'number', required: true, description: 'Queue ID' }] },
      { method: 'GET', path: '/rest/servicedeskapi/request/{requestId}/sla', description: 'Get SLA info for request (time remaining, breach status)', parameters: [{ name: 'requestId', type: 'string', required: true, description: 'Request issue key' }], exampleResponse: { values: [{ name: 'Time to first response', completedCycles: [], ongoingCycle: { remainingTime: { millis: 3600000 }, breached: false } }] } },
      // Webhooks
      { method: 'POST', path: '/rest/api/2/webhook', description: 'Register webhook', parameters: [{ name: 'url', type: 'string', required: true, description: 'Callback URL' }, { name: 'events', type: 'string[]', required: true, description: 'Events to subscribe to' }], exampleRequest: { url: 'http://fudo-mock:8443/api/v2/events/webhook', events: ['jira:issue_created', 'jira:issue_updated'] } },
      { method: 'GET', path: '/rest/api/2/webhook', description: 'List registered webhooks' },
      { method: 'DELETE', path: '/rest/api/2/webhook/{webhookId}', description: 'Delete webhook', parameters: [{ name: 'webhookId', type: 'string', required: true, description: 'Webhook ID' }] },
    ],
  },
  {
    api: 'BMC Remedy / Helix',
    baseUrl: 'http://localhost:8449',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check', exampleResponse: { status: 'healthy', service: 'remedy-mock-api' } },
      // Authentication (AR-JWT)
      { method: 'POST', path: '/api/jwt/login', description: 'Login — returns AR-JWT token (plain text)', parameters: [{ name: 'username', type: 'string', required: true, description: 'Username' }, { name: 'password', type: 'string', required: true, description: 'Password' }], exampleRequest: { username: 'admin', password: 'admin' }, exampleResponse: 'AR-JWT eyJhbGciOiJIUzI1NiIs...' },
      { method: 'DELETE', path: '/api/jwt/logout', description: 'Logout — invalidate AR-JWT token' },
      // Generic Entry API (forms)
      { method: 'GET', path: '/api/arsys/v1/entry/{formName}', description: 'List entries for any form (supports q=, fields=, offset, limit, sort)', parameters: [{ name: 'formName', type: 'string', required: true, description: 'Form name (e.g. HPD:Help Desk, CHG:Infrastructure Change)' }, { name: 'q', type: 'string', required: false, description: 'Qualification string (e.g. \'Status\'="New")' }, { name: 'fields', type: 'string', required: false, description: 'Comma-separated field list' }, { name: 'limit', type: 'number', required: false, description: 'Max results' }, { name: 'offset', type: 'number', required: false, description: 'Start offset' }], exampleResponse: { entries: [{ values: { 'Request ID': 'INC000000001' }, _links: { self: [{ href: '...' }] } }] } },
      { method: 'GET', path: '/api/arsys/v1/entry/{formName}/{entryId}', description: 'Get single entry by ID', parameters: [{ name: 'formName', type: 'string', required: true, description: 'Form name' }, { name: 'entryId', type: 'string', required: true, description: 'Entry/Request ID' }] },
      { method: 'POST', path: '/api/arsys/v1/entry/{formName}', description: 'Create entry (returns Location header)', parameters: [{ name: 'formName', type: 'string', required: true, description: 'Form name' }], exampleRequest: { values: { Description: 'New incident from PAM', Impact: '1-Extensive/Widespread', Urgency: '1-Critical' } } },
      { method: 'PUT', path: '/api/arsys/v1/entry/{formName}/{entryId}', description: 'Update entry', parameters: [{ name: 'formName', type: 'string', required: true, description: 'Form name' }, { name: 'entryId', type: 'string', required: true, description: 'Entry ID' }] },
      { method: 'DELETE', path: '/api/arsys/v1/entry/{formName}/{entryId}', description: 'Delete entry', parameters: [{ name: 'formName', type: 'string', required: true, description: 'Form name' }, { name: 'entryId', type: 'string', required: true, description: 'Entry ID' }] },
      // Incident (HPD:Help Desk) convenience
      { method: 'GET', path: '/api/arsys/v1/incident/stats', description: 'Incident statistics (total, open, by priority, by group)', exampleResponse: { total: 8, open: 6, by_priority: { Critical: 4, High: 2 } } },
      { method: 'POST', path: '/api/arsys/v1/incident/{id}/assign', description: 'Assign incident to group/person', parameters: [{ name: 'id', type: 'string', required: true, description: 'Incident Number' }, { name: 'assigned_group', type: 'string', required: false, description: 'Support group' }, { name: 'assignee', type: 'string', required: false, description: 'Person login' }], exampleRequest: { assigned_group: 'IT Operations', assignee: 'j.doe' } },
      { method: 'POST', path: '/api/arsys/v1/incident/{id}/resolve', description: 'Resolve incident with resolution', parameters: [{ name: 'id', type: 'string', required: true, description: 'Incident Number' }, { name: 'resolution', type: 'string', required: true, description: 'Resolution text' }], exampleRequest: { resolution: 'Restarted database service, connections restored.' } },
      { method: 'POST', path: '/api/arsys/v1/incident/{id}/reopen', description: 'Reopen a resolved/closed incident', parameters: [{ name: 'id', type: 'string', required: true, description: 'Incident Number' }] },
      { method: 'POST', path: '/api/arsys/v1/incident/{id}/worknotes', description: 'Add work note to incident', parameters: [{ name: 'id', type: 'string', required: true, description: 'Incident Number' }, { name: 'note', type: 'string', required: true, description: 'Work note text' }], exampleRequest: { note: 'Investigating root cause — checking PAM session logs' } },
      // Change Management (CHG:Infrastructure Change) convenience
      { method: 'GET', path: '/api/arsys/v1/change/schedule', description: 'Change calendar — list scheduled changes', exampleResponse: { result: [{ 'Infrastructure Change ID': 'CRQ000000001', 'Description': 'Upgrade Fudo PAM to v6.2' }] } },
      { method: 'POST', path: '/api/arsys/v1/change/{id}/approve', description: 'Approve change request (CAB)', parameters: [{ name: 'id', type: 'string', required: true, description: 'Change ID' }, { name: 'approval_notes', type: 'string', required: false, description: 'Approval notes' }], exampleRequest: { approval_notes: 'Risk assessment reviewed, approved by CAB' } },
      { method: 'POST', path: '/api/arsys/v1/change/{id}/reject', description: 'Reject change request', parameters: [{ name: 'id', type: 'string', required: true, description: 'Change ID' }, { name: 'rejection_reason', type: 'string', required: true, description: 'Reason' }] },
      { method: 'POST', path: '/api/arsys/v1/change/{id}/implement', description: 'Start change implementation', parameters: [{ name: 'id', type: 'string', required: true, description: 'Change ID' }] },
      { method: 'POST', path: '/api/arsys/v1/change/{id}/complete', description: 'Complete change', parameters: [{ name: 'id', type: 'string', required: true, description: 'Change ID' }] },
      { method: 'GET', path: '/api/arsys/v1/change/{id}/tasks', description: 'List change tasks', parameters: [{ name: 'id', type: 'string', required: true, description: 'Change ID' }] },
      // Asset (AST:ComputerSystem) convenience
      { method: 'GET', path: '/api/arsys/v1/asset/topology', description: 'Asset relationship topology (nodes + edges)', exampleResponse: { nodes: [], edges: [] } },
      { method: 'GET', path: '/api/arsys/v1/asset/{id}/relationships', description: 'Get CI relationships', parameters: [{ name: 'id', type: 'string', required: true, description: 'Asset instance ID' }] },
      { method: 'POST', path: '/api/arsys/v1/asset/{id}/relationships', description: 'Create CI relationship', parameters: [{ name: 'id', type: 'string', required: true, description: 'Asset instance ID' }, { name: 'target_id', type: 'string', required: true, description: 'Target asset ID' }, { name: 'type', type: 'string', required: true, description: 'Relationship type (e.g. Runs On, Depends On)' }] },
      // People (CTM:People) convenience
      { method: 'GET', path: '/api/arsys/v1/people/groups', description: 'List support groups', exampleResponse: { entries: [{ values: { 'Group Name': 'IT Operations', 'Group Lead': 'j.doe' } }] } },
      { method: 'GET', path: '/api/arsys/v1/people/groups/{groupId}/members', description: 'List support group members', parameters: [{ name: 'groupId', type: 'string', required: true, description: 'Group ID' }] },
      // Work Orders (WOI:WorkOrder) convenience
      { method: 'POST', path: '/api/arsys/v1/workorder/{id}/assign', description: 'Assign work order', parameters: [{ name: 'id', type: 'string', required: true, description: 'Work Order ID' }, { name: 'assignee', type: 'string', required: true, description: 'Assignee login' }] },
      { method: 'POST', path: '/api/arsys/v1/workorder/{id}/complete', description: 'Complete work order', parameters: [{ name: 'id', type: 'string', required: true, description: 'Work Order ID' }] },
      // SLA Management
      { method: 'GET', path: '/api/arsys/v1/sla/definitions', description: 'List SLA definitions (P1-P4 response/resolution targets)', exampleResponse: { entries: [{ values: { Name: 'P1 - Critical', 'Response Target': '15 minutes', 'Resolution Target': '4 hours' } }] } },
      { method: 'GET', path: '/api/arsys/v1/sla/status/{incidentId}', description: 'Get SLA status for incident (time remaining, breach)', parameters: [{ name: 'incidentId', type: 'string', required: true, description: 'Incident Number' }], exampleResponse: { response: { target_ms: 900000, elapsed_ms: 300000, remaining_ms: 600000, breached: false }, resolution: { target_ms: 14400000, breached: false } } },
      // Webhooks
      { method: 'POST', path: '/api/arsys/v1/webhook', description: 'Register webhook', parameters: [{ name: 'url', type: 'string', required: true, description: 'Callback URL' }, { name: 'events', type: 'string[]', required: true, description: 'Events (incident.created, change.approved, etc.)' }], exampleRequest: { url: 'http://fudo-mock:8443/api/v2/events/webhook', events: ['incident.created', 'incident.resolved'] } },
      { method: 'GET', path: '/api/arsys/v1/webhook', description: 'List registered webhooks' },
      { method: 'DELETE', path: '/api/arsys/v1/webhook/{id}', description: 'Delete webhook', parameters: [{ name: 'id', type: 'string', required: true, description: 'Webhook ID' }] },
    ],
  },
  {
    api: 'CyberArk PVWA',
    baseUrl: 'http://localhost:8450',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check', exampleResponse: { status: 'ok', service: 'cyberark-mock-api' } },
      // Auth
      { method: 'POST', path: '/api/auth/Cyberark/Logon', description: 'Authenticate (CyberArk)', parameters: [{ name: 'username', type: 'string', required: true, description: 'Username' }, { name: 'password', type: 'string', required: true, description: 'Password' }], exampleRequest: { username: 'Administrator', password: 'Cyberark1!' }, exampleResponse: '"<session-token>"' },
      { method: 'POST', path: '/api/auth/Logoff', description: 'Logoff session' },
      // Safes
      { method: 'GET', path: '/api/Safes', description: 'List all safes (pagination: offset, limit)', exampleResponse: { value: [{ SafeUrlId: 'IT-Admins', SafeName: 'IT-Admins' }], count: 4 } },
      { method: 'GET', path: '/api/Safes/{safeUrlId}', description: 'Get safe by URL ID', parameters: [{ name: 'safeUrlId', type: 'string', required: true, description: 'Safe URL ID' }] },
      { method: 'POST', path: '/api/Safes', description: 'Create safe', parameters: [{ name: 'SafeName', type: 'string', required: true, description: 'Safe name' }, { name: 'Description', type: 'string', required: false, description: 'Description' }], exampleRequest: { SafeName: 'New-Safe', Description: 'A new safe' } },
      { method: 'PUT', path: '/api/Safes/{safeUrlId}', description: 'Update safe', parameters: [{ name: 'safeUrlId', type: 'string', required: true, description: 'Safe URL ID' }] },
      { method: 'DELETE', path: '/api/Safes/{safeUrlId}', description: 'Delete safe', parameters: [{ name: 'safeUrlId', type: 'string', required: true, description: 'Safe URL ID' }] },
      { method: 'GET', path: '/api/Safes/{safeUrlId}/Members', description: 'List safe members', parameters: [{ name: 'safeUrlId', type: 'string', required: true, description: 'Safe URL ID' }] },
      { method: 'POST', path: '/api/Safes/{safeUrlId}/Members', description: 'Add safe member', parameters: [{ name: 'safeUrlId', type: 'string', required: true, description: 'Safe URL ID' }, { name: 'MemberName', type: 'string', required: true, description: 'Member name' }] },
      { method: 'DELETE', path: '/api/Safes/{safeUrlId}/Members/{memberName}', description: 'Remove safe member', parameters: [{ name: 'safeUrlId', type: 'string', required: true, description: 'Safe URL ID' }, { name: 'memberName', type: 'string', required: true, description: 'Member name' }] },
      // Accounts
      { method: 'GET', path: '/api/Accounts', description: 'List/search accounts (search, filter, offset, limit)', exampleResponse: { value: [{ id: 'acc-001', userName: 'Administrator' }], count: 12 } },
      { method: 'GET', path: '/api/Accounts/{id}', description: 'Get account by ID', parameters: [{ name: 'id', type: 'string', required: true, description: 'Account ID' }] },
      { method: 'POST', path: '/api/Accounts', description: 'Create account', parameters: [{ name: 'safeName', type: 'string', required: true, description: 'Safe name' }, { name: 'platformId', type: 'string', required: true, description: 'Platform ID' }, { name: 'address', type: 'string', required: true, description: 'Target address' }, { name: 'userName', type: 'string', required: true, description: 'Account username' }], exampleRequest: { safeName: 'IT-Admins', platformId: 'UnixSSH', address: 'server.local', userName: 'root' } },
      { method: 'DELETE', path: '/api/Accounts/{id}', description: 'Delete account', parameters: [{ name: 'id', type: 'string', required: true, description: 'Account ID' }] },
      { method: 'POST', path: '/api/Accounts/{id}/Password/Retrieve', description: 'Retrieve (checkout) password', parameters: [{ name: 'id', type: 'string', required: true, description: 'Account ID' }] },
      { method: 'POST', path: '/api/Accounts/{id}/CheckIn', description: 'Check in account', parameters: [{ name: 'id', type: 'string', required: true, description: 'Account ID' }] },
      { method: 'POST', path: '/api/Accounts/{id}/Change', description: 'Initiate password change', parameters: [{ name: 'id', type: 'string', required: true, description: 'Account ID' }] },
      { method: 'POST', path: '/api/Accounts/{id}/Verify', description: 'Verify password', parameters: [{ name: 'id', type: 'string', required: true, description: 'Account ID' }] },
      { method: 'POST', path: '/api/Accounts/{id}/Reconcile', description: 'Reconcile password', parameters: [{ name: 'id', type: 'string', required: true, description: 'Account ID' }] },
      // Platforms
      { method: 'GET', path: '/api/Platforms', description: 'List platforms', exampleResponse: { Platforms: [{ PlatformID: 'WinDomain', Active: true }], Total: 5 } },
      { method: 'GET', path: '/api/Platforms/{platformId}', description: 'Get platform', parameters: [{ name: 'platformId', type: 'string', required: true, description: 'Platform ID' }] },
      { method: 'POST', path: '/api/Platforms/{platformId}/Activate', description: 'Activate platform', parameters: [{ name: 'platformId', type: 'string', required: true, description: 'Platform ID' }] },
      { method: 'POST', path: '/api/Platforms/{platformId}/Deactivate', description: 'Deactivate platform', parameters: [{ name: 'platformId', type: 'string', required: true, description: 'Platform ID' }] },
      // Users
      { method: 'GET', path: '/api/Users', description: 'List users', exampleResponse: { Users: [{ id: 2, username: 'Administrator' }], Total: 6 } },
      { method: 'POST', path: '/api/Users', description: 'Create user', parameters: [{ name: 'username', type: 'string', required: true, description: 'Username' }], exampleRequest: { username: 'newuser', personalDetails: { firstName: 'New', lastName: 'User' } } },
      { method: 'POST', path: '/api/Users/{id}/Activate', description: 'Activate user', parameters: [{ name: 'id', type: 'number', required: true, description: 'User ID' }] },
      { method: 'POST', path: '/api/Users/{id}/Deactivate', description: 'Suspend user', parameters: [{ name: 'id', type: 'number', required: true, description: 'User ID' }] },
      { method: 'POST', path: '/api/Users/{id}/ResetPassword', description: 'Reset user password', parameters: [{ name: 'id', type: 'number', required: true, description: 'User ID' }] },
      // Groups
      { method: 'GET', path: '/api/UserGroups', description: 'List user groups' },
      { method: 'POST', path: '/api/UserGroups', description: 'Create group', parameters: [{ name: 'groupName', type: 'string', required: true, description: 'Group name' }] },
      { method: 'POST', path: '/api/UserGroups/{id}/Members', description: 'Add member to group', parameters: [{ name: 'id', type: 'number', required: true, description: 'Group ID' }, { name: 'memberId', type: 'number', required: true, description: 'User ID' }] },
      { method: 'DELETE', path: '/api/UserGroups/{id}/Members/{memberId}', description: 'Remove member from group', parameters: [{ name: 'id', type: 'number', required: true, description: 'Group ID' }, { name: 'memberId', type: 'number', required: true, description: 'User ID' }] },
      // Sessions
      { method: 'GET', path: '/api/LiveSessions', description: 'List PSM sessions', exampleResponse: { LiveSessions: [{ SessionID: 'psm-001', User: 'operator1', IsLive: true }], Total: 4 } },
      { method: 'POST', path: '/api/LiveSessions/{sessionId}/Terminate', description: 'Terminate PSM session', parameters: [{ name: 'sessionId', type: 'string', required: true, description: 'Session ID' }] },
      // System Health
      { method: 'GET', path: '/api/ComponentsMonitoringDetails', description: 'System health overview' },
      { method: 'GET', path: '/api/Server', description: 'Server info' },
    ],
  },
];
