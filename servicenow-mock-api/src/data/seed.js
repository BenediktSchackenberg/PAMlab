const { v4: uuidv4 } = require('uuid');
const store = require('./store');

function sysId() {
  return uuidv4().replace(/-/g, '');
}

function now() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

function seed() {
  const ts = now();

  // ── sys_user ──
  const users = [
    { sys_id: sysId(), user_name: 'admin', first_name: 'System', last_name: 'Administrator', email: 'admin@pamlab.local', active: true, roles: 'admin', department: 'IT Operations' },
    { sys_id: sysId(), user_name: 'j.doe', first_name: 'John', last_name: 'Doe', email: 'j.doe@pamlab.local', active: true, roles: 'itil', department: 'IT Operations', title: 'Systems Administrator' },
    { sys_id: sysId(), user_name: 'a.smith', first_name: 'Alice', last_name: 'Smith', email: 'a.smith@pamlab.local', active: true, roles: 'itil', department: 'Engineering', title: 'Senior Developer' },
    { sys_id: sysId(), user_name: 'b.wilson', first_name: 'Bob', last_name: 'Wilson', email: 'b.wilson@pamlab.local', active: true, roles: 'itil', department: 'Engineering', title: 'DevOps Engineer' },
    { sys_id: sysId(), user_name: 'c.jones', first_name: 'Carol', last_name: 'Jones', email: 'c.jones@pamlab.local', active: true, roles: 'itil,admin', department: 'Management', title: 'IT Manager' },
    { sys_id: sysId(), user_name: 'svc-integration', first_name: 'Service', last_name: 'Integration', email: 'svc-integration@pamlab.local', active: true, roles: 'web_service_admin', department: 'IT Operations' },
    { sys_id: sysId(), user_name: 'svc-fudo-sync', first_name: 'Fudo', last_name: 'Sync Service', email: 'svc-fudo-sync@pamlab.local', active: true, roles: 'web_service_admin', department: 'IT Operations' },
    { sys_id: sysId(), user_name: 'svc-matrix42', first_name: 'Matrix42', last_name: 'Sync Service', email: 'svc-matrix42@pamlab.local', active: true, roles: 'web_service_admin', department: 'IT Operations' },
    { sys_id: sysId(), user_name: 't.developer', first_name: 'Tom', last_name: 'Developer', email: 't.developer@pamlab.local', active: true, roles: 'itil', department: 'Engineering', title: 'Junior Developer' },
    { sys_id: sysId(), user_name: 'l.leaving', first_name: 'Lisa', last_name: 'Leaving', email: 'l.leaving@pamlab.local', active: false, roles: 'itil', department: 'Finance', title: 'Accountant' },
  ].map(u => ({ ...u, sys_created_on: ts, sys_updated_on: ts, sys_created_by: 'admin' }));
  store.tables.sys_user = users;

  const userMap = {};
  users.forEach(u => { userMap[u.user_name] = u.sys_id; });

  // ── sys_user_group ──
  const groups = [
    { sys_id: sysId(), name: 'IT Operations', description: 'IT Operations team', manager: userMap['j.doe'] },
    { sys_id: sysId(), name: 'Engineering', description: 'Engineering team', manager: userMap['a.smith'] },
    { sys_id: sysId(), name: 'Finance', description: 'Finance department', manager: userMap['c.jones'] },
    { sys_id: sysId(), name: 'Management', description: 'Management team', manager: userMap['c.jones'] },
    { sys_id: sysId(), name: 'Service Desk', description: 'Service Desk team', manager: userMap['j.doe'] },
    { sys_id: sysId(), name: 'Security', description: 'Security team', manager: userMap['b.wilson'] },
    { sys_id: sysId(), name: 'CAB', description: 'Change Advisory Board', manager: userMap['c.jones'] },
  ].map(g => ({ ...g, sys_created_on: ts, sys_updated_on: ts, sys_created_by: 'admin', active: true }));
  store.tables.sys_user_group = groups;

  const groupMap = {};
  groups.forEach(g => { groupMap[g.name] = g.sys_id; });

  // ── sys_user_grmember ──
  store.tables.sys_user_grmember = [
    { sys_id: sysId(), group: groupMap['IT Operations'], user: userMap['j.doe'] },
    { sys_id: sysId(), group: groupMap['IT Operations'], user: userMap['b.wilson'] },
    { sys_id: sysId(), group: groupMap['Engineering'], user: userMap['a.smith'] },
    { sys_id: sysId(), group: groupMap['Engineering'], user: userMap['t.developer'] },
    { sys_id: sysId(), group: groupMap['Finance'], user: userMap['l.leaving'] },
    { sys_id: sysId(), group: groupMap['Management'], user: userMap['c.jones'] },
    { sys_id: sysId(), group: groupMap['Service Desk'], user: userMap['j.doe'] },
    { sys_id: sysId(), group: groupMap['Security'], user: userMap['b.wilson'] },
    { sys_id: sysId(), group: groupMap['CAB'], user: userMap['c.jones'] },
    { sys_id: sysId(), group: groupMap['CAB'], user: userMap['j.doe'] },
    { sys_id: sysId(), group: groupMap['CAB'], user: userMap['b.wilson'] },
  ].map(m => ({ ...m, sys_created_on: ts, sys_updated_on: ts, sys_created_by: 'admin' }));

  // ── cmdb_ci_server ──
  const servers = [
    { sys_id: sysId(), name: 'DC01', ip_address: '10.0.1.10', os: 'Windows Server 2022', os_version: '21H2', classification: 'Production', operational_status: 1, sys_class_name: 'cmdb_ci_server', category: 'Server', subcategory: 'Domain Controller', assigned_to: userMap['j.doe'], managed_by: userMap['j.doe'], location: 'DC1-Rack-A1' },
    { sys_id: sysId(), name: 'DB-PROD', ip_address: '10.0.1.20', os: 'Ubuntu', os_version: '22.04 LTS', classification: 'Production', operational_status: 1, sys_class_name: 'cmdb_ci_server', category: 'Server', subcategory: 'Database', assigned_to: userMap['a.smith'], managed_by: userMap['j.doe'], location: 'DC1-Rack-A2' },
    { sys_id: sysId(), name: 'APP-ERP', ip_address: '10.0.1.30', os: 'Red Hat Enterprise Linux', os_version: '9', classification: 'Production', operational_status: 1, sys_class_name: 'cmdb_ci_server', category: 'Server', subcategory: 'Application', assigned_to: userMap['a.smith'], managed_by: userMap['j.doe'], location: 'DC1-Rack-B1' },
    { sys_id: sysId(), name: 'FILE-SRV01', ip_address: '10.0.1.40', os: 'Windows Server 2022', os_version: '21H2', classification: 'Production', operational_status: 1, sys_class_name: 'cmdb_ci_server', category: 'Server', subcategory: 'File Server', assigned_to: userMap['j.doe'], managed_by: userMap['j.doe'], location: 'DC1-Rack-B2' },
    { sys_id: sysId(), name: 'FUDO-PAM', ip_address: '10.0.1.50', os: 'Fudo PAM Appliance', os_version: '6.1', classification: 'Production', operational_status: 1, sys_class_name: 'cmdb_ci_server', category: 'Server', subcategory: 'Security Appliance', assigned_to: userMap['b.wilson'], managed_by: userMap['b.wilson'], location: 'DC1-Rack-C1' },
  ].map(s => ({ ...s, sys_created_on: ts, sys_updated_on: ts, sys_created_by: 'admin' }));
  store.tables.cmdb_ci_server = servers;

  const ciMap = {};
  servers.forEach(s => { ciMap[s.name] = s.sys_id; });

  // ── cmdb_rel_ci ──
  store.tables.cmdb_rel_ci = [
    { sys_id: sysId(), parent: ciMap['APP-ERP'], child: ciMap['DB-PROD'], type: 'depends_on', type_display: 'Depends on::Used by' },
    { sys_id: sysId(), parent: ciMap['APP-ERP'], child: ciMap['DC01'], type: 'depends_on', type_display: 'Depends on::Used by' },
    { sys_id: sysId(), parent: ciMap['FUDO-PAM'], child: ciMap['DC01'], type: 'depends_on', type_display: 'Depends on::Used by' },
    { sys_id: sysId(), parent: ciMap['FUDO-PAM'], child: ciMap['DB-PROD'], type: 'managed_by', type_display: 'Manages::Managed by' },
    { sys_id: sysId(), parent: ciMap['FUDO-PAM'], child: ciMap['APP-ERP'], type: 'managed_by', type_display: 'Manages::Managed by' },
    { sys_id: sysId(), parent: ciMap['FUDO-PAM'], child: ciMap['FILE-SRV01'], type: 'managed_by', type_display: 'Manages::Managed by' },
    { sys_id: sysId(), parent: ciMap['FILE-SRV01'], child: ciMap['DC01'], type: 'runs_on', type_display: 'Runs on::Runs' },
  ].map(r => ({ ...r, sys_created_on: ts, sys_updated_on: ts, sys_created_by: 'admin' }));

  // ── incident ──
  store.tables.incident = [
    { sys_id: sysId(), number: 'INC0001', short_description: 'Database server unreachable', description: 'DB-PROD (10.0.1.20) is not responding to health checks. All applications depending on this server are affected.', priority: 1, impact: 1, urgency: 1, state: 1, category: 'Hardware', subcategory: 'Server', assignment_group: groupMap['IT Operations'], assigned_to: userMap['j.doe'], caller_id: userMap['a.smith'], cmdb_ci: ciMap['DB-PROD'], severity: 1 },
    { sys_id: sysId(), number: 'INC0002', short_description: 'VPN authentication failures', description: 'Multiple users reporting VPN authentication failures since 08:00. Affects remote workers. Correlates with Matrix42 INC001.', priority: 2, impact: 2, urgency: 1, state: 2, category: 'Network', subcategory: 'VPN', assignment_group: groupMap['IT Operations'], assigned_to: userMap['j.doe'], caller_id: userMap['c.jones'], cmdb_ci: ciMap['DC01'], severity: 2 },
    { sys_id: sysId(), number: 'INC0003', short_description: 'ERP application slow response', description: 'ERP application response times exceeding 10 seconds. Users in Finance department most affected.', priority: 3, impact: 2, urgency: 2, state: 2, category: 'Application', subcategory: 'Performance', assignment_group: groupMap['Engineering'], assigned_to: userMap['a.smith'], caller_id: userMap['l.leaving'], cmdb_ci: ciMap['APP-ERP'], severity: 3 },
    { sys_id: sysId(), number: 'INC0004', short_description: 'Printer not responding Floor 2', description: 'Floor 2 network printer is offline. Low impact, affects ~10 users.', priority: 4, impact: 3, urgency: 3, state: 1, category: 'Hardware', subcategory: 'Printer', assignment_group: groupMap['Service Desk'], assigned_to: userMap['j.doe'], caller_id: userMap['t.developer'], severity: 4 },
    { sys_id: sysId(), number: 'INC0005', short_description: 'Fudo PAM session recording gap detected', description: 'Gap in session recordings detected between 02:00-04:00. Security audit compliance risk. Fudo PAM appliance may have restarted unexpectedly.', priority: 2, impact: 1, urgency: 2, state: 2, category: 'Security', subcategory: 'Compliance', assignment_group: groupMap['Security'], assigned_to: userMap['b.wilson'], caller_id: userMap['svc-fudo-sync'], cmdb_ci: ciMap['FUDO-PAM'], severity: 2 },
    { sys_id: sysId(), number: 'INC0006', short_description: 'Password rotation failed for svc accounts', description: 'Scheduled password rotation for service accounts svc-integration and svc-matrix42 failed. Manual intervention required.', priority: 3, impact: 2, urgency: 2, state: 1, category: 'Security', subcategory: 'Access', assignment_group: groupMap['Security'], assigned_to: userMap['b.wilson'], caller_id: userMap['svc-fudo-sync'], cmdb_ci: ciMap['FUDO-PAM'], severity: 3 },
  ].map(i => ({ ...i, sys_created_on: ts, sys_updated_on: ts, sys_created_by: 'admin', opened_at: ts, opened_by: i.caller_id || userMap['admin'] }));

  // ── change_request ──
  store.tables.change_request = [
    { sys_id: sysId(), number: 'CHG0001', short_description: 'Upgrade Fudo PAM to v6.2', description: 'Upgrade Fudo PAM appliance from v6.1 to v6.2. Includes security patches and new MFA integration features.', type: 'normal', state: -2, priority: 2, impact: 2, urgency: 2, risk: 'moderate', category: 'Software', assignment_group: groupMap['Security'], assigned_to: userMap['b.wilson'], requested_by: userMap['c.jones'], cmdb_ci: ciMap['FUDO-PAM'], start_date: '2026-04-01 02:00:00', end_date: '2026-04-01 06:00:00', cab_required: true, approval: 'approved' },
    { sys_id: sysId(), number: 'CHG0002', short_description: 'Patch critical vulnerability on DC01', description: 'Emergency patch for CVE-2026-1234 on Domain Controller DC01. Critical vulnerability in Active Directory services.', type: 'emergency', state: -1, priority: 1, impact: 1, urgency: 1, risk: 'high', category: 'Software', assignment_group: groupMap['IT Operations'], assigned_to: userMap['j.doe'], requested_by: userMap['b.wilson'], cmdb_ci: ciMap['DC01'], start_date: '2026-03-28 00:00:00', end_date: '2026-03-28 04:00:00', cab_required: false, approval: 'approved' },
    { sys_id: sysId(), number: 'CHG0003', short_description: 'Add new server to PAM monitoring', description: 'Add FILE-SRV01 to Fudo PAM monitoring scope. Standard change following approved template.', type: 'standard', state: -2, priority: 3, impact: 3, urgency: 3, risk: 'low', category: 'Configuration', assignment_group: groupMap['Security'], assigned_to: userMap['b.wilson'], requested_by: userMap['j.doe'], cmdb_ci: ciMap['FILE-SRV01'], start_date: '2026-04-05 10:00:00', end_date: '2026-04-05 12:00:00', cab_required: false, approval: 'approved' },
    { sys_id: sysId(), number: 'CHG0004', short_description: 'AD group restructuring for RBAC', description: 'Restructure Active Directory groups to align with new RBAC model. Affects all PAM-managed servers.', type: 'normal', state: -3, priority: 2, impact: 2, urgency: 2, risk: 'high', category: 'Configuration', assignment_group: groupMap['IT Operations'], assigned_to: userMap['j.doe'], requested_by: userMap['c.jones'], cmdb_ci: ciMap['DC01'], start_date: '2026-04-10 02:00:00', end_date: '2026-04-10 08:00:00', cab_required: true, approval: 'requested' },
  ].map(c => ({ ...c, sys_created_on: ts, sys_updated_on: ts, sys_created_by: 'admin', opened_at: ts }));

  // ── sc_request / sc_req_item ──
  const req1Id = sysId(), req2Id = sysId(), req3Id = sysId();
  store.tables.sc_request = [
    { sys_id: req1Id, number: 'REQ0001', short_description: 'Privileged access request for new engineer', description: 'New engineer Tom Developer needs privileged access to APP-ERP and DB-PROD for deployment tasks.', state: 2, priority: 3, requested_for: userMap['t.developer'], opened_by: userMap['c.jones'], approval: 'approved', stage: 'fulfillment' },
    { sys_id: req2Id, number: 'REQ0002', short_description: 'Emergency access revocation', description: 'Revoke all privileged access for Lisa Leaving immediately. Employee termination in progress.', state: 2, priority: 1, requested_for: userMap['l.leaving'], opened_by: userMap['c.jones'], approval: 'approved', stage: 'fulfillment' },
    { sys_id: req3Id, number: 'REQ0003', short_description: 'Password vault onboarding', description: 'Onboard service accounts svc-integration and svc-matrix42 into Fudo PAM password vault.', state: 1, priority: 3, requested_for: userMap['svc-integration'], opened_by: userMap['b.wilson'], approval: 'requested', stage: 'request_approved' },
  ].map(r => ({ ...r, sys_created_on: ts, sys_updated_on: ts, sys_created_by: 'admin' }));

  store.tables.sc_req_item = [
    { sys_id: sysId(), number: 'RITM0001', request: req1Id, short_description: 'Grant SSH access to APP-ERP', state: 2, assigned_to: userMap['b.wilson'], assignment_group: groupMap['Security'], cmdb_ci: ciMap['APP-ERP'], stage: 'fulfillment' },
    { sys_id: sysId(), number: 'RITM0002', request: req1Id, short_description: 'Grant DB access to DB-PROD', state: 2, assigned_to: userMap['b.wilson'], assignment_group: groupMap['Security'], cmdb_ci: ciMap['DB-PROD'], stage: 'fulfillment' },
    { sys_id: sysId(), number: 'RITM0003', request: req2Id, short_description: 'Revoke all Fudo PAM access for l.leaving', state: 2, assigned_to: userMap['b.wilson'], assignment_group: groupMap['Security'], stage: 'fulfillment' },
    { sys_id: sysId(), number: 'RITM0004', request: req3Id, short_description: 'Onboard svc-integration to password vault', state: 1, assigned_to: userMap['b.wilson'], assignment_group: groupMap['Security'], stage: 'waiting_for_approval' },
    { sys_id: sysId(), number: 'RITM0005', request: req3Id, short_description: 'Onboard svc-matrix42 to password vault', state: 1, assigned_to: userMap['b.wilson'], assignment_group: groupMap['Security'], stage: 'waiting_for_approval' },
  ].map(r => ({ ...r, sys_created_on: ts, sys_updated_on: ts, sys_created_by: 'admin', priority: 3 }));

  console.log(`[SEED] Loaded: ${store.tables.sys_user.length} users, ${store.tables.sys_user_group.length} groups, ${store.tables.incident.length} incidents, ${store.tables.change_request.length} changes, ${store.tables.cmdb_ci_server.length} CIs, ${store.tables.sc_request.length} requests`);
}

module.exports = seed;
