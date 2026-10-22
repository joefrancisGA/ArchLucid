#requires -Version 5.1
<#
.SYNOPSIS
  Validate paid-pilot ROI baseline capture before kickoff or sponsor handoff.

.DESCRIPTION
  Wraps scripts/ci/report_paid_pilot_baseline_readiness.py. Use at pilot kickoff to
  confirm baselineReviewCycleHours and source labels are captured (or explicitly waived).

.EXAMPLE
  .\scripts\validate-paid-pilot-baseline-readiness.ps1 `
    -BaselinePath artifacts/paid-pilot-baseline/contoso-pilot/baseline.json `
    -StrictPaidPilot
#>
param(
    [string] $BaselinePath = '',
    [string] $PilotLabel = '',
    [string] $TenantId = '',
    [string] $RunId = '',
    [string] $OutputDirectory = 'artifacts/paid-pilot-baseline-readiness',
    [switch] $StrictPaidPilot,
    [switch] $AllowMissing
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $PSScriptRoot 'ci\report_paid_pilot_baseline_readiness.py'

function Resolve-PaidPilotBaselinePath {
    param(
        [string] $ExplicitPath,
        [string] $PilotLabelValue,
        [string] $TenantIdValue,
        [string] $RunIdValue
    )

    if (-not [string]::IsNullOrWhiteSpace($ExplicitPath)) {
        if (Test-Path -LiteralPath $ExplicitPath) {
            return (Resolve-Path -LiteralPath $ExplicitPath).Path
        }

        return $null
    }

    $candidates = @()

    if (-not [string]::IsNullOrWhiteSpace($RunIdValue)) {
        $candidates += Join-Path $root "artifacts\paid-pilot-baseline\$($RunIdValue.Trim())\baseline.json"
    }

    if (-not [string]::IsNullOrWhiteSpace($TenantIdValue)) {
        $candidates += Join-Path $root "artifacts\paid-pilot-baseline\$($TenantIdValue.Trim())\baseline.json"
    }

    if (-not [string]::IsNullOrWhiteSpace($PilotLabelValue)) {
        $safeLabel = ($PilotLabelValue.Trim() -replace '[^\w\-]+', '-').Trim('-')

        if ($safeLabel) {
            $candidates += Join-Path $root "artifacts\paid-pilot-baseline\$safeLabel\baseline.json"
        }
    }

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    return $null
}

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$outRoot = Join-Path (Get-Location) $OutputDirectory
$reportDir = Join-Path $outRoot "baseline-readiness-$timestamp"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$resolvedBaselinePath = Resolve-PaidPilotBaselinePath `
    -ExplicitPath $BaselinePath `
    -PilotLabelValue $PilotLabel `
    -TenantIdValue $TenantId `
    -RunIdValue $RunId

$reportJsonPath = Join-Path $reportDir 'paid-pilot-baseline-readiness-report.json'
$reportMdPath = Join-Path $reportDir 'paid-pilot-baseline-readiness-report.md'

if ($null -eq $resolvedBaselinePath) {
    if ($AllowMissing) {
        Write-Host 'WARN: No paid-pilot baseline JSON found; skipping validation.'
        exit 0
    }

    Write-Error @"
No paid-pilot baseline JSON found.
Copy docs/go-to-market/templates/paid-pilot-baseline.template.json to artifacts/paid-pilot-baseline/<label>/baseline.json and complete baselineReviewCycleHours + baselineReviewCycleSource (or waiver).
"@
}

$args = @(
    $scriptPath,
    '--baseline-json', $resolvedBaselinePath,
    '--json-out', $reportJsonPath,
    '--markdown-out', $reportMdPath
)

if ($StrictPaidPilot) {
    $args += '--strict-paid-pilot'
}

& python @args
$exitCode = $LASTEXITCODE

if (-not (Test-Path -LiteralPath $reportJsonPath)) {
    throw 'Baseline readiness report was not generated.'
}

$report = Get-Content -LiteralPath $reportJsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
Write-Host "Paid-pilot baseline readiness: $($report.disposition) (report: $reportJsonPath)"

exit $exitCode
