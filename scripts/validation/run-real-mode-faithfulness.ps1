#requires -Version 7.0
<#
.SYNOPSIS
  TB-357 / M-49 — Orchestrate real-mode proof runs and emit a faithfulness rollup scaffold.

.DESCRIPTION
  Automates the execution/collection phase of M-49 up to human faithfulness scoring:
  1. Validates real-mode AOAI prerequisites.
  2. Runs collect-first-pilot-proof.ps1 for each supplied committed review id.
  3. Writes an owner-editable rollup markdown file aligned with REAL_MODE_FAITHFULNESS_ROLLUP.md.

.PARAMETER RunId
  One or more committed authority run GUIDs (minimum 3 recommended).

.PARAMETER RunNumber
  Optional 1-based run index for the first RunId when only one id is supplied.

.PARAMETER BaseUrl
  ArchLucid API base URL (defaults to ARCHLUCID_API_URL or http://localhost:5128).

.PARAMETER OutputDirectory
  Root folder for harness artifacts (default: artifacts/validation/m49-faithfulness).

.PARAMETER SkipProofCollection
  Skip collect-first-pilot-proof.ps1 and only emit the rollup scaffold.

.PARAMETER ValidateOnly
  CI/owner smoke mode: emit rollup scaffold + manifest without live AOAI or proof collection.
  Uses placeholder run ids when -RunId is omitted.

.EXAMPLE
  .\scripts\validation\run-real-mode-faithfulness.ps1 `
    -RunId '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333'
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string[]] $RunId = @(),

    [int] $RunNumber = 1,
    [string] $BaseUrl = '',
    [string] $OutputDirectory = 'artifacts/validation/m49-faithfulness',
    [string] $CompareBaseRunId = '',
    [switch] $SkipProofCollection,
    [switch] $FailOnHold,
    [switch] $ValidateOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

if ($ValidateOnly) {
    if ($RunId.Count -lt 1) {
        $RunId = @(
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
            '33333333-3333-3333-3333-333333333333'
        )
    }

    if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
        $BaseUrl = $env:ARCHLUCID_API_URL
    }

    if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
        $BaseUrl = 'http://localhost:5128'
    }

    $timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
    $outRoot = Join-Path (Get-Location) $OutputDirectory
    $harnessDir = Join-Path $outRoot "m49-harness-$timestamp"
    New-Item -ItemType Directory -Force -Path $harnessDir | Out-Null

    $python = $env:ARCHLUCID_PYTHON
    if ([string]::IsNullOrWhiteSpace($python)) {
        $python = 'python'
    }

    $scaffoldScript = Join-Path $root 'scripts/validation/m49_faithfulness_scaffold.py'
    $runIdArgs = @()
    foreach ($id in $RunId) {
        $runIdArgs += @('--run-id', $id.Trim())
    }

    & $python $scaffoldScript --output-directory $harnessDir @runIdArgs --base-url $BaseUrl
    if ($LASTEXITCODE -ne 0) {
        throw "m49_faithfulness_scaffold.py failed (exit $LASTEXITCODE)."
    }

    Write-Host "M-49 validate-only harness complete." -ForegroundColor Green
    exit 0
}

. (Join-Path $root 'scripts/Import-LocalRealAoaiEnv.ps1') -RepoRoot $root

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = $env:ARCHLUCID_API_URL
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = 'http://localhost:5128'
}

$endpoint = $env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT
$key = $env:ARCHLUCID_REAL_AOAI_TEST_KEY

if ([string]::IsNullOrWhiteSpace($endpoint) -or [string]::IsNullOrWhiteSpace($key)) {
    Write-Warning 'Real-mode AOAI credentials not loaded. Set secrets/local-real-aoai.env or ARCHLUCID_REAL_AOAI_TEST_* before executing live runs.'
}

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$outRoot = Join-Path (Get-Location) $OutputDirectory
$harnessDir = Join-Path $outRoot "m49-harness-$timestamp"
New-Item -ItemType Directory -Force -Path $harnessDir | Out-Null

$rollupPath = Join-Path $harnessDir 'real-mode-faithfulness-rollup.md'
$manifestPath = Join-Path $harnessDir 'harness-manifest.json'

$normalizedRunIds = @(
    foreach ($id in $RunId) {
        if ([string]::IsNullOrWhiteSpace($id)) {
            continue
        }

        $id.Trim()
    }
)

if ($normalizedRunIds.Count -lt 1) {
    throw 'At least one RunId is required (or use -ValidateOnly).'
}

$proofFolders = [System.Collections.Generic.List[string]]::new()
$collectScript = Join-Path $root 'scripts/collect-first-pilot-proof.ps1'

for ($index = 0; $index -lt $normalizedRunIds.Count; $index += 1) {
    $currentRunId = $normalizedRunIds[$index]
    $currentRunNumber = $RunNumber + $index

    if (-not $SkipProofCollection) {
        if (-not (Test-Path -LiteralPath $collectScript)) {
            throw "Missing collector script: $collectScript"
        }

        $collectArgs = @{
            BaseUrl          = $BaseUrl
            RunId            = $currentRunId
            RunNumber        = $currentRunNumber
            OutputDirectory  = (Join-Path $harnessDir 'proof-collections')
            SponsorHandoff   = $true
        }

        if ($index -gt 0 -and -not [string]::IsNullOrWhiteSpace($CompareBaseRunId)) {
            $collectArgs['CompareBaseRunId'] = $CompareBaseRunId
        }
        elseif ($index -gt 0) {
            $collectArgs['CompareBaseRunId'] = $normalizedRunIds[$index - 1]
        }

        if ($FailOnHold) {
            $collectArgs['FailOnHold'] = $true
        }

        Write-Host "Collecting M-49 proof artifacts for run $currentRunNumber ($currentRunId)..." -ForegroundColor Cyan
        & $collectScript @collectArgs
        if ($LASTEXITCODE -ne 0) {
            throw "collect-first-pilot-proof.ps1 failed for run $currentRunId (exit $LASTEXITCODE)."
        }

        $latestProof = Get-ChildItem -Path (Join-Path $harnessDir 'proof-collections') -Directory |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1

        if ($null -ne $latestProof) {
            $proofFolders.Add($latestProof.FullName)
        }
    }
}

$rollupTemplate = @"
# Real-mode faithfulness rollup (M-49 harness output)

Generated: $timestamp UTC
Harness directory: $harnessDir
Canonical gate: docs/quality/REAL_MODE_FAITHFULNESS_ROLLUP.md

> **Owner action required:** Replace placeholder cells with human-counted faithfulness scores from authorized real-mode runs only.

## Cohort rollup

| Run id | Mode | Packet | Findings | Evidence-chain % | Unsupported | Wrong/overstated | Support ratio | Disposition | BLOCK rows |
|--------|------|--------|---------:|-----------------:|------------:|-----------------:|--------------:|-------------|-----------:|
"@

foreach ($currentRunId in $normalizedRunIds) {
    $rollupTemplate += "| ``$currentRunId`` | Real | ``<brief-id>`` | — | — | — | — | — | — | — |`n"
}

$rollupTemplate += @"

## Cohort aggregates (complete after scoring)

- Admissible runs scored: ``$($normalizedRunIds.Count)`` (target ≥3)
- Total unsupported claims surviving to sponsor packet: ``<sum>``
- Total wrong / overstated findings on sponsor-sent items: ``<sum>``
- Min evidence-chain completeness on highest-severity finding: ``<min %>``
- Min retrieval support ratio where retrieval-backed: ``<min>`` (floor 0.80)
- Runs with READY or WARN disposition: ``<k>`` of ``$($normalizedRunIds.Count)``
- Total BLOCK rows across cohort: ``<sum>``
- Real-mode evidence gate freshness: ``<date>``

## Sponsor-facing correctness gate

**Verdict:** ``HOLD`` / ``GOOD ENOUGH FOR SPONSOR-FACING PILOTS``
**HOLD reason (if any):** run id(s) + failing condition number(s)

## Proof collection folders

"@

foreach ($folder in $proofFolders) {
    $rollupTemplate += "- $folder`n"
}

if ($proofFolders.Count -eq 0) {
    $rollupTemplate += "- _(none — proof collection skipped or produced no folders)_`n"
}

$rollupTemplate += @"

## Next steps

1. Score each run using docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md.
2. Copy finalized rows into docs/quality/REAL_MODE_FAITHFULNESS_ROLLUP.md.
3. Run ``.\scripts\Invoke-RealLlmEvidenceGate.ps1`` after run 3 or at RC.
4. Attach outcome to artifacts/release/real-llm-evidence-gate.json per docs/quality/RELEASE_CLAIM_GATE.md.
"@

Set-Content -Path $rollupPath -Value $rollupTemplate -Encoding utf8

$manifest = [ordered]@{
    generatedUtc = $timestamp
    harnessDir   = $harnessDir
    runIds       = $normalizedRunIds
    proofFolders = @($proofFolders)
    rollupPath   = $rollupPath
    baseUrl      = $BaseUrl
    aoaiConfigured = (-not [string]::IsNullOrWhiteSpace($endpoint) -and -not [string]::IsNullOrWhiteSpace($key))
}

$manifest | ConvertTo-Json -Depth 4 | Set-Content -Path $manifestPath -Encoding utf8

Write-Host ""
Write-Host "M-49 harness complete." -ForegroundColor Green
Write-Host "  Rollup scaffold : $rollupPath"
Write-Host "  Manifest        : $manifestPath"
Write-Host "  Runs captured   : $($normalizedRunIds.Count)"
Write-Host ""
Write-Host "Complete human faithfulness scoring, then copy rows into docs/quality/REAL_MODE_FAITHFULNESS_ROLLUP.md."
