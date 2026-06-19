<#
    .SYNOPSIS
        Agent-friendly wrapper for simulator/live divergence classification (assessment SAQ-008).

    .DESCRIPTION
        Accepts either a pre-built summary JSON (--SummaryJson) or a release evidence bundle directory
        (--BundleDir). Writes JSON and Markdown artifacts and optionally enforces buyer-facing full-real
        blocking (--EnforceBuyerFacing).

    .PARAMETER SummaryJson
        Path to simulator/live divergence summary input JSON.

    .PARAMETER BundleDir
        Release evidence bundle directory (synthesizes summary via build_simulator_live_divergence_from_bundle.py).

    .PARAMETER OutputDir
        Directory for simulator-live-divergence.json and .md outputs.

    .PARAMETER EnforceBuyerFacing
        Exit non-zero when buyerFacingFullRealBlocked is true.

    .EXAMPLE
        .\scripts\ci\agent-sim-live-divergence-check.ps1 -BundleDir artifacts/release-readiness -OutputDir artifacts/release-readiness

    .EXAMPLE
        .\scripts\ci\agent-sim-live-divergence-check.ps1 -SummaryJson artifacts/summary.json -OutputDir artifacts/out -EnforceBuyerFacing
#>
[CmdletBinding(DefaultParameterSetName = 'Bundle')]
param(
    [Parameter(ParameterSetName = 'Summary', Mandatory = $true)]
    [string] $SummaryJson,

    [Parameter(ParameterSetName = 'Bundle', Mandatory = $true)]
    [string] $BundleDir,

    [Parameter(Mandatory = $true)]
    [string] $OutputDir,

    [switch] $EnforceBuyerFacing
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$checkScript = Join-Path $repoRoot 'scripts/ci/check_simulator_live_divergence.py'
$bundleScript = Join-Path $repoRoot 'scripts/ci/build_simulator_live_divergence_from_bundle.py'

if (-not (Test-Path -LiteralPath $checkScript)) {
    throw "Missing checker: $checkScript"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$jsonOut = Join-Path $OutputDir 'simulator-live-divergence.json'
$mdOut = Join-Path $OutputDir 'simulator-live-divergence.md'
$enforceFlag = if ($EnforceBuyerFacing) { '--enforce-buyer-facing' } else { $null }

if ($PSCmdlet.ParameterSetName -eq 'Summary') {
    if ([string]::IsNullOrWhiteSpace($SummaryJson)) {
        throw 'SummaryJson is required when not using -BundleDir.'
    }

    if (-not (Test-Path -LiteralPath $SummaryJson)) {
        throw "Summary JSON not found: $SummaryJson"
    }

    $args = @(
        $checkScript,
        '--summary-json', (Resolve-Path -LiteralPath $SummaryJson).Path,
        '--json-out', $jsonOut,
        '--markdown-out', $mdOut
    )

    if ($null -ne $enforceFlag) {
        $args += $enforceFlag
    }

    & python @args
}
else {
    if (-not (Test-Path -LiteralPath $bundleScript)) {
        throw "Missing bundle builder: $bundleScript"
    }

    if (-not (Test-Path -LiteralPath $BundleDir)) {
        throw "Bundle directory not found: $BundleDir"
    }

    $args = @(
        $bundleScript,
        '--bundle-dir', (Resolve-Path -LiteralPath $BundleDir).Path,
        '--json-out', $jsonOut,
        '--markdown-out', $mdOut
    )

    if ($null -ne $enforceFlag) {
        $args += $enforceFlag
    }

    & python @args
}

$exit = $LASTEXITCODE

if ($exit -ne 0) {
    Write-Error "Simulator/live divergence check failed (exit $exit). See $mdOut"
}

Write-Host "Simulator/live divergence check passed. Artifacts: $jsonOut , $mdOut"
exit 0
