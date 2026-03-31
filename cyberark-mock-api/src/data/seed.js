const { v4: uuidv4 } = require('uuid');

const now = new Date().toISOString();
const hour = h => { const d = new Date(); d.setHours(d.getHours() - h); return d.toISOString(); };

// Platforms
const platforms = [
  { PlatformID: 'WinDomain', PlatformName: 'Windows Domain Account', Active: true, SystemType: 'Windows', Description: 'Platform for Windows Domain accounts' },
  { PlatformID: 'UnixSSH', PlatformName: 'Unix via SSH', Active: true, SystemType: 'Unix', Description: 'Platform for Unix/Linux SSH accounts' },
  { PlatformID: 'MySQL', PlatformName: 'MySQL Database', Active: true, SystemType: 'Database', Description: 'Platform for MySQL database accounts' },
  { PlatformID: 'WinServerLocal', PlatformName: 'Windows Server Local', Active: false, SystemType: 'Windows', Description: 'Platform for local Windows server accounts' },
  { PlatformID: 'AWSAccessKeys', PlatformName: 'AWS Access Keys', Active: true, SystemType: 'Cloud', Description: 'Platform for AWS IAM access key rotation' },
];

// Safes
const safes = [
  { SafeUrlId: 'IT-Admins', SafeName: 'IT-Admins', Description: 'Safe for IT administrator credentials', ManagingCPM: 'PasswordManager', NumberOfVersionsRetention: 10, NumberOfDaysRetention: 30, OLACEnabled: false, AutoPurgeEnabled: false, Location: '\\', Creator: { Id: 2, Name: 'Administrator' }, CreationTime: 1704067200, LastModificationTime: Date.now() / 1000 | 0 },
  { SafeUrlId: 'DB-Credentials', SafeName: 'DB-Credentials', Description: 'Safe for database credentials', ManagingCPM: 'PasswordManager', NumberOfVersionsRetention: 5, NumberOfDaysRetention: 60, OLACEnabled: true, AutoPurgeEnabled: false, Location: '\\', Creator: { Id: 2, Name: 'Administrator' }, CreationTime: 1706745600, LastModificationTime: Date.now() / 1000 | 0 },
  { SafeUrlId: 'Application-Accounts', SafeName: 'Application-Accounts', Description: 'Safe for application service accounts', ManagingCPM: 'PasswordManager', NumberOfVersionsRetention: 3, NumberOfDaysRetention: 90, OLACEnabled: false, AutoPurgeEnabled: true, Location: '\\', Creator: { Id: 2, Name: 'Administrator' }, CreationTime: 1709424000, LastModificationTime: Date.now() / 1000 | 0 },
  { SafeUrlId: 'Cloud-Keys', SafeName: 'Cloud-Keys', Description: 'Safe for cloud provider access keys', ManagingCPM: 'PasswordManager', NumberOfVersionsRetention: 5, NumberOfDaysRetention: 30, OLACEnabled: true, AutoPurgeEnabled: false, Location: '\\', Creator: { Id: 2, Name: 'Administrator' }, CreationTime: 1711929600, LastModificationTime: Date.now() / 1000 | 0 },
];

// Safe members
const safeMembers = [
  { SafeUrlId: 'IT-Admins', MemberId: 'm1', MemberName: 'Administrator', MemberType: 'User', Permissions: { UseAccounts: true, RetrieveAccounts: true, ListAccounts: true, AddAccounts: true, UpdateAccountContent: true, UpdateAccountProperties: true, InitiateCPMAccountManagementOperations: true, SpecifyNextAccountContent: true, RenameAccounts: true, DeleteAccounts: true, UnlockAccounts: true, ManageSafe: true, ManageSafeMembers: true, ViewAuditLog: true, ViewSafeMembers: true, RequestsAuthorizationLevel1: false, RequestsAuthorizationLevel2: false, AccessWithoutConfirmation: true, CreateFolders: true, DeleteFolders: true, MoveAccountsAndFolders: true } },
  { SafeUrlId: 'IT-Admins', MemberId: 'm2', MemberName: 'PVWAGWUser', MemberType: 'User', Permissions: { UseAccounts: true, RetrieveAccounts: false, ListAccounts: true, AddAccounts: false, UpdateAccountContent: false, UpdateAccountProperties: false, ManageSafe: false, ManageSafeMembers: false, ViewAuditLog: true, ViewSafeMembers: true } },
  { SafeUrlId: 'IT-Admins', MemberId: 'm3', MemberName: 'IT-Ops-Group', MemberType: 'Group', Permissions: { UseAccounts: true, RetrieveAccounts: true, ListAccounts: true, AddAccounts: false, UpdateAccountContent: false, UpdateAccountProperties: false, ManageSafe: false, ManageSafeMembers: false, ViewAuditLog: true, ViewSafeMembers: true } },
  { SafeUrlId: 'DB-Credentials', MemberId: 'm4', MemberName: 'Administrator', MemberType: 'User', Permissions: { UseAccounts: true, RetrieveAccounts: true, ListAccounts: true, AddAccounts: true, UpdateAccountContent: true, ManageSafe: true, ManageSafeMembers: true, ViewAuditLog: true, ViewSafeMembers: true } },
  { SafeUrlId: 'DB-Credentials', MemberId: 'm5', MemberName: 'DBA-Group', MemberType: 'Group', Permissions: { UseAccounts: true, RetrieveAccounts: true, ListAccounts: true, AddAccounts: false, UpdateAccountContent: false, ManageSafe: false, ManageSafeMembers: false, ViewAuditLog: true, ViewSafeMembers: true } },
  { SafeUrlId: 'Application-Accounts', MemberId: 'm6', MemberName: 'Administrator', MemberType: 'User', Permissions: { UseAccounts: true, RetrieveAccounts: true, ListAccounts: true, AddAccounts: true, UpdateAccountContent: true, ManageSafe: true, ManageSafeMembers: true, ViewAuditLog: true, ViewSafeMembers: true } },
  { SafeUrlId: 'Application-Accounts', MemberId: 'm7', MemberName: 'AppTeam', MemberType: 'Group', Permissions: { UseAccounts: true, RetrieveAccounts: true, ListAccounts: true, AddAccounts: false, UpdateAccountContent: false, ManageSafe: false, ManageSafeMembers: false, ViewAuditLog: false, ViewSafeMembers: false } },
];

// Accounts
const accounts = [
  { id: 'acc-001', name: 'Operating System-WinDomain-dc01.corp.local-Administrator', address: 'dc01.corp.local', userName: 'Administrator', safeName: 'IT-Admins', platformId: 'WinDomain', secretType: 'password', secret: 'P@ssw0rd!DC01', platformAccountProperties: { LogonDomain: 'CORP' }, secretManagement: { automaticManagementEnabled: true, lastModifiedTime: 1711929600 }, createdTime: 1704067200, checkedOut: false, checkedOutBy: null },
  { id: 'acc-002', name: 'Operating System-WinDomain-dc02.corp.local-Administrator', address: 'dc02.corp.local', userName: 'Administrator', safeName: 'IT-Admins', platformId: 'WinDomain', secretType: 'password', secret: 'P@ssw0rd!DC02', platformAccountProperties: { LogonDomain: 'CORP' }, secretManagement: { automaticManagementEnabled: true, lastModifiedTime: 1711929600 }, createdTime: 1704067200, checkedOut: false, checkedOutBy: null },
  { id: 'acc-003', name: 'Operating System-UnixSSH-dbprod01.corp.local-root', address: 'dbprod01.corp.local', userName: 'root', safeName: 'IT-Admins', platformId: 'UnixSSH', secretType: 'password', secret: 'R00t$ecure!', platformAccountProperties: {}, secretManagement: { automaticManagementEnabled: true, lastModifiedTime: 1709424000 }, createdTime: 1706745600, checkedOut: false, checkedOutBy: null },
  { id: 'acc-004', name: 'Database-MySQL-dbprod01.corp.local-dbadmin', address: 'dbprod01.corp.local', userName: 'dbadmin', safeName: 'DB-Credentials', platformId: 'MySQL', secretType: 'password', secret: 'Db@dmin2024!', platformAccountProperties: { Database: 'production', Port: '3306' }, secretManagement: { automaticManagementEnabled: true, lastModifiedTime: 1711929600 }, createdTime: 1706745600, checkedOut: false, checkedOutBy: null },
  { id: 'acc-005', name: 'Database-MySQL-dbprod01.corp.local-readonly', address: 'dbprod01.corp.local', userName: 'readonly', safeName: 'DB-Credentials', platformId: 'MySQL', secretType: 'password', secret: 'R3adOnly!', platformAccountProperties: { Database: 'production', Port: '3306' }, secretManagement: { automaticManagementEnabled: false, lastModifiedTime: 1709424000 }, createdTime: 1709424000, checkedOut: false, checkedOutBy: null },
  { id: 'acc-006', name: 'Database-MySQL-dbstaging.corp.local-dbadmin', address: 'dbstaging.corp.local', userName: 'dbadmin', safeName: 'DB-Credentials', platformId: 'MySQL', secretType: 'password', secret: 'St@ging2024!', platformAccountProperties: { Database: 'staging', Port: '3306' }, secretManagement: { automaticManagementEnabled: true, lastModifiedTime: 1711929600 }, createdTime: 1709424000, checkedOut: false, checkedOutBy: null },
  { id: 'acc-007', name: 'Operating System-UnixSSH-web01.corp.local-deploy', address: 'web01.corp.local', userName: 'deploy', safeName: 'Application-Accounts', platformId: 'UnixSSH', secretType: 'password', secret: 'D3ploy!App', platformAccountProperties: {}, secretManagement: { automaticManagementEnabled: true, lastModifiedTime: 1711929600 }, createdTime: 1709424000, checkedOut: false, checkedOutBy: null },
  { id: 'acc-008', name: 'Operating System-UnixSSH-web02.corp.local-deploy', address: 'web02.corp.local', userName: 'deploy', safeName: 'Application-Accounts', platformId: 'UnixSSH', secretType: 'password', secret: 'D3ploy!Web2', platformAccountProperties: {}, secretManagement: { automaticManagementEnabled: true, lastModifiedTime: 1711929600 }, createdTime: 1709424000, checkedOut: false, checkedOutBy: null },
  { id: 'acc-009', name: 'Application-UnixSSH-app01.corp.local-svc-erp', address: 'app01.corp.local', userName: 'svc-erp', safeName: 'Application-Accounts', platformId: 'UnixSSH', secretType: 'password', secret: 'SvcErp!2024', platformAccountProperties: {}, secretManagement: { automaticManagementEnabled: false, lastModifiedTime: 1706745600 }, createdTime: 1706745600, checkedOut: true, checkedOutBy: 'operator1' },
  { id: 'acc-010', name: 'Cloud-AWSAccessKeys-aws-prod-svc-deploy', address: 'aws-prod', userName: 'svc-deploy', safeName: 'Cloud-Keys', platformId: 'AWSAccessKeys', secretType: 'key', secret: 'AKIAIOSFODNN7EXAMPLE', platformAccountProperties: { AWSAccountId: '123456789012', Region: 'eu-central-1' }, secretManagement: { automaticManagementEnabled: true, lastModifiedTime: 1711929600 }, createdTime: 1711929600, checkedOut: false, checkedOutBy: null },
  { id: 'acc-011', name: 'Operating System-WinDomain-citrix01.corp.local-svc-ctx', address: 'citrix01.corp.local', userName: 'svc-ctx', safeName: 'Application-Accounts', platformId: 'WinDomain', secretType: 'password', secret: 'C1trix!Svc', platformAccountProperties: { LogonDomain: 'CORP' }, secretManagement: { automaticManagementEnabled: true, lastModifiedTime: 1711929600 }, createdTime: 1711929600, checkedOut: false, checkedOutBy: null },
  { id: 'acc-012', name: 'Operating System-UnixSSH-monitor01.corp.local-nagios', address: 'monitor01.corp.local', userName: 'nagios', safeName: 'Application-Accounts', platformId: 'UnixSSH', secretType: 'password', secret: 'N@gios2024!', platformAccountProperties: {}, secretManagement: { automaticManagementEnabled: false, lastModifiedTime: 1709424000 }, createdTime: 1709424000, checkedOut: false, checkedOutBy: null },
];

// Users
const users = [
  { id: 2, username: 'Administrator', source: 'CyberArk', userType: 'Built-InAdmins', componentUser: false, vaultAuthorization: ['AddUpdateUsers', 'AddSafes', 'AddNetworkAreas', 'ManageServerFileCategories', 'AuditUsers', 'ResetUsersPasswords', 'ActivateUsers'], location: '\\', personalDetails: { firstName: 'Vault', lastName: 'Administrator', email: 'admin@corp.local' }, enableUser: true, suspended: false, lastSuccessfulLoginDate: now },
  { id: 10, username: 'auditor1', source: 'CyberArk', userType: 'EPVUser', componentUser: false, vaultAuthorization: ['AuditUsers'], location: '\\Users', personalDetails: { firstName: 'Anna', lastName: 'Auditor', email: 'anna.auditor@corp.local' }, enableUser: true, suspended: false, lastSuccessfulLoginDate: hour(2) },
  { id: 11, username: 'operator1', source: 'CyberArk', userType: 'EPVUser', componentUser: false, vaultAuthorization: [], location: '\\Users', personalDetails: { firstName: 'Otto', lastName: 'Operator', email: 'otto.operator@corp.local' }, enableUser: true, suspended: false, lastSuccessfulLoginDate: hour(1) },
  { id: 12, username: 'helpdesk1', source: 'CyberArk', userType: 'EPVUser', componentUser: false, vaultAuthorization: ['ResetUsersPasswords'], location: '\\Users', personalDetails: { firstName: 'Helen', lastName: 'Helpdesk', email: 'helen.helpdesk@corp.local' }, enableUser: true, suspended: false, lastSuccessfulLoginDate: hour(5) },
  { id: 13, username: 'svc-integration', source: 'CyberArk', userType: 'AppProvider', componentUser: false, vaultAuthorization: [], location: '\\Applications', personalDetails: { firstName: 'Service', lastName: 'Integration', email: 'svc@corp.local' }, enableUser: true, suspended: false, lastSuccessfulLoginDate: hour(0) },
  { id: 14, username: 'dev-user', source: 'LDAP', userType: 'EPVUser', componentUser: false, vaultAuthorization: [], location: '\\Users', personalDetails: { firstName: 'Daniel', lastName: 'Developer', email: 'daniel.dev@corp.local' }, enableUser: true, suspended: true, lastSuccessfulLoginDate: hour(48) },
];

// Groups
const groups = [
  { id: 1, groupName: 'Vault Admins', description: 'Full vault administration', groupType: 'Vault', location: '\\', members: [{ id: 2, username: 'Administrator' }] },
  { id: 2, groupName: 'IT-Ops-Group', description: 'IT Operations team', groupType: 'Vault', location: '\\Groups', members: [{ id: 11, username: 'operator1' }] },
  { id: 3, groupName: 'DBA-Group', description: 'Database administrators', groupType: 'Vault', location: '\\Groups', members: [{ id: 11, username: 'operator1' }] },
  { id: 4, groupName: 'AppTeam', description: 'Application support team', groupType: 'Vault', location: '\\Groups', members: [{ id: 13, username: 'svc-integration' }] },
  { id: 5, groupName: 'Auditors', description: 'Audit team', groupType: 'Vault', location: '\\Groups', members: [{ id: 10, username: 'auditor1' }] },
];

// PSM Sessions
const psmSessions = [
  { SessionID: 'psm-001', SafeName: 'IT-Admins', AccountUsername: 'Administrator', AccountAddress: 'dc01.corp.local', AccountPlatformID: 'WinDomain', RemoteMachine: 'dc01.corp.local', User: 'operator1', ConnectionComponentID: 'PSM-RDP', Protocol: 'RDP', Start: hour(1), End: null, Duration: null, SessionStatus: 'Active', IsLive: true },
  { SessionID: 'psm-002', SafeName: 'DB-Credentials', AccountUsername: 'dbadmin', AccountAddress: 'dbprod01.corp.local', AccountPlatformID: 'MySQL', RemoteMachine: 'dbprod01.corp.local', User: 'operator1', ConnectionComponentID: 'PSM-SSH', Protocol: 'SSH', Start: hour(2), End: null, Duration: null, SessionStatus: 'Active', IsLive: true },
  { SessionID: 'psm-003', SafeName: 'IT-Admins', AccountUsername: 'root', AccountAddress: 'dbprod01.corp.local', AccountPlatformID: 'UnixSSH', RemoteMachine: 'dbprod01.corp.local', User: 'auditor1', ConnectionComponentID: 'PSM-SSH', Protocol: 'SSH', Start: hour(5), End: hour(4), Duration: '01:00:00', SessionStatus: 'Completed', IsLive: false },
  { SessionID: 'psm-004', SafeName: 'Application-Accounts', AccountUsername: 'deploy', AccountAddress: 'web01.corp.local', AccountPlatformID: 'UnixSSH', RemoteMachine: 'web01.corp.local', User: 'svc-integration', ConnectionComponentID: 'PSM-SSH', Protocol: 'SSH', Start: hour(3), End: null, Duration: null, SessionStatus: 'Active', IsLive: true },
];

// System health components
const systemHealth = [
  { ComponentID: 'SessionManagement', ComponentName: 'Privileged Session Manager', Description: 'PSM Server', ConnectedComponentCount: 2, ComponentTotalCount: 2, ComponentSpecificStat: null, IsLoggedOn: true, LastLogonDate: hour(0) },
  { ComponentID: 'SessionManagement', ComponentName: 'Privileged Session Manager SSH Proxy', Description: 'PSM SSH Proxy', ConnectedComponentCount: 1, ComponentTotalCount: 1, ComponentSpecificStat: null, IsLoggedOn: true, LastLogonDate: hour(0) },
  { ComponentID: 'PasswordManager', ComponentName: 'Central Policy Manager', Description: 'CPM Scanner', ConnectedComponentCount: 1, ComponentTotalCount: 1, ComponentSpecificStat: null, IsLoggedOn: true, LastLogonDate: hour(0) },
  { ComponentID: 'PVWA', ComponentName: 'Password Vault Web Access', Description: 'PVWA Server', ConnectedComponentCount: 2, ComponentTotalCount: 2, ComponentSpecificStat: null, IsLoggedOn: true, LastLogonDate: hour(0) },
  { ComponentID: 'AIM', ComponentName: 'Application Identity Manager', Description: 'AIM Provider', ConnectedComponentCount: 1, ComponentTotalCount: 1, ComponentSpecificStat: null, IsLoggedOn: true, LastLogonDate: hour(1) },
];

module.exports = {
  platforms,
  safes,
  safeMembers,
  accounts,
  users,
  groups,
  psmSessions,
  systemHealth,
};
