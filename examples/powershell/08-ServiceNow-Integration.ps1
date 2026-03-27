<#
.SYNOPSIS
    ServiceNow ITSM Integration Examples for PAMlab
.DESCRIPTION
    Demonstrates integration with ServiceNow Mock API:
    - Authentication
    - Create incident from Fudo anomaly
    - Create change request for password rotation
    - Query CMDB for PAMlab servers
    - Order catalog item for access request
.NOTES
    Requires: PAMlab running (docker-compose up)
    ServiceNow Mock API: http://localhost:8447
#>

# Import PAMlab module
. "$PSScriptRoot/../_PAMlab-Module.psm1" -ErrorAction SilentlyContinue

$SnowBase = "http://localhost:8447"
$Token = "snow-mock-token-pamlab-2024"
$Headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type"  = "application/json"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ServiceNow ITSM Integration Demo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Authentication ──
Write-Host "[1/5] Authenticating to ServiceNow..." -ForegroundColor Yellow

$AuthBody = @{ username = "admin"; password = "admin" } | ConvertTo-Json
try {
    $AuthResult = Invoke-RestMethod -Uri "$SnowBase/api/now/auth/token" -Method POST -Body $AuthBody -ContentType "application/json"
    $Token = $AuthResult.result.token
    $Headers["Authorization"] = "Bearer $Token"
    Write-Host "  ✓ Authenticated as $($AuthResult.result.user)" -ForegroundColor Green
    Write-Host "  Token: $($Token.Substring(0,16))..." -ForegroundColor DarkGray
} catch {
    Write-Host "  ✗ Auth failed: $_" -ForegroundColor Red
    Write-Host "  Using default token" -ForegroundColor DarkGray
}
Write-Host ""

# ── 2. Create Incident from Fudo Anomaly ──
Write-Host "[2/5] Creating incident from Fudo PAM anomaly..." -ForegroundColor Yellow

$IncidentBody = @{
    short_description = "Fudo PAM: Unusual privilege escalation detected"
    description       = "Automated alert: User svc-integration performed unexpected sudo commands on DB-PROD during non-business hours (03:47 UTC). Session ID: FUDO-SES-2026-0847. Requires immediate investigation."
    priority          = 2
    impact            = 1
    urgency           = 2
    category          = "Security"
    subcategory       = "Intrusion Detection"
    severity          = 2
} | ConvertTo-Json

try {
    $Incident = Invoke-RestMethod -Uri "$SnowBase/api/now/table/incident" -Method POST -Headers $Headers -Body $IncidentBody
    Write-Host "  ✓ Created: $($Incident.result.number) - $($Incident.result.short_description)" -ForegroundColor Green
    Write-Host "  sys_id: $($Incident.result.sys_id)" -ForegroundColor DarkGray
    $NewIncSysId = $Incident.result.sys_id
} catch {
    Write-Host "  ✗ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ── 3. Create Change Request for Password Rotation ──
Write-Host "[3/5] Creating change request for password rotation..." -ForegroundColor Yellow

$ChangeBody = @{
    short_description = "Emergency password rotation - all service accounts"
    description       = "Following security incident detection, rotate all service account passwords managed by Fudo PAM. Accounts: svc-integration, svc-fudo-sync, svc-matrix42. Coordinate with AD and Matrix42 for service restart."
    type              = "emergency"
    priority          = 1
    impact            = 1
    urgency           = 1
    risk              = "moderate"
    category          = "Security"
    cab_required      = $false
} | ConvertTo-Json

try {
    $Change = Invoke-RestMethod -Uri "$SnowBase/api/now/table/change_request" -Method POST -Headers $Headers -Body $ChangeBody
    Write-Host "  ✓ Created: $($Change.result.number) - $($Change.result.short_description)" -ForegroundColor Green
    Write-Host "  Type: $($Change.result.type) | Priority: $($Change.result.priority)" -ForegroundColor DarkGray
} catch {
    Write-Host "  ✗ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ── 4. Query CMDB for PAMlab Servers ──
Write-Host "[4/5] Querying CMDB for PAMlab servers..." -ForegroundColor Yellow

try {
    $Servers = Invoke-RestMethod -Uri "$SnowBase/api/now/table/cmdb_ci_server?sysparm_fields=name,ip_address,os,operational_status&sysparm_limit=50" -Method GET -Headers $Headers
    Write-Host "  ✓ Found $($Servers.result.Count) servers:" -ForegroundColor Green
    foreach ($srv in $Servers.result) {
        $status = if ($srv.operational_status -eq 1) { "Operational" } else { "Down" }
        Write-Host "    - $($srv.name) ($($srv.ip_address)) - $($srv.os) [$status]" -ForegroundColor White
    }
} catch {
    Write-Host "  ✗ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ── 5. Order Catalog Item for Access Request ──
Write-Host "[5/5] Ordering privileged access from service catalog..." -ForegroundColor Yellow

try {
    # List catalog items
    $Catalog = Invoke-RestMethod -Uri "$SnowBase/api/now/catalog/items" -Method GET -Headers $Headers
    Write-Host "  Available catalog items:" -ForegroundColor DarkGray
    foreach ($item in $Catalog.result) {
        Write-Host "    - $($item.name) ($($item.item_id))" -ForegroundColor DarkGray
    }

    # Order privileged access
    $OrderBody = @{
        description   = "Emergency access for incident investigation - Fudo anomaly on DB-PROD"
        requested_for = "b.wilson"
        opened_by     = "c.jones"
        variables     = @{
            server     = "DB-PROD"
            access_type = "SSH"
            duration   = "4 hours"
            justification = "Security incident investigation"
        }
    } | ConvertTo-Json -Depth 3

    $Order = Invoke-RestMethod -Uri "$SnowBase/api/now/catalog/items/cat-priv-access/order" -Method POST -Headers $Headers -Body $OrderBody
    Write-Host "  ✓ Ordered: $($Order.result.request.number) - $($Order.result.request.short_description)" -ForegroundColor Green
    Write-Host "  Status: $($Order.result.request.stage)" -ForegroundColor DarkGray
} catch {
    Write-Host "  ✗ Failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Integration demo complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
