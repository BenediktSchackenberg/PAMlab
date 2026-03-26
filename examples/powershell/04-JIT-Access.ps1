# =============================================================================
# 04-JIT-Access.ps1
# Just-in-Time temporary access: time-limited group membership + Fudo sync
# =============================================================================

Import-Module "$PSScriptRoot/_PAMlab-Module.psm1" -Force
Connect-PAMlab

$UserName = "jdoe"
$TargetServer = "prod-db-01"
$GroupName = "JIT-ProdDB-Access"
$DurationMinutes = 60

Write-Host "⏱️  JIT Access Request" -ForegroundColor Cyan
Write-Host "   User: $UserName | Server: $TargetServer | Duration: ${DurationMinutes}min`n" -ForegroundColor Gray

$summary = @()
$expiry = (Get-Date).AddMinutes($DurationMinutes).ToString("yyyy-MM-dd HH:mm:ss")

# Step 1: Create JIT access request in Fudo
try {
    $request = Invoke-Fudo -Endpoint "/api/v2/access-requests" -Method POST -Body @{
        user        = $UserName
        server      = $TargetServer
        duration    = $DurationMinutes
        reason      = "Emergency maintenance - JIT access"
        type        = "jit"
    }
    Write-Step "Created JIT request in Fudo (ID: $($request.id))" $true
    $summary += "Fudo request: $($request.id)"
} catch {
    Write-Step "Create JIT request: $_" $false
}

# Step 2: Auto-approve
try {
    $null = Invoke-Fudo -Endpoint "/api/v2/access-requests/$($request.id)/approve" -Method POST -Body @{
        approver = "admin"
        comment  = "Auto-approved JIT request"
    }
    Write-Step "JIT request approved" $true
    $summary += "Approval: auto-approved"
} catch {
    Write-Step "Approve JIT request: $_" $false
}

# Step 3: Add user to AD group with expiry metadata
try {
    $null = Invoke-AD -Endpoint "/api/ad/groups/$GroupName/members" -Method POST -Body @{
        member  = $UserName
        expiry  = $expiry
        ttl     = $DurationMinutes
    }
    Write-Step "Added to $GroupName (expires: $expiry)" $true
    $summary += "AD group: $GroupName (TTL: ${DurationMinutes}min)"
} catch {
    Write-Step "Add to JIT group: $_" $false
}

# Step 4: Trigger Fudo sync
try {
    $sync = Invoke-Fudo -Endpoint "/api/v2/system/ad-sync" -Method POST
    Write-Step "Fudo AD sync triggered" $true
} catch {
    Write-Step "Fudo sync: $_" $false
}

# Step 5: Verify temporary access
try {
    $access = Invoke-Fudo -Endpoint "/api/v2/users?search=$UserName"
    if ($access.result.Count -gt 0) {
        $userId = $access.result[0].id
        $policies = Invoke-Fudo -Endpoint "/api/v2/users/$userId/access"
        Write-Step "User has $($policies.result.Count) active access entries" $true
    }
} catch {
    Write-Step "Verify access: $_" $false
}

# Step 6: Show expiry info
Write-Host "`n⏰ Access Expiry Information" -ForegroundColor Yellow
Write-Host "  Granted at:  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "  Expires at:  $expiry" -ForegroundColor White
Write-Host "  Duration:    $DurationMinutes minutes" -ForegroundColor White
Write-Host "  Server:      $TargetServer" -ForegroundColor White

# Summary
Write-Host "`n📋 JIT Access Summary" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Gray
$summary | ForEach-Object { Write-Host "  • $_" -ForegroundColor White }
Write-Host ""
