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
  { ID: uuidv4(), Name: 'Windows 11 Enterprise', Version: '23H2', Vendor: 'Microsoft', LicenseType: 'Volume', Status: 'Active' },
  { ID: uuidv4(), Name: 'Matrix42 Agent', Version: '8.2.1', Vendor: 'Matrix42', LicenseType: 'Subscription', Status: 'Active' },
  { ID: uuidv4(), Name: 'SAP GUI', Version: '8.00', Vendor: 'SAP', LicenseType: 'Named', Status: 'Active' },
  { ID: uuidv4(), Name: 'Microsoft Office 365', Version: '2024', Vendor: 'Microsoft', LicenseType: 'Subscription', Status: 'Active' },
  { ID: uuidv4(), Name: 'Visual Studio Code', Version: '1.87', Vendor: 'Microsoft', LicenseType: 'Free', Status: 'Active' },
];

const tickets = [
  { ID: uuidv4(), TicketNumber: 'INC001', Title: 'VPN connection failing', Description: 'Users report intermittent VPN disconnects since morning', Status: 'InProgress', Priority: 2, AssignedTo: 'bob.wilson', Reporter: 'john.doe', Category: 'Network', CreatedDate: '2026-03-25T08:00:00Z', ModifiedDate: '2026-03-25T14:00:00Z', ResolvedDate: null },
  { ID: uuidv4(), TicketNumber: 'INC002', Title: 'New laptop request', Description: 'New hire starting April needs laptop provisioned', Status: 'New', Priority: 3, AssignedTo: null, Reporter: 'carol.jones', Category: 'Hardware', CreatedDate: '2026-03-26T09:00:00Z', ModifiedDate: '2026-03-26T09:00:00Z', ResolvedDate: null },
  { ID: uuidv4(), TicketNumber: 'INC003', Title: 'Password reset for ERP', Description: 'Account locked after failed login attempts', Status: 'Resolved', Priority: 1, AssignedTo: 'admin', Reporter: 'alice.smith', Category: 'User-Management', CreatedDate: '2026-03-24T16:00:00Z', ModifiedDate: '2026-03-24T16:30:00Z', ResolvedDate: '2026-03-24T16:30:00Z' },
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

module.exports = {
  dataDefinitions,
  employees, assets, software, tickets, categories,
  accessRequests
};
