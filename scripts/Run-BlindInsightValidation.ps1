#Requires -Version 5.1
<#
.SYNOPSIS
  Run blind principal-architect insight validation: assemble packet, optional score, summarize, cohort aggregate.

.DESCRIPTION
  Wraps scripts/assemble_blind_validation_packet.py and scripts/ci/aggregate_blind_insight_sessions.py.
  Protocol: docs/go-to-market/Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md (#blind-insight-validation)

.EXAMPLE
  .\scripts\Run-BlindInsightValidation.ps1 -SessionLabel pilot-session-01

.EXAMPLE
  .\scripts\Run-BlindInsightValidation.ps1 -SessionLabel demo -NonInteractiveScore -FillRating 4 -FillClassification U -AutoSummarize
#>
[CmdletBinding()]
param(
    [string] $Fixture = (Join-Path $PSScriptRoot '..\fixtures\blind-validation\regulated-scenario'),
    [Parameter(Mandatory = $true)]
    [string] $SessionLabel,
    [string] $OutputRoot = (Join-Path $PSScriptRoot '..\artifacts\blind-validation'),
    [int] $Seed = 42,
    [switch] $InteractiveScore,
    [switch] $NonInteractiveScore,
    [ValidateRange(1, 5)]
    [int] $FillRating = 4,
    [ValidateSet('O', 'U', 'N', 'X', 'S')]
    [string] $FillClassification = 'U',
    [switch] $AutoSummarize,
    [switch] $AggregateCohort
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$python = if ($env:ARCHLUCID_PYTHON) { $env:ARCHLUCID_PYTHON } else { 'python' }
$assembler = Join-Path $repoRoot 'scripts\assemble_blind_validation_packet.py'
$aggregator = Join-Path $repoRoot 'scripts\ci\aggregate_blind_insight_sessions.py'
$outputDir = Join-Path $OutputRoot $SessionLabel

Push-Location $repoRoot
try {
    & $python $assembler assemble `
        --fixture $Fixture `
        --output $outputDir `
        --seed $Seed `
        --session-id $SessionLabel
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    if ($InteractiveScore) {
        & $python $assembler score --packet-dir $outputDir --auto-summarize
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    elseif ($NonInteractiveScore) {
        $scoreArgs = @(
            'score',
            '--packet-dir', $outputDir,
            '--non-interactive',
            '--fill-rating', $FillRating,
            '--fill-classification', $FillClassification
        )

        if ($AutoSummarize) {
            $scoreArgs += '--auto-summarize'
        }

        & $python $assembler @scoreArgs
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

        if ($AutoSummarize -and -not (Test-Path (Join-Path $outputDir 'session-summary.json'))) {
            & $python $assembler summarize `
                --scoring-sheet (Join-Path $outputDir 'scoring-sheet.json') `
                --packet (Join-Path $outputDir 'blind-packet.json') `
                --output $outputDir
            if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        }
    }
    elseif ($AutoSummarize) {
        Write-Warning 'AutoSummarize requires -InteractiveScore or -NonInteractiveScore; skipping summarize.'
    }

    if ($AggregateCohort) {
        $cohortJson = Join-Path $OutputRoot 'cohort-summary.json'
        $cohortMd = Join-Path $OutputRoot 'cohort-summary.md'
        & $python $aggregator `
            --sessions-dir $OutputRoot `
            --json-out $cohortJson `
            --markdown-out $cohortMd
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }

    Write-Host "Blind validation artifacts: $outputDir"
}
finally {
    Pop-Location
}
