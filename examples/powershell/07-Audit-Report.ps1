# =============================================================================
# 07-Audit-Report.ps1
# Generate a comprehensive audit report from all PAMlab APIs
# =============================================================================

Import-Module "$PSScriptRoot/_PAMlab-Module.psm1" -Force
Connect-PAMlab

$ReportDate = Get-Date -Format "yyyy-MM-dd"
$ReportFile = "$PSScriptRoot/audit-report-$ReportDate.txt"

Write-Host "📊 Generating Audit Report ($ReportDate)`n" -ForegroundColor Cyan

$report = @()
$report += "=" * 60
$report += "  PAMlab Audit Report — $ReportDate"
$report += "  Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$report += "=" * 60
$report += ""

# Step 1: Recent Fudo events (last 24h)
try {
    $since = (Get-Date).AddHours(-24).ToString("yyyy-MM-ddTHH:mm:ss")
    $events = Invoke-Fudo -Endpoint "/api/v2/events?since=$since&limit=50"
    $report += "--- FUDO EVENTS (Last 24h) ---"
    $report += "Total events: $($events.result.Count)"
    $report += ""
    foreach ($e in $events.result) {
        $report += "  [$($e.timestamp)] $($e.type) — $($e.description)"
    }
    $report += ""
    Write-Step "Collected $($events.result.Count) Fudo events" $true
} catch {
    Write-Step "Get Fudo events: $_" $false
    $report += "--- FUDO EVENTS: ERROR ---"
    $report += ""
}

# Step 2: Active sessions
try {
    $sessions = Invoke-Fudo -Endpoint "/api/v2/sessions?status=active"
    $report += "--- ACTIVE SESSIONS ---"
    $report += "Total active: $($sessions.result.Count)"
    $report += ""
    foreach ($s in $sessions.result) {
        $report += "  Session $($s.id): $($s.user) → $($s.server) (started: $($s.start_time))"
    }
    $report += ""
    Write-Step "Found $($sessions.result.Count) active sessions" $true
} catch {
    Write-Step "Get sessions: $_" $false
    $report += "--- ACTIVE SESSIONS: ERROR ---"
    $report += ""
}

# Step 3: Access requests and statuses
try {
    $requests = Invoke-M42 -Endpoint "/m42Services/api/data/fragments/Ud_SoftwareportfolioClassBase?limit=20"
    $report += "--- ACCESS REQUESTS (Matrix42) ---"
    $report += "Total: $($requests.result.Count)"
    $report += ""
    foreach ($r in $requests.result) {
        $report += "  [$($r.Status)] $($r.Title) (ID: $($r.ID))"
    }
    $report += ""
    Write-Step "Collected $($requests.result.Count) access requests" $true
} catch {
    Write-Step "Get M42 requests: $_" $false
    $report += "--- ACCESS REQUESTS: ERROR ---"
    $report += ""
}

# Step 4: Password rotation history
try {
    $rotations = Invoke-Fudo -Endpoint "/api/v2/rotation-history?limit=20"
    $report += "--- PASSWORD ROTATION HISTORY ---"
    $report += "Total entries: $($rotations.result.Count)"
    $report += ""
    foreach ($r in $rotations.result) {
        $icon = if ($r.status -eq "success") { "[OK]" } else { "[FAIL]" }
        $report += "  $icon $($r.timestamp) | $($r.policy) | $($r.account)"
    }
    $report += ""
    Write-Step "Collected rotation history" $true
} catch {
    Write-Step "Get rotation history: $_" $false
    $report += "--- PASSWORD ROTATION: ERROR ---"
    $report += ""
}

# Step 5: Format and save
$report += "=" * 60
$report += "  End of Report"
$report += "=" * 60

$reportText = $report -join "`n"

# Display
Write-Host "`n$reportText" -ForegroundColor Gray

# Save to file
$reportText | Out-File -FilePath $ReportFile -Encoding UTF8
Write-Host "`n💾 Report saved to: $ReportFile" -ForegroundColor Green
Write-Host ""
