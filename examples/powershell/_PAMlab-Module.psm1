# =============================================================================
# PAMlab Helper Module
# Provides authentication, API wrappers, and utility functions for PAMlab
# =============================================================================

# Script-scoped token storage
$script:FudoToken = $null
$script:M42Token = $null
$script:ADToken = $null
$script:AzureAdToken = $null
$script:FudoUrl = $null
$script:M42Url = $null
$script:ADUrl = $null
$script:AzureAdUrl = $null
$script:ConfigFile = $null

function Import-PAMlabConfig {
    <#
    .SYNOPSIS
        Parses a .env file and sets environment variables.
    .DESCRIPTION
        Existing process environment variables are preserved so callers can
        override values for one-off runs without editing the config file.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Path
    )

    if (-not (Test-Path $Path)) {
        Write-Host "  [FAIL] Config file not found: $Path" -ForegroundColor Red
        return $false
    }

    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { return }

        if ($line -match '^([^=]+)=(.*)$') {
            $key = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            $existingValue = [Environment]::GetEnvironmentVariable($key, "Process")

            if ([string]::IsNullOrWhiteSpace($existingValue)) {
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }

    $envName = $env:PAMLAB_ENV
    if ($envName -eq 'production') {
        Write-Host "  [WARN] PRODUCTION environment loaded from: $Path" -ForegroundColor Red
        Write-Host "  [WARN] You are working against PRODUCTION systems!" -ForegroundColor Red
    } else {
        Write-Host "  [OK] Dev environment loaded from: $Path" -ForegroundColor Green
    }

    return $true
}

function Get-PAMlabSetting {
    [CmdletBinding()]
    param(
        [AllowEmptyString()][string]$ExplicitValue,
        [string]$EnvironmentVariable,
        [string]$DefaultValue
    )

    if (-not [string]::IsNullOrWhiteSpace($ExplicitValue)) {
        return $ExplicitValue
    }

    $envValue = [Environment]::GetEnvironmentVariable($EnvironmentVariable, "Process")
    if (-not [string]::IsNullOrWhiteSpace($envValue)) {
        return $envValue
    }

    return $DefaultValue
}

function Connect-PAMlab {
    <#
    .SYNOPSIS
        Authenticates to all PAMlab APIs and stores tokens.
    .DESCRIPTION
        Loads config from .env file, then connects to Fudo PAM, Matrix42 ESM,
        Active Directory, and Microsoft Entra ID APIs. Tokens are stored in
        module scope.
    #>
    [CmdletBinding()]
    param(
        [string]$ConfigFile = "",
        [string]$FudoUrl = "",
        [string]$M42Url = "",
        [string]$ADUrl = "",
        [string]$AzureAdUrl = "",
        [string]$FudoUser = "",
        [string]$FudoPassword = "",
        [string]$M42ApiToken = "",
        [string]$AzureAdClientId = "",
        [string]$AzureAdClientSecret = ""
    )

    if (-not $ConfigFile) {
        $ConfigFile = "$PSScriptRoot/config/.env"
    }
    if (-not (Test-Path $ConfigFile)) {
        $ConfigFile = "$PSScriptRoot/config/pamlab.env"
    }
    $script:ConfigFile = $ConfigFile

    Write-Host "`nLoading configuration..." -ForegroundColor Cyan
    $null = Import-PAMlabConfig -Path $ConfigFile

    $FudoUrl = Get-PAMlabSetting -ExplicitValue $FudoUrl -EnvironmentVariable 'FUDO_URL' -DefaultValue 'http://localhost:8443'
    $M42Url = Get-PAMlabSetting -ExplicitValue $M42Url -EnvironmentVariable 'M42_URL' -DefaultValue 'http://localhost:8444'
    $ADUrl = Get-PAMlabSetting -ExplicitValue $ADUrl -EnvironmentVariable 'AD_URL' -DefaultValue 'http://localhost:8445'
    $AzureAdUrl = Get-PAMlabSetting -ExplicitValue $AzureAdUrl -EnvironmentVariable 'AZURE_AD_URL' -DefaultValue 'http://localhost:8452'
    $FudoUser = Get-PAMlabSetting -ExplicitValue $FudoUser -EnvironmentVariable 'FUDO_USER' -DefaultValue 'admin'
    $FudoPassword = Get-PAMlabSetting -ExplicitValue $FudoPassword -EnvironmentVariable 'FUDO_PASSWORD' -DefaultValue 'admin123'
    $M42ApiToken = Get-PAMlabSetting -ExplicitValue $M42ApiToken -EnvironmentVariable 'M42_API_TOKEN' -DefaultValue 'pamlab-dev-token'
    $AzureAdClientId = Get-PAMlabSetting -ExplicitValue $AzureAdClientId -EnvironmentVariable 'AZURE_AD_CLIENT_ID' -DefaultValue '11111111-2222-3333-4444-555555555551'
    $AzureAdClientSecret = Get-PAMlabSetting -ExplicitValue $AzureAdClientSecret -EnvironmentVariable 'AZURE_AD_CLIENT_SECRET' -DefaultValue 'PAMlab-Secret-1!'

    $script:FudoUrl = $FudoUrl
    $script:M42Url = $M42Url
    $script:ADUrl = $ADUrl
    $script:AzureAdUrl = $AzureAdUrl

    Write-Host "`nConnecting to PAMlab APIs...`n" -ForegroundColor Cyan

    try {
        $body = @{ login = $FudoUser; password = $FudoPassword } | ConvertTo-Json
        $resp = Invoke-RestMethod -Uri "$FudoUrl/api/v2/auth/login" -Method POST -Body $body -ContentType "application/json"
        $script:FudoToken = $resp.session_token
        Write-Step "Fudo PAM authentication" $true
    } catch {
        Write-Step "Fudo PAM authentication: $_" $false
    }

    try {
        $headers = @{ Authorization = "Bearer $M42ApiToken" }
        $resp = Invoke-RestMethod -Uri "$M42Url/m42Services/api/ApiToken/GenerateAccessTokenFromApiToken/" -Method POST -Headers $headers
        $script:M42Token = $resp.RawToken
        Write-Step "Matrix42 ESM authentication" $true
    } catch {
        Write-Step "Matrix42 ESM authentication: $_" $false
    }

    try {
        $adBindDn = Get-PAMlabSetting -ExplicitValue '' -EnvironmentVariable 'AD_BIND_DN' -DefaultValue 'CN=admin'
        $adBindPw = Get-PAMlabSetting -ExplicitValue '' -EnvironmentVariable 'AD_BIND_PASSWORD' -DefaultValue 'admin'
        $body = @{ dn = $adBindDn; password = $adBindPw } | ConvertTo-Json
        $resp = Invoke-RestMethod -Uri "$ADUrl/api/ad/auth/bind" -Method POST -Body $body -ContentType "application/json"
        $script:ADToken = $resp.token
        Write-Step "Active Directory authentication" $true
    } catch {
        Write-Step "Active Directory authentication: $_" $false
    }

    try {
        $body = @{
            grant_type    = "client_credentials"
            client_id     = $AzureAdClientId
            client_secret = $AzureAdClientSecret
            scope         = "https://graph.microsoft.com/.default"
        }
        $resp = Invoke-RestMethod -Uri "$AzureAdUrl/oauth2/v2.0/token" -Method POST -Body $body
        $script:AzureAdToken = $resp.access_token
        Write-Step "Microsoft Entra ID authentication" $true
    } catch {
        Write-Step "Microsoft Entra ID authentication: $_" $false
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

function Invoke-Entra {
    <#
    .SYNOPSIS
        Wrapper for Microsoft Entra ID API calls. Auto-adds Bearer token and base URL.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null
    )

    $headers = @{ Authorization = "Bearer $script:AzureAdToken" }
    $params = @{
        Uri         = "$script:AzureAdUrl$Endpoint"
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
        Pretty-prints a step result.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Message,
        [Parameter(Mandatory)][bool]$Success
    )

    if ($Success) {
        Write-Host "  [OK] $Message" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $Message" -ForegroundColor Red
    }
}

function Test-ApiHealth {
    <#
    .SYNOPSIS
        Checks if all PAMlab APIs are reachable.
    #>
    [CmdletBinding()]
    param(
        [string]$FudoUrl = "http://localhost:8443",
        [string]$M42Url = "http://localhost:8444",
        [string]$ADUrl = "http://localhost:8445",
        [string]$AzureAdUrl = "http://localhost:8452"
    )

    Write-Host "`nChecking API health...`n" -ForegroundColor Cyan

    $allHealthy = $true

    foreach ($api in @(
        @{ Name = "Fudo PAM"; Url = "$FudoUrl/api/v2/health" },
        @{ Name = "Matrix42 ESM"; Url = "$M42Url/health" },
        @{ Name = "Active Directory"; Url = "$ADUrl/health" },
        @{ Name = "Microsoft Entra ID"; Url = "$AzureAdUrl/health" }
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

function Switch-PAMlabEnv {
    <#
    .SYNOPSIS
        Switches between dev and production configuration.
    #>
    [CmdletBinding()]
    param(
        [ValidateSet("dev", "production")]
        [string]$Environment = "dev"
    )

    if ($Environment -eq "dev") {
        $script:ConfigFile = "$PSScriptRoot/config/pamlab.env"
    } else {
        $script:ConfigFile = "$PSScriptRoot/config/.env"
        if (-not (Test-Path $script:ConfigFile)) {
            Write-Host "[FAIL] Production config not found! Copy config/production.env.template to config/.env" -ForegroundColor Red
            return
        }
    }

    Connect-PAMlab -ConfigFile $script:ConfigFile
}

Export-ModuleMember -Function Connect-PAMlab, Invoke-Fudo, Invoke-M42, Invoke-AD, Invoke-Entra, Write-Step, Test-ApiHealth, Switch-PAMlabEnv, Import-PAMlabConfig
