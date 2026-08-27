#requires -Version 5.1
<#
.SYNOPSIS
  Guided orchestrator for GTM G-REAL-06 (three real-mode proof runs) and G-REAL-07 (proof packets).

.DESCRIPTION
  Does not create reviews or call Azure OpenAI by itself. It runs prerequisites, then
  collect-first-pilot-proof.ps1 with the right flags after you commit each run in Real mode.

  Canonical runbook: docs/runbooks/THREE_REAL_MODE_PROOF_RUNS.md
  Log target: docs/go-to-market/CLAIM_READINESS_STATUS.md#proof-packet-run-log

.PARAMETER Phase
  Prerequisites — stack doctor + prerequisite report (no spend).
  CollectRun1 — proof packet for Run 1 (Core Pilot path).
  CollectRun2 — Run 2 with -CompareBaseRunId (policy pack delta on same architecture).
  CollectRun3 — Run 3 compare vs Run 1 (repeat / second review).
  Rollup — Invoke-RealLlmEvidenceGate.ps1 (quad-agent gate JSON).
  Interactive — prerequisites, then prompt for each run id and collect.
  All — Interactive plus Rollup when all three runs collected.

.PARAMETER RunId
  Committed run GUID for CollectRun* phases.

.PARAMETER CompareBaseRunId
  Base run for Run 2 or Run 3 compare collection.

.PARAMETER BaseUrl
  API base URL (default ARCHLUCID_API_URL or http://localhost:5128).

.PARAMETER SkipRollup
  Do not run Invoke-RealLlmEvidenceGate.ps1 after Interactive/All.

.EXAMPLE
  .\scripts\Run-GReal06ProofRuns.ps1 -Phase Prerequisites

.EXAMPLE
  .\scripts\Run-GReal06ProofRuns.ps1 -Phase CollectRun1 -RunId 'your-run-guid' -BaseUrl 'https://api.example.com'

.EXAMPLE
  .\scripts\Run-GReal06ProofRuns.ps1 -Phase Interactive
#>
param(
    [ValidateSet('Prerequisites', 'CollectRun1', 'CollectRun2', 'CollectRun3', 'Rollup', 'Interactive', 'All')]
    [string] $Phase = 'Interactive',
    [string] $RunId = '',
    [string] $CompareBaseRunId = '',
    [string] $BaseUrl = '',
    [switch] $SkipRollup
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Write-GReal06Banner {
    param([string] $Title)
    Write-Host ''
    Write-Host '=== G-REAL-06: ' -NoNewline -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host '==='
}

function Test-RealAoaiConfigured {
    $endpoint = $env:AZURE_OPENAI_ENDPOINT
    if ([string]::IsNullOrWhiteSpace($endpoint)) {
        $endpoint = $env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT
    }

    $key = $env:AZURE_OPENAI_API_KEY
    if ([string]::IsNullOrWhiteSpace($key)) {
        $key = $env:ARCHLUCID_REAL_AOAI_TEST_KEY
    }

    $deployment = $env:AZURE_OPENAI_DEPLOYMENT_NAME
    if ([string]::IsNullOrWhiteSpace($deployment)) {
        $deployment = $env:ARCHLUCID_REAL_AOAI_TEST_DEPLOYMENT
    }

    return -not [string]::IsNullOrWhiteSpace($endpoint) `
        -and -not [string]::IsNullOrWhiteSpace($key) `
        -and -not [string]::IsNullOrWhiteSpace($deployment)
}

function Invoke-PrerequisitesPhase {
    Write-GReal06Banner 'Prerequisites (no LLM spend)'

    $localEnv = Join-Path $root 'secrets/local-real-aoai.env'
    if (Test-Path -LiteralPath $localEnv) {
        Write-Host "Found secrets/local-real-aoai.env — Invoke-RealLlmEvidenceGate will load it."
    }
    else {
        Write-Host 'WARN: secrets/local-real-aoai.env missing. Copy secrets/local-real-aoai.env.example or export AZURE_OPENAI_* before Real runs.' -ForegroundColor Yellow
    }

    if (Test-RealAoaiConfigured) {
        Write-Host 'PASS: Azure OpenAI env vars appear set in this shell.'
    }
    else {
        Write-Host 'WARN: Azure OpenAI env vars not set in this shell (may still work via local-real-aoai.env on gate rollup).' -ForegroundColor Yellow
    }

    & (Join-Path $root 'scripts/Test-ArchLucidPrerequisites.ps1') -Profile StagingRealLlm
    & dotnet run --project (Join-Path $root 'ArchLucid.Cli/ArchLucid.Cli.csproj') -- --json pilot preflight

    try {
        & dotnet run --project (Join-Path $root 'ArchLucid.Cli/ArchLucid.Cli.csproj') -- stack doctor --profile StagingRealLlm
    }
    catch {
        Write-Host "stack doctor failed or unavailable: $($_.Exception.Message)" -ForegroundColor Yellow
    }

    Write-Host ''
    Write-Host 'Before each Real run, confirm host AgentExecution:Mode = Real (not Simulator-only).'
    Write-Host 'Quick local stack: ARCHLUCID_REAL_AOAI=1 archlucid try --real (see docs/library/FIRST_REAL_VALUE.md).'
    Write-Host 'Full operator path: docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md'
    Write-Host 'Run matrix: docs/runbooks/THREE_REAL_MODE_PROOF_RUNS.md'
}

function Invoke-CollectProofPhase {
    param(
        [Parameter(Mandatory = $true)][int] $RunNumber,
        [Parameter(Mandatory = $true)][string] $CommittedRunId,
        [string] $CompareRunId = ''
    )

    Write-GReal06Banner "Collect proof — Run $RunNumber"

    $proofArgs = @{
        RunId           = $CommittedRunId.Trim()
        RunNumber       = $RunNumber
        SponsorHandoff  = $true
        FailOnHold      = $true
        OutputDirectory = 'artifacts/pilot-proof-run' + $RunNumber
    }

    if (-not [string]::IsNullOrWhiteSpace($BaseUrl)) {
        $proofArgs['BaseUrl'] = $BaseUrl.Trim()
    }

    if (-not [string]::IsNullOrWhiteSpace($CompareRunId)) {
        $proofArgs['CompareBaseRunId'] = $CompareRunId.Trim()
    }

    & (Join-Path $root 'scripts/collect-first-pilot-proof.ps1') @proofArgs

    Write-Host ''
    Write-Host "PASS: Run $RunNumber proof collected. Append a row to CLAIM_READINESS_STATUS.md#proof-packet-run-log (G-REAL-07)."
    Write-Host 'Copy REAL_LLM_RUN_EVIDENCE_TEMPLATE.md session notes into private storage — not customer PII in git.'
}

function Invoke-RollupPhase {
    Write-GReal06Banner 'Real-LLM evidence gate rollup (G5 adjunct)'

    if (-not (Test-RealAoaiConfigured) -and -not (Test-Path -LiteralPath (Join-Path $root 'secrets/local-real-aoai.env'))) {
        Write-Host 'WARN: No AOAI credentials visible — gate may SKIP. Set secrets/local-real-aoai.env first.' -ForegroundColor Yellow
    }

    & (Join-Path $root 'scripts/Invoke-RealLlmEvidenceGate.ps1')
    Write-Host 'Gate output: artifacts/release/real-llm-evidence-gate.json'
}

function Read-RequiredRunId {
    param([string] $Prompt)

    $value = $RunId
    if ([string]::IsNullOrWhiteSpace($value)) {
        $value = Read-Host $Prompt
    }

    if ([string]::IsNullOrWhiteSpace($value)) {
        throw 'Run id is required.'
    }

    return $value.Trim()
}

function Invoke-InteractivePhase {
    Invoke-PrerequisitesPhase

    Write-GReal06Banner 'Manual steps — Run 1 (Core Pilot, default pack)'
    Write-Host '1. Create review → upload evidence (Azure extractor Tier 1 ZIP or starter brief).'
    Write-Host '2. Execute in Real mode → Finalize/commit.'
    Write-Host '3. Record execution mode = Real in your session notes.'
    $run1 = Read-RequiredRunId 'Enter committed Run 1 GUID'
    Invoke-CollectProofPhase -RunNumber 1 -CommittedRunId $run1

    Write-GReal06Banner 'Manual steps — Run 2 (same architecture, different policy pack)'
    Write-Host 'Use the SAME evidence as Run 1. Change governance posture (e.g. SOC 2 vs CIS Azure).'
    $run2 = Read-Host 'Enter committed Run 2 GUID'
    Invoke-CollectProofPhase -RunNumber 2 -CommittedRunId $run2 -CompareRunId $run1

    Write-GReal06Banner 'Manual steps — Run 3 (repeat / compare vs Run 1)'
    Write-Host 'Second review or compare path; attach compare output in proof collection.'
    $run3 = Read-Host 'Enter committed Run 3 GUID'
    Invoke-CollectProofPhase -RunNumber 3 -CommittedRunId $run3 -CompareRunId $run1

    Write-Host ''
    Write-Host 'G-REAL-06 complete when three log rows are Real + Clean. Stage 1 rule: >=2 READY/WARN, zero BLOCK sponsor handoff.'
}

switch ($Phase) {
    'Prerequisites' {
        Invoke-PrerequisitesPhase
    }

    'CollectRun1' {
        $id = Read-RequiredRunId 'RunId required for CollectRun1'
        Invoke-CollectProofPhase -RunNumber 1 -CommittedRunId $id
    }

    'CollectRun2' {
        $id = Read-RequiredRunId 'RunId required for CollectRun2'
        $base = $CompareBaseRunId
        if ([string]::IsNullOrWhiteSpace($base)) {
            $base = Read-Host 'Enter Run 1 GUID (CompareBaseRunId)'
        }

        Invoke-CollectProofPhase -RunNumber 2 -CommittedRunId $id -CompareRunId $base
    }

    'CollectRun3' {
        $id = Read-RequiredRunId 'RunId required for CollectRun3'
        $base = $CompareBaseRunId
        if ([string]::IsNullOrWhiteSpace($base)) {
            $base = Read-Host 'Enter compare base run GUID (typically Run 1)'
        }

        Invoke-CollectProofPhase -RunNumber 3 -CommittedRunId $id -CompareRunId $base
    }

    'Rollup' {
        Invoke-RollupPhase
    }

    'Interactive' {
        Invoke-InteractivePhase
        if (-not $SkipRollup) {
            Invoke-RollupPhase
        }
    }

    'All' {
        Invoke-InteractivePhase
        if (-not $SkipRollup) {
            Invoke-RollupPhase
        }
    }

    default {
        throw "Unsupported phase: $Phase"
    }
}

Write-Host ''
Write-Host 'Done. Update docs/go-to-market/CLAIM_READINESS_STATUS.md (G4 rows + gate table).'
