const now = new Date().toISOString();
const domain = 'corp.local';
const baseDN = 'DC=corp,DC=local';

function userDN(cn, ou) { return `CN=${cn},${ou},${baseDN}`; }
function groupDN(cn, ou) { return `CN=${cn},${ou},${baseDN}`; }
function ouDN(path) { return `${path},${baseDN}`; }

const ous = [
  { distinguishedName: `OU=Users,${baseDN}`, name: 'Users', description: 'User accounts' },
  { distinguishedName: `OU=IT Department,OU=Users,${baseDN}`, name: 'IT Department', description: 'IT staff' },
  { distinguishedName: `OU=Finance,OU=Users,${baseDN}`, name: 'Finance', description: 'Finance department' },
  { distinguishedName: `OU=Engineering,OU=Users,${baseDN}`, name: 'Engineering', description: 'Engineering department' },
  { distinguishedName: `OU=Management,OU=Users,${baseDN}`, name: 'Management', description: 'Management' },
  { distinguishedName: `OU=Service Accounts,${baseDN}`, name: 'Service Accounts', description: 'Service accounts' },
  { distinguishedName: `OU=Security Groups,${baseDN}`, name: 'Security Groups', description: 'Security groups' },
  { distinguishedName: `OU=Server Access,OU=Security Groups,${baseDN}`, name: 'Server Access', description: 'Server access groups' },
  { distinguishedName: `OU=Application Access,OU=Security Groups,${baseDN}`, name: 'Application Access', description: 'Application access groups' },
  { distinguishedName: `OU=Servers,${baseDN}`, name: 'Servers', description: 'Server computer objects' },
  { distinguishedName: `OU=Workstations,${baseDN}`, name: 'Workstations', description: 'Workstation computer objects' },
];

const grpRdpAdmins = `CN=GRP-RDP-Admins,OU=Server Access,OU=Security Groups,${baseDN}`;
const grpDbOps = `CN=GRP-DB-Operators,OU=Server Access,OU=Security Groups,${baseDN}`;
const grpSvcInt = `CN=GRP-SVC-Integration,OU=Application Access,OU=Security Groups,${baseDN}`;
const grpErp = `CN=GRP-ERP-Users,OU=Application Access,OU=Security Groups,${baseDN}`;
const grpVpn = `CN=GRP-VPN-Users,OU=Application Access,OU=Security Groups,${baseDN}`;
const grpItAdmins = `CN=GRP-IT-Admins,OU=Server Access,OU=Security Groups,${baseDN}`;

const userDefs = [
  { sam: 'admin', cn: 'Administrator', gn: 'Admin', sn: 'Account', dept: 'IT Department', title: 'Domain Administrator', ou: `OU=IT Department,OU=Users`, enabled: true, memberOf: [grpRdpAdmins, grpVpn, grpItAdmins] },
  { sam: 'j.doe', cn: 'John Doe', gn: 'John', sn: 'Doe', dept: 'Engineering', title: 'Senior Developer', ou: `OU=Engineering,OU=Users`, enabled: true, manager: 'c.jones', memberOf: [grpDbOps, grpErp, grpVpn] },
  { sam: 'a.smith', cn: 'Alice Smith', gn: 'Alice', sn: 'Smith', dept: 'Finance', title: 'Financial Analyst', ou: `OU=Finance,OU=Users`, enabled: true, manager: 'c.jones', memberOf: [grpDbOps, grpVpn] },
  { sam: 'b.wilson', cn: 'Bob Wilson', gn: 'Bob', sn: 'Wilson', dept: 'IT Department', title: 'System Administrator', ou: `OU=IT Department,OU=Users`, enabled: true, manager: 'admin', memberOf: [grpRdpAdmins, grpVpn, grpItAdmins] },
  { sam: 'c.jones', cn: 'Carol Jones', gn: 'Carol', sn: 'Jones', dept: 'Management', title: 'CTO', ou: `OU=Management,OU=Users`, enabled: true, memberOf: [grpErp, grpVpn] },
  { sam: 'svc-integration', cn: 'Service Integration', gn: 'Service', sn: 'Integration', dept: 'IT Department', title: 'Service Account', ou: `OU=Service Accounts`, enabled: true, memberOf: [grpSvcInt, grpItAdmins] },
  { sam: 'svc-fudo-sync', cn: 'Fudo Sync Service', gn: 'Fudo', sn: 'Sync', dept: 'IT Department', title: 'Service Account', ou: `OU=Service Accounts`, enabled: true, memberOf: [] },
  { sam: 'svc-matrix42', cn: 'Matrix42 Service', gn: 'Matrix42', sn: 'Service', dept: 'IT Department', title: 'Service Account', ou: `OU=Service Accounts`, enabled: true, memberOf: [] },
  { sam: 't.developer', cn: 'Tom Developer', gn: 'Tom', sn: 'Developer', dept: 'Engineering', title: 'Junior Developer', ou: `OU=Engineering,OU=Users`, enabled: true, manager: 'j.doe', memberOf: [grpVpn] },
  { sam: 'l.leaving', cn: 'Lisa Leaving', gn: 'Lisa', sn: 'Leaving', dept: 'Finance', title: 'Accountant', ou: `OU=Finance,OU=Users`, enabled: false, manager: 'a.smith', memberOf: [grpVpn] },
];

const users = userDefs.map(u => {
  const dn = `CN=${u.cn},${u.ou},${baseDN}`;
  const managerDN = u.manager ? userDefs.find(m => m.sam === u.manager) : null;
  return {
    distinguishedName: dn,
    sAMAccountName: u.sam,
    userPrincipalName: `${u.sam}@${domain}`,
    cn: u.cn,
    givenName: u.gn,
    sn: u.sn,
    displayName: u.cn,
    mail: `${u.sam}@${domain}`,
    department: u.dept,
    title: u.title,
    manager: managerDN ? `CN=${managerDN.cn},${managerDN.ou},${baseDN}` : null,
    memberOf: [...u.memberOf],
    enabled: u.enabled,
    lastLogon: u.enabled ? now : null,
    whenCreated: now,
    whenChanged: now,
    accountExpires: u.sam === 'l.leaving' ? '2026-03-01T00:00:00Z' : null,
  };
});

const groupDefs = [
  { name: 'GRP-RDP-Admins', ou: 'OU=Server Access,OU=Security Groups', desc: 'Remote Desktop administrators for servers', scope: 'global', members: ['admin', 'b.wilson'] },
  { name: 'GRP-DB-Operators', ou: 'OU=Server Access,OU=Security Groups', desc: 'Database operations team', scope: 'global', members: ['j.doe', 'a.smith'] },
  { name: 'GRP-SVC-Integration', ou: 'OU=Application Access,OU=Security Groups', desc: 'Integration service accounts', scope: 'global', members: ['svc-integration'] },
  { name: 'GRP-ERP-Users', ou: 'OU=Application Access,OU=Security Groups', desc: 'ERP application users', scope: 'global', members: ['j.doe', 'c.jones'] },
  { name: 'GRP-VPN-Users', ou: 'OU=Application Access,OU=Security Groups', desc: 'VPN access users', scope: 'global', members: ['admin', 'j.doe', 'a.smith', 'b.wilson', 'c.jones', 't.developer', 'l.leaving'] },
  { name: 'GRP-IT-Admins', ou: 'OU=Server Access,OU=Security Groups', desc: 'IT administrators', scope: 'global', members: ['admin', 'b.wilson', 'svc-integration'] },
];

const groups = groupDefs.map(g => {
  const memberDNs = g.members.map(sam => {
    const u = users.find(u => u.sAMAccountName === sam);
    return u ? u.distinguishedName : null;
  }).filter(Boolean);
  return {
    distinguishedName: `CN=${g.name},${g.ou},${baseDN}`,
    cn: g.name,
    sAMAccountName: g.name,
    groupType: 'security',
    groupScope: g.scope,
    description: g.desc,
    members: memberDNs,
    managedBy: null,
    whenCreated: now,
    whenChanged: now,
  };
});

const computers = [
  { name: 'DC01', os: 'Windows Server 2022', ou: 'Servers', desc: 'Domain Controller' },
  { name: 'DB-PROD', os: 'Ubuntu 22.04', ou: 'Servers', desc: 'Production Database Server' },
  { name: 'APP-ERP', os: 'RHEL 9', ou: 'Servers', desc: 'ERP Application Server' },
  { name: 'FILE-SRV01', os: 'Windows Server 2022', ou: 'Servers', desc: 'File Server' },
  { name: 'WKS-ENG-01', os: 'Windows 11', ou: 'Workstations', desc: 'Engineering Workstation 1' },
  { name: 'WKS-ENG-02', os: 'Windows 11', ou: 'Workstations', desc: 'Engineering Workstation 2' },
  { name: 'WKS-FIN-01', os: 'Windows 11', ou: 'Workstations', desc: 'Finance Workstation 1' },
].map(c => ({
  distinguishedName: `CN=${c.name},OU=${c.ou},${baseDN}`,
  cn: c.name,
  sAMAccountName: `${c.name}$`,
  operatingSystem: c.os,
  description: c.desc,
  enabled: true,
  whenCreated: now,
  whenChanged: now,
}));

const domainInfo = {
  name: domain,
  distinguishedName: baseDN,
  functionalLevel: 'Windows Server 2022',
  netbiosName: 'CORP',
  dnsRoot: domain,
  domainControllers: ['DC01.corp.local'],
  whenCreated: now,
};

module.exports = { users, groups, ous, computers, domainInfo };
