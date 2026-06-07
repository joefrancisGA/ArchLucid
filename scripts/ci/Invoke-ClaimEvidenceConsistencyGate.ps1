<#
    .SYNOPSIS
        Runs the unified claim/evidence consistency gate and writes release-review artifacts.

    .PARAMETER OutputDir
        Directory for claim-evidence-consistency.json and .md outputs.

    .EXAMPLE
        .\scripts\ci\Invoke-ClaimEvidenceConsistencyGate.ps1 -OutputDir artifacts/release-readiness
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $OutputDir
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$checker = Join-Path $repoRoot 'scripts/ci/check_claim_evidence_consistency.py'

if (-not (Test-Path -LiteralPath $checker)) {
    throw "Missing checker: $checker"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$jsonOut = Join-Path $OutputDir 'claim-evidence-consistency.json'
$mdOut = Join-Path $OutputDir 'claim-evidence-consistency.md'

& python $checker --json-out $jsonOut --markdown-out $mdOut
$exit = $LASTEXITCODE

if ($exit -ne 0) {
    Write-Error "Claim/evidence consistency gate failed (exit $exit). See $mdOut"
}

Write-Host "Claim/evidence consistency gate passed. Artifacts: $jsonOut"
exit 0
