const { v4: uuidv4 } = require('uuid');

const now = new Date().toISOString();
const hour = h => { const d = new Date(); d.setHours(d.getHours() - h); return d.toISOString(); };

// IDs
const ids = {
  users: { admin: uuidv4(), svcIntegration: uuidv4(), jdoe: uuidv4(), asmith: uuidv4(), itOps: uuidv4() },
  servers: { dc01: uuidv4(), dbProd: uuidv4(), appErp: uuidv4() },
  accounts: { adminDc01: uuidv4(), postgresDb: uuidv4(), erpAdmin: uuidv4() },
  safes: { itAdmin: uuidv4(), appAccess: uuidv4() },
  listeners: { ssh: uuidv4(), rdp: uuidv4() },
  pools: { production: uuidv4() },
};

const users = [
  { id: ids.users.admin, login: 'admin', name: 'System Administrator', email: 'admin@corp.local', role: 'admin', status: 'active', blocked: false, created_at: '2024-01-15T08:00:00Z', modified_at: now },
  { id: ids.users.svcIntegration, login: 'svc-integration', name: 'Integration Service Account', email: 'svc-integration@corp.local', role: 'api', status: 'active', blocked: false, created_at: '2025-06-01T10:00:00Z', modified_at: now },
  { id: ids.users.jdoe, login: 'j.doe', name: 'John Doe', email: 'john.doe@corp.local', role: 'user', status: 'active', blocked: false, created_at: '2024-03-20T09:00:00Z', modified_at: now },
  { id: ids.users.asmith, login: 'a.smith', name: 'Alice Smith', email: 'alice.smith@corp.local', role: 'user', status: 'active', blocked: false, created_at: '2024-05-10T07:30:00Z', modified_at: now },
  { id: ids.users.itOps, login: 'it-ops', name: 'IT Operations Team', email: 'it-ops@corp.local', role: 'operator', status: 'active', blocked: false, created_at: '2024-02-01T08:00:00Z', modified_at: now },
];

const servers = [
  { id: ids.servers.dc01, name: 'dc01.corp.local', address: '10.10.1.10', port: 3389, protocol: 'rdp', description: 'Primary Domain Controller', os: 'Windows Server 2022', status: 'online', created_at: '2024-01-15T08:00:00Z', modified_at: now },
  { id: ids.servers.dbProd, name: 'db-prod.corp.local', address: '10.10.2.20', port: 5432, protocol: 'ssh', description: 'Production PostgreSQL Database', os: 'Ubuntu 22.04 LTS', status: 'online', created_at: '2024-01-15T08:00:00Z', modified_at: now },
  { id: ids.servers.appErp, name: 'app-erp.corp.local', address: '10.10.3.30', port: 22, protocol: 'ssh', description: 'ERP Application Server', os: 'RHEL 9', status: 'online', created_at: '2024-02-01T08:00:00Z', modified_at: now },
];

const accounts = [
  { id: ids.accounts.adminDc01, name: 'Administrator@dc01', login: 'Administrator', server_id: ids.servers.dc01, server_name: 'dc01.corp.local', type: 'regular', status: 'active', password_change_required: false, created_at: '2024-01-15T08:00:00Z', modified_at: now },
  { id: ids.accounts.postgresDb, name: 'postgres@db-prod', login: 'postgres', server_id: ids.servers.dbProd, server_name: 'db-prod.corp.local', type: 'regular', status: 'active', password_change_required: false, created_at: '2024-01-15T08:00:00Z', modified_at: now },
  { id: ids.accounts.erpAdmin, name: 'erp-admin@app-erp', login: 'erp-admin', server_id: ids.servers.appErp, server_name: 'app-erp.corp.local', type: 'regular', status: 'active', password_change_required: true, created_at: '2024-02-01T08:00:00Z', modified_at: now },
];

const safes = [
  { id: ids.safes.itAdmin, name: 'IT-Administration', description: 'Full access for IT administrators', policy: 'allow_all', created_at: '2024-01-15T08:00:00Z', modified_at: now },
  { id: ids.safes.appAccess, name: 'Application-Access', description: 'Restricted access to business applications', policy: 'time_restricted', created_at: '2024-03-01T08:00:00Z', modified_at: now },
];

// Relations
const safeUsers = [
  { safe_id: ids.safes.itAdmin, user_id: ids.users.admin },
  { safe_id: ids.safes.itAdmin, user_id: ids.users.itOps },
  { safe_id: ids.safes.itAdmin, user_id: ids.users.svcIntegration },
  { safe_id: ids.safes.appAccess, user_id: ids.users.jdoe },
  { safe_id: ids.safes.appAccess, user_id: ids.users.asmith },
];

const safeAccounts = [
  { safe_id: ids.safes.itAdmin, account_id: ids.accounts.adminDc01 },
  { safe_id: ids.safes.itAdmin, account_id: ids.accounts.postgresDb },
  { safe_id: ids.safes.itAdmin, account_id: ids.accounts.erpAdmin },
  { safe_id: ids.safes.appAccess, account_id: ids.accounts.erpAdmin },
];

const accountManagers = [
  { account_id: ids.accounts.adminDc01, user_id: ids.users.admin },
  { account_id: ids.accounts.postgresDb, user_id: ids.users.admin },
  { account_id: ids.accounts.postgresDb, user_id: ids.users.itOps },
  { account_id: ids.accounts.erpAdmin, user_id: ids.users.itOps },
];

const listeners = [
  { id: ids.listeners.ssh, name: 'SSH-Listener', address: '0.0.0.0', port: 2222, protocol: 'ssh', status: 'active', created_at: '2024-01-15T08:00:00Z', modified_at: now },
  { id: ids.listeners.rdp, name: 'RDP-Listener', address: '0.0.0.0', port: 3389, protocol: 'rdp', status: 'active', created_at: '2024-01-15T08:00:00Z', modified_at: now },
];

const pools = [
  { id: ids.pools.production, name: 'Production-Servers', description: 'All production infrastructure servers', server_ids: [ids.servers.dc01, ids.servers.dbProd, ids.servers.appErp], created_at: '2024-02-01T08:00:00Z', modified_at: now },
];

const sessions = [
  { id: uuidv4(), user_id: ids.users.admin, user_login: 'admin', account_id: ids.accounts.adminDc01, account_name: 'Administrator@dc01', server_name: 'dc01.corp.local', protocol: 'rdp', status: 'completed', started_at: hour(48), ended_at: hour(47), duration_seconds: 3600, bytes_transferred: 245000, recorded: true },
  { id: uuidv4(), user_id: ids.users.itOps, user_login: 'it-ops', account_id: ids.accounts.postgresDb, account_name: 'postgres@db-prod', server_name: 'db-prod.corp.local', protocol: 'ssh', status: 'completed', started_at: hour(24), ended_at: hour(23.5), duration_seconds: 1800, bytes_transferred: 52000, recorded: true },
  { id: uuidv4(), user_id: ids.users.jdoe, user_login: 'j.doe', account_id: ids.accounts.erpAdmin, account_name: 'erp-admin@app-erp', server_name: 'app-erp.corp.local', protocol: 'ssh', status: 'active', started_at: hour(1), ended_at: null, duration_seconds: null, bytes_transferred: 12000, recorded: true },
  { id: uuidv4(), user_id: ids.users.svcIntegration, user_login: 'svc-integration', account_id: ids.accounts.adminDc01, account_name: 'Administrator@dc01', server_name: 'dc01.corp.local', protocol: 'rdp', status: 'completed', started_at: hour(6), ended_at: hour(5.8), duration_seconds: 720, bytes_transferred: 8500, recorded: true },
];

const authMethods = [
  { id: uuidv4(), user_id: ids.users.admin, type: 'password', created_at: '2024-01-15T08:00:00Z' },
  { id: uuidv4(), user_id: ids.users.svcIntegration, type: 'password', created_at: '2025-06-01T10:00:00Z' },
  { id: uuidv4(), user_id: ids.users.svcIntegration, type: 'ssh_key', public_key: 'ssh-rsa AAAAB3...truncated...svc-integration@corp', created_at: '2025-06-01T10:05:00Z' },
  { id: uuidv4(), user_id: ids.users.jdoe, type: 'password', created_at: '2024-03-20T09:00:00Z' },
  { id: uuidv4(), user_id: ids.users.asmith, type: 'password', created_at: '2024-05-10T07:30:00Z' },
  { id: uuidv4(), user_id: ids.users.itOps, type: 'password', created_at: '2024-02-01T08:00:00Z' },
];

// Groups
const groups = [
  { id: uuidv4(), name: 'RDP-Server-Admins', description: 'Administrators with RDP access to server infrastructure', ad_group_dn: 'CN=GRP-RDP-Admins,OU=Security Groups,DC=corp,DC=local', created_at: '2024-02-01T08:00:00Z', modified_at: now },
  { id: uuidv4(), name: 'DB-Operators', description: 'Database operations team', ad_group_dn: 'CN=GRP-DB-Operators,OU=Security Groups,DC=corp,DC=local', created_at: '2024-03-15T08:00:00Z', modified_at: now },
  { id: uuidv4(), name: 'Integration-Services', description: 'Service accounts for system integration', ad_group_dn: 'CN=GRP-SVC-Integration,OU=Service Accounts,DC=corp,DC=local', created_at: '2025-06-01T10:00:00Z', modified_at: now },
];
ids.groups = { rdpAdmins: groups[0].id, dbOperators: groups[1].id, integrationServices: groups[2].id };

const groupUsers = [
  { group_id: ids.groups.rdpAdmins, user_id: ids.users.admin },
  { group_id: ids.groups.rdpAdmins, user_id: ids.users.itOps },
  { group_id: ids.groups.dbOperators, user_id: ids.users.jdoe },
  { group_id: ids.groups.dbOperators, user_id: ids.users.asmith },
  { group_id: ids.groups.integrationServices, user_id: ids.users.svcIntegration },
];

const groupSafes = [
  { group_id: ids.groups.rdpAdmins, safe_id: ids.safes.itAdmin },
  { group_id: ids.groups.dbOperators, safe_id: ids.safes.appAccess },
  { group_id: ids.groups.integrationServices, safe_id: ids.safes.itAdmin },
  { group_id: ids.groups.integrationServices, safe_id: ids.safes.appAccess },
];

const userDirectoryConfig = {
  type: 'active_directory',
  host: 'dc01.corp.local',
  port: 636,
  use_ssl: true,
  base_dn: 'DC=corp,DC=local',
  bind_dn: 'CN=fudo-sync,OU=Service Accounts,DC=corp,DC=local',
  sync_interval_minutes: 60,
  sync_groups: true,
  group_base_dn: 'OU=Security Groups,DC=corp,DC=local',
  user_base_dn: 'OU=Users,DC=corp,DC=local',
  last_sync: new Date(Date.now() - 3600000).toISOString(),
  last_sync_status: 'success',
  last_sync_summary: { users_added: 0, users_updated: 2, users_removed: 0, groups_synced: 3 }
};

// Events (last 24h of simulated activity)
const events = [
  { id: uuidv4(), type: 'session.started', timestamp: hour(23), details: { session_id: sessions[0].id, user: 'admin', account: 'Administrator@dc01', protocol: 'rdp' } },
  { id: uuidv4(), type: 'session.ended', timestamp: hour(22), details: { session_id: sessions[0].id, user: 'admin', duration_seconds: 3600 } },
  { id: uuidv4(), type: 'session.started', timestamp: hour(20), details: { session_id: sessions[1].id, user: 'it-ops', account: 'postgres@db-prod', protocol: 'ssh' } },
  { id: uuidv4(), type: 'session.ended', timestamp: hour(19.5), details: { session_id: sessions[1].id, user: 'it-ops', duration_seconds: 1800 } },
  { id: uuidv4(), type: 'user.created', timestamp: hour(18), details: { user: 'temp-contractor', created_by: 'admin' } },
  { id: uuidv4(), type: 'sync.completed', timestamp: hour(17), details: { source: 'Active Directory', users_synced: 5, groups_synced: 3 } },
  { id: uuidv4(), type: 'session.started', timestamp: hour(15), details: { user: 'j.doe', account: 'erp-admin@app-erp', protocol: 'ssh' } },
  { id: uuidv4(), type: 'account.password_rotation', timestamp: hour(14), details: { policy: 'Standard-90-Days', accounts_rotated: 3 } },
  { id: uuidv4(), type: 'account.password_changed', timestamp: hour(14), details: { account: 'Administrator@dc01', changed_by: 'policy' } },
  { id: uuidv4(), type: 'access.denied', timestamp: hour(12), details: { user: 'a.smith', target: 'IT-Administration', reason: 'Insufficient permissions' } },
  { id: uuidv4(), type: 'session.started', timestamp: hour(10), details: { user: 'svc-integration', account: 'Administrator@dc01', protocol: 'rdp' } },
  { id: uuidv4(), type: 'session.ended', timestamp: hour(9.8), details: { user: 'svc-integration', duration_seconds: 720 } },
  { id: uuidv4(), type: 'session.anomaly_detected', timestamp: hour(8), details: { session_id: sessions[2].id, user: 'j.doe', anomaly: 'Unusual command pattern detected', risk_score: 0.72 } },
  { id: uuidv4(), type: 'access.granted', timestamp: hour(7), details: { user: 'j.doe', target: 'Application-Access', granted_by: 'admin' } },
  { id: uuidv4(), type: 'system.alert', timestamp: hour(5), details: { message: 'High CPU usage on Fudo appliance', severity: 'warning' } },
  { id: uuidv4(), type: 'user.blocked', timestamp: hour(4), details: { user: 'temp-contractor', blocked_by: 'admin', reason: 'Contract ended' } },
  { id: uuidv4(), type: 'user.unblocked', timestamp: hour(3), details: { user: 'temp-contractor', unblocked_by: 'admin', reason: 'Contract extended' } },
  { id: uuidv4(), type: 'session.started', timestamp: hour(1), details: { session_id: sessions[2].id, user: 'j.doe', account: 'erp-admin@app-erp', protocol: 'ssh' } },
];

// Password Policies
const passwordPolicies = [
  { id: uuidv4(), name: 'Standard-90-Days', rotation_interval_days: 90, min_length: 16, require_special: true, accounts: [ids.accounts.adminDc01, ids.accounts.postgresDb, ids.accounts.erpAdmin], created_at: '2024-03-01T08:00:00Z', modified_at: now, last_rotation: hour(14) },
  { id: uuidv4(), name: 'High-Security-30-Days', rotation_interval_days: 30, min_length: 24, require_special: true, accounts: [ids.accounts.adminDc01], created_at: '2024-06-01T08:00:00Z', modified_at: now, last_rotation: hour(14) },
];

// Access Requests
const day = d => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString(); };
const futureDay = d => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString(); };

const accessRequests = [
  { id: uuidv4(), user_id: ids.users.jdoe, requester: 'John Doe', safe_id: ids.safes.appAccess, account_id: null, target: 'Application-Access', justification: 'ERP system maintenance required for quarterly report generation', duration_hours: 48, start_time: null, status: 'approved', created_at: day(2), decided_at: day(2), decided_by: 'admin', expires_at: futureDay(5), comment: 'Approved for Q1 reporting period' },
  { id: uuidv4(), user_id: ids.users.asmith, requester: 'Alice Smith', safe_id: null, account_id: ids.accounts.postgresDb, target: 'postgres@db-prod', justification: 'Need to run performance analysis queries on production database', duration_hours: 4, start_time: null, status: 'pending', created_at: hour(3), decided_at: null, decided_by: null, expires_at: null, comment: null },
  { id: uuidv4(), user_id: ids.users.jdoe, requester: 'John Doe', safe_id: ids.safes.itAdmin, account_id: null, target: 'IT-Administration', justification: 'Emergency server patching for CVE-2025-1234', duration_hours: 8, start_time: null, status: 'expired', created_at: day(35), decided_at: day(35), decided_by: 'it-ops', expires_at: day(34), comment: 'Approved for emergency patching window' },
];

// Webhooks
const webhooks = [
  { id: uuidv4(), url: 'http://localhost:8444/m42Services/api/webhooks/receive', events: ['session.started', 'session.ended', 'session.terminated', 'session.anomaly_detected', 'access.granted', 'access.denied'], secret: 'whsec_m42integration2025', created_at: '2025-06-15T10:00:00Z', status: 'active' },
];

// Password Rotation History
const passwordRotationHistory = [
  { id: uuidv4(), policy_id: passwordPolicies[0].id, account_id: ids.accounts.adminDc01, account_name: 'Administrator@dc01', status: 'success', rotated_at: hour(14) },
  { id: uuidv4(), policy_id: passwordPolicies[0].id, account_id: ids.accounts.postgresDb, account_name: 'postgres@db-prod', status: 'success', rotated_at: hour(14) },
  { id: uuidv4(), policy_id: passwordPolicies[0].id, account_id: ids.accounts.erpAdmin, account_name: 'erp-admin@app-erp', status: 'success', rotated_at: hour(14) },
];

module.exports = { users, servers, accounts, safes, safeUsers, safeAccounts, accountManagers, listeners, pools, sessions, authMethods, groups, groupUsers, groupSafes, userDirectoryConfig, events, passwordPolicies, accessRequests, webhooks, passwordRotationHistory, ids };
