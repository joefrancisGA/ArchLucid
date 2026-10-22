#requires -Version 5.1
<#
.SYNOPSIS
  Fail-closed validation for ReleaseCandidate / LiveUiSql machine-readable smoke artifacts.

.DESCRIPTION
  RC signoff lanes expect evidenceKind=live-ui-sql-parity, profile LiveUiSql or ReleaseCandidate,
  and verdict Pass with live Playwright parity exercised. Used by release-smoke.ps1 and local dry runs.
#>
param(
    [Parameter(Mandatory = $true)]
    [string] $ResultPath,

    [ValidateSet('ReleaseCandidate', 'LiveUiSql')]
    [string] $ExpectedProfile = 'ReleaseCandidate'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'OperatorDiagnostics.ps1')

function Test-ReleaseSmokeCheckPassed {
    param(
        [object[]] $CheckRows,
        [string] $CheckName
    )

    foreach ($row in $CheckRows) {
        $name = if ($row.name) { [string]$row.name } else { [string]$row.Name }

        if ($name -ne $CheckName) {
            continue
        }

        $result = if ($row.result) { [string]$row.result } else { [string]$row.Result }

        return ($result -eq 'Passed')
    }

    return $false
}

if (-not (Test-Path -LiteralPath $ResultPath)) {
    Write-OperatorFailureTriage -Stage 'RC result artifact' -Category 'MissingArtifact' `
        -Details @("Result JSON not found at $ResultPath") `
        -NextSteps @(
        'Run: .\scripts\release-smoke-rc.ps1 -ResultOut artifacts/release-smoke-live-ui-sql-result.json',
        'Supply tenant SQL via ARCHLUCID_SMOKE_SQL or -SqlConnectionString'
    )
    exit 1
}

try {
    $payload = Get-Content -LiteralPath $ResultPath -Raw | ConvertFrom-Json
}
catch {
    Write-OperatorFailureTriage -Stage 'RC result artifact' -Category 'InvalidArtifact' `
        -Details @("Could not parse JSON at $ResultPath : $($_.Exception.Message)") `
        -NextSteps @('Re-run release-smoke-rc.ps1 without -SkipE2E or -SkipUi')
    exit 1
}

$failures = @()
$verdict = [string]$payload.verdict
$profile = [string]$payload.profile
$evidenceKind = [string]$payload.evidenceKind

if ($verdict -notin @('Pass', 'PASS')) {
    $failures += "verdict must be Pass (got '$verdict')"
}

if ($profile -ne $ExpectedProfile) {
    $failures += "profile must be $ExpectedProfile (got '$profile')"
}

if ($evidenceKind -ne 'live-ui-sql-parity') {
    $failures += "evidenceKind must be live-ui-sql-parity (got '$evidenceKind')"
}

if ([string]::IsNullOrWhiteSpace([string]$payload.generatedUtc)) {
    $failures += 'generatedUtc is required for RC freshness lanes'
}

$checks = @($payload.checks)

if (-not (Test-ReleaseSmokeCheckPassed -CheckRows $checks -CheckName 'Live Playwright parity')) {
    $failures += 'checks must include Live Playwright parity=Passed (omit -SkipE2E and -SkipUi for RC profile)'
}

if ($failures.Count -gt 0) {
    Write-OperatorFailureTriage -Stage 'RC result artifact' -Category 'StrictRcValidation' `
        -Details $failures `
        -NextSteps @(
        'RC path is fail-closed: use .\scripts\release-smoke-rc.ps1 with SQL + full E2E + UI build',
        'Attach release-smoke-live-ui-sql-result.json to artifacts/release-readiness/ before strict signoff',
        'See docs/library/RELEASE_SMOKE.md — ReleaseCandidate profile'
    )
    exit 1
}

Write-Host "RC release-smoke artifact validated: $ResultPath (profile=$profile, evidenceKind=$evidenceKind)" -ForegroundColor Green
exit 0
