# =============================================================================
# 06-Password-Rotation.ps1
# Trigger and verify password rotation via Fudo PAM
# =============================================================================

Import-Module "$PSScriptRoot/_PAMlab-Module.psm1" -Force
Connect-PAMlab

$PolicyName = "default-rotation"

Write-Host "🔑 Password Rotation Management`n" -ForegroundColor Cyan

# Step 1: List password policies
try {
    $policies = Invoke-Fudo -Endpoint "/api/v2/password-policies"
    Write-Host "  Password Policies:" -ForegroundColor Yellow
    foreach ($p in $policies.result) {
        Write-Host "    • $($p.name) (interval: $($p.interval), accounts: $($p.account_count))" -ForegroundColor White
    }
    Write-Step "Listed $($policies.result.Count) password policies" $true
} catch {
    Write-Step "List policies: $_" $false
}

# Step 2: Show accounts covered by each policy
try {
    foreach ($p in $policies.result) {
        $accounts = Invoke-Fudo -Endpoint "/api/v2/password-policies/$($p.id)/accounts"
        Write-Host "`n  Accounts under '$($p.name)':" -ForegroundColor Yellow
        foreach ($acc in $accounts.result) {
            Write-Host "    • $($acc.name) @ $($acc.server) (last rotated: $($acc.last_rotation))" -ForegroundColor White
        }
    }
    Write-Step "Retrieved account details" $true
} catch {
    Write-Step "Get accounts: $_" $false
}

# Step 3: Trigger rotation for specific policy
try {
    $targetPolicy = $policies.result | Where-Object { $_.name -eq $PolicyName } | Select-Object -First 1
    if ($targetPolicy) {
        $rotation = Invoke-Fudo -Endpoint "/api/v2/password-policies/$($targetPolicy.id)/rotate" -Method POST
        Write-Step "Triggered rotation for '$PolicyName' (job: $($rotation.job_id))" $true
    } else {
        Write-Step "Policy '$PolicyName' not found" $false
    }
} catch {
    Write-Step "Trigger rotation: $_" $false
}

# Step 4: Show rotation results
try {
    Start-Sleep -Seconds 2  # Brief wait for rotation to complete
    $results = Invoke-Fudo -Endpoint "/api/v2/password-policies/$($targetPolicy.id)/rotation-history?limit=5"
    Write-Host "`n  Recent Rotation Results:" -ForegroundColor Yellow
    foreach ($r in $results.result) {
        $icon = if ($r.status -eq "success") { "✅" } else { "❌" }
        Write-Host "    $icon $($r.account) — $($r.status) ($($r.timestamp))" -ForegroundColor White
    }
} catch {
    Write-Step "Get rotation results: $_" $false
}

# Step 5: Verify rotation history
try {
    $history = Invoke-Fudo -Endpoint "/api/v2/rotation-history?limit=10"
    Write-Host "`n  Full Rotation History (last 10):" -ForegroundColor Yellow
    foreach ($h in $history.result) {
        Write-Host "    • $($h.timestamp) | $($h.policy) | $($h.account) | $($h.status)" -ForegroundColor White
    }
    Write-Step "Rotation history verified" $true
} catch {
    Write-Step "Verify history: $_" $false
}

Write-Host ""
