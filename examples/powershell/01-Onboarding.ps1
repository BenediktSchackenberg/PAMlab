# =============================================================================
# 01-Onboarding.ps1
# Full user onboarding scenario: access request → AD provisioning → Fudo sync
# =============================================================================

Import-Module "$PSScriptRoot/_PAMlab-Module.psm1" -Force
Connect-PAMlab

$UserName = "jdoe"
$FullName = "John Doe"
$Department = "Engineering"
$GroupName = "SSH-Servers-Engineering"

Write-Host "👤 Onboarding: $FullName ($UserName)" -ForegroundColor Cyan
Write-Host "   Department: $Department | Group: $GroupName`n" -ForegroundColor Gray

$summary = @()

# Step 1: Create access request in Matrix42
try {
    $ticket = Invoke-M42 -Endpoint "/m42Services/api/data/fragments/Ud_SoftwareportfolioClassBase" -Method POST -Body @{
        Title       = "Onboarding: $FullName"
        Description = "New employee onboarding for $FullName ($Department)"
        Priority    = "Normal"
        Type        = "AccessRequest"
        Status      = "New"
    }
    $ticketId = $ticket.ID
    Write-Step "Created access request in Matrix42 (ID: $ticketId)" $true
    $summary += "Access request: $ticketId"
} catch {
    Write-Step "Create access request: $_" $false
    $summary += "Access request: FAILED"
}

# Step 2: Approve the request
try {
    $null = Invoke-M42 -Endpoint "/m42Services/api/data/fragments/Ud_SoftwareportfolioClassBase/$ticketId" -Method PUT -Body @{
        Status = "Approved"
    }
    Write-Step "Approved access request" $true
    $summary += "Approval: OK"
} catch {
    Write-Step "Approve request: $_" $false
    $summary += "Approval: FAILED"
}

# Step 3: Create user in AD (or use existing)
try {
    $adUser = Invoke-AD -Endpoint "/api/ad/users" -Method POST -Body @{
        sAMAccountName = $UserName
        cn             = $FullName
        department     = $Department
        userPassword   = "Welcome1!"
        enabled        = $true
    }
    Write-Step "Created AD user: $($adUser.dn)" $true
    $summary += "AD user: $($adUser.dn)"
} catch {
    if ($_.ToString() -match "already exists") {
        Write-Step "AD user already exists, continuing" $true
        $summary += "AD user: exists"
    } else {
        Write-Step "Create AD user: $_" $false
        $summary += "AD user: FAILED"
    }
}

# Step 4: Add user to AD security group
try {
    $null = Invoke-AD -Endpoint "/api/ad/groups/$GroupName/members" -Method POST -Body @{
        member = $UserName
    }
    Write-Step "Added $UserName to group $GroupName" $true
    $summary += "Group membership: $GroupName"
} catch {
    Write-Step "Add to group: $_" $false
    $summary += "Group membership: FAILED"
}

# Step 5: Trigger Fudo AD sync
try {
    $sync = Invoke-Fudo -Endpoint "/api/v2/system/ad-sync" -Method POST
    Write-Step "Triggered Fudo AD sync (status: $($sync.status))" $true
    $summary += "Fudo sync: $($sync.status)"
} catch {
    Write-Step "Fudo AD sync: $_" $false
    $summary += "Fudo sync: FAILED"
}

# Step 6: Verify user has access in Fudo
try {
    $fudoUser = Invoke-Fudo -Endpoint "/api/v2/users?search=$UserName"
    if ($fudoUser.result.Count -gt 0) {
        Write-Step "User visible in Fudo (ID: $($fudoUser.result[0].id))" $true
        $summary += "Fudo verification: OK"
    } else {
        Write-Step "User not yet visible in Fudo" $false
        $summary += "Fudo verification: NOT FOUND"
    }
} catch {
    Write-Step "Verify Fudo user: $_" $false
    $summary += "Fudo verification: FAILED"
}

# Step 7: Summary
Write-Host "`n📋 Onboarding Summary for $FullName" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Gray
$summary | ForEach-Object { Write-Host "  • $_" -ForegroundColor White }
Write-Host ""
