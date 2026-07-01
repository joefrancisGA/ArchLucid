<#
.SYNOPSIS
    Read-only Azure Container Apps deployment diagnostic for ArchLucid RC2.
    Safe to run at midnight: no secrets printed, no destructive actions, no DB writes.

.DESCRIPTION
    Reports current state of the archlucid-api and archlucid-ui Container Apps,
    checks health endpoints, validates required env var presence (not values),
    and optionally verifies the active revision uses a specific expected SHA.

.PARAMETER ResourceGroup
    Azure resource group containing the Container Apps.
    Default: rg-ArchLucid-dev

.PARAMETER ApiAppName
    Container App name for the API.
    Default: archlucid-api

.PARAMETER UiAppName
    Container App name for the UI.
    Default: archlucid-ui

.PARAMETER ApiBaseUrl
    Base URL for the API health and version endpoints.
    Default: https://archlucid-api.orangewave-b0bbb43e.eastus2.azurecontainerapps.io

.PARAMETER UiUrl
    Public URL for the UI smoke check.
    Default: https://www.archlucid.net

.PARAMETER ExpectedSha
    Optional expected git SHA (full or prefix). When provided the script reports
    whether the active API revision image tag contains this value.

.PARAMETER LogLines
    Number of recent API log lines to retrieve via az containerapp logs.
    Default: 300

.EXAMPLE
    .\Diagnose-RC2Deployment.ps1

.EXAMPLE
    .\Diagnose-RC2Deployment.ps1 -ExpectedSha 6600bd4ce17ee62446ee7ec1c12f8baa65b36ec6

.EXAMPLE
    .\Diagnose-RC2Deployment.ps1 -ResourceGroup rg-ArchLucid-prod -ApiAppName archlucid-api-prod
#>

[CmdletBinding()]
param(
    [string]$ResourceGroup = 'rg-ArchLucid-dev',
    [string]$ApiAppName    = 'archlucid-api',
    [string]$UiAppName     = 'archlucid-ui',
    [string]$ApiBaseUrl    = 'https://archlucid-api.orangewave-b0bbb43e.eastus2.azurecontainerapps.io',
    [string]$UiUrl         = 'https://www.archlucid.net',
    [string]$ExpectedSha   = '',
    [int]   $LogLines      = 300
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# ── Helpers ───────────────────────────────────────────────────────────────────

function Section([string]$Title) {
    Write-Host ''
    Write-Host ('=' * 72) -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host ('=' * 72) -ForegroundColor Cyan
}

function Ok([string]$msg)   { Write-Host "  [OK]  $msg" -ForegroundColor Green }
function Warn([string]$msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Fail([string]$msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }
function Info([string]$msg) { Write-Host "  $msg" }

function Invoke-Az {
    [OutputType([string])]
    param([string[]]$Args)
    $result = az @Args 2>&1
    if ($LASTEXITCODE -ne 0) {
        Warn "az $($Args[0..2] -join ' ') exited $LASTEXITCODE"
        return $null
    }
    return $result
}

function Invoke-AzJson {
    param([string[]]$Args)
    $json = Invoke-Az ($Args + @('--output', 'json'))
    if ($null -eq $json) { return $null }
    try   { return $json | ConvertFrom-Json }
    catch { Warn "Could not parse JSON response"; return $null }
}

function Http-Get([string]$Url, [int]$TimeoutSec = 30) {
    try {
        $resp = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSec -UseBasicParsing -ErrorAction Stop
        return [PSCustomObject]@{ StatusCode = $resp.StatusCode; Body = $resp.Content }
    }
    catch [System.Net.WebException] {
        $code = [int]($_.Exception.Response?.StatusCode ?? 0)
        return [PSCustomObject]@{ StatusCode = $code; Body = $_.Exception.Message }
    }
    catch {
        return [PSCustomObject]@{ StatusCode = 0; Body = $_.Exception.Message }
    }
}

# ── Header ───────────────────────────────────────────────────────────────────

Write-Host ''
Write-Host '  ArchLucid RC2 — Deployment Diagnostic' -ForegroundColor White
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')"
Write-Host ''

# ── Section 1: Subscription and Git context ──────────────────────────────────

Section '1. Azure subscription + local git context'

$sub = Invoke-AzJson @('account', 'show')
if ($sub) {
    Ok "Subscription : $($sub.name) ($($sub.id))"
    Ok "Tenant       : $($sub.tenantId)"
    Info "User/SP      : $($sub.user.name) (type: $($sub.user.type))"
}
else {
    Fail "Could not read subscription — run 'az login' first."
}

$gitSha = ''
try {
    $gitSha = (git rev-parse HEAD 2>$null).Trim()
    $gitBranch = (git branch --show-current 2>$null).Trim()
    Ok "Local HEAD   : $gitSha"
    Ok "Local branch : $gitBranch"
}
catch {
    Warn "git not found or not in a repo — skipping git context."
}

if ($ExpectedSha) {
    Info "Expected SHA : $ExpectedSha"
}

# ── Section 2: API Container App — revisions ─────────────────────────────────

Section '2. API Container App revisions'

$apiRevisions = Invoke-AzJson @(
    'containerapp', 'revision', 'list',
    '--resource-group', $ResourceGroup,
    '--name', $ApiAppName
)

if ($null -eq $apiRevisions) {
    Fail "Could not list API revisions. Check ResourceGroup='$ResourceGroup' and ApiAppName='$ApiAppName'."
}
else {
    $apiRevisions | Sort-Object { $_.properties.createdTime } -Descending | ForEach-Object {
        $rev   = $_.name
        $state = $_.properties.runningState
        $img   = $_.properties.template.containers[0].image
        $wt    = $_.properties.trafficWeight
        $ts    = $_.properties.createdTime

        $stateColor = if ($state -eq 'Running') { 'Green' } elseif ($state -eq 'Failed') { 'Red' } else { 'Yellow' }
        Write-Host "  $rev" -ForegroundColor White
        Write-Host "    runningState  : $state" -ForegroundColor $stateColor
        Write-Host "    trafficWeight : $wt %"
        Write-Host "    image         : $img"
        Write-Host "    createdTime   : $ts"

        if ($ExpectedSha -and $wt -gt 0) {
            if ($img -and $img.Contains($ExpectedSha)) {
                Ok "Active revision image contains expected SHA $ExpectedSha"
            }
            else {
                Fail "Active revision image '$img' does NOT contain expected SHA '$ExpectedSha' — stale image deployed."
            }
        }
    }
}

# ── Section 3: UI Container App — revisions ──────────────────────────────────

Section '3. UI Container App revisions'

$uiRevisions = Invoke-AzJson @(
    'containerapp', 'revision', 'list',
    '--resource-group', $ResourceGroup,
    '--name', $UiAppName
)

if ($null -eq $uiRevisions) {
    Warn "Could not list UI revisions (UiAppName='$UiAppName'). Skipping."
}
else {
    $uiRevisions | Sort-Object { $_.properties.createdTime } -Descending | ForEach-Object {
        $rev   = $_.name
        $state = $_.properties.runningState
        $img   = $_.properties.template.containers[0].image
        $wt    = $_.properties.trafficWeight
        $ts    = $_.properties.createdTime

        $stateColor = if ($state -eq 'Running') { 'Green' } elseif ($state -eq 'Failed') { 'Red' } else { 'Yellow' }
        Write-Host "  $rev" -ForegroundColor White
        Write-Host "    runningState  : $state" -ForegroundColor $stateColor
        Write-Host "    trafficWeight : $wt %"
        Write-Host "    image         : $img"
        Write-Host "    createdTime   : $ts"

        if ($ExpectedSha -and $wt -gt 0) {
            if ($img -and $img.Contains($ExpectedSha)) {
                Ok "Active UI revision image contains expected SHA $ExpectedSha"
            }
            else {
                Fail "Active UI revision image '$img' does NOT contain expected SHA '$ExpectedSha'."
            }
        }
    }
}

# ── Section 4: Required API environment variable presence ─────────────────────

Section '4. API required env var presence (no secret values printed)'

# Vars checked for exact value match; others only for presence (non-empty or secretRef set).
$requiredExact = [ordered]@{
    'ArchLucid__SqlTopology__Mode'   = 'SystemWithPerTenantCatalogs'
    'ArchLucidAuth__Mode'            = 'ApiKey'
    'Authentication__ApiKey__Enabled' = 'true'
    'Demo__Enabled'                  = 'false'
    'Cors__AllowedOrigins__0'        = 'https://www.archlucid.net'
    'Billing__Provider'              = 'None'
    'ArchLucid__Secrets__Provider'   = 'KeyVault'
}

$requiredPresent = @(
    'ConnectionStrings__ArchLucidSystem',
    'ArchLucid__SqlTopology__TenantCatalogConnectionStringTemplate',
    'Authentication__ApiKey__AdminKey',
    'Authentication__ApiKey__TenantId',
    'ArchLucid__Secrets__KeyVaultUri',
    'ArchLucid__ContentSafety__Endpoint',
    'ArchLucid__ContentSafety__ApiKey'
)

$envJson = Invoke-Az @(
    'containerapp', 'show',
    '--resource-group', $ResourceGroup,
    '--name', $ApiAppName,
    '--query', 'properties.template.containers[0].env',
    '--output', 'json'
)

if ($null -eq $envJson) {
    Warn "Could not read API env vars — skipping this section."
}
else {
    $envVars = $envJson | ConvertFrom-Json

    $getEnvEntry = {
        param([string]$Name)
        $envVars | Where-Object { $_.name -eq $Name } | Select-Object -First 1
    }

    foreach ($kv in $requiredExact.GetEnumerator()) {
        $entry = & $getEnvEntry $kv.Key
        if ($null -eq $entry) {
            Fail "$($kv.Key) — MISSING"
        }
        elseif ($entry.PSObject.Properties.Name -contains 'secretRef' -and $entry.secretRef) {
            # Value is in a KeyVault / secret reference — presence confirmed, can't check exact value.
            Ok "$($kv.Key) = (secret-ref: $($entry.secretRef)) [expected '$($kv.Value)' — verify in portal]"
        }
        elseif ($entry.value -eq $kv.Value) {
            Ok "$($kv.Key) = $($kv.Value)"
        }
        else {
            Fail "$($kv.Key) = '$($entry.value)' — expected '$($kv.Value)'"
        }
    }

    foreach ($name in $requiredPresent) {
        $entry = & $getEnvEntry $name
        if ($null -eq $entry) {
            Fail "$name — MISSING"
        }
        else {
            $ref = if ($entry.PSObject.Properties.Name -contains 'secretRef') { $entry.secretRef } else { '' }
            $val = if ($entry.PSObject.Properties.Name -contains 'value') { $entry.value } else { '' }
            if ($ref) {
                Ok "$name = (secret-ref: $ref)"
            }
            elseif ($val) {
                # Print only the first 4 chars of sensitive-looking values, then mask.
                $preview = if ($val.Length -gt 4) { $val.Substring(0, 4) + '****' } else { '****' }
                Ok "$name = $preview  [present]"
            }
            else {
                Fail "$name — present but EMPTY (no value and no secretRef)"
            }
        }
    }

    # Extra: validate TenantId looks like a GUID.
    $tidEntry = & $getEnvEntry 'Authentication__ApiKey__TenantId'
    if ($tidEntry) {
        $tidVal = if ($tidEntry.PSObject.Properties.Name -contains 'secretRef') { $null } else { $tidEntry.value }
        if ($null -eq $tidVal) {
            Info "Authentication__ApiKey__TenantId is a secret-ref — GUID format cannot be verified here."
        }
        elseif ($tidVal -match '^[{]?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}[}]?$') {
            Ok "Authentication__ApiKey__TenantId is a valid GUID format"
        }
        else {
            Fail "Authentication__ApiKey__TenantId '$tidVal' is NOT a valid GUID"
        }
    }
}

# ── Section 5: Health endpoints ───────────────────────────────────────────────

Section '5. API health endpoints'

$liveUrl  = "$($ApiBaseUrl.TrimEnd('/'))/health/live"
$readyUrl = "$($ApiBaseUrl.TrimEnd('/'))/health/ready"
$verUrl   = "$($ApiBaseUrl.TrimEnd('/'))/version"

Info "Base URL: $ApiBaseUrl"
Info ''

Info "GET $liveUrl"
$liveResp = Http-Get $liveUrl
if ($liveResp.StatusCode -eq 200) {
    Ok "/health/live  HTTP $($liveResp.StatusCode)"
}
else {
    Fail "/health/live  HTTP $($liveResp.StatusCode) — $($liveResp.Body.Substring(0, [Math]::Min(200, $liveResp.Body.Length)))"
}

Info ''
Info "GET $readyUrl"
$readyResp = Http-Get $readyUrl 60
if ($readyResp.StatusCode -eq 200) {
    try {
        $readyJson = $readyResp.Body | ConvertFrom-Json
        $overallStatus = $readyJson.status
        if ($overallStatus -eq 'Healthy') {
            Ok "/health/ready HTTP $($readyResp.StatusCode) — status: $overallStatus"
        }
        else {
            Fail "/health/ready HTTP $($readyResp.StatusCode) — status: $overallStatus"
            $readyJson.entries.PSObject.Properties | ForEach-Object {
                $checkStatus = $_.Value.status
                $checkColor  = if ($checkStatus -eq 'Healthy') { 'Green' } else { 'Red' }
                Write-Host "    $($_.Name): $checkStatus" -ForegroundColor $checkColor
            }
        }
    }
    catch {
        Warn "/health/ready HTTP $($readyResp.StatusCode) — could not parse JSON body"
        Info $readyResp.Body.Substring(0, [Math]::Min(500, $readyResp.Body.Length))
    }
}
else {
    Fail "/health/ready HTTP $($readyResp.StatusCode)"
    Info $readyResp.Body.Substring(0, [Math]::Min(500, $readyResp.Body.Length))
}

Info ''
Info "GET $verUrl"
$verResp = Http-Get $verUrl
if ($verResp.StatusCode -eq 200) {
    try {
        $verJson = $verResp.Body | ConvertFrom-Json
        Ok "/version      HTTP $($verResp.StatusCode)"
        Info "  CommitSha    : $($verJson.commitSha ?? $verJson.CommitSha ?? '(not stamped)')"
        Info "  Version      : $($verJson.version ?? $verJson.Version ?? '?')"
        Info "  Environment  : $($verJson.environment ?? $verJson.Environment ?? '?')"
        if ($ExpectedSha -and ($verJson.commitSha ?? $verJson.CommitSha)) {
            $reportedSha = ($verJson.commitSha ?? $verJson.CommitSha)
            if ($reportedSha.StartsWith($ExpectedSha) -or $ExpectedSha.StartsWith($reportedSha)) {
                Ok "CommitSha matches expected SHA"
            }
            else {
                Fail "CommitSha '$reportedSha' does NOT match expected '$ExpectedSha' — wrong image running"
            }
        }
    }
    catch {
        Warn "/version returned non-JSON body"
        Info $verResp.Body.Substring(0, [Math]::Min(300, $verResp.Body.Length))
    }
}
else {
    Fail "/version HTTP $($verResp.StatusCode)"
}

# ── Section 6: UI public URL ──────────────────────────────────────────────────

Section '6. UI public URL'

Info "GET $UiUrl"
$uiResp = Http-Get $UiUrl 30
if ($uiResp.StatusCode -eq 200) {
    Ok "UI public URL HTTP $($uiResp.StatusCode)"
}
else {
    Fail "UI public URL HTTP $($uiResp.StatusCode) — $($uiResp.Body.Substring(0, [Math]::Min(200, $uiResp.Body.Length)))"
}

# ── Section 7: Recent API logs ────────────────────────────────────────────────

Section "7. Recent API logs (last $LogLines lines)"

Info "Fetching logs for '$ApiAppName' in '$ResourceGroup'..."
Info "(This may take 15-30 seconds.)"
Info ''

$logs = Invoke-Az @(
    'containerapp', 'logs', 'show',
    '--resource-group', $ResourceGroup,
    '--name', $ApiAppName,
    '--tail', $LogLines.ToString(),
    '--output', 'table'
)

if ($null -ne $logs) {
    $logs | ForEach-Object { Write-Host "  $_" }
}
else {
    Warn "Could not retrieve logs. Try manually:"
    Info "  az containerapp logs show -g $ResourceGroup -n $ApiAppName --tail $LogLines --follow"
}

# ── Section 8: Summary ────────────────────────────────────────────────────────

Section '8. Quick summary'

$activeApiRevs = $apiRevisions | Where-Object { $_.properties.runningState -eq 'Running' }
$failedApiRevs = $apiRevisions | Where-Object { $_.properties.runningState -eq 'Failed'  }

if ($activeApiRevs) {
    $activeApiRevs | ForEach-Object {
        Ok "API  Running: $($_.name) — image: $($_.properties.template.containers[0].image)"
    }
}
else {
    Fail "No Running API revisions found."
}

if ($failedApiRevs) {
    $failedApiRevs | ForEach-Object {
        Fail "API  Failed : $($_.name) — image: $($_.properties.template.containers[0].image)"
    }
}

$activeUiRevs = if ($uiRevisions) { $uiRevisions | Where-Object { $_.properties.runningState -eq 'Running' } } else { @() }
if ($activeUiRevs) {
    $activeUiRevs | ForEach-Object {
        Ok "UI   Running: $($_.name) — image: $($_.properties.template.containers[0].image)"
    }
}
else {
    Warn "No Running UI revisions found (or UI app not configured)."
}

Info ''
Info "Next steps:"
Info "  If a revision is Failed    → section 7 logs + docs/runbooks/RC2_CONTAINER_APPS_DEPLOYMENT.md"
Info "  If image SHA is wrong      → re-run CD or: az containerapp update -g $ResourceGroup -n $ApiAppName --image <acr>/<repo>:<sha>"
Info "  If env vars are wrong      → fix in Azure portal or az containerapp update --set-env-vars, then restart"
Info "  If health/ready Unhealthy  → check SQL connectivity (see Verify-SystemCatalog.sql + Verify-TenantCatalog.sql)"
Info "  If /version commitSha wrong → image was built without BUILD_SHA arg; re-run CD"
Info ''
