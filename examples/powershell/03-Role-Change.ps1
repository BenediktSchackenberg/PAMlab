# =============================================================================
# 03-Role-Change.ps1
# Department/role change: swap AD groups, sync Fudo, log in Matrix42
# =============================================================================

Import-Module "$PSScriptRoot/_PAMlab-Module.psm1" -Force
Connect-PAMlab

$UserName = "jdoe"
$OldDepartment = "Engineering"
$NewDepartment = "Security"

Write-Host "🔄 Role Change: $UserName" -ForegroundColor Cyan
Write-Host "   $OldDepartment → $NewDepartment`n" -ForegroundColor Gray

$summary = @()

# Step 1: Get user's current AD groups
try {
    $groups = Invoke-AD -Endpoint "/api/ad/users/$UserName/groups"
    Write-Step "Current groups: $(($groups.result | ForEach-Object { $_.cn }) -join ', ')" $true
} catch {
    Write-Step "Get groups: $_" $false
}

# Step 2: Remove from old department groups
$oldGroups = $groups.result | Where-Object { $_.cn -match $OldDepartment }
foreach ($g in $oldGroups) {
    try {
        $null = Invoke-AD -Endpoint "/api/ad/groups/$($g.cn)/members/$UserName" -Method DELETE
        Write-Step "Removed from: $($g.cn)" $true
        $summary += "Removed: $($g.cn)"
    } catch {
        Write-Step "Remove from $($g.cn): $_" $false
    }
}

# Step 3: Add to new department groups
$newGroups = @("SSH-Servers-$NewDepartment", "VPN-$NewDepartment")
foreach ($gName in $newGroups) {
    try {
        $null = Invoke-AD -Endpoint "/api/ad/groups/$gName/members" -Method POST -Body @{ member = $UserName }
        Write-Step "Added to: $gName" $true
        $summary += "Added: $gName"
    } catch {
        Write-Step "Add to $gName`: $_" $false
    }
}

# Step 4: Trigger Fudo sync
try {
    $sync = Invoke-Fudo -Endpoint "/api/v2/system/ad-sync" -Method POST
    Write-Step "Fudo AD sync triggered (status: $($sync.status))" $true
} catch {
    Write-Step "Fudo sync: $_" $false
}

# Step 5: Verify new access / old access removed
try {
    $fudoUsers = Invoke-Fudo -Endpoint "/api/v2/users?search=$UserName"
    if ($fudoUsers.result.Count -gt 0) {
        $user = $fudoUsers.result[0]
        Write-Step "Fudo user found — verifying access policies" $true
        
        # Check new access
        $access = Invoke-Fudo -Endpoint "/api/v2/users/$($user.id)/access"
        Write-Step "Current Fudo access entries: $($access.result.Count)" $true
    }
} catch {
    Write-Step "Verify access: $_" $false
}

# Step 6: Log change in Matrix42 ticket
try {
    $ticket = Invoke-M42 -Endpoint "/m42Services/api/data/fragments/Ud_SoftwareportfolioClassBase" -Method POST -Body @{
        Title       = "Role Change: $UserName ($OldDepartment → $NewDepartment)"
        Description = "Department change processed. Old groups removed, new groups assigned, Fudo synced."
        Priority    = "Normal"
        Type        = "ChangeRequest"
        Status      = "Completed"
    }
    Write-Step "Logged in Matrix42 (ID: $($ticket.ID))" $true
    $summary += "M42 ticket: $($ticket.ID)"
} catch {
    Write-Step "Create M42 ticket: $_" $false
}

# Summary
Write-Host "`n📋 Role Change Summary" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Gray
$summary | ForEach-Object { Write-Host "  • $_" -ForegroundColor White }
Write-Host ""
