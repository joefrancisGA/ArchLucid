#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Run the weekly proof-cadence workflow and emit a claim-gate checklist packet.

.DESCRIPTION
  Orchestrates readiness proof collection and release-readiness evidence emission,
  then builds a machine-readable G1–G6 cadence checklist under artifacts/weekly-proof-cadence/.

.PARAMETER OutDir
  Root output directory (default: artifacts/weekly-proof-cadence).

.PARAMETER Strict
  Exit 1 when overallDisposition is HOLD after validation.
#>
[CmdletBinding()]
param(
    [string] $OutDir = 'artifacts/weekly-proof-cadence',
    [switch] $Strict
)

$ErrorActionPreference = 'Stop'
[string] $root = Split-Path -Parent $PSScriptRoot
Set-Location $root

[string] $stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
[string] $cadenceId = "weekly-$stamp"
[string] $cadenceDir = Join-Path $OutDir $stamp
[string] $releaseDir = Join-Path $cadenceDir 'release-readiness'
[string] $pilotDir = Join-Path $cadenceDir 'first-pilot-readiness'

New-Item -ItemType Directory -Force -Path $cadenceDir, $releaseDir, $pilotDir | Out-Null

Write-Host "Weekly proof cadence: $cadenceId"
Write-Host "Output: $cadenceDir"

& .\scripts\collect-first-pilot-proof.ps1 -OutputDirectory $pilotDir 2>&1 | Write-Host
if ($LASTEXITCODE -ne 0) {
    Write-Warning "collect-first-pilot-proof.ps1 exited $LASTEXITCODE — continuing cadence assembly with partial pilot artifacts."
}

& .\scripts\Emit-ReleaseReadinessEvidence.ps1 -OutDir $releaseDir 2>&1 | Write-Host
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Emit-ReleaseReadinessEvidence.ps1 exited $LASTEXITCODE — continuing cadence assembly with partial release artifacts."
}

[string] $pilotSummary = Join-Path $pilotDir 'go-no-go-summary.json'
[string[]] $buildArgs = @(
    'scripts/ci/build_weekly_proof_cadence.py',
    '--cadence-id', $cadenceId,
    '--release-bundle-dir', $releaseDir,
    '--json-out', (Join-Path $cadenceDir 'weekly-proof-cadence.json'),
    '--markdown-out', (Join-Path $cadenceDir 'weekly-proof-cadence.md')
)

if (Test-Path -LiteralPath $pilotSummary) {
    $buildArgs += @('--pilot-summary', $pilotSummary)
}

& python @buildArgs
if ($LASTEXITCODE -ne 0) {
    throw "build_weekly_proof_cadence.py failed with exit code $LASTEXITCODE"
}

[string[]] $validateArgs = @(
    'scripts/ci/validate_weekly_proof_cadence.py',
    '--cadence-json', (Join-Path $cadenceDir 'weekly-proof-cadence.json')
)

if ($Strict) {
    $validateArgs += '--strict'
}

& python @validateArgs
[int] $validateExit = $LASTEXITCODE

Write-Host "Cadence packet: $(Join-Path $cadenceDir 'weekly-proof-cadence.json')"

if ($validateExit -ne 0) {
    exit $validateExit
}

exit 0
