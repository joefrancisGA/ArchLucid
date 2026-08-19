#Requires -Version 5.1
<#
.SYNOPSIS
  Audits GitHub repository variables for CD API canary + bake (TB-755).

.DESCRIPTION
  Splits a small percentage of API ingress to the new revision before smoke promotes
  to 100%. Requires Terraform api_revision_mode = Multiple on the API Container App.

  Recommended repository variables (no min_replicas increase):

    CD_CANARY_ENABLED=true
    CD_CANARY_INITIAL_PERCENT=10
    CD_CANARY_BAKE_MINUTES=3

  Exit codes: 0 pass, 1 warn (missing or below recommended), 2 fail (gh/read error).

.EXAMPLE
  .\scripts\ci\verify-cd-canary-vars.ps1

.EXAMPLE
  .\scripts\ci\verify-cd-canary-vars.ps1 -Apply
#>
[CmdletBinding()]
param(
    [switch]$Apply,

    [int]$RecommendedInitialPercent = 10,

    [int]$RecommendedBakeMinutes = 3
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

function Test-IntegerInRange {
    param(
        [string]$RawValue,
        [int]$Minimum,
        [int]$Maximum
    )

    if ([string]::IsNullOrWhiteSpace($RawValue)) {
        return $false
    }

    [int]$parsed = 0

    if (-not [int]::TryParse($RawValue.Trim(), [ref]$parsed)) {
        return $false
    }

    return $parsed -ge $Minimum -and $parsed -le $Maximum
}

function Test-CanaryEnabled {
    param([string]$RawValue)

    return -not [string]::IsNullOrWhiteSpace($RawValue) -and $RawValue.Trim().Equals('true', [System.StringComparison]::OrdinalIgnoreCase)
}

Assert-GhReady

$issues = [System.Collections.Generic.List[string]]::new()
$enabledValue = Get-RepoVariableValue -Name 'CD_CANARY_ENABLED'
$percentValue = Get-RepoVariableValue -Name 'CD_CANARY_INITIAL_PERCENT'
$bakeValue = Get-RepoVariableValue -Name 'CD_CANARY_BAKE_MINUTES'

if (-not (Test-CanaryEnabled -RawValue $enabledValue)) {
    $display = if ([string]::IsNullOrWhiteSpace($enabledValue)) { '<unset>' } else { $enabledValue }
    $issues.Add("CD_CANARY_ENABLED is $display; recommended true for staging/production cold-start canary.")
}

if (-not (Test-IntegerInRange -RawValue $percentValue -Minimum 1 -Maximum 99)) {
    $display = if ([string]::IsNullOrWhiteSpace($percentValue)) { '<unset>' } else { $percentValue }
    $issues.Add("CD_CANARY_INITIAL_PERCENT is $display; recommended $RecommendedInitialPercent (1-99).")
}

if (-not (Test-IntegerInRange -RawValue $bakeValue -Minimum $RecommendedBakeMinutes -Maximum 30)) {
    $display = if ([string]::IsNullOrWhiteSpace($bakeValue)) { '<unset>' } else { $bakeValue }
    $issues.Add("CD_CANARY_BAKE_MINUTES is $display; recommended >= $RecommendedBakeMinutes before smoke.")
}

if ($Apply -and $issues.Count -gt 0) {
    if (-not (Test-CanaryEnabled -RawValue $enabledValue)) {
        Set-RepoVariableValue -Name 'CD_CANARY_ENABLED' -Value 'true'
    }

    if (-not (Test-IntegerInRange -RawValue $percentValue -Minimum 1 -Maximum 99)) {
        Set-RepoVariableValue -Name 'CD_CANARY_INITIAL_PERCENT' -Value "$RecommendedInitialPercent"
    }

    if (-not (Test-IntegerInRange -RawValue $bakeValue -Minimum $RecommendedBakeMinutes -Maximum 30)) {
        Set-RepoVariableValue -Name 'CD_CANARY_BAKE_MINUTES' -Value "$RecommendedBakeMinutes"
    }

    $enabledValue = Get-RepoVariableValue -Name 'CD_CANARY_ENABLED'
    $percentValue = Get-RepoVariableValue -Name 'CD_CANARY_INITIAL_PERCENT'
    $bakeValue = Get-RepoVariableValue -Name 'CD_CANARY_BAKE_MINUTES'
    $issues.Clear()

    if (-not (Test-CanaryEnabled -RawValue $enabledValue)) {
        $issues.Add('CD_CANARY_ENABLED still not true after -Apply.')
    }

    if (-not (Test-IntegerInRange -RawValue $percentValue -Minimum 1 -Maximum 99)) {
        $issues.Add('CD_CANARY_INITIAL_PERCENT still invalid after -Apply.')
    }

    if (-not (Test-IntegerInRange -RawValue $bakeValue -Minimum $RecommendedBakeMinutes -Maximum 30)) {
        $issues.Add('CD_CANARY_BAKE_MINUTES still below recommended after -Apply.')
    }
}

if ($issues.Count -eq 0) {
    Write-Host "CD canary repo vars OK (enabled=$enabledValue, percent=$percentValue, bake=${bakeValue}m). Requires api_revision_mode=Multiple in Terraform."
    exit 0
}

foreach ($issue in $issues) {
    Write-Warning $issue
}

Write-Host "Recommended: CD_CANARY_ENABLED=true, CD_CANARY_INITIAL_PERCENT=$RecommendedInitialPercent, CD_CANARY_BAKE_MINUTES=$RecommendedBakeMinutes."
Write-Host 'Terraform: set api_revision_mode = Multiple on staging/production (see staging.tfvars.example / production.tfvars.example).'
Write-Host 'Fix: .\scripts\ci\bootstrap-github-cd-environments.ps1 or .\scripts\ci\verify-cd-canary-vars.ps1 -Apply'

exit 1
