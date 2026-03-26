# =============================================================================
# 02-Offboarding.ps1
# Full user offboarding: disable access, block Fudo, cleanup AD, create ticket
# =============================================================================

Import-Module "$PSScriptRoot/_PAMlab-Module.psm1" -Force
Connect-PAMlab

$UserName = "jdoe"

Write-Host "🚪 Offboarding: $UserName`n" -ForegroundColor Cyan

$summary = @()

# Step 1: Get user details from AD
try {
    $adUser = Invoke-AD -Endpoint "/api/ad/users/$UserName"
    Write-Step "Retrieved AD user: $($adUser.cn) ($($adUser.department))" $true
    $summary += "AD user: $($adUser.cn)"
} catch {
    Write-Step "Get AD user: $_" $false
    $summary += "AD user: FAILED"
}

# Step 2: List user's group memberships
try {
    $groups = Invoke-AD -Endpoint "/api/ad/users/$UserName/groups"
    $groupNames = ($groups.result | ForEach-Object { $_.cn }) -join ", "
    Write-Step "Group memberships: $groupNames" $true
    $summary += "Groups found: $($groups.result.Count)"
} catch {
    Write-Step "List groups: $_" $false
    $groups = @{ result = @() }
}

# Step 3: Remove user from all security groups
foreach ($group in $groups.result) {
    try {
        $null = Invoke-AD -Endpoint "/api/ad/groups/$($group.cn)/members/$UserName" -Method DELETE
        Write-Step "Removed from group: $($group.cn)" $true
    } catch {
        Write-Step "Remove from $($group.cn): $_" $false
    }
}
$summary += "Groups removed: $($groups.result.Count)"

# Step 4: Block user in Fudo
try {
    $fudoUsers = Invoke-Fudo -Endpoint "/api/v2/users?search=$UserName"
    if ($fudoUsers.result.Count -gt 0) {
        $fudoId = $fudoUsers.result[0].id
        $null = Invoke-Fudo -Endpoint "/api/v2/users/$fudoId" -Method PUT -Body @{ blocked = $true }
        Write-Step "Blocked user in Fudo (ID: $fudoId)" $true
        $summary += "Fudo block: OK"
    } else {
        Write-Step "User not found in Fudo" $false
        $summary += "Fudo block: NOT FOUND"
    }
} catch {
    Write-Step "Block in Fudo: $_" $false
    $summary += "Fudo block: FAILED"
}

# Step 5: Terminate active Fudo sessions
try {
    $sessions = Invoke-Fudo -Endpoint "/api/v2/sessions?user=$UserName&status=active"
    foreach ($session in $sessions.result) {
        $null = Invoke-Fudo -Endpoint "/api/v2/sessions/$($session.id)/terminate" -Method POST
        Write-Step "Terminated session: $($session.id)" $true
    }
    $summary += "Sessions terminated: $($sessions.result.Count)"
} catch {
    Write-Step "Terminate sessions: $_" $false
    $summary += "Sessions: FAILED"
}

# Step 6: Create offboarding ticket in Matrix42
try {
    $ticket = Invoke-M42 -Endpoint "/m42Services/api/data/fragments/Ud_SoftwareportfolioClassBase" -Method POST -Body @{
        Title       = "Offboarding: $UserName"
        Description = "Employee offboarding completed. All access revoked."
        Priority    = "Normal"
        Type        = "ChangeRequest"
        Status      = "Completed"
    }
    Write-Step "Created offboarding ticket (ID: $($ticket.ID))" $true
    $summary += "M42 ticket: $($ticket.ID)"
} catch {
    Write-Step "Create ticket: $_" $false
    $summary += "M42 ticket: FAILED"
}

# Step 7: Disable user in AD
try {
    $null = Invoke-AD -Endpoint "/api/ad/users/$UserName" -Method PUT -Body @{ enabled = $false }
    Write-Step "Disabled AD account" $true
    $summary += "AD disabled: OK"
} catch {
    Write-Step "Disable AD user: $_" $false
    $summary += "AD disabled: FAILED"
}

# Step 8: Summary
Write-Host "`n📋 Offboarding Summary for $UserName" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Gray
$summary | ForEach-Object { Write-Host "  • $_" -ForegroundColor White }
Write-Host ""
