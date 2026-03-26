# =============================================================================
# 05-Emergency-Revoke.ps1
# Emergency access revocation for security incidents
# =============================================================================

Import-Module "$PSScriptRoot/_PAMlab-Module.psm1" -Force
Connect-PAMlab

$UserName = "jdoe"

Write-Host "🚨 EMERGENCY ACCESS REVOCATION: $UserName" -ForegroundColor Red
Write-Host ("=" * 55) -ForegroundColor Red
Write-Host ""

$summary = @()
$actionsCount = 0

# Step 1: Get active Fudo sessions
try {
    $sessions = Invoke-Fudo -Endpoint "/api/v2/sessions?user=$UserName&status=active"
    Write-Step "Found $($sessions.result.Count) active session(s)" $true
} catch {
    Write-Step "Get sessions: $_" $false
    $sessions = @{ result = @() }
}

# Step 2: Terminate ALL active sessions immediately
foreach ($session in $sessions.result) {
    try {
        $null = Invoke-Fudo -Endpoint "/api/v2/sessions/$($session.id)/terminate" -Method POST
        Write-Step "Terminated session $($session.id) ($($session.server))" $true
        $actionsCount++
    } catch {
        Write-Step "Terminate session $($session.id): $_" $false
    }
}
$summary += "Sessions terminated: $($sessions.result.Count)"

# Step 3: Block user in Fudo
try {
    $fudoUsers = Invoke-Fudo -Endpoint "/api/v2/users?search=$UserName"
    if ($fudoUsers.result.Count -gt 0) {
        $fudoId = $fudoUsers.result[0].id
        $null = Invoke-Fudo -Endpoint "/api/v2/users/$fudoId" -Method PUT -Body @{ blocked = $true }
        Write-Step "Blocked in Fudo" $true
        $actionsCount++
    }
    $summary += "Fudo block: OK"
} catch {
    Write-Step "Block in Fudo: $_" $false
    $summary += "Fudo block: FAILED"
}

# Step 4: Remove from all AD security groups
try {
    $groups = Invoke-AD -Endpoint "/api/ad/users/$UserName/groups"
    foreach ($group in $groups.result) {
        try {
            $null = Invoke-AD -Endpoint "/api/ad/groups/$($group.cn)/members/$UserName" -Method DELETE
            Write-Step "Removed from AD group: $($group.cn)" $true
            $actionsCount++
        } catch {
            Write-Step "Remove from $($group.cn): $_" $false
        }
    }
    $summary += "AD groups removed: $($groups.result.Count)"
} catch {
    Write-Step "Get AD groups: $_" $false
}

# Step 5: Revoke pending access requests in Matrix42
try {
    $requests = Invoke-M42 -Endpoint "/m42Services/api/data/fragments/Ud_SoftwareportfolioClassBase?filter=user eq '$UserName' and status eq 'Pending'"
    foreach ($req in $requests.result) {
        $null = Invoke-M42 -Endpoint "/m42Services/api/data/fragments/Ud_SoftwareportfolioClassBase/$($req.ID)" -Method PUT -Body @{
            Status = "Revoked"
        }
        Write-Step "Revoked request: $($req.ID)" $true
        $actionsCount++
    }
    $summary += "M42 requests revoked: $($requests.result.Count)"
} catch {
    Write-Step "Revoke M42 requests: $_" $false
    $summary += "M42 revocation: FAILED"
}

# Step 6: Create high-priority security incident ticket
try {
    $ticket = Invoke-M42 -Endpoint "/m42Services/api/data/fragments/Ud_SoftwareportfolioClassBase" -Method POST -Body @{
        Title       = "SECURITY INCIDENT: Emergency revocation for $UserName"
        Description = "All access revoked. Sessions terminated. AD groups removed. Fudo blocked. Actions taken: $actionsCount"
        Priority    = "Critical"
        Type        = "SecurityIncident"
        Status      = "Open"
    }
    Write-Step "Created security incident ticket (ID: $($ticket.ID))" $true
    $summary += "Incident ticket: $($ticket.ID)"
} catch {
    Write-Step "Create incident ticket: $_" $false
}

# Step 7: Summary
Write-Host "`n🚨 Emergency Revocation Summary" -ForegroundColor Red
Write-Host ("=" * 50) -ForegroundColor Gray
Write-Host "  Total actions taken: $actionsCount" -ForegroundColor Yellow
$summary | ForEach-Object { Write-Host "  • $_" -ForegroundColor White }
Write-Host ""
