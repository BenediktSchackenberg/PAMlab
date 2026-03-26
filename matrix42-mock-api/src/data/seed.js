const { v4: uuidv4 } = require('uuid');

const dataDefinitions = {
  SPSUserClassBase: {
    name: 'SPSUserClassBase',
    displayName: 'Employees',
    description: 'Employee and user accounts',
    fields: {
      ID: 'Guid', FirstName: 'String', LastName: 'String', Email: 'String',
      Department: 'String', EmployeeNumber: 'String', Status: 'String',
      AccountName: 'String', Phone: 'String', Location: 'String',
      Manager: 'String', JobTitle: 'String', StartDate: 'DateTime',
      EndDate: 'DateTime', CreatedDate: 'DateTime', ModifiedDate: 'DateTime'
    }
  },
  SPSAssetClassBase: {
    name: 'SPSAssetClassBase',
    displayName: 'Assets',
    description: 'Hardware and infrastructure assets',
    fields: {
      ID: 'Guid', Name: 'String', SerialNumber: 'String', Manufacturer: 'String',
      Model: 'String', OperatingSystem: 'String', IPAddress: 'String',
      MACAddress: 'String', AssetTag: 'String', Status: 'String',
      AssignedUser: 'String', Location: 'String', LastSeen: 'DateTime', AssetType: 'String'
    }
  },
  SPSSoftwareType: {
    name: 'SPSSoftwareType',
    displayName: 'Software',
    description: 'Software catalog entries',
    fields: {
      ID: 'Guid', Name: 'String', Version: 'String', Vendor: 'String',
      LicenseType: 'String', Status: 'String'
    }
  },
  SPSActivityClassBase: {
    name: 'SPSActivityClassBase',
    displayName: 'Tickets',
    description: 'Incidents and service requests',
    fields: {
      ID: 'Guid', TicketNumber: 'String', Title: 'String', Description: 'String',
      Status: 'String', Priority: 'Number', AssignedTo: 'String',
      Reporter: 'String', Category: 'String', CreatedDate: 'DateTime',
      ModifiedDate: 'DateTime', ResolvedDate: 'DateTime'
    }
  },
  SPSScCategoryClassBase: {
    name: 'SPSScCategoryClassBase',
    displayName: 'Categories',
    description: 'Service catalog categories',
    fields: {
      ID: 'Guid', Name: 'String', Description: 'String', ParentCategory: 'String'
    }
  }
};

function makeUser(first, last, account, dept, status, jobTitle, manager, empNum, extra = {}) {
  return {
    ID: uuidv4(), FirstName: first, LastName: last, Email: `${account}@corp.local`,
    Department: dept, EmployeeNumber: empNum, Status: status, AccountName: account,
    Phone: '+49-555-' + String(Math.floor(1000 + Math.random() * 9000)),
    Location: 'HQ Frankfurt', Manager: manager, JobTitle: jobTitle,
    StartDate: '2023-01-15T00:00:00Z', EndDate: null,
    CreatedDate: '2023-01-10T00:00:00Z', ModifiedDate: '2024-12-01T00:00:00Z',
    ...extra
  };
}

const employees = [
  makeUser('System', 'Administrator', 'admin', 'IT Department', 'Active', 'IT Administrator', null, 'EMP001'),
  makeUser('Bob', 'Wilson', 'bob.wilson', 'IT Department', 'Active', 'Systems Engineer', 'admin', 'EMP002'),
  makeUser('John', 'Doe', 'john.doe', 'Engineering', 'Active', 'Software Developer', 'carol.jones', 'EMP003'),
  makeUser('Alice', 'Smith', 'alice.smith', 'Finance', 'Active', 'Financial Analyst', 'carol.jones', 'EMP004'),
  makeUser('Carol', 'Jones', 'carol.jones', 'Management', 'Active', 'Department Manager', null, 'EMP005'),
  makeUser('Service', 'Account', 'svc-matrix42', 'Service Account', 'Active', 'Service Account', null, 'SVC001'),
  makeUser('Tom', 'Developer', 'tom.developer', 'Engineering', 'Onboarding', 'Junior Developer', 'john.doe', 'EMP006', { StartDate: '2026-04-01T00:00:00Z' }),
  makeUser('Lisa', 'Leaving', 'lisa.leaving', 'Finance', 'Offboarding', 'Accountant', 'alice.smith', 'EMP007', { EndDate: '2026-03-31T00:00:00Z' }),
];

function makeAsset(name, serial, mfg, model, os, ip, mac, tag, status, assignedUser, type) {
  return {
    ID: uuidv4(), Name: name, SerialNumber: serial, Manufacturer: mfg, Model: model,
    OperatingSystem: os, IPAddress: ip, MACAddress: mac, AssetTag: tag,
    Status: status, AssignedUser: assignedUser, Location: 'HQ Frankfurt',
    LastSeen: '2026-03-26T10:00:00Z', AssetType: type
  };
}

const assets = [
  makeAsset('DC01', 'SRV-2022-001', 'Dell', 'PowerEdge R750', 'Windows Server 2022', '10.0.1.10', 'AA:BB:CC:01:01:01', 'AST-SRV-001', 'Active', 'admin', 'Server'),
  makeAsset('DB-PROD', 'SRV-2022-002', 'HPE', 'ProLiant DL380', 'Ubuntu 22.04', '10.0.1.20', 'AA:BB:CC:01:01:02', 'AST-SRV-002', 'Active', 'bob.wilson', 'Server'),
  makeAsset('APP-ERP', 'SRV-2022-003', 'Lenovo', 'ThinkSystem SR650', 'RHEL 9', '10.0.1.30', 'AA:BB:CC:01:01:03', 'AST-SRV-003', 'Active', 'bob.wilson', 'Server'),
  makeAsset('FILE-SRV01', 'SRV-2022-004', 'Dell', 'PowerEdge R550', 'Windows Server 2022', '10.0.1.40', 'AA:BB:CC:01:01:04', 'AST-SRV-004', 'Active', 'admin', 'Server'),
  makeAsset('WKS-ENG-01', 'WKS-2024-001', 'Dell', 'OptiPlex 7090', 'Windows 11', '10.0.10.101', 'AA:BB:CC:02:01:01', 'AST-WKS-001', 'Active', 'john.doe', 'Desktop'),
  makeAsset('WKS-ENG-02', 'WKS-2024-002', 'Dell', 'OptiPlex 7090', 'Windows 11', '10.0.10.102', 'AA:BB:CC:02:01:02', 'AST-WKS-002', 'Active', 'tom.developer', 'Desktop'),
  makeAsset('WKS-FIN-01', 'WKS-2024-003', 'HP', 'EliteDesk 800', 'Windows 11', '10.0.10.201', 'AA:BB:CC:02:02:01', 'AST-WKS-003', 'Active', 'alice.smith', 'Desktop'),
  makeAsset('LAPTOP-SALES-01', 'LPT-2024-001', 'Lenovo', 'ThinkPad X1 Carbon', 'Windows 11', '10.0.20.50', 'AA:BB:CC:03:01:01', 'AST-LPT-001', 'InRepair', null, 'Laptop'),
];

const software = [
  { ID: uuidv4(), Name: 'Windows 11 Enterprise', Version: '23H2', Vendor: 'Microsoft', LicenseType: 'Volume', Status: 'Active', Category: 'Operating System', TotalLicenses: 50, UsedLicenses: 12 },
  { ID: uuidv4(), Name: 'Matrix42 Agent', Version: '8.2.1', Vendor: 'Matrix42', LicenseType: 'Subscription', Status: 'Active', Category: 'Management', TotalLicenses: 100, UsedLicenses: 8 },
  { ID: uuidv4(), Name: 'SAP GUI', Version: '8.00', Vendor: 'SAP', LicenseType: 'Named', Status: 'Active', Category: 'Business', TotalLicenses: 20, UsedLicenses: 3 },
  { ID: uuidv4(), Name: 'Microsoft Office 365', Version: '2024', Vendor: 'Microsoft', LicenseType: 'Subscription', Status: 'Active', Category: 'Productivity', TotalLicenses: 100, UsedLicenses: 15 },
  { ID: uuidv4(), Name: 'Visual Studio Code', Version: '1.87', Vendor: 'Microsoft', LicenseType: 'Free', Status: 'Active', Category: 'Development', TotalLicenses: null, UsedLicenses: 5 },
  { ID: uuidv4(), Name: 'CrowdStrike Falcon', Version: '7.10', Vendor: 'CrowdStrike', LicenseType: 'Subscription', Status: 'Active', Category: 'Security', TotalLicenses: 50, UsedLicenses: 8 },
  { ID: uuidv4(), Name: 'Adobe Acrobat Pro', Version: '2024', Vendor: 'Adobe', LicenseType: 'Subscription', Status: 'Active', Category: 'Productivity', TotalLicenses: 10, UsedLicenses: 4 },
];

const tickets = [
  { ID: uuidv4(), TicketNumber: 'INC001', Title: 'VPN connection failing', Description: 'Users report intermittent VPN disconnects since morning', Status: 'InProgress', Priority: 2, AssignedTo: 'bob.wilson', Reporter: 'john.doe', Category: 'Network', CreatedDate: '2026-03-25T08:00:00Z', ModifiedDate: '2026-03-25T14:00:00Z', ResolvedDate: null },
  { ID: uuidv4(), TicketNumber: 'INC002', Title: 'New laptop request', Description: 'New hire starting April needs laptop provisioned', Status: 'New', Priority: 3, AssignedTo: null, Reporter: 'carol.jones', Category: 'Hardware', CreatedDate: '2026-03-26T09:00:00Z', ModifiedDate: '2026-03-26T09:00:00Z', ResolvedDate: null },
  { ID: uuidv4(), TicketNumber: 'INC003', Title: 'Password reset for ERP', Description: 'Account locked after failed login attempts', Status: 'Resolved', Priority: 1, AssignedTo: 'admin', Reporter: 'alice.smith', Category: 'User-Management', CreatedDate: '2026-03-24T16:00:00Z', ModifiedDate: '2026-03-24T16:30:00Z', ResolvedDate: '2026-03-24T16:30:00Z' },
  { ID: uuidv4(), TicketNumber: 'INC004', Title: 'File share access denied', Description: 'Cannot access \\\\FILE-SRV01\\finance after policy update', Status: 'New', Priority: 2, AssignedTo: null, Reporter: 'alice.smith', Category: 'Network', CreatedDate: '2026-03-26T11:00:00Z', ModifiedDate: '2026-03-26T11:00:00Z', ResolvedDate: null },
  { ID: uuidv4(), TicketNumber: 'INC005', Title: 'Outlook keeps crashing', Description: 'Outlook 365 crashes every 10 minutes on WKS-ENG-01', Status: 'InProgress', Priority: 2, AssignedTo: 'bob.wilson', Reporter: 'john.doe', Category: 'Software', CreatedDate: '2026-03-26T08:30:00Z', ModifiedDate: '2026-03-26T10:00:00Z', ResolvedDate: null },
  { ID: uuidv4(), TicketNumber: 'INC006', Title: 'Printer not reachable', Description: 'Floor 2 printer HP LaserJet not responding to print jobs', Status: 'Resolved', Priority: 3, AssignedTo: 'bob.wilson', Reporter: 'carol.jones', Category: 'Hardware', CreatedDate: '2026-03-23T14:00:00Z', ModifiedDate: '2026-03-23T16:00:00Z', ResolvedDate: '2026-03-23T16:00:00Z' },
  { ID: uuidv4(), TicketNumber: 'SR001', Title: 'SAP GUI installation request', Description: 'Need SAP GUI installed for new finance role', Status: 'New', Priority: 3, AssignedTo: null, Reporter: 'lisa.leaving', Category: 'Software', CreatedDate: '2026-03-26T13:00:00Z', ModifiedDate: '2026-03-26T13:00:00Z', ResolvedDate: null },
  { ID: uuidv4(), TicketNumber: 'SR002', Title: 'Onboarding - Tom Developer', Description: 'Full onboarding workflow for new Engineering hire', Status: 'InProgress', Priority: 2, AssignedTo: 'admin', Reporter: 'carol.jones', Category: 'User-Management', CreatedDate: '2026-03-20T09:00:00Z', ModifiedDate: '2026-03-25T11:00:00Z', ResolvedDate: null },
];

const categories = [
  { ID: uuidv4(), Name: 'IT-Support', Description: 'General IT support requests', ParentCategory: null },
  { ID: uuidv4(), Name: 'Network', Description: 'Network and connectivity issues', ParentCategory: 'IT-Support' },
  { ID: uuidv4(), Name: 'Software', Description: 'Software installation and licensing', ParentCategory: 'IT-Support' },
  { ID: uuidv4(), Name: 'Hardware', Description: 'Hardware provisioning and repair', ParentCategory: 'IT-Support' },
  { ID: uuidv4(), Name: 'User-Management', Description: 'Account and access management', ParentCategory: 'IT-Support' },
];

const accessRequests = [
  {
    id: uuidv4(), user: 'john.doe', target_type: 'group', target: 'GRP-RDP-Admins',
    access_type: 'member', justification: 'Need RDP access for server maintenance',
    duration: '30d', status: 'approved', approved_by: 'carol.jones',
    comment: 'Approved for Q1 maintenance window',
    created_at: '2026-03-22T10:00:00Z', decided_at: '2026-03-24T09:00:00Z', expires_at: '2026-04-23T10:00:00Z'
  },
  {
    id: uuidv4(), user: 'alice.smith', target_type: 'group', target: 'GRP-DB-Operators',
    access_type: 'member', justification: 'Financial reporting requires direct DB access',
    duration: '90d', status: 'pending',
    created_at: '2026-03-25T14:00:00Z', decided_at: null, expires_at: null
  },
  {
    id: uuidv4(), user: 'bob.wilson', target_type: 'group', target: 'GRP-VPN-Admins',
    access_type: 'member', justification: 'Temporary VPN admin for migration project',
    duration: '14d', status: 'expired',
    approved_by: 'carol.jones', comment: 'Short-term approval',
    created_at: '2026-02-15T08:00:00Z', decided_at: '2026-02-15T10:00:00Z', expires_at: '2026-03-01T08:00:00Z'
  }
];

// --- NEW SEED DATA ---

// Asset assignments (userId -> assetId mappings built from existing data)
const assetAssignments = [];
assets.forEach(a => {
  if (a.AssignedUser) {
    const user = employees.find(e => e.AccountName === a.AssignedUser);
    if (user) {
      assetAssignments.push({
        id: uuidv4(),
        userId: user.ID,
        assetId: a.ID,
        assignedDate: '2024-06-01T00:00:00Z',
        status: 'Active'
      });
    }
  }
});

// Software installations (which software on which device)
const softwareInstallations = [
  { id: uuidv4(), softwareId: software[0].ID, assetId: assets[4].ID, installedDate: '2024-06-01T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[0].ID, assetId: assets[5].ID, installedDate: '2024-06-01T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[0].ID, assetId: assets[6].ID, installedDate: '2024-06-01T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[1].ID, assetId: assets[4].ID, installedDate: '2024-06-15T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[1].ID, assetId: assets[5].ID, installedDate: '2024-06-15T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[1].ID, assetId: assets[6].ID, installedDate: '2024-06-15T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[3].ID, assetId: assets[4].ID, installedDate: '2024-06-01T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[3].ID, assetId: assets[5].ID, installedDate: '2024-06-01T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[3].ID, assetId: assets[6].ID, installedDate: '2024-06-01T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[4].ID, assetId: assets[4].ID, installedDate: '2024-07-01T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[4].ID, assetId: assets[5].ID, installedDate: '2024-07-01T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[2].ID, assetId: assets[6].ID, installedDate: '2024-08-01T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[5].ID, assetId: assets[4].ID, installedDate: '2024-09-01T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[5].ID, assetId: assets[5].ID, installedDate: '2024-09-01T00:00:00Z', status: 'Installed' },
  { id: uuidv4(), softwareId: software[5].ID, assetId: assets[6].ID, installedDate: '2024-09-01T00:00:00Z', status: 'Installed' },
];

// Ticket comments
const ticketComments = [
  { id: uuidv4(), ticketId: tickets[0].ID, text: 'Investigating VPN gateway logs now', author: 'bob.wilson', createdDate: '2026-03-25T09:00:00Z' },
  { id: uuidv4(), ticketId: tickets[0].ID, text: 'Found high CPU on VPN concentrator, restarting service', author: 'bob.wilson', createdDate: '2026-03-25T12:00:00Z' },
  { id: uuidv4(), ticketId: tickets[2].ID, text: 'Password reset completed, account unlocked', author: 'admin', createdDate: '2026-03-24T16:25:00Z' },
  { id: uuidv4(), ticketId: tickets[4].ID, text: 'Checking Outlook profile and add-ins', author: 'bob.wilson', createdDate: '2026-03-26T09:00:00Z' },
  { id: uuidv4(), ticketId: tickets[4].ID, text: 'Disabled third-party add-in causing the crash, monitoring', author: 'bob.wilson', createdDate: '2026-03-26T10:00:00Z' },
  { id: uuidv4(), ticketId: tickets[5].ID, text: 'Printer was offline, power cycled and back online', author: 'bob.wilson', createdDate: '2026-03-23T15:30:00Z' },
  { id: uuidv4(), ticketId: tickets[7].ID, text: 'AD account created, setting up group memberships', author: 'admin', createdDate: '2026-03-22T10:00:00Z' },
];

// User-group mappings
const userGroupMappings = [
  { id: uuidv4(), userId: employees[0].ID, groupName: 'Domain Admins', status: 'Active', assignedDate: '2023-01-15T00:00:00Z' },
  { id: uuidv4(), userId: employees[0].ID, groupName: 'GRP-Server-Admins', status: 'Active', assignedDate: '2023-01-15T00:00:00Z' },
  { id: uuidv4(), userId: employees[1].ID, groupName: 'GRP-Server-Admins', status: 'Active', assignedDate: '2023-02-01T00:00:00Z' },
  { id: uuidv4(), userId: employees[1].ID, groupName: 'GRP-VPN-Admins', status: 'Active', assignedDate: '2023-02-01T00:00:00Z' },
  { id: uuidv4(), userId: employees[2].ID, groupName: 'GRP-Developers', status: 'Active', assignedDate: '2023-03-01T00:00:00Z' },
  { id: uuidv4(), userId: employees[2].ID, groupName: 'GRP-RDP-Admins', status: 'Active', assignedDate: '2026-03-24T09:00:00Z' },
  { id: uuidv4(), userId: employees[3].ID, groupName: 'GRP-Finance', status: 'Active', assignedDate: '2023-03-01T00:00:00Z' },
  { id: uuidv4(), userId: employees[4].ID, groupName: 'GRP-Management', status: 'Active', assignedDate: '2023-01-15T00:00:00Z' },
  { id: uuidv4(), userId: employees[6].ID, groupName: 'GRP-Developers', status: 'Pending', assignedDate: null },
];

// Asset compliance
const assetCompliance = [
  { id: uuidv4(), assetId: assets[0].ID, antivirusInstalled: true, antivirusUpToDate: true, osPatched: true, encryptionEnabled: true, lastScan: '2026-03-26T06:00:00Z', complianceScore: 100, status: 'Compliant' },
  { id: uuidv4(), assetId: assets[1].ID, antivirusInstalled: true, antivirusUpToDate: true, osPatched: true, encryptionEnabled: true, lastScan: '2026-03-26T06:00:00Z', complianceScore: 100, status: 'Compliant' },
  { id: uuidv4(), assetId: assets[2].ID, antivirusInstalled: true, antivirusUpToDate: false, osPatched: true, encryptionEnabled: true, lastScan: '2026-03-25T06:00:00Z', complianceScore: 75, status: 'NonCompliant' },
  { id: uuidv4(), assetId: assets[3].ID, antivirusInstalled: true, antivirusUpToDate: true, osPatched: true, encryptionEnabled: true, lastScan: '2026-03-26T06:00:00Z', complianceScore: 100, status: 'Compliant' },
  { id: uuidv4(), assetId: assets[4].ID, antivirusInstalled: true, antivirusUpToDate: true, osPatched: true, encryptionEnabled: true, lastScan: '2026-03-26T06:00:00Z', complianceScore: 100, status: 'Compliant' },
  { id: uuidv4(), assetId: assets[5].ID, antivirusInstalled: true, antivirusUpToDate: true, osPatched: false, encryptionEnabled: true, lastScan: '2026-03-26T06:00:00Z', complianceScore: 75, status: 'NonCompliant' },
  { id: uuidv4(), assetId: assets[6].ID, antivirusInstalled: true, antivirusUpToDate: true, osPatched: true, encryptionEnabled: false, lastScan: '2026-03-26T06:00:00Z', complianceScore: 75, status: 'NonCompliant' },
  { id: uuidv4(), assetId: assets[7].ID, antivirusInstalled: false, antivirusUpToDate: false, osPatched: false, encryptionEnabled: false, lastScan: '2026-03-10T06:00:00Z', complianceScore: 0, status: 'NonCompliant' },
];

// Provisioning workflows
const provisioningWorkflows = [
  {
    id: uuidv4(), type: 'onboarding', userId: employees[6].ID, userName: 'tom.developer',
    status: 'completed', createdDate: '2026-03-20T09:00:00Z', completedDate: '2026-03-25T11:00:00Z',
    params: { department: 'Engineering', manager: 'john.doe' }
  },
  {
    id: uuidv4(), type: 'offboarding', userId: employees[7].ID, userName: 'lisa.leaving',
    status: 'in-progress', createdDate: '2026-03-24T10:00:00Z', completedDate: null,
    params: { lastDay: '2026-03-31', revokeAccess: true }
  },
  {
    id: uuidv4(), type: 'access-change', userId: employees[2].ID, userName: 'john.doe',
    status: 'pending', createdDate: '2026-03-26T14:00:00Z', completedDate: null,
    params: { addGroups: ['GRP-DB-ReadOnly'], removeGroups: [], justification: 'Need read access for reporting' }
  },
];

const workflowSteps = [
  // Onboarding for tom.developer (completed)
  { id: uuidv4(), workflowId: provisioningWorkflows[0].id, stepNumber: 1, name: 'Create AD account', status: 'completed', completedDate: '2026-03-20T10:00:00Z' },
  { id: uuidv4(), workflowId: provisioningWorkflows[0].id, stepNumber: 2, name: 'Add to security groups', status: 'completed', completedDate: '2026-03-21T09:00:00Z' },
  { id: uuidv4(), workflowId: provisioningWorkflows[0].id, stepNumber: 3, name: 'Configure PAM access', status: 'completed', completedDate: '2026-03-22T11:00:00Z' },
  { id: uuidv4(), workflowId: provisioningWorkflows[0].id, stepNumber: 4, name: 'Assign assets', status: 'completed', completedDate: '2026-03-24T09:00:00Z' },
  { id: uuidv4(), workflowId: provisioningWorkflows[0].id, stepNumber: 5, name: 'Send welcome email', status: 'completed', completedDate: '2026-03-25T11:00:00Z' },
  // Offboarding for lisa.leaving (in-progress)
  { id: uuidv4(), workflowId: provisioningWorkflows[1].id, stepNumber: 1, name: 'Disable AD account', status: 'completed', completedDate: '2026-03-25T09:00:00Z' },
  { id: uuidv4(), workflowId: provisioningWorkflows[1].id, stepNumber: 2, name: 'Remove from security groups', status: 'completed', completedDate: '2026-03-25T10:00:00Z' },
  { id: uuidv4(), workflowId: provisioningWorkflows[1].id, stepNumber: 3, name: 'Revoke PAM access', status: 'in-progress', completedDate: null },
  { id: uuidv4(), workflowId: provisioningWorkflows[1].id, stepNumber: 4, name: 'Reclaim assets', status: 'pending', completedDate: null },
  { id: uuidv4(), workflowId: provisioningWorkflows[1].id, stepNumber: 5, name: 'Archive mailbox', status: 'pending', completedDate: null },
  // Access-change for john.doe (pending)
  { id: uuidv4(), workflowId: provisioningWorkflows[2].id, stepNumber: 1, name: 'Validate request approval', status: 'pending', completedDate: null },
  { id: uuidv4(), workflowId: provisioningWorkflows[2].id, stepNumber: 2, name: 'Add to security groups', status: 'pending', completedDate: null },
  { id: uuidv4(), workflowId: provisioningWorkflows[2].id, stepNumber: 3, name: 'Configure PAM access', status: 'pending', completedDate: null },
  { id: uuidv4(), workflowId: provisioningWorkflows[2].id, stepNumber: 4, name: 'Notify user', status: 'pending', completedDate: null },
];

module.exports = {
  dataDefinitions,
  employees, assets, software, tickets, categories,
  accessRequests,
  assetAssignments, softwareInstallations, ticketComments,
  userGroupMappings, assetCompliance,
  provisioningWorkflows, workflowSteps
};
