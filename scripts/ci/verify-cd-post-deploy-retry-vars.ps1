#Requires -Version 5.1
<#
.SYNOPSIS
  Audits GitHub repository variables for CD post-deploy smoke retries (TB-754).

.DESCRIPTION
  Container App cold starts often need multiple deployment-evidence passes. Recommended
  repository variables (zero extra Azure spend):

    CD_POST_DEPLOY_MAX_ATTEMPTS=6
    CD_POST_DEPLOY_RETRY_WAIT_SECONDS=10

  cd.yml uses bash fallbacks of 6/10 when vars are unset; local cd-post-deploy-verify.sh
  defaults to 1 attempt unless env vars are exported.

  Exit codes: 0 pass, 1 warn (missing or below recommended), 2 fail (gh/read error).

.EXAMPLE
  .\scripts\ci\verify-cd-post-deploy-retry-vars.ps1

.EXAMPLE
  .\scripts\ci\verify-cd-post-deploy-retry-vars.ps1 -Apply
#>
[CmdletBinding()]
param(
    [switch]$Apply,

    [int]$RecommendedMaxAttempts = 6,

    [int]$RecommendedRetryWaitSeconds = 10
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-GhReady {
    $null = gh auth status 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Error 'gh CLI is not authenticated. Run: gh auth login'
        exit 2
    }
}

function Get-RepoVariableValue {
    param([string]$Name)

    $json = gh variable list --json name,value 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Error "gh variable list failed: $json"
        exit 2
    }

    $rows = @($json | ConvertFrom-Json)
    $match = $rows | Where-Object { $_.name -eq $Name } | Select-Object -First 1

    if ($null -eq $match) {
        return $null
    }

    return [string]$match.value
}

function Set-RepoVariableValue {
    param(
        [string]$Name,
        [string]$Value
    )

    gh variable set $Name --body $Value | Out-Null

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to set repository variable $Name"
        exit 2
    }

    Write-Host "Set repository variable $Name=$Value"
}

function Test-IntegerAtLeast {
    param(
        [string]$RawValue,
        [int]$Minimum
    )

    if ([string]::IsNullOrWhiteSpace($RawValue)) {
        return $false
    }

    [int]$parsed = 0

    if (-not [int]::TryParse($RawValue.Trim(), [ref]$parsed)) {
        return $false
    }

    return $parsed -ge $Minimum
}

Assert-GhReady

$issues = [System.Collections.Generic.List[string]]::new()
$maxValue = Get-RepoVariableValue -Name 'CD_POST_DEPLOY_MAX_ATTEMPTS'
$waitValue = Get-RepoVariableValue -Name 'CD_POST_DEPLOY_RETRY_WAIT_SECONDS'

if (-not (Test-IntegerAtLeast -RawValue $maxValue -Minimum $RecommendedMaxAttempts)) {
    $display = if ([string]::IsNullOrWhiteSpace($maxValue)) { '<unset>' } else { $maxValue }
    $issues.Add("CD_POST_DEPLOY_MAX_ATTEMPTS is $display; recommended >= $RecommendedMaxAttempts for Container Apps cold start.")
}

if (-not (Test-IntegerAtLeast -RawValue $waitValue -Minimum $RecommendedRetryWaitSeconds)) {
    $display = if ([string]::IsNullOrWhiteSpace($waitValue)) { '<unset>' } else { $waitValue }
    $issues.Add("CD_POST_DEPLOY_RETRY_WAIT_SECONDS is $display; recommended >= $RecommendedRetryWaitSeconds when retrying smoke.")
}

if ($Apply -and $issues.Count -gt 0) {
    if (-not (Test-IntegerAtLeast -RawValue $maxValue -Minimum $RecommendedMaxAttempts)) {
        Set-RepoVariableValue -Name 'CD_POST_DEPLOY_MAX_ATTEMPTS' -Value "$RecommendedMaxAttempts"
    }

    if (-not (Test-IntegerAtLeast -RawValue $waitValue -Minimum $RecommendedRetryWaitSeconds)) {
        Set-RepoVariableValue -Name 'CD_POST_DEPLOY_RETRY_WAIT_SECONDS' -Value "$RecommendedRetryWaitSeconds"
    }

    $maxValue = Get-RepoVariableValue -Name 'CD_POST_DEPLOY_MAX_ATTEMPTS'
    $waitValue = Get-RepoVariableValue -Name 'CD_POST_DEPLOY_RETRY_WAIT_SECONDS'
    $issues.Clear()

    if (-not (Test-IntegerAtLeast -RawValue $maxValue -Minimum $RecommendedMaxAttempts)) {
        $issues.Add('CD_POST_DEPLOY_MAX_ATTEMPTS still below recommended after -Apply.')
    }

    if (-not (Test-IntegerAtLeast -RawValue $waitValue -Minimum $RecommendedRetryWaitSeconds)) {
        $issues.Add('CD_POST_DEPLOY_RETRY_WAIT_SECONDS still below recommended after -Apply.')
    }
}

if ($issues.Count -eq 0) {
    Write-Host "CD post-deploy retry repo vars OK (max=$maxValue, wait=${waitValue}s). No extra Azure compute cost."
    exit 0
}

foreach ($issue in $issues) {
    Write-Warning $issue
}

Write-Host "Recommended: CD_POST_DEPLOY_MAX_ATTEMPTS=$RecommendedMaxAttempts, CD_POST_DEPLOY_RETRY_WAIT_SECONDS=$RecommendedRetryWaitSeconds (GitHub Actions retries only)."
Write-Host 'Fix: .\scripts\ci\bootstrap-github-cd-environments.ps1 (sets vars) or .\scripts\ci\verify-cd-post-deploy-retry-vars.ps1 -Apply'

exit 1
