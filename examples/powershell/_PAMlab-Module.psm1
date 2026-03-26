# =============================================================================
# PAMlab Helper Module
# Provides authentication, API wrappers, and utility functions for PAMlab
# =============================================================================

# Script-scoped token storage
$script:FudoToken = $null
$script:M42Token = $null
$script:ADToken = $null
$script:FudoUrl = $null
$script:M42Url = $null
$script:ADUrl = $null
$script:ConfigFile = $null

function Import-PAMlabConfig {
    <#
    .SYNOPSIS
        Parses a .env file and sets environment variables.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Path
    )

    if (-not (Test-Path $Path)) {
        Write-Host "  ❌ Config file not found: $Path" -ForegroundColor Red
        return $false
    }

    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { return }
        if ($line -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
        }
    }

    $envName = $env:PAMLAB_ENV
    if ($envName -eq 'production') {
        Write-Host "  ⚠️  PRODUCTION environment loaded from: $Path" -ForegroundColor Red
        Write-Host "  ⚠️  You are working against PRODUCTION systems!" -ForegroundColor Red
    } else {
        Write-Host "  🧪 Dev environment loaded from: $Path" -ForegroundColor Green
    }

    return $true
}

function Connect-PAMlab {
    <#
    .SYNOPSIS
        Authenticates to all 3 PAMlab APIs and stores tokens.
    .DESCRIPTION
        Loads config from .env file, then connects to Fudo PAM, Matrix42 ESM,
        and Active Directory APIs. Tokens are stored in module scope.
    #>
    [CmdletBinding()]
    param(
        [string]$ConfigFile = "",
        [string]$FudoUrl = "",
        [string]$M42Url = "",
        [string]$ADUrl = "",
        [string]$FudoUser = "",
        [string]$FudoPassword = "",
        [string]$M42ApiToken = ""
    )

    # --- Load config file ---
    if (-not $ConfigFile) {
        $ConfigFile = "$PSScriptRoot/config/.env"
    }
    if (-not (Test-Path $ConfigFile)) {
        $ConfigFile = "$PSScriptRoot/config/pamlab.env"
    }
    $script:ConfigFile = $ConfigFile

    Write-Host "`n📁 Loading configuration..." -ForegroundColor Cyan
    $loaded = Import-PAMlabConfig -Path $ConfigFile

    # Use env vars as defaults, allow explicit params to override
    if (-not $FudoUrl)      { $FudoUrl      = if ($env:FUDO_URL)      { $env:FUDO_URL }      else { "http://localhost:8443" } }
    if (-not $M42Url)       { $M42Url       = if ($env:M42_URL)       { $env:M42_URL }       else { "http://localhost:8444" } }
    if (-not $ADUrl)        { $ADUrl        = if ($env:AD_URL)        { $env:AD_URL }        else { "http://localhost:8445" } }
    if (-not $FudoUser)     { $FudoUser     = if ($env:FUDO_USER)     { $env:FUDO_USER }     else { "admin" } }
    if (-not $FudoPassword) { $FudoPassword = if ($env:FUDO_PASSWORD) { $env:FUDO_PASSWORD } else { "admin123" } }
    if (-not $M42ApiToken)  { $M42ApiToken  = if ($env:M42_API_TOKEN) { $env:M42_API_TOKEN } else { "pamlab-dev-token" } }

    $script:FudoUrl = $FudoUrl
    $script:M42Url = $M42Url
    $script:ADUrl = $ADUrl

    Write-Host "`n🔐 Connecting to PAMlab APIs...`n" -ForegroundColor Cyan

    # --- Fudo PAM ---
    try {
        $body = @{ login = $FudoUser; password = $FudoPassword } | ConvertTo-Json
        $resp = Invoke-RestMethod -Uri "$FudoUrl/api/v2/auth/login" -Method POST -Body $body -ContentType "application/json"
        $script:FudoToken = $resp.session_token
        Write-Step "Fudo PAM authentication" $true
    } catch {
        Write-Step "Fudo PAM authentication: $_" $false
    }

    # --- Matrix42 ESM ---
    try {
        $headers = @{ Authorization = "Bearer $M42ApiToken" }
        $resp = Invoke-RestMethod -Uri "$M42Url/m42Services/api/ApiToken/GenerateAccessTokenFromApiToken/" -Method POST -Headers $headers
        $script:M42Token = $resp.RawToken
        Write-Step "Matrix42 ESM authentication" $true
    } catch {
        Write-Step "Matrix42 ESM authentication: $_" $false
    }

    # --- Active Directory ---
    try {
        $adBindDn = if ($env:AD_BIND_DN) { $env:AD_BIND_DN } else { "CN=admin" }
        $adBindPw = if ($env:AD_BIND_PASSWORD) { $env:AD_BIND_PASSWORD } else { "admin" }
        $body = @{ dn = $adBindDn; password = $adBindPw } | ConvertTo-Json
        $resp = Invoke-RestMethod -Uri "$ADUrl/api/ad/auth/bind" -Method POST -Body $body -ContentType "application/json"
        $script:ADToken = $resp.token
        Write-Step "Active Directory authentication" $true
    } catch {
        Write-Step "Active Directory authentication: $_" $false
    }

    Write-Host ""
}

function Invoke-Fudo {
    <#
    .SYNOPSIS
        Wrapper for Fudo PAM API calls. Auto-adds Bearer token and base URL.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null
    )

    $headers = @{ Authorization = "Bearer $script:FudoToken" }
    $params = @{
        Uri         = "$script:FudoUrl$Endpoint"
        Method      = $Method
        Headers     = $headers
        ContentType = "application/json"
    }
    if ($Body) {
        $params.Body = if ($Body -is [string]) { $Body } else { $Body | ConvertTo-Json -Depth 10 }
    }
    Invoke-RestMethod @params
}

function Invoke-M42 {
    <#
    .SYNOPSIS
        Wrapper for Matrix42 ESM API calls. Auto-adds Bearer token and base URL.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null
    )

    $headers = @{ Authorization = "Bearer $script:M42Token" }
    $params = @{
        Uri         = "$script:M42Url$Endpoint"
        Method      = $Method
        Headers     = $headers
        ContentType = "application/json"
    }
    if ($Body) {
        $params.Body = if ($Body -is [string]) { $Body } else { $Body | ConvertTo-Json -Depth 10 }
    }
    Invoke-RestMethod @params
}

function Invoke-AD {
    <#
    .SYNOPSIS
        Wrapper for Active Directory API calls. Auto-adds Bearer token and base URL.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null
    )

    $headers = @{ Authorization = "Bearer $script:ADToken" }
    $params = @{
        Uri         = "$script:ADUrl$Endpoint"
        Method      = $Method
        Headers     = $headers
        ContentType = "application/json"
    }
    if ($Body) {
        $params.Body = if ($Body -is [string]) { $Body } else { $Body | ConvertTo-Json -Depth 10 }
    }
    Invoke-RestMethod @params
}

function Write-Step {
    <#
    .SYNOPSIS
        Pretty-prints a step result with ✅ or ❌ icon.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Message,
        [Parameter(Mandatory)][bool]$Success
    )

    if ($Success) {
        Write-Host "  ✅ $Message" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $Message" -ForegroundColor Red
    }
}

function Test-ApiHealth {
    <#
    .SYNOPSIS
        Checks if all 3 PAMlab APIs are reachable.
    #>
    [CmdletBinding()]
    param(
        [string]$FudoUrl = "http://localhost:8443",
        [string]$M42Url = "http://localhost:8444",
        [string]$ADUrl = "http://localhost:8445"
    )

    Write-Host "`n🏥 Checking API health...`n" -ForegroundColor Cyan

    $allHealthy = $true

    foreach ($api in @(
        @{ Name = "Fudo PAM";    Url = "$FudoUrl/api/v2/health" },
        @{ Name = "Matrix42 ESM"; Url = "$M42Url/m42Services/api/health" },
        @{ Name = "Active Directory"; Url = "$ADUrl/api/ad/health" }
    )) {
        try {
            $null = Invoke-RestMethod -Uri $api.Url -Method GET -TimeoutSec 5
            Write-Step "$($api.Name) ($($api.Url))" $true
        } catch {
            Write-Step "$($api.Name) ($($api.Url)) - $_" $false
            $allHealthy = $false
        }
    }

    Write-Host ""
    return $allHealthy
}

Export-ModuleMember -Function Connect-PAMlab, Invoke-Fudo, Invoke-M42, Invoke-AD, Write-Step, Test-ApiHealth, Switch-PAMlabEnv, Import-PAMlabConfig

function Switch-PAMlabEnv {
    <#
    .SYNOPSIS
        Switches between dev and production configuration.
    #>
    [CmdletBinding()]
    param(
        [ValidateSet("dev","production")]
        [string]$Environment = "dev"
    )

    if ($Environment -eq "dev") {
        $script:ConfigFile = "$PSScriptRoot/config/pamlab.env"
    } else {
        $script:ConfigFile = "$PSScriptRoot/config/.env"
        if (-not (Test-Path $script:ConfigFile)) {
            Write-Host "❌ Production config not found! Copy config/production.env.template to config/.env" -ForegroundColor Red
            return
        }
    }

    Connect-PAMlab -ConfigFile $script:ConfigFile
}
