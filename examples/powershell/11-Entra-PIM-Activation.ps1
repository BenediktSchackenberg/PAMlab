# =============================================================================
# 11-Entra-PIM-Activation.ps1
# Microsoft Entra ID PIM activation demo for PAMlab
# =============================================================================

Import-Module "$PSScriptRoot/_PAMlab-Module.psm1" -Force
Connect-PAMlab

$PrincipalId = "20000000-0000-0000-0000-000000000004"
$PrincipalUpn = "b.wilson@corp.local"
$RoleDefinitionId = "e8611ab8-c189-46e8-94e1-60213ab1f814"
$Justification = "Emergency admin access for PAM maintenance"

Write-Host "Microsoft Entra ID PIM Activation" -ForegroundColor Cyan
Write-Host "   Principal: $PrincipalUpn" -ForegroundColor Gray
Write-Host "   Role ID:   $RoleDefinitionId`n" -ForegroundColor Gray

$summary = @()

# Step 1: Review eligibility
try {
    $eligibilities = Invoke-Entra -Endpoint "/v1.0/roleManagement/directory/roleEligibilityScheduleRequests"
    $eligible = $eligibilities.value | Where-Object {
        $_.principalId -eq $PrincipalId -and $_.roleDefinitionId -eq $RoleDefinitionId
    }

    if ($eligible) {
        Write-Step "Principal is eligible for requested role" $true
        $summary += "Eligibility verified"
    } else {
        throw "No matching PIM eligibility found for $PrincipalUpn"
    }
} catch {
    Write-Step "PIM eligibility check: $_" $false
}

# Step 2: Activate role
try {
    $activation = Invoke-Entra -Endpoint "/v1.0/roleManagement/directory/roleAssignmentScheduleRequests" -Method POST -Body @{
        action = "selfActivate"
        principalId = $PrincipalId
        roleDefinitionId = $RoleDefinitionId
        justification = $Justification
    }
    Write-Step "Activated PIM role request $($activation.id)" $true
    $summary += "Activation request: $($activation.id)"
} catch {
    Write-Step "Activate PIM role: $_" $false
}

# Step 3: Revoke stale sessions
try {
    $null = Invoke-Entra -Endpoint "/v1.0/users/$PrincipalUpn/revokeSignInSessions" -Method POST
    Write-Step "Revoked sign-in sessions for $PrincipalUpn" $true
    $summary += "Sessions revoked"
} catch {
    Write-Step "Revoke sign-in sessions: $_" $false
}

# Step 4: Verify assignments
try {
    $assignments = Invoke-Entra -Endpoint "/v1.0/roleManagement/directory/roleAssignments"
    $active = $assignments.value | Where-Object {
        $_.principalId -eq $PrincipalId -and $_.roleDefinitionId -eq $RoleDefinitionId
    }

    if ($active) {
        Write-Step "Verified active privileged assignment" $true
        $summary += "Active role assignments: $(@($active).Count)"
    } else {
        throw "Activated role not found in active assignments"
    }
} catch {
    Write-Step "Verify assignments: $_" $false
}

Write-Host "`nEntra PIM Summary" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Gray
$summary | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
Write-Host ""
