import type { Scenario } from '../types';

export const scenarios: Scenario[] = [
  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'Provision a new employee with AD account, server access via Fudo PAM, and ESM service catalog entry.',
    systems: ['Active Directory', 'Fudo PAM', 'Matrix42 ESM'],
    steps: [
      'Create AD user account',
      'Add user to security groups',
      'Create Fudo PAM user',
      'Assign server access in Fudo',
      'Create ESM ticket for onboarding',
    ],
    template: `# Onboarding Scenario
$fudoBase = "http://localhost:8443"
$matrixBase = "http://localhost:8444"
$adBase = "http://localhost:8445"

# Step 1: Create AD User
$adUser = @{
  username = "jdoe"
  firstName = "John"
  lastName = "Doe"
  email = "jdoe@corp.local"
  department = "Engineering"
}
Invoke-RestMethod -Uri "$adBase/api/users" -Method POST -Body ($adUser | ConvertTo-Json) -ContentType "application/json"

# Step 2: Add to Groups
Invoke-RestMethod -Uri "$adBase/api/groups/engineers/members" -Method POST -Body '{"username":"jdoe"}' -ContentType "application/json"

# Step 3: Create Fudo PAM User
$pamUser = @{
  name = "jdoe"
  email = "jdoe@corp.local"
}
Invoke-RestMethod -Uri "$fudoBase/api/v2/users" -Method POST -Body ($pamUser | ConvertTo-Json) -ContentType "application/json"

# Step 4: Create Access Request
$request = @{
  user_id = 1
  server_id = 1
  justification = "New employee onboarding"
}
Invoke-RestMethod -Uri "$fudoBase/api/v2/access-requests" -Method POST -Body ($request | ConvertTo-Json) -ContentType "application/json"

# Step 5: Create ESM Ticket
$ticket = @{
  title = "Onboarding: John Doe"
  description = "New employee onboarding - Engineering"
  priority = "medium"
  category = "onboarding"
}
Invoke-RestMethod -Uri "$matrixBase/api/tickets" -Method POST -Body ($ticket | ConvertTo-Json) -ContentType "application/json"
`,
  },
  {
    id: 'offboarding',
    name: 'Offboarding',
    description: 'Revoke all access for a departing employee across all systems.',
    systems: ['Active Directory', 'Fudo PAM', 'Matrix42 ESM'],
    steps: [
      'Disable AD account',
      'Remove from all groups',
      'Revoke Fudo PAM sessions',
      'Delete Fudo PAM user',
      'Create ESM offboarding ticket',
    ],
    template: `# Offboarding Scenario
$fudoBase = "http://localhost:8443"
$matrixBase = "http://localhost:8444"
$adBase = "http://localhost:8445"

# Step 1: Disable AD Account
Invoke-RestMethod -Uri "$adBase/api/users/jdoe/disable" -Method POST -ContentType "application/json"

# Step 2: Remove from Groups
Invoke-RestMethod -Uri "$adBase/api/groups/engineers/members/jdoe" -Method DELETE

# Step 3: Revoke Active Sessions
Invoke-RestMethod -Uri "$fudoBase/api/v2/sessions/revoke" -Method POST -Body '{"user_id":1}' -ContentType "application/json"

# Step 4: Delete PAM User
Invoke-RestMethod -Uri "$fudoBase/api/v2/users/1" -Method DELETE

# Step 5: ESM Ticket
$ticket = @{
  title = "Offboarding: John Doe"
  description = "Employee departure - revoke all access"
  priority = "high"
  category = "offboarding"
}
Invoke-RestMethod -Uri "$matrixBase/api/tickets" -Method POST -Body ($ticket | ConvertTo-Json) -ContentType "application/json"
`,
  },
  {
    id: 'role-change',
    name: 'Role Change',
    description: 'Update group memberships and access when an employee changes roles.',
    systems: ['Active Directory', 'Fudo PAM'],
    steps: [
      'Remove from old groups',
      'Add to new groups',
      'Update Fudo access policies',
    ],
    template: `# Role Change Scenario
$fudoBase = "http://localhost:8443"
$adBase = "http://localhost:8445"

# Step 1: Remove from old group
Invoke-RestMethod -Uri "$adBase/api/groups/engineering/members/jdoe" -Method DELETE

# Step 2: Add to new group
Invoke-RestMethod -Uri "$adBase/api/groups/management/members" -Method POST -Body '{"username":"jdoe"}' -ContentType "application/json"

# Step 3: Update Fudo access
Invoke-RestMethod -Uri "$fudoBase/api/v2/access-requests" -Method POST -Body '{"user_id":1,"server_id":2,"justification":"Role change to management"}' -ContentType "application/json"
`,
  },
  {
    id: 'jit-access',
    name: 'JIT Access',
    description: 'Just-In-Time privileged access request with automatic expiry.',
    systems: ['Fudo PAM', 'Matrix42 ESM'],
    steps: [
      'Create access request with time limit',
      'Approve request',
      'Log ESM ticket',
    ],
    template: `# JIT Access Scenario
$fudoBase = "http://localhost:8443"
$matrixBase = "http://localhost:8444"

# Step 1: Create time-limited access request
$request = @{
  user_id = 1
  server_id = 1
  justification = "Emergency maintenance - 2h window"
  duration_minutes = 120
}
Invoke-RestMethod -Uri "$fudoBase/api/v2/access-requests" -Method POST -Body ($request | ConvertTo-Json) -ContentType "application/json"

# Step 2: Approve request
Invoke-RestMethod -Uri "$fudoBase/api/v2/access-requests/1/approve" -Method POST -ContentType "application/json"

# Step 3: Log in ESM
$ticket = @{
  title = "JIT Access: Emergency Maintenance"
  description = "Time-limited access granted for 2 hours"
  priority = "high"
  category = "access-request"
}
Invoke-RestMethod -Uri "$matrixBase/api/tickets" -Method POST -Body ($ticket | ConvertTo-Json) -ContentType "application/json"
`,
  },
  {
    id: 'emergency-revoke',
    name: 'Emergency Revoke',
    description: 'Immediately revoke all sessions and access for a compromised account.',
    systems: ['Fudo PAM', 'Active Directory'],
    steps: [
      'Kill all active sessions',
      'Lock AD account',
      'Revoke all access',
    ],
    template: `# Emergency Revoke Scenario
$fudoBase = "http://localhost:8443"
$adBase = "http://localhost:8445"

# Step 1: Kill all active sessions
Invoke-RestMethod -Uri "$fudoBase/api/v2/sessions/revoke" -Method POST -Body '{"user_id":1}' -ContentType "application/json"

# Step 2: Lock AD Account
Invoke-RestMethod -Uri "$adBase/api/users/jdoe/disable" -Method POST -ContentType "application/json"

# Step 3: Revoke all pending access requests
Invoke-RestMethod -Uri "$fudoBase/api/v2/access-requests/revoke-all" -Method POST -Body '{"user_id":1}' -ContentType "application/json"
`,
  },
  {
    id: 'password-rotation',
    name: 'Password Rotation',
    description: 'Rotate passwords for service accounts across systems.',
    systems: ['Active Directory', 'Fudo PAM'],
    steps: [
      'Generate new password',
      'Update AD password',
      'Update Fudo credentials',
    ],
    template: `# Password Rotation Scenario
$fudoBase = "http://localhost:8443"
$adBase = "http://localhost:8445"

# Step 1: Reset AD Password
Invoke-RestMethod -Uri "$adBase/api/users/svc-account/reset-password" -Method POST -Body '{"newPassword":"NewSecure!Pass123"}' -ContentType "application/json"

# Step 2: Update Fudo PAM credentials
Invoke-RestMethod -Uri "$fudoBase/api/v2/servers/1/credentials" -Method PUT -Body '{"password":"NewSecure!Pass123"}' -ContentType "application/json"
`,
  },
  {
    id: 'snow-incident-auto',
    name: 'SNOW Incident from PAM Anomaly',
    description: 'Detect a Fudo PAM anomaly and automatically create a ServiceNow incident, then update CMDB.',
    systems: ['Fudo PAM', 'ServiceNow ITSM'],
    steps: [
      'Check Fudo PAM for anomalies',
      'Create SNOW incident from anomaly',
      'Link incident to CMDB CI',
      'Assign to IT Operations',
    ],
    template: `# ServiceNow Incident from PAM Anomaly
$fudoBase = "http://localhost:8443"
$snowBase = "http://localhost:8447"

# Auth headers
$fudoAuth = @{ Authorization = "Bearer pamlab-dev-token" }
$snowAuth = @{ Authorization = "Bearer pamlab-dev-token" }

# Step 1: Check Fudo PAM events for anomalies
$events = Invoke-RestMethod -Uri "$fudoBase/api/v2/events" -Headers $fudoAuth -Method GET
Write-Host "Found $($events.Count) events"

# Step 2: Create ServiceNow Incident
$incident = @{
    short_description = "PAM Anomaly: Unusual session pattern detected"
    description = "Fudo PAM detected unusual session activity from svc-integration account. Multiple failed authentication attempts followed by successful login from new IP."
    impact = 1
    urgency = 1
    category = "Security"
    subcategory = "Intrusion Detection"
    assigned_to = "b.wilson"
    caller_id = "svc-fudo-sync"
}
$result = Invoke-RestMethod -Uri "$snowBase/api/now/table/incident" -Headers $snowAuth -Method POST -Body ($incident | ConvertTo-Json) -ContentType "application/json"
Write-Host "Created incident: $($result.result.number)"

# Step 3: Query CMDB for affected server
$cmdb = Invoke-RestMethod -Uri "$snowBase/api/now/table/cmdb_ci_server?sysparm_query=name=FUDO-PAM" -Headers $snowAuth -Method GET
Write-Host "CMDB CI: $($cmdb.result[0].name) ($($cmdb.result[0].ip_address))"

# Step 4: Get incident stats
$stats = Invoke-RestMethod -Uri "$snowBase/api/now/incident/stats" -Headers $snowAuth -Method GET
Write-Host "Total open incidents: $($stats.result.total)"
`,
  },
  {
    id: 'snow-change-rotation',
    name: 'SNOW Change for Password Rotation',
    description: 'Create a ServiceNow change request for service account password rotation, get CAB approval, then execute.',
    systems: ['ServiceNow ITSM', 'Active Directory', 'Fudo PAM'],
    steps: [
      'Create SNOW change request',
      'Submit for CAB approval',
      'After approval: rotate AD password',
      'Update Fudo PAM credentials',
      'Close change request',
    ],
    template: `# ServiceNow Change Request for Password Rotation
$snowBase = "http://localhost:8447"
$adBase = "http://localhost:8445"
$fudoBase = "http://localhost:8443"

$snowAuth = @{ Authorization = "Bearer pamlab-dev-token" }

# Step 1: Create Change Request
$change = @{
    short_description = "Scheduled password rotation for service accounts"
    description = "Quarterly rotation of svc-integration and svc-fudo-sync passwords across AD and Fudo PAM"
    type = "Standard"
    risk = "Low"
    assignment_group = "IT Operations"
    requested_by = "admin"
}
$result = Invoke-RestMethod -Uri "$snowBase/api/now/table/change_request" -Headers $snowAuth -Method POST -Body ($change | ConvertTo-Json) -ContentType "application/json"
$chgSysId = $result.result.sys_id
Write-Host "Created change: $($result.result.number)"

# Step 2: CAB Approval
$approval = Invoke-RestMethod -Uri "$snowBase/api/now/change/approve/$chgSysId" -Headers $snowAuth -Method POST -Body '{"approval_notes":"Standard rotation - auto-approved"}' -ContentType "application/json"
Write-Host "Change approved"

# Step 3: Start Implementation
Invoke-RestMethod -Uri "$snowBase/api/now/change/implement/$chgSysId" -Headers $snowAuth -Method POST -ContentType "application/json"

# Step 4: Rotate AD password
$newPass = "RotatedPass_$(Get-Date -Format 'yyyyMMdd')!"
Invoke-RestMethod -Uri "$adBase/api/ad/users/svc-integration/reset-password" -Method POST -Body (@{newPassword=$newPass} | ConvertTo-Json) -ContentType "application/json"
Write-Host "AD password rotated"

# Step 5: Update Fudo PAM
Invoke-RestMethod -Uri "$fudoBase/api/v2/servers/1/credentials" -Method PUT -Body (@{password=$newPass} | ConvertTo-Json) -ContentType "application/json"
Write-Host "Fudo credentials updated"

# Step 6: Check change schedule
$schedule = Invoke-RestMethod -Uri "$snowBase/api/now/change/schedule" -Headers $snowAuth -Method GET
Write-Host "Upcoming changes: $($schedule.result.Count)"
`,
  },
  {
    id: 'snow-cmdb-sync',
    name: 'CMDB Sync & Discovery',
    description: 'Synchronize PAMlab infrastructure into ServiceNow CMDB and verify relationships.',
    systems: ['ServiceNow ITSM', 'Fudo PAM', 'Active Directory'],
    steps: [
      'Fetch servers from Fudo PAM',
      'Fetch computers from AD',
      'Query CMDB for existing CIs',
      'Verify CMDB topology',
      'Create catalog request for new server',
    ],
    template: `# CMDB Sync & Discovery
$snowBase = "http://localhost:8447"
$fudoBase = "http://localhost:8443"
$adBase = "http://localhost:8445"

$snowAuth = @{ Authorization = "Bearer pamlab-dev-token" }

# Step 1: Get Fudo PAM managed servers
$pamServers = Invoke-RestMethod -Uri "$fudoBase/api/v2/servers" -Headers @{Authorization="Bearer pamlab-dev-token"} -Method GET
Write-Host "PAM servers: $($pamServers.Count)"

# Step 2: Get AD computer objects
$adComputers = Invoke-RestMethod -Uri "$adBase/api/ad/computers" -Headers @{Authorization="Bearer pamlab-dev-token"} -Method GET
Write-Host "AD computers: $($adComputers.Count)"

# Step 3: Query CMDB servers
$cmdbServers = Invoke-RestMethod -Uri "$snowBase/api/now/table/cmdb_ci_server?sysparm_fields=name,ip_address,os,operational_status" -Headers $snowAuth -Method GET
Write-Host "CMDB CIs: $($cmdbServers.result.Count)"
foreach ($ci in $cmdbServers.result) {
    Write-Host "  $($ci.name) - $($ci.ip_address) [$($ci.os)]"
}

# Step 4: Get CMDB topology
$topology = Invoke-RestMethod -Uri "$snowBase/api/now/cmdb/topology" -Headers $snowAuth -Method GET
Write-Host "Topology: $($topology.result.nodes.Count) nodes, $($topology.result.edges.Count) edges"

# Step 5: Order new server onboarding via catalog
$order = @{
    requested_for = "b.wilson"
    variables = @{
        server_name = "NEW-APP-01"
        environment = "Production"
        access_level = "admin"
        justification = "New application deployment"
    }
}
# Use first catalog item ID from the list
$catalogItems = Invoke-RestMethod -Uri "$snowBase/api/now/catalog/items" -Headers $snowAuth -Method GET
$itemId = $catalogItems.result[0].sys_id
$orderResult = Invoke-RestMethod -Uri "$snowBase/api/now/catalog/items/$itemId/order" -Headers $snowAuth -Method POST -Body ($order | ConvertTo-Json -Depth 3) -ContentType "application/json"
Write-Host "Catalog request created: $($orderResult.result.number)"
`,
  },
  {
    id: 'audit-report',
    name: 'Audit Report',
    description: 'Gather data from all systems (including ServiceNow) for a compliance audit report.',
    systems: ['Fudo PAM', 'Matrix42 ESM', 'Active Directory', 'ServiceNow ITSM'],
    steps: [
      'Fetch all users from AD',
      'Fetch Fudo session logs',
      'Fetch ESM tickets',
      'Fetch SNOW incidents & changes',
      'Fetch CMDB inventory',
    ],
    template: `# Audit Report Scenario
$fudoBase = "http://localhost:8443"
$matrixBase = "http://localhost:8444"
$adBase = "http://localhost:8445"
$snowBase = "http://localhost:8447"

$snowAuth = @{ Authorization = "Bearer pamlab-dev-token" }

# Step 1: Get all AD users
Invoke-RestMethod -Uri "$adBase/api/ad/users" -Headers @{Authorization="Bearer pamlab-dev-token"} -Method GET

# Step 2: Get Fudo session logs
Invoke-RestMethod -Uri "$fudoBase/api/v2/sessions" -Headers @{Authorization="Bearer pamlab-dev-token"} -Method GET

# Step 3: Get all ESM tickets
Invoke-RestMethod -Uri "$matrixBase/m42Services/api/tickets" -Headers @{Authorization="Bearer pamlab-dev-token"} -Method GET

# Step 4: Get Fudo users
Invoke-RestMethod -Uri "$fudoBase/api/v2/users" -Headers @{Authorization="Bearer pamlab-dev-token"} -Method GET

# Step 5: Get AD groups
Invoke-RestMethod -Uri "$adBase/api/ad/groups" -Headers @{Authorization="Bearer pamlab-dev-token"} -Method GET

# Step 6: Get SNOW incidents (open)
$incidents = Invoke-RestMethod -Uri "$snowBase/api/now/table/incident?sysparm_query=state!=7" -Headers $snowAuth -Method GET
Write-Host "Open incidents: $($incidents.result.Count)"

# Step 7: Get SNOW change requests
$changes = Invoke-RestMethod -Uri "$snowBase/api/now/table/change_request" -Headers $snowAuth -Method GET
Write-Host "Change requests: $($changes.result.Count)"

# Step 8: Get CMDB server inventory
$cmdb = Invoke-RestMethod -Uri "$snowBase/api/now/table/cmdb_ci_server" -Headers $snowAuth -Method GET
Write-Host "CMDB servers: $($cmdb.result.Count)"
`,
  },
];
