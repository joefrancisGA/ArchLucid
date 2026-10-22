#Requires -Version 5.1
<#
.SYNOPSIS
  Audits GitHub repository variable SMOKE_SYNTHETIC_PATH for CD warm-path smoke (TB-758).

.DESCRIPTION
  Post-deploy validation already probes anonymous health + /version. Setting
  SMOKE_SYNTHETIC_PATH to a cheap authenticated GET warms auth + tenant scope
  without mutating data (one extra GET per smoke attempt).

  Recommended repository variable (staging/production):

    SMOKE_SYNTHETIC_PATH=/api/auth/me

  Requires ARCHLUCID_API_KEY (Admin X-Api-Key) on the deployment-evidence step.
  Path must return HTTP 200 and must not mutate tenant data.

  Exit codes: 0 pass, 1 warn (missing or still /version), 2 fail (gh/read error).

.EXAMPLE
  .\scripts\ci\verify-cd-synthetic-path-vars.ps1

.EXAMPLE
  .\scripts\ci\verify-cd-synthetic-path-vars.ps1 -Apply
#>
[CmdletBinding()]
param(
    [switch]$Apply,

    [string]$RecommendedSyntheticPath = '/api/auth/me'
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

function Normalize-SyntheticPath {
    param([string]$Raw)

    if ([string]::IsNullOrWhiteSpace($Raw)) {
        return '/version'
    }

    $trimmed = $Raw.Trim()

    if (-not $trimmed.StartsWith('/')) {
        $trimmed = "/$trimmed"
    }

    return $trimmed
}

Assert-GhReady

$issues = [System.Collections.Generic.List[string]]::new()
$rawValue = Get-RepoVariableValue -Name 'SMOKE_SYNTHETIC_PATH'
$normalized = Normalize-SyntheticPath -Raw $rawValue

if ($normalized -eq '/version') {
    $display = if ([string]::IsNullOrWhiteSpace($rawValue)) { '<unset>' } else { $rawValue }
    $issues.Add(
        "SMOKE_SYNTHETIC_PATH is $display (effective /version); recommended $RecommendedSyntheticPath for authenticated warm-path smoke.")
}

if ($Apply -and $issues.Count -gt 0) {
    Set-RepoVariableValue -Name 'SMOKE_SYNTHETIC_PATH' -Value $RecommendedSyntheticPath
    $rawValue = Get-RepoVariableValue -Name 'SMOKE_SYNTHETIC_PATH'
    $normalized = Normalize-SyntheticPath -Raw $rawValue
    $issues.Clear()

    if ($normalized -eq '/version') {
        $issues.Add('SMOKE_SYNTHETIC_PATH still /version after -Apply.')
    }
}

if ($issues.Count -eq 0) {
    Write-Host "CD synthetic path repo var OK ($normalized). One extra GET per smoke attempt; no Azure SKU change."
    exit 0
}

foreach ($issue in $issues) {
    Write-Warning $issue
}

Write-Host "Recommended: SMOKE_SYNTHETIC_PATH=$RecommendedSyntheticPath (GET, ReadAuthority, no mutation)."
Write-Host 'Fix: .\scripts\ci\bootstrap-github-cd-environments.ps1 or .\scripts\ci\verify-cd-synthetic-path-vars.ps1 -Apply'

exit 1
