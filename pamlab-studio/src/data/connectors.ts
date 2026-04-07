import type { Connector } from '../types';

// ── Connector Definitions ──────────────────────────────────────────
// Each connector represents a system PAMlab can talk to.
// Actions map 1:1 to real API endpoints in the mock services.

export const connectors: Connector[] = [
  // ── Active Directory ─────────────────────────────────────────────
  {
    id: 'ad',
    name: 'Active Directory',
    icon: '🏢',
    color: 'bg-blue-600',
    description: 'User & group management via LDAP/REST',
    actions: [
      {
        id: 'ad-create-user',
        name: 'Create User',
        description: 'Create a new AD user account',
        method: 'POST',
        path: '/api/users',
        params: [
          { id: 'sAMAccountName', label: 'Username (sAMAccountName)', type: 'text', placeholder: 'j.doe', required: true },
          { id: 'cn', label: 'Full Name (CN)', type: 'text', placeholder: 'John Doe', required: true },
          { id: 'givenName', label: 'First Name', type: 'text', placeholder: 'John' },
          { id: 'sn', label: 'Last Name', type: 'text', placeholder: 'Doe' },
          { id: 'department', label: 'Department', type: 'text', placeholder: 'Engineering' },
          { id: 'title', label: 'Job Title', type: 'text', placeholder: 'Software Engineer' },
          { id: 'ou', label: 'OU Path', type: 'text', placeholder: 'OU=Engineering,OU=Users' },
        ],
      },
      {
        id: 'ad-add-to-group',
        name: 'Add to Group',
        description: 'Add user to a security group',
        method: 'POST',
        path: '/api/groups/{groupName}/members',
        params: [
          { id: 'groupName', label: 'Group Name', type: 'select', required: true, options: [
            { value: 'GRP-VPN-Users', label: 'GRP-VPN-Users' },
            { value: 'GRP-RDP-Admins', label: 'GRP-RDP-Admins' },
            { value: 'GRP-DB-Operators', label: 'GRP-DB-Operators' },
            { value: 'GRP-ERP-Users', label: 'GRP-ERP-Users' },
            { value: 'GRP-IT-Admins', label: 'GRP-IT-Admins' },
            { value: 'GRP-SVC-Integration', label: 'GRP-SVC-Integration' },
          ]},
          { id: 'sAMAccountName', label: 'Username', type: 'text', placeholder: 'j.doe', required: true },
        ],
      },
      {
        id: 'ad-disable-user',
        name: 'Disable User',
        description: 'Disable an AD user account',
        method: 'PUT',
        path: '/api/users/{sAMAccountName}',
        params: [
          { id: 'sAMAccountName', label: 'Username', type: 'text', placeholder: 'j.doe', required: true },
          { id: 'enabled', label: 'Enabled', type: 'hidden', default: 'false' },
        ],
      },
      {
        id: 'ad-remove-from-group',
        name: 'Remove from Group',
        description: 'Remove user from a security group',
        method: 'DELETE',
        path: '/api/groups/{groupName}/members/{sAMAccountName}',
        params: [
          { id: 'groupName', label: 'Group Name', type: 'select', required: true, options: [
            { value: 'GRP-VPN-Users', label: 'GRP-VPN-Users' },
            { value: 'GRP-RDP-Admins', label: 'GRP-RDP-Admins' },
            { value: 'GRP-DB-Operators', label: 'GRP-DB-Operators' },
            { value: 'GRP-ERP-Users', label: 'GRP-ERP-Users' },
            { value: 'GRP-IT-Admins', label: 'GRP-IT-Admins' },
            { value: 'GRP-SVC-Integration', label: 'GRP-SVC-Integration' },
          ]},
          { id: 'sAMAccountName', label: 'Username', type: 'text', placeholder: 'j.doe', required: true },
        ],
      },
    ],
  },

  // ── Fudo PAM ─────────────────────────────────────────────────────
  {
    id: 'fudo',
    name: 'Fudo PAM',
    icon: '🔐',
    color: 'bg-emerald-600',
    description: 'Privileged Access Management — users, servers, sessions',
    actions: [
      {
        id: 'fudo-create-user',
        name: 'Create PAM User',
        description: 'Create a user in Fudo PAM',
        method: 'POST',
        path: '/api/v2/users',
        params: [
          { id: 'login', label: 'Login', type: 'text', placeholder: 'j.doe', required: true },
          { id: 'name', label: 'Display Name', type: 'text', placeholder: 'John Doe', required: true },
          { id: 'email', label: 'Email', type: 'text', placeholder: 'j.doe@corp.local' },
          { id: 'role', label: 'Role', type: 'select', default: 'user', options: [
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' },
            { value: 'auditor', label: 'Auditor' },
          ]},
        ],
      },
      {
        id: 'fudo-add-to-group',
        name: 'Add User to Group',
        description: 'Add a PAM user to a Fudo group (grants access to linked safes)',
        method: 'POST',
        path: '/api/v2/groups/{groupId}/users',
        params: [
          { id: 'groupId', label: 'Fudo Group', type: 'select', required: true, options: [
            { value: '70000000-0000-0000-0000-000000000001', label: 'RDP-Server-Admins (→ IT-Administration Safe)' },
            { value: '70000000-0000-0000-0000-000000000002', label: 'DB-Operators (→ Application-Access Safe)' },
            { value: '70000000-0000-0000-0000-000000000003', label: 'Integration-Services (→ IT-Admin + App Safe)' },
          ]},
          { id: 'user_id', label: 'User ID', type: 'text', placeholder: 'uuid', required: true },
        ],
      },
      {
        id: 'fudo-create-policy',
        name: 'Create Access Policy',
        description: 'Define who (group) can access what (safe) via which protocol (listener)',
        method: 'POST',
        path: '/api/v2/access-policies',
        params: [
          { id: 'name', label: 'Policy Name', type: 'text', placeholder: 'Engineering RDP Access', required: true },
          { id: 'group_id', label: 'Group', type: 'select', required: true, options: [
            { value: '70000000-0000-0000-0000-000000000001', label: 'RDP-Server-Admins' },
            { value: '70000000-0000-0000-0000-000000000002', label: 'DB-Operators' },
            { value: '70000000-0000-0000-0000-000000000003', label: 'Integration-Services' },
          ]},
          { id: 'safe_id', label: 'Safe (Server Group)', type: 'select', required: true, options: [
            { value: '40000000-0000-0000-0000-000000000001', label: 'IT-Administration (DC01, DB, ERP)' },
            { value: '40000000-0000-0000-0000-000000000002', label: 'Application-Access (ERP Server)' },
            { value: '40000000-0000-0000-0000-000000000003', label: 'File-Server-Access (FileServer01)' },
            { value: '40000000-0000-0000-0000-000000000004', label: 'Web-Server-Deployment (Web + Citrix)' },
          ]},
          { id: 'listener_id', label: 'Protocol', type: 'select', options: [
            { value: '50000000-0000-0000-0000-000000000002', label: 'RDP (Remote Desktop)' },
            { value: '50000000-0000-0000-0000-000000000001', label: 'SSH (Secure Shell)' },
          ]},
          { id: 'max_duration_hours', label: 'Max Duration (hours)', type: 'number', placeholder: '8' },
          { id: 'require_approval', label: 'Require Approval', type: 'select', default: 'false', options: [
            { value: 'false', label: 'No — direct access' },
            { value: 'true', label: 'Yes — needs manager approval' },
          ]},
        ],
      },
      {
        id: 'fudo-access-request',
        name: 'Request Access',
        description: 'Create an access request to a safe/server',
        method: 'POST',
        path: '/api/v2/access-requests',
        params: [
          { id: 'user_id', label: 'User ID', type: 'text', placeholder: 'uuid', required: true },
          { id: 'safe_id', label: 'Safe ID', type: 'text', placeholder: 'uuid', required: true },
          { id: 'justification', label: 'Justification', type: 'text', placeholder: 'Project access needed', required: true },
          { id: 'duration_hours', label: 'Duration (hours)', type: 'number', placeholder: '24', default: '24' },
        ],
      },
      {
        id: 'fudo-block-user',
        name: 'Block User',
        description: 'Block a Fudo PAM user (revoke all access)',
        method: 'POST',
        path: '/api/v2/users/{userId}/block',
        params: [
          { id: 'userId', label: 'User ID', type: 'text', placeholder: 'uuid', required: true },
        ],
      },
    ],
  },

  // ── Matrix42 ESM ─────────────────────────────────────────────────
  {
    id: 'matrix42',
    name: 'Matrix42 ESM',
    icon: '🎫',
    color: 'bg-purple-600',
    description: 'Enterprise Service Management — tickets, approvals',
    actions: [
      {
        id: 'm42-create-ticket',
        name: 'Create Ticket',
        description: 'Create a service request / incident',
        method: 'POST',
        path: '/api/tickets',
        params: [
          { id: 'title', label: 'Title', type: 'text', placeholder: 'Onboarding: John Doe', required: true },
          { id: 'description', label: 'Description', type: 'text', placeholder: 'New employee needs access...' },
          { id: 'priority', label: 'Priority', type: 'select', default: 'medium', options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' },
          ]},
          { id: 'category', label: 'Category', type: 'select', default: 'onboarding', options: [
            { value: 'onboarding', label: 'Onboarding' },
            { value: 'offboarding', label: 'Offboarding' },
            { value: 'access-request', label: 'Access Request' },
            { value: 'incident', label: 'Incident' },
          ]},
        ],
      },
      {
        id: 'm42-update-ticket',
        name: 'Update Ticket Status',
        description: 'Update ticket status (resolve, close, etc.)',
        method: 'PUT',
        path: '/api/tickets/{ticketId}',
        params: [
          { id: 'ticketId', label: 'Ticket ID', type: 'text', placeholder: 'INC001', required: true },
          { id: 'status', label: 'New Status', type: 'select', required: true, options: [
            { value: 'In Progress', label: 'In Progress' },
            { value: 'Resolved', label: 'Resolved' },
            { value: 'Closed', label: 'Closed' },
          ]},
        ],
      },
    ],
  },

  // ── ServiceNow ITSM ──────────────────────────────────────────────
  {
    id: 'servicenow',
    name: 'ServiceNow ITSM',
    icon: '📋',
    color: 'bg-orange-600',
    description: 'IT Service Management — incidents, change requests',
    actions: [
      {
        id: 'snow-create-incident',
        name: 'Create Incident',
        description: 'Create a ServiceNow incident',
        method: 'POST',
        path: '/api/now/table/incident',
        params: [
          { id: 'short_description', label: 'Short Description', type: 'text', placeholder: 'Access provisioning for new employee', required: true },
          { id: 'description', label: 'Description', type: 'text', placeholder: 'Full details...' },
          { id: 'urgency', label: 'Urgency', type: 'select', default: '2', options: [
            { value: '1', label: '1 - High' },
            { value: '2', label: '2 - Medium' },
            { value: '3', label: '3 - Low' },
          ]},
          { id: 'category', label: 'Category', type: 'text', placeholder: 'Access', default: 'Access' },
        ],
      },
      {
        id: 'snow-create-change',
        name: 'Create Change Request',
        description: 'Create a change request for infrastructure changes',
        method: 'POST',
        path: '/api/now/table/change_request',
        params: [
          { id: 'short_description', label: 'Short Description', type: 'text', required: true },
          { id: 'type', label: 'Type', type: 'select', default: 'normal', options: [
            { value: 'normal', label: 'Normal' },
            { value: 'standard', label: 'Standard' },
            { value: 'emergency', label: 'Emergency' },
          ]},
          { id: 'risk', label: 'Risk', type: 'select', default: 'moderate', options: [
            { value: 'low', label: 'Low' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'high', label: 'High' },
          ]},
        ],
      },
    ],
  },

  // ── Jira Service Management ──────────────────────────────────────
  {
    id: 'jira',
    name: 'Jira Service Mgmt',
    icon: '🔷',
    color: 'bg-sky-600',
    description: 'Jira Service Management — issues & requests',
    actions: [
      {
        id: 'jira-create-issue',
        name: 'Create Issue',
        description: 'Create a Jira issue / service request',
        method: 'POST',
        path: '/rest/api/2/issue',
        params: [
          { id: 'summary', label: 'Summary', type: 'text', placeholder: 'Onboarding: John Doe', required: true },
          { id: 'description', label: 'Description', type: 'text', placeholder: 'Details...' },
          { id: 'issuetype', label: 'Issue Type', type: 'select', default: 'Task', options: [
            { value: 'Task', label: 'Task' },
            { value: 'Service Request', label: 'Service Request' },
            { value: 'Bug', label: 'Bug' },
          ]},
          { id: 'priority', label: 'Priority', type: 'select', default: 'Medium', options: [
            { value: 'Low', label: 'Low' },
            { value: 'Medium', label: 'Medium' },
            { value: 'High', label: 'High' },
          ]},
        ],
      },
    ],
  },

  // ── BMC Remedy/Helix ─────────────────────────────────────────────
  {
    id: 'remedy',
    name: 'BMC Remedy/Helix',
    icon: '🛠️',
    color: 'bg-red-600',
    description: 'BMC Remedy ITSM — incidents & work orders',
    actions: [
      {
        id: 'remedy-create-incident',
        name: 'Create Incident',
        description: 'Create a Remedy incident',
        method: 'POST',
        path: '/api/arsys/v1/entry/HPD:IncidentInterface_Create',
        params: [
          { id: 'Description', label: 'Description', type: 'text', placeholder: 'Access provisioning', required: true },
          { id: 'Urgency', label: 'Urgency', type: 'select', default: '2-Medium', options: [
            { value: '1-Critical', label: '1 - Critical' },
            { value: '2-Medium', label: '2 - Medium' },
            { value: '3-Low', label: '3 - Low' },
          ]},
          { id: 'Impact', label: 'Impact', type: 'select', default: '3-Moderate/Limited', options: [
            { value: '1-Extensive/Widespread', label: '1 - Extensive' },
            { value: '2-Significant/Large', label: '2 - Significant' },
            { value: '3-Moderate/Limited', label: '3 - Moderate' },
          ]},
        ],
      },
    ],
  },
  // ── CyberArk PVWA ──────────────────────────────────────────────────
  {
    id: 'cyberark',
    name: 'CyberArk PVWA',
    icon: '🔐',
    color: 'bg-purple-600',
    description: 'Privileged Access Management — safes, accounts, password rotation, session monitoring',
    actions: [
      {
        id: 'cyberark-list-safes',
        name: 'List Safes',
        description: 'List all CyberArk safes',
        method: 'GET',
        path: '/api/Safes',
        params: [],
      },
      {
        id: 'cyberark-create-safe',
        name: 'Create Safe',
        description: 'Create a new safe',
        method: 'POST',
        path: '/api/Safes',
        params: [
          { id: 'SafeName', label: 'Safe Name', type: 'text', placeholder: 'New-Safe', required: true },
          { id: 'Description', label: 'Description', type: 'text', placeholder: 'Safe description' },
        ],
      },
      {
        id: 'cyberark-list-accounts',
        name: 'List Accounts',
        description: 'Search/list privileged accounts',
        method: 'GET',
        path: '/api/Accounts',
        params: [
          { id: 'search', label: 'Search', type: 'text', placeholder: 'Administrator' },
          { id: 'SafeName', label: 'Safe Name', type: 'select', options: [
            { value: 'IT-Admins', label: 'IT-Admins' },
            { value: 'DB-Credentials', label: 'DB-Credentials' },
            { value: 'Application-Accounts', label: 'Application-Accounts' },
            { value: 'Cloud-Keys', label: 'Cloud-Keys' },
          ]},
        ],
      },
      {
        id: 'cyberark-retrieve-password',
        name: 'Retrieve Password',
        description: 'Checkout/retrieve account password',
        method: 'POST',
        path: '/api/Accounts/{id}/Password/Retrieve',
        params: [
          { id: 'id', label: 'Account ID', type: 'text', placeholder: 'acc-001', required: true },
        ],
      },
      {
        id: 'cyberark-change-password',
        name: 'Change Password',
        description: 'Initiate CPM password change',
        method: 'POST',
        path: '/api/Accounts/{id}/Change',
        params: [
          { id: 'id', label: 'Account ID', type: 'text', placeholder: 'acc-001', required: true },
        ],
      },
      {
        id: 'cyberark-list-sessions',
        name: 'List PSM Sessions',
        description: 'List active PSM sessions',
        method: 'GET',
        path: '/api/LiveSessions',
        params: [],
      },
      {
        id: 'cyberark-terminate-session',
        name: 'Terminate Session',
        description: 'Terminate an active PSM session',
        method: 'POST',
        path: '/api/LiveSessions/{sessionId}/Terminate',
        params: [
          { id: 'sessionId', label: 'Session ID', type: 'text', placeholder: 'psm-001', required: true },
        ],
      },
      {
        id: 'cyberark-list-users',
        name: 'List Users',
        description: 'List CyberArk vault users',
        method: 'GET',
        path: '/api/Users',
        params: [],
      },
      {
        id: 'cyberark-create-user',
        name: 'Create User',
        description: 'Create a new vault user',
        method: 'POST',
        path: '/api/Users',
        params: [
          { id: 'username', label: 'Username', type: 'text', placeholder: 'newuser', required: true },
          { id: 'userType', label: 'User Type', type: 'select', options: [
            { value: 'EPVUser', label: 'EPVUser' },
            { value: 'AppProvider', label: 'AppProvider' },
          ]},
        ],
      },
      {
        id: 'cyberark-system-health',
        name: 'System Health',
        description: 'Check system component health',
        method: 'GET',
        path: '/api/ComponentsMonitoringDetails',
        params: [],
      },
    ],
  },
  {
    id: 'azure-ad',
    name: 'Microsoft Entra ID',
    icon: '☁️',
    color: 'bg-cyan-600',
    description: 'Cloud identity, Conditional Access, and PIM via Microsoft Graph',
    actions: [
      {
        id: 'entra-list-users',
        name: 'List Users',
        description: 'List Microsoft Entra ID users',
        method: 'GET',
        path: '/v1.0/users',
        params: [],
      },
      {
        id: 'entra-create-user',
        name: 'Create User',
        description: 'Create a new cloud user account',
        method: 'POST',
        path: '/v1.0/users',
        params: [
          { id: 'userPrincipalName', label: 'User Principal Name', type: 'text', placeholder: 'cloud.ops@corp.local', required: true },
          { id: 'displayName', label: 'Display Name', type: 'text', placeholder: 'Cloud Operations', required: true },
          { id: 'givenName', label: 'First Name', type: 'text', placeholder: 'Cloud' },
          { id: 'surname', label: 'Last Name', type: 'text', placeholder: 'Operations' },
          { id: 'department', label: 'Department', type: 'text', placeholder: 'Cloud Platform' },
          { id: 'jobTitle', label: 'Job Title', type: 'text', placeholder: 'Cloud Engineer' },
        ],
      },
      {
        id: 'entra-revoke-sessions',
        name: 'Revoke Sign-In Sessions',
        description: 'Invalidate active sign-in sessions for a user',
        method: 'POST',
        path: '/v1.0/users/{id}/revokeSignInSessions',
        params: [
          { id: 'id', label: 'User ID / UPN', type: 'text', placeholder: 'b.wilson@corp.local', required: true },
        ],
      },
      {
        id: 'entra-create-group',
        name: 'Create Group',
        description: 'Create a new Entra security group',
        method: 'POST',
        path: '/v1.0/groups',
        params: [
          { id: 'displayName', label: 'Group Name', type: 'text', placeholder: 'Emergency-Responders', required: true },
          { id: 'description', label: 'Description', type: 'text', placeholder: 'Temporary response team' },
        ],
      },
      {
        id: 'entra-add-group-member',
        name: 'Add Group Member',
        description: 'Add a user or service principal to an Entra group',
        method: 'POST',
        path: '/v1.0/groups/{id}/members',
        params: [
          { id: 'id', label: 'Group ID', type: 'select', required: true, options: [
            { value: '30000000-0000-0000-0000-000000000001', label: 'Cloud-Admins' },
            { value: '30000000-0000-0000-0000-000000000002', label: 'Azure-Contributors' },
            { value: '30000000-0000-0000-0000-000000000003', label: 'PIM-Eligible' },
          ]},
          { id: 'memberId', label: 'Directory Object ID', type: 'text', placeholder: '20000000-0000-0000-0000-000000000004', required: true },
        ],
      },
      {
        id: 'entra-create-ca-policy',
        name: 'Create CA Policy',
        description: 'Create a Conditional Access policy',
        method: 'POST',
        path: '/v1.0/identity/conditionalAccess/policies',
        params: [
          { id: 'displayName', label: 'Policy Name', type: 'text', placeholder: 'Require compliant device for admins', required: true },
          { id: 'state', label: 'State', type: 'select', default: 'enabled', options: [
            { value: 'enabled', label: 'Enabled' },
            { value: 'disabled', label: 'Disabled' },
            { value: 'enabledForReportingButNotEnforced', label: 'Report only' },
          ]},
        ],
      },
      {
        id: 'entra-activate-pim',
        name: 'Activate PIM Role',
        description: 'Activate an eligible privileged role',
        method: 'POST',
        path: '/v1.0/roleManagement/directory/roleAssignmentScheduleRequests',
        params: [
          { id: 'principalId', label: 'Principal', type: 'select', required: true, options: [
            { value: '20000000-0000-0000-0000-000000000004', label: 'Bob Wilson' },
            { value: '20000000-0000-0000-0000-000000000008', label: 'Cloud Operations' },
          ]},
          { id: 'roleDefinitionId', label: 'Role', type: 'select', required: true, options: [
            { value: '62e90394-69f5-4237-9190-012177145e10', label: 'Global Administrator' },
            { value: 'e8611ab8-c189-46e8-94e1-60213ab1f814', label: 'Privileged Role Administrator' },
            { value: '194ae4cb-b126-40b2-bd5b-6091b380977d', label: 'Security Administrator' },
          ]},
          { id: 'justification', label: 'Justification', type: 'text', placeholder: 'Emergency admin access for PAM maintenance', required: true },
        ],
      },
      {
        id: 'entra-list-service-principals',
        name: 'List Service Principals',
        description: 'List Entra service principals / app registrations',
        method: 'GET',
        path: '/v1.0/servicePrincipals',
        params: [],
      },
    ],
  },
];

/** Get a connector by ID */
export function getConnector(id: string) {
  return connectors.find(c => c.id === id);
}

/** Get an action from a connector */
export function getAction(connectorId: string, actionId: string) {
  const c = getConnector(connectorId);
  return c?.actions.find(a => a.id === actionId);
}
