#requires -Version 5.1
<#
.SYNOPSIS
  Run the first-pilot proof pipeline and emit one go/no-go evidence folder.

.DESCRIPTION
  Read-only orchestration over existing ArchLucid pilot readiness collectors:
  CLI preflight, data-consistency readiness, and committed-run evidence collection.
  A missing RunId is a warning, not a blocking failure, so operators can use this
  script before and after the first committed review.
#>
param(
    [string] $BaseUrl = '',
    [string] $RunId = '',
    [string] $OutputDirectory = 'artifacts/first-pilot-proof',
    [string] $BearerToken = '',
    [string] $ApiKey = '',
    [switch] $SkipDataConsistency,
    [switch] $SkipPreflight,
    [switch] $SkipTelemetryExport,
    [switch] $SkipCommercialHandoff,
    [switch] $SkipDemoWorkspaceValidation,
    [switch] $ProductionLikeHostedPilot,
    [switch] $SponsorHandoff,
    [string[]] $DeferredBuyerRequirement = @(),
    [string] $K6SummaryPath = '',
    [string] $LiveUiSqlResultPath = '',
    [string] $StagingSmokeResultsPath = '',
    [string] $HostedProbeArtifactsPath = '',
    [string] $RouteTierBaseRef = 'origin/main'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot 'FirstPilotProofDisposition.ps1')
. (Join-Path $PSScriptRoot 'FirstPilotAiQualityProof.ps1')
. (Join-Path $PSScriptRoot 'FirstPilotConsolidatedAiReadinessGate.ps1')
. (Join-Path $PSScriptRoot 'FirstPilotCommandCenter.ps1')
. (Join-Path $PSScriptRoot 'FirstPilotSupportNextStep.ps1')
. (Join-Path $PSScriptRoot 'FirstPilotDataConsistencyProof.ps1')
. (Join-Path $PSScriptRoot 'FirstPilotCommercialNextStep.ps1')
. (Join-Path $PSScriptRoot 'FirstPilotCommercialCloseout.ps1')
. (Join-Path $PSScriptRoot 'FirstPilotWorkflowHandoff.ps1')

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = $env:ARCHLUCID_API_URL
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = 'http://localhost:5128'
}

$normalizedBase = $BaseUrl.Trim().TrimEnd('/')
. (Join-Path $PSScriptRoot 'ArchLucid.AuthHeaders.ps1')
$headers = Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey
$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$outRoot = Join-Path (Get-Location) $OutputDirectory
$proofDir = Join-Path $outRoot "first-pilot-proof-$timestamp"
New-Item -ItemType Directory -Force -Path $proofDir | Out-Null
$proofCollectionStartedUtc = (Get-Date).ToUniversalTime()

$findings = [System.Collections.Generic.List[object]]::new()
$artifacts = [System.Collections.Generic.List[object]]::new()
$script:roiBasisStatus = 'not-collected'
$script:roiSponsorSafe = $false
$script:dataConsistencyStatus = 'NOT_RUN'
$script:procurementReportText = ''
$script:aiQualityProof = $null
$script:aiReadinessGate = $null
$script:demoWorkspaceValidationDisposition = 'NOT_RUN'

function Add-ProofFinding {
    param(
        [Parameter(Mandatory = $true)][ValidateSet('PASS', 'WARN', 'BLOCK')][string] $Disposition,
        [Parameter(Mandatory = $true)][string] $Name,
        [Parameter(Mandatory = $true)][string] $Detail,
        [string] $Remediation = '',
        [string] $TriageCard = ''
    )

    $row = [ordered]@{
        disposition = $Disposition
        name        = $Name
        detail      = $Detail
        remediation = $Remediation
        triageCard  = $TriageCard
    }

    if ($Disposition -eq 'BLOCK' -or $Disposition -eq 'WARN') {
        $row = Add-SupportNextStepToFindingRow -Finding $row -RunId $RunId
    }

    $findings.Add($row)
}

function Add-ProofArtifact {
    param(
        [Parameter(Mandatory = $true)][string] $Name,
        [Parameter(Mandatory = $true)][string] $Path,
        [Parameter(Mandatory = $true)][string] $Purpose
    )

    $artifacts.Add([ordered]@{
        name    = $Name
        path    = $Path
        purpose = $Purpose
    })
}

function Get-TriageCardForPreflightStep {
    param(
        [Parameter(Mandatory = $true)][string] $Name,
        [string] $Detail = ''
    )

    if ($Name -like 'config:ArchLucidAuth:*' -or $Detail -match 'auth|401|403') {
        return 'FP-T001'
    }

    if ($Name -like 'config:*ConnectionStrings*' -or $Detail -match 'SQL|DbUp|connection string') {
        return 'FP-T002'
    }

    if ($Name -eq 'health/ready') {
        return 'FP-T003'
    }

    if ($Name -eq 'openapi/v1.json') {
        return 'FP-T011'
    }

    if ($Detail -match 'network|reachability|connection refused|timed out') {
        return 'FP-T012'
    }

    return ''
}

function Convert-StepDisposition {
    param([Parameter(Mandatory = $true)][string] $Disposition)

    switch ($Disposition.ToLowerInvariant()) {
        'pass' { return 'PASS' }
        'warn' { return 'WARN' }
        default { return 'BLOCK' }
    }
}

function Get-LatestEvidenceBundleDirectory {
    param([Parameter(Mandatory = $true)][string] $EvidenceRoot)

    if (-not (Test-Path -LiteralPath $EvidenceRoot)) {
        return $null
    }

    return Get-ChildItem -LiteralPath $EvidenceRoot -Directory |
        Sort-Object LastWriteTimeUtc -Descending |
        Select-Object -First 1
}

function Get-PilotRunDeltasJsonPath {
    param([string] $EvidenceRoot = '')

    if ([string]::IsNullOrWhiteSpace($EvidenceRoot) -or -not (Test-Path -LiteralPath $EvidenceRoot)) {
        return ''
    }

    $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

    if ($null -eq $latestBundle) {
        return ''
    }

    $deltasPath = Join-Path $latestBundle.FullName 'pilot-run-deltas.json'

    if (Test-Path -LiteralPath $deltasPath) {
        return $deltasPath
    }

    return ''
}

function Add-GovernanceOutcomeSummaryFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [string] $RunIdValue = '',
        [string] $DeltasJsonPath = ''
    )

    $markdownPath = Join-Path $ProofDirectory 'governance-outcome-summary.md'
    $jsonPath = Join-Path $ProofDirectory 'governance-outcome-summary.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_first_pilot_governance_outcome.py'
    $args = @(
        $scriptPath,
        '--json-out', $jsonPath,
        '--markdown-out', $markdownPath,
        '--run-id', $(if ([string]::IsNullOrWhiteSpace($RunIdValue)) { 'not-supplied' } else { $RunIdValue.Trim() }),
        '--pilot-strict-satisfied'
    )

    if (-not [string]::IsNullOrWhiteSpace($DeltasJsonPath) -and (Test-Path -LiteralPath $DeltasJsonPath)) {
        $args += @('--deltas-json', $DeltasJsonPath)
    }

    & python @args 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'governance-outcome-summary.md' -Path 'governance-outcome-summary.md' -Purpose 'Buyer-safe governance PASS/WARN/HOLD summary for sponsor proof.'
    Add-ProofArtifact -Name 'governance-outcome-summary.json' -Path 'governance-outcome-summary.json' -Purpose 'Machine-readable governance outcome summary.'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'governance-outcome-summary' -Detail 'Governance outcome summary was not generated.' -Remediation 'Supply -RunId and committed-run evidence, or repair report_first_pilot_governance_outcome.py.' -TriageCard 'FP-T015'
        return
    }

    $payload = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
    $disposition = [string]$payload.proofDisposition

    if ($disposition -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'governance-outcome-summary' -Detail 'Governance outcome summary is PASS for sponsor handoff.' -Remediation ''
        return
    }

    $proofFinding = if ($SponsorHandoff -and $disposition -eq 'HOLD') { 'BLOCK' } else { 'WARN' }

    Add-ProofFinding -Disposition $proofFinding -Name 'governance-outcome-summary' -Detail "Governance outcome disposition is $disposition." -Remediation 'Resolve governance/proof completeness before sponsor send.' -TriageCard 'FP-T015'
}

function Add-PolicyPackFreshnessFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'policy-pack-freshness.md'
    $jsonPath = Join-Path $ProofDirectory 'policy-pack-freshness.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_policy_pack_freshness.py'
    & python $scriptPath --json-out $jsonPath --markdown-out $markdownPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'policy-pack-freshness.md' -Path 'policy-pack-freshness.md' -Purpose 'Vertical policy-pack lastReviewedUtc freshness for procurement/proof.'
    Add-ProofArtifact -Name 'policy-pack-freshness.json' -Path 'policy-pack-freshness.json' -Purpose 'Machine-readable policy-pack freshness disposition.'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'policy-pack-freshness' -Detail 'Policy-pack freshness report was not generated.' -Remediation 'Run python scripts/ci/report_policy_pack_freshness.py.'
        return
    }

    $payload = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
    $disposition = [string]$payload.disposition

    if ($disposition -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'policy-pack-freshness' -Detail 'All vertical policy packs are within freshness thresholds.' -Remediation ''
        return
    }

    if ($disposition -eq 'HOLD') {
        $proofDisposition = if ($SponsorHandoff) { 'BLOCK' } else { 'WARN' }

        Add-ProofFinding -Disposition $proofDisposition -Name 'policy-pack-freshness' -Detail 'One or more policy packs are stale (>180 days since lastReviewedUtc).' -Remediation 'Update packManifest.lastReviewedUtc after SME review.' -TriageCard 'FP-T015'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'policy-pack-freshness' -Detail 'Policy-pack freshness WARN — review lastReviewedUtc before procurement proof.' -Remediation 'See policy-pack-freshness.md.'
}

function Add-BuyerSafeAuditEvidenceSummaryFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [string] $RunIdValue = '',
        [string] $DeltasJsonPath = ''
    )

    $markdownPath = Join-Path $ProofDirectory 'audit-evidence-summary.md'
    $jsonPath = Join-Path $ProofDirectory 'audit-evidence-summary.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_buyer_safe_audit_evidence_summary.py'
    $args = @(
        $scriptPath,
        '--json-out', $jsonPath,
        '--markdown-out', $markdownPath,
        '--run-id', $(if ([string]::IsNullOrWhiteSpace($RunIdValue)) { 'not-supplied' } else { $RunIdValue.Trim() })
    )

    if (-not [string]::IsNullOrWhiteSpace($DeltasJsonPath) -and (Test-Path -LiteralPath $DeltasJsonPath)) {
        $args += @('--deltas-json', $DeltasJsonPath)
    }

    & python @args 2>&1 | Out-Null

    Add-ProofArtifact -Name 'audit-evidence-summary.md' -Path 'audit-evidence-summary.md' -Purpose 'Buyer-safe audit category summary (no raw payloads).'
    Add-ProofArtifact -Name 'audit-evidence-summary.json' -Path 'audit-evidence-summary.json' -Purpose 'Machine-readable audit evidence summary.'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'audit-evidence-summary' -Detail 'Audit evidence summary was not generated.' -Remediation 'Repair report_buyer_safe_audit_evidence_summary.py.'
        return
    }

    $payload = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
    $disposition = [string]$payload.disposition

    if ($disposition -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'audit-evidence-summary' -Detail 'Audit evidence summary includes run-linked row counts.' -Remediation ''
        return
    }

    $proofDisposition = if ($SponsorHandoff) { 'BLOCK' } else { 'WARN' }

    Add-ProofFinding -Disposition $proofDisposition -Name 'audit-evidence-summary' -Detail 'No audit rows linked to run in deltas; attach committed-run evidence.' -Remediation 'Re-run with -RunId after committed review.' -TriageCard 'FP-T015'
}

function Add-AgentQualitySponsorGateFinding {
    param([Parameter(Mandatory = $true)][string] $EvidenceRoot)

    $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

    if ($null -eq $latestBundle) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail 'Evidence collector completed but no evidence bundle directory was found.' -Remediation 'Re-run first-pilot evidence collection for the committed review.' -TriageCard 'FP-T006'
        return
    }

    $observabilityPath = Join-Path $latestBundle.FullName 'pilot-observability-summary.json'

    if (-not (Test-Path -LiteralPath $observabilityPath)) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail 'pilot-observability-summary.json is missing from the committed-run evidence bundle.' -Remediation 'Re-run first-pilot evidence collection and confirm pilot observability summary generation.' -TriageCard 'FP-T004'
        return
    }

    try {
        $observability = Get-Content -LiteralPath $observabilityPath -Raw | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail "Could not parse pilot-observability-summary.json: $($_.Exception.Message)" -Remediation 'Regenerate the committed-run evidence bundle.' -TriageCard 'FP-T004'
        return
    }

    $qualityGateDisposition = [string]$observability.qualityGateDisposition
    $llmCallCountResolved = $observability.llmCallCountResolved
    $llmCallCount = $observability.llmCallCount
    $realModeEvidenceDetected = ($llmCallCountResolved -eq $true) -or ($null -ne $llmCallCount -and -not [string]::IsNullOrWhiteSpace([string]$llmCallCount))

    if ($qualityGateDisposition -eq 'pilot-strict-sponsor-evidence-pass') {
        Add-ProofFinding -Disposition 'PASS' -Name 'real-llm-sponsor-evidence' -Detail 'PilotStrict sponsor-evidence disposition passed.' -Remediation ''
        return
    }

    if ($qualityGateDisposition -eq 'pilot-strict-violates-sponsor-evidence' -or $qualityGateDisposition -eq 'pilot-strict-signals-unresolved') {
        $gateMode = [string]$observability.qualityGateMode
        $holdDetail = Get-QualityGateHoldDetail -QualityGateDisposition $qualityGateDisposition -QualityGateMode $gateMode -UnresolvedQualitySignalsPresent ($observability.unresolvedQualitySignalsPresent -eq $true)
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail $holdDetail -Remediation 'Pause sponsor handoff and resolve agent quality gate evidence before sending the packet.' -TriageCard 'FP-T005'
        return
    }

    if ($observability.unresolvedQualitySignalsPresent -eq $true -and $SponsorHandoff) {
        $gateMode = [string]$observability.qualityGateMode
        $holdDetail = Get-QualityGateHoldDetail -QualityGateDisposition $qualityGateDisposition -QualityGateMode $gateMode -UnresolvedQualitySignalsPresent $true
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail $holdDetail -Remediation 'Resolve PilotStrict quality signals before sponsor send.' -TriageCard 'FP-T005'
        return
    }

    if ($realModeEvidenceDetected) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail "Real-mode LLM usage signals were detected, but PilotStrict sponsor-evidence disposition was not passing: $qualityGateDisposition." -Remediation 'Attach passing real-LLM evidence or regenerate the evidence bundle after quality signals resolve.' -TriageCard 'FP-T004'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'real-llm-sponsor-evidence' -Detail "No real-mode LLM sponsor-evidence signal was detected. Quality gate disposition: $qualityGateDisposition." -Remediation 'For buyer sponsor proof, use a PilotStrict real-mode host or explicitly label the packet as simulator/demo evidence.' -TriageCard 'FP-T004'
}

function Add-AiQualityProofFinding {
    param([Parameter(Mandatory = $true)][string] $EvidenceRoot)

    $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

    if ($null -eq $latestBundle) {
        $script:aiQualityProof = Build-AiQualityProofSnapshot -Observability $null -RetrievalGroundingSummary $null
        $finding = Resolve-AiQualityProofFinding -AiQualityProof $script:aiQualityProof -SponsorHandoff:$SponsorHandoff
        Add-ProofFinding -Disposition ([string]$finding.disposition) -Name 'ai-quality-proof' -Detail ([string]$finding.detail) -Remediation 'Re-run committed-run evidence collection with a RunId.' -TriageCard 'FP-T005'
        return
    }

    $observabilityPath = Join-Path $latestBundle.FullName 'pilot-observability-summary.json'
    $groundingPath = Join-Path $latestBundle.FullName 'retrieval-grounding.json'
    $observability = $null

    if (Test-Path -LiteralPath $observabilityPath) {
        try {
            $observability = Get-Content -LiteralPath $observabilityPath -Raw | ConvertFrom-Json -ErrorAction Stop
        }
        catch {
            $script:aiQualityProof = Build-AiQualityProofSnapshot -Observability $null -RetrievalGroundingSummary $null
            $finding = Resolve-AiQualityProofFinding -AiQualityProof $script:aiQualityProof -SponsorHandoff:$SponsorHandoff
            Add-ProofFinding -Disposition 'BLOCK' -Name 'ai-quality-proof' -Detail "Could not parse pilot-observability-summary.json: $($_.Exception.Message)" -Remediation 'Regenerate the evidence bundle.' -TriageCard 'FP-T005'
            return
        }
    }

    $groundingSummary = Get-RetrievalGroundingSummaryFromFile -Path $groundingPath
    $script:aiQualityProof = Build-AiQualityProofSnapshot -Observability $observability -RetrievalGroundingSummary $groundingSummary
    $finding = Resolve-AiQualityProofFinding -AiQualityProof $script:aiQualityProof -SponsorHandoff:$SponsorHandoff
    Add-ProofFinding -Disposition ([string]$finding.disposition) -Name 'ai-quality-proof' -Detail ([string]$finding.detail) -Remediation 'Resolve PilotStrict quality signals and attach retrieval grounding before sponsor send.' -TriageCard 'FP-T005'
}

function Add-ConsolidatedAiReadinessGateFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [string] $EvidenceRoot = ''
    )

    $observability = $null
    $groundingSummary = $null

    if (-not [string]::IsNullOrWhiteSpace($EvidenceRoot)) {
        $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

        if ($null -ne $latestBundle) {
            $observabilityPath = Join-Path $latestBundle.FullName 'pilot-observability-summary.json'
            $groundingPath = Join-Path $latestBundle.FullName 'retrieval-grounding.json'

            if (Test-Path -LiteralPath $observabilityPath) {
                try {
                    $observability = Get-Content -LiteralPath $observabilityPath -Raw | ConvertFrom-Json -ErrorAction Stop
                }
                catch {
                    $observability = $null
                }
            }

            $groundingSummary = Get-RetrievalGroundingSummaryFromFile -Path $groundingPath
        }
    }

    $irStatus = Get-RetrievalIrStatusFromProofDirectory -ProofDirectory $ProofDirectory
    $gate = Build-ConsolidatedAiReadinessGate `
        -Observability $observability `
        -RetrievalGroundingSummary $groundingSummary `
        -RetrievalIrStatus $irStatus `
        -AiQualityProof $script:aiQualityProof
    $dispositionResult = Resolve-ConsolidatedAiReadinessDisposition -Gate $gate -SponsorHandoff:$SponsorHandoff
    $artifactPaths = Write-ConsolidatedAiReadinessGateArtifacts `
        -ProofDirectory $ProofDirectory `
        -Gate $gate `
        -DispositionResult $dispositionResult

    $script:aiReadinessGate = [ordered]@{
        disposition = [string]$dispositionResult.disposition
        summary     = [string]$dispositionResult.summary
        gate        = $gate
    }

    Add-ProofArtifact -Name 'ai-readiness-gate.json' -Path $artifactPaths.jsonPath -Purpose 'Machine-readable consolidated AI readiness gate (PASS/WARN/HOLD).'
    Add-ProofArtifact -Name 'ai-readiness-gate.md' -Path $artifactPaths.mdPath -Purpose 'Human-readable consolidated AI readiness gate for sponsor and release evidence.'

    $proofDisposition = Map-ConsolidatedAiReadinessToProofFindingDisposition `
        -GateDisposition ([string]$dispositionResult.disposition) `
        -SponsorHandoff:$SponsorHandoff

    Add-ProofFinding `
        -Disposition $proofDisposition `
        -Name 'ai-readiness-gate' `
        -Detail ([string]$dispositionResult.summary) `
        -Remediation 'See ai-readiness-gate.md and docs/library/AGENT_OUTPUT_EVALUATION.md; resolve HOLD rows before sponsor handoff on real-mode hosts.' `
        -TriageCard 'FP-T005'
}

function Add-CommittedRealLlmFixtureFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [switch] $SponsorHandoff
    )

    $markdownPath = Join-Path $ProofDirectory 'committed-real-llm-fixture-validation.md'
    $scriptPath = Join-Path $PSScriptRoot 'ci\validate_committed_real_llm_fixtures.py'
    & python $scriptPath --markdown-out $markdownPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'committed-real-llm-fixture-validation.md' -Path 'committed-real-llm-fixture-validation.md' -Purpose 'Sanitized committed real-mode AgentResult fixture validation (no live Azure OpenAI in PR CI).'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'committed-real-llm-fixtures' -Detail 'Committed *.real.json fixtures passed structural and secret-safety validation.' -Remediation ''
        return
    }

    $disposition = if ($SponsorHandoff) { 'BLOCK' } else { 'WARN' }

    Add-ProofFinding -Disposition $disposition -Name 'committed-real-llm-fixtures' -Detail 'One or more committed real-mode fixtures failed validation; see committed-real-llm-fixture-validation.md and docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md.' -Remediation 'Fix or replace invalid tests/eval-corpus/agent-results/*.real.json before RC or sponsor handoff.' -TriageCard 'FP-T005'
}

function Add-RetrievalIrEvidenceFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [switch] $SponsorHandoff
    )

    $reportSource = Join-Path $root 'docs/quality/retrieval-ir-report.md'
    $jsonSource = Join-Path $root 'docs/quality/retrieval-ir-summary.json'

    if (-not (Test-Path -LiteralPath $reportSource)) {
        $missingDisposition = if ($SponsorHandoff) { 'BLOCK' } else { 'WARN' }

        Add-ProofFinding -Disposition $missingDisposition -Name 'retrieval-ir-evidence' -Detail 'retrieval-ir-report.md is missing; run scripts/ci/eval_retrieval_ir.py after retrieval or corpus changes.' -Remediation 'python scripts/ci/eval_retrieval_ir.py --enforce; attach retrieval-ir-report.md before sponsor handoff when RAG quality is part of the claim.' -TriageCard 'FP-T004'
        return
    }

    $reportDest = Join-Path $ProofDirectory 'retrieval-ir-report.md'
    Copy-Item -LiteralPath $reportSource -Destination $reportDest -Force
    Add-ProofArtifact -Name 'retrieval-ir-report.md' -Path 'retrieval-ir-report.md' -Purpose 'Offline golden-fixture retrieval IR benchmark (recall@5, MRR); not live customer corpus data.'

    if (Test-Path -LiteralPath $jsonSource) {
        $jsonDest = Join-Path $ProofDirectory 'retrieval-ir-summary.json'
        Copy-Item -LiteralPath $jsonSource -Destination $jsonDest -Force
        Add-ProofArtifact -Name 'retrieval-ir-summary.json' -Path 'retrieval-ir-summary.json' -Purpose 'Machine-readable retrieval IR summary for proof automation.'
    }

    $reportText = Get-Content -LiteralPath $reportSource -Raw
    $meanRecall = $null
    $meanMrr = $null

    if ($reportText -match 'Mean recall@5:\*\*\s+([0-9.]+)') {
        $meanRecall = [double]$Matches[1]
    }

    if ($reportText -match 'Mean MRR:\*\*\s+([0-9.]+)') {
        $meanMrr = [double]$Matches[1]
    }

    $detail = if ($null -ne $meanRecall -and $null -ne $meanMrr) {
        "Retrieval IR evidence attached (mean recall@5=$meanRecall, mean MRR=$meanMrr)."
    }
    else {
        'Retrieval IR report attached; parse metrics manually if floors are required.'
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'retrieval-ir-evidence' -Detail $detail -Remediation ''
}

function Add-TelemetryExportReadinessFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $telemetryReportPath = Join-Path $ProofDirectory 'observability-export-readiness.md'
    $telemetryScript = Join-Path $PSScriptRoot 'report_observability_export_readiness.py'
    $telemetryArgs = @(
        $telemetryScript,
        '--environment',
        'Production',
        '--out',
        $telemetryReportPath,
        '--honor-require-telemetry-export-config'
    )

    if ($ProductionLikeHostedPilot) {
        $telemetryArgs += '--strict-exit-code'
    }

    $output = & python @telemetryArgs 2>&1
    $telemetryExit = $LASTEXITCODE

    if (-not (Test-Path -LiteralPath $telemetryReportPath) -and -not [string]::IsNullOrWhiteSpace(($output | Out-String))) {
        [System.IO.File]::WriteAllText($telemetryReportPath, ($output | Out-String), [System.Text.UTF8Encoding]::new($false))
    }

    Add-ProofArtifact -Name 'observability-export-readiness.md' -Path 'observability-export-readiness.md' -Purpose 'Offline telemetry export readiness for hosted pilot handoff.'

    $reportText = if (Test-Path -LiteralPath $telemetryReportPath) {
        Get-Content -LiteralPath $telemetryReportPath -Raw
    }
    else {
        ''
    }

    $verdict = 'UNKNOWN'

    if ($reportText -match 'Telemetry export readiness verdict:\s+\*\*(PASS|WARN|FAIL)\*\*') {
        $verdict = $Matches[1]
    }

    if ($telemetryExit -eq 0 -and $verdict -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'telemetry-export-readiness' -Detail 'Durable telemetry export readiness passed for the merged Production view.' -Remediation ''
        return
    }

    if ($ProductionLikeHostedPilot) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'telemetry-export-readiness' -Detail "Telemetry export readiness verdict is $verdict; reporter exit code $telemetryExit." -Remediation 'Configure Application Insights, OTLP, or Prometheus export before hosted sponsor handoff, or remove -ProductionLikeHostedPilot for local readiness-only checks.' -TriageCard 'FP-T013'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'telemetry-export-readiness' -Detail "Telemetry export readiness verdict is $verdict; reporter exit code $telemetryExit." -Remediation 'For production-like hosted sponsor handoff, rerun with -ProductionLikeHostedPilot and attach passing telemetry export evidence.' -TriageCard 'FP-T013'
}

function Add-RouteTierPolicyNavFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $reportPath = Join-Path $ProofDirectory 'route-tier-policy-nav-parity.md'
    $jsonPath = Join-Path $ProofDirectory 'route-tier-policy-nav-parity.json'
    $driftJsonPath = Join-Path $ProofDirectory 'route-tier-policy-nav-drift.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\assert_route_tier_policy_nav.py'
    $driftScriptPath = Join-Path $PSScriptRoot 'ci\detect_route_tier_policy_nav_changes.py'
    $baseRef = if ([string]::IsNullOrWhiteSpace($RouteTierBaseRef)) { 'origin/main' } else { $RouteTierBaseRef.Trim() }

    & python $driftScriptPath --base-ref $baseRef --json-out $driftJsonPath 2>&1 | Out-Null

    $surfacesChanged = $false
    $changedPathCount = 0

    if (Test-Path -LiteralPath $driftJsonPath) {
        try {
            $driftPayload = Get-Content -LiteralPath $driftJsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
            $surfacesChanged = $driftPayload.surfaces_changed -eq $true
            $changedPathCount = @($driftPayload.changed_paths).Count
        }
        catch {
            $surfacesChanged = $false
        }
    }

    & python $scriptPath --markdown-report $reportPath --json-summary-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'route-tier-policy-nav-parity.md' -Path 'route-tier-policy-nav-parity.md' -Purpose 'Buyer-safe route/tier/policy/nav parity summary for commercial handoff.'
    Add-ProofArtifact -Name 'route-tier-policy-nav-parity.json' -Path 'route-tier-policy-nav-parity.json' -Purpose 'Machine-readable route/tier/policy/nav parity summary.'
    Add-ProofArtifact -Name 'route-tier-policy-nav-drift.json' -Path 'route-tier-policy-nav-drift.json' -Purpose 'Git diff signal for route/tier/policy/nav surface files vs base ref.'

    if ($exitCode -eq 0) {
        if ($surfacesChanged) {
            Add-ProofFinding -Disposition 'WARN' -Name 'route-tier-policy-nav-parity' -Detail "Parity passed but $changedPathCount route/tier/policy/nav surface file(s) changed vs $baseRef; confirm registry updates are reviewed." -Remediation 'See docs/library/ROUTE_TIER_POLICY_NAV_DRIFT_GATE.md before sponsor send.' -TriageCard 'FP-T014'
        }
        else {
            Add-ProofFinding -Disposition 'PASS' -Name 'route-tier-policy-nav-parity' -Detail 'Route/tier/policy/nav registry parity passed.' -Remediation ''
        }

        return
    }

    $detail = "Route/tier/policy/nav parity check failed with exit code $exitCode."

    if ($surfacesChanged) {
        $detail = "$detail $changedPathCount surface file(s) changed vs $baseRef."
    }

    if ($SponsorHandoff -or $ProductionLikeHostedPilot -or $surfacesChanged) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'route-tier-policy-nav-parity' -Detail $detail -Remediation 'Run python scripts/ci/assert_route_tier_policy_nav.py --sync and resolve parity failures before sponsor send.' -TriageCard 'FP-T014'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'route-tier-policy-nav-parity' -Detail $detail -Remediation 'Resolve route/tier/policy/nav drift before enterprise commercial handoff.' -TriageCard 'FP-T014'
}

function Add-ScaleEnvelopeEvidenceFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [string] $PerformanceBaselineJsonPath = '',
        [string] $K6SummaryJsonPath = ''
    )

    $markdownPath = Join-Path $ProofDirectory 'scale-envelope-evidence.md'
    $jsonPath = Join-Path $ProofDirectory 'scale-envelope-evidence.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_scale_envelope_evidence.py'
    $args = @(
        $scriptPath,
        '--markdown-out', $markdownPath,
        '--json-out', $jsonPath
    )

    if (-not [string]::IsNullOrWhiteSpace($PerformanceBaselineJsonPath)) {
        $args += @('--performance-baseline-json', $PerformanceBaselineJsonPath)
    }

    if (-not [string]::IsNullOrWhiteSpace($K6SummaryJsonPath)) {
        $args += @('--k6-summary-json', $K6SummaryJsonPath)
    }

    & python @args 2>&1 | Out-Null

    Add-ProofArtifact -Name 'scale-envelope-evidence.md' -Path 'scale-envelope-evidence.md' -Purpose 'V1 scale envelope: measured evidence vs configured targets vs untested assumptions.'
    Add-ProofArtifact -Name 'scale-envelope-evidence.json' -Path 'scale-envelope-evidence.json' -Purpose 'Machine-readable V1 scale envelope evidence pack.'

    if ([string]::IsNullOrWhiteSpace($PerformanceBaselineJsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'scale-envelope-evidence' -Detail 'Scale envelope pack emitted; staging-smoke timings were not attached for measured step latencies.' -Remediation 'Run ./scripts/staging-smoke.ps1 and rerun proof with -StagingSmokeResultsPath.'
        return
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'scale-envelope-evidence' -Detail 'Scale envelope evidence pack includes measured staging-smoke timings with explicit not-a-load-test bounds.' -Remediation ''
}

function Add-FirstPilotTimingBudgetFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [string] $PerformanceBaselineJsonPath = '',
        [int] $ProofCollectionElapsedMs = 0
    )

    $markdownPath = Join-Path $ProofDirectory 'first-pilot-timing-budget.md'
    $jsonPath = Join-Path $ProofDirectory 'first-pilot-timing-budget.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_first_pilot_timing_budget.py'
    $args = @(
        $scriptPath,
        '--markdown-out', $markdownPath,
        '--json-out', $jsonPath
    )

    if (-not [string]::IsNullOrWhiteSpace($PerformanceBaselineJsonPath)) {
        $args += @('--performance-baseline-json', $PerformanceBaselineJsonPath)
    }

    if ($ProofCollectionElapsedMs -gt 0) {
        $args += @('--proof-collection-elapsed-ms', $ProofCollectionElapsedMs)
    }

    & python @args 2>&1 | Out-Null

    Add-ProofArtifact -Name 'first-pilot-timing-budget.md' -Path 'first-pilot-timing-budget.md' -Purpose 'Measured vs guidance-only timing budget for first-pilot proof (not SLA).'
    Add-ProofArtifact -Name 'first-pilot-timing-budget.json' -Path 'first-pilot-timing-budget.json' -Purpose 'Machine-readable first-pilot timing budget evidence.'

    if ([string]::IsNullOrWhiteSpace($PerformanceBaselineJsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'first-pilot-timing-budget' -Detail 'Timing budget emitted; staging-smoke measured steps were not attached.' -Remediation 'Run ./scripts/staging-smoke.ps1 and rerun proof with -StagingSmokeResultsPath.'
        return
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'first-pilot-timing-budget' -Detail 'Timing budget includes measured staging-smoke steps with guidance-only doc targets labeled separately.' -Remediation ''
}

function Add-AdminOperationalPostureFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $postureScript = Join-Path $PSScriptRoot 'report_admin_operational_posture.ps1'
    & $postureScript -ProofDirectory $ProofDirectory -BaseUrl $normalizedBase -BearerToken $BearerToken -ApiKey $ApiKey 2>&1 | Out-Null

    Add-ProofArtifact -Name 'admin-operational-posture.md' -Path 'admin-operational-posture.md' -Purpose 'Admin operational posture rollup (config, telemetry, data consistency, AI readiness) without secrets.'
    Add-ProofArtifact -Name 'admin-operational-posture.json' -Path 'admin-operational-posture.json' -Purpose 'Machine-readable admin operational posture rollup.'

    $jsonPath = Join-Path $ProofDirectory 'admin-operational-posture.json'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'admin-operational-posture' -Detail 'Admin operational posture summary was not generated.' -Remediation 'Rerun collect-first-pilot-proof.ps1 and inspect report_admin_operational_posture.ps1 output.'
        return
    }

    try {
        $posture = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
        $rollup = [string]$posture.disposition

        if ($rollup -eq 'HOLD') {
            Add-ProofFinding -Disposition 'BLOCK' -Name 'admin-operational-posture' -Detail 'Admin operational posture rollup contains HOLD rows.' -Remediation 'Open admin-operational-posture.md and resolve each HOLD remediation pointer.' -TriageCard 'FP-T013'
            return
        }

        if ($rollup -eq 'WARN') {
            Add-ProofFinding -Disposition 'WARN' -Name 'admin-operational-posture' -Detail 'Admin operational posture rollup contains WARN rows.' -Remediation 'Review admin-operational-posture.md before sponsor send.'
            return
        }

        Add-ProofFinding -Disposition 'PASS' -Name 'admin-operational-posture' -Detail 'Admin operational posture rollup passed.' -Remediation ''
    }
    catch {
        Add-ProofFinding -Disposition 'WARN' -Name 'admin-operational-posture' -Detail "Could not parse admin-operational-posture.json: $($_.Exception.Message)" -Remediation 'Regenerate admin operational posture artifacts.'
    }
}

function Add-OptionalIntegrationCorrectnessDrillFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $apiUrl = [Environment]::GetEnvironmentVariable('ARCHLUCID_INTEGRATION_DRILL_API_URL')

    if ([string]::IsNullOrWhiteSpace($apiUrl)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'v1-integration-correctness-drill' -Detail 'Skipped; set ARCHLUCID_INTEGRATION_DRILL_API_URL to run staging integration drill.' -Remediation 'Run scripts/v1-integration-correctness-drill.ps1 and attach artifacts to release evidence.'
        return
    }

    $outDir = Join-Path $ProofDirectory 'v1-integration-correctness-drill'
    $scriptPath = Join-Path $PSScriptRoot 'v1-integration-correctness-drill.ps1'
    $drillArgs = @(
        '-ApiBaseUrl', $apiUrl.Trim(),
        '-OutputDirectory', $outDir
    )

    if (-not [string]::IsNullOrWhiteSpace($BearerToken)) {
        $drillArgs += @('-BearerToken', $BearerToken)
    }

    if (-not [string]::IsNullOrWhiteSpace($ApiKey)) {
        $drillArgs += @('-ApiKey', $ApiKey)
    }

    & $scriptPath @drillArgs 2>&1 | Out-Null
    $drillExit = $LASTEXITCODE
    $jsonPath = Join-Path $outDir 'v1-integration-correctness-drill.json'

    if ($drillExit -ne 0 -or -not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'v1-integration-correctness-drill' -Detail "Integration drill exited $drillExit or missing JSON output." -Remediation 'Fix API URL/auth and rerun v1-integration-correctness-drill.ps1.'
        return
    }

    Add-ProofArtifact -Name 'v1-integration-correctness-drill.md' -Path 'v1-integration-correctness-drill/v1-integration-correctness-drill.md' -Purpose 'PASS/WARN/HOLD integration correctness drill for authority vs coordinator semantics.'
    Add-ProofArtifact -Name 'v1-integration-correctness-drill.json' -Path 'v1-integration-correctness-drill/v1-integration-correctness-drill.json' -Purpose 'Machine-readable integration correctness drill rows.'

    try {
        $drill = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
        $rollup = [string]$drill.overallDisposition

        if ($rollup -eq 'HOLD') {
            Add-ProofFinding -Disposition 'WARN' -Name 'v1-integration-correctness-drill' -Detail 'Integration correctness drill reported HOLD.' -Remediation 'Open v1-integration-correctness-drill.md and resolve HOLD rows before release.'
            return
        }

        if ($rollup -eq 'WARN') {
            Add-ProofFinding -Disposition 'WARN' -Name 'v1-integration-correctness-drill' -Detail 'Integration correctness drill reported WARN.' -Remediation 'Review WARN rows in v1-integration-correctness-drill.md.'
            return
        }

        Add-ProofFinding -Disposition 'PASS' -Name 'v1-integration-correctness-drill' -Detail 'Integration correctness drill passed.' -Remediation ''
    }
    catch {
        Add-ProofFinding -Disposition 'WARN' -Name 'v1-integration-correctness-drill' -Detail "Could not parse drill JSON: $($_.Exception.Message)" -Remediation 'Rerun v1-integration-correctness-drill.ps1.'
    }
}

function Add-EnvironmentReliabilityRollupFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $rollupScript = Join-Path $PSScriptRoot 'report_environment_reliability_rollup.ps1'
    & $rollupScript -ProofDirectory $ProofDirectory 2>&1 | Out-Null

    Add-ProofArtifact -Name 'environment-reliability-rollup.md' -Path 'environment-reliability-rollup.md' -Purpose 'Environment reliability rollup (data, telemetry, AI gate, LLM budget, timing) — not an SLA.'
    Add-ProofArtifact -Name 'environment-reliability-rollup.json' -Path 'environment-reliability-rollup.json' -Purpose 'Machine-readable environment reliability rollup.'

    $jsonPath = Join-Path $ProofDirectory 'environment-reliability-rollup.json'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'environment-reliability-rollup' -Detail 'Environment reliability rollup was not generated.' -Remediation 'Rerun collect-first-pilot-proof.ps1 and inspect report_environment_reliability_rollup.ps1 output.'
        return
    }

    try {
        $rollup = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
        $disposition = [string]$rollup.disposition

        if ($disposition -eq 'HOLD') {
            $proofDisposition = if ($SponsorHandoff -or $ProductionLikeHostedPilot) { 'BLOCK' } else { 'WARN' }

            Add-ProofFinding -Disposition $proofDisposition -Name 'environment-reliability-rollup' -Detail 'Environment reliability rollup contains HOLD rows.' -Remediation 'Open environment-reliability-rollup.md and resolve HOLD signals before sponsor handoff.' -TriageCard 'FP-T013'
            return
        }

        if ($disposition -eq 'WARN') {
            Add-ProofFinding -Disposition 'WARN' -Name 'environment-reliability-rollup' -Detail 'Environment reliability rollup contains WARN rows.' -Remediation 'Review environment-reliability-rollup.md before sponsor send.'
            return
        }

        Add-ProofFinding -Disposition 'PASS' -Name 'environment-reliability-rollup' -Detail 'Environment reliability rollup passed.' -Remediation ''
    }
    catch {
        Add-ProofFinding -Disposition 'WARN' -Name 'environment-reliability-rollup' -Detail "Could not parse environment-reliability-rollup.json: $($_.Exception.Message)" -Remediation 'Regenerate environment reliability rollup artifacts.'
    }
}

function Add-CommittedReviewTraceChainSummaryFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [Parameter(Mandatory = $true)][string] $EvidenceRoot,
        [string] $RunId = ''
    )

    $traceScript = Join-Path $PSScriptRoot 'report_committed_review_trace_chain_summary.ps1'
    & $traceScript -ProofDirectory $ProofDirectory -EvidenceRoot $EvidenceRoot -RunId $RunId 2>&1 | Out-Null

    Add-ProofArtifact -Name 'committed-review-trace-chain-summary.md' -Path 'committed-review-trace-chain-summary.md' -Purpose 'Compact evidence-to-manifest-to-audit trace chain for sponsor and support bundles.'
    Add-ProofArtifact -Name 'committed-review-trace-chain-summary.json' -Path 'committed-review-trace-chain-summary.json' -Purpose 'Machine-readable committed review trace chain summary.'

    $jsonPath = Join-Path $ProofDirectory 'committed-review-trace-chain-summary.json'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'committed-review-trace-chain-summary' -Detail 'Trace chain summary was not generated.' -Remediation 'Rerun with -RunId after committed-run evidence collection succeeds.'
        return
    }

    try {
        $trace = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
        $disposition = [string]$trace.disposition

        if ($disposition -eq 'HOLD') {
            $proofDisposition = if ($SponsorHandoff) { 'BLOCK' } else { 'WARN' }

            Add-ProofFinding -Disposition $proofDisposition -Name 'committed-review-trace-chain-summary' -Detail ([string]$trace.summary) -Remediation 'Collect committed-run evidence and verify manifest and audit rows in first-value report.' -TriageCard 'FP-T006'
            return
        }

        if ($disposition -eq 'WARN') {
            Add-ProofFinding -Disposition 'WARN' -Name 'committed-review-trace-chain-summary' -Detail ([string]$trace.summary) -Remediation 'Review committed-review-trace-chain-summary.md before sponsor send.'
            return
        }

        Add-ProofFinding -Disposition 'PASS' -Name 'committed-review-trace-chain-summary' -Detail ([string]$trace.summary) -Remediation ''
    }
    catch {
        Add-ProofFinding -Disposition 'WARN' -Name 'committed-review-trace-chain-summary' -Detail "Could not parse committed-review-trace-chain-summary.json: $($_.Exception.Message)" -Remediation 'Regenerate trace chain summary.'
    }
}

function Add-ProductionLikeConfigLintFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    if (-not $ProductionLikeHostedPilot -and -not $SponsorHandoff -and [string]::IsNullOrWhiteSpace($RunId)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'production-like-config-lint' -Detail 'Skipped; supply -RunId or use -ProductionLikeHostedPilot / -SponsorHandoff for profile lint artifacts.' -Remediation 'Run archlucid config lint --profile production-like-hosted-pilot before hosted sponsor handoff.' -TriageCard 'FP-T022'
        return
    }

    $jsonPath = Join-Path $ProofDirectory 'config-lint-production-like-hosted-pilot.json'
    $markdownPath = Join-Path $ProofDirectory 'config-lint-production-like-hosted-pilot.md'
    $cliProject = Join-Path $root 'ArchLucid.Cli\ArchLucid.Cli.csproj'
    $lintArgs = @(
        'run',
        '--project', $cliProject,
        '--',
        'config',
        'lint',
        '--profile', 'production-like-hosted-pilot',
        '--json-out', $jsonPath,
        '--markdown-out', $markdownPath
    )

    Push-Location -LiteralPath $root
    try {
        & dotnet @lintArgs 2>&1 | Out-Null
        $lintExit = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    Add-ProofArtifact -Name 'config-lint-production-like-hosted-pilot.json' -Path 'config-lint-production-like-hosted-pilot.json' -Purpose 'Production-like hosted pilot config lint JSON for auth, telemetry, LLM redaction, and hosting advisor checks.'
    Add-ProofArtifact -Name 'config-lint-production-like-hosted-pilot.md' -Path 'config-lint-production-like-hosted-pilot.md' -Purpose 'Human-readable config lint disposition for production-like hosted pilot handoff.'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        $detail = "Production-like hosted pilot config lint failed with exit code $lintExit and no JSON artifact."

        Add-ProofFinding -Disposition 'BLOCK' -Name 'production-like-config-lint' -Detail $detail -Remediation 'Fix blocking config lint findings and rerun with --profile production-like-hosted-pilot.' -TriageCard 'FP-T022'
        return
    }

    $lintDoc = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json
    $proofDisposition = [string]$lintDoc.proofDisposition

    if ([string]::IsNullOrWhiteSpace($proofDisposition)) {
        $proofDisposition = if ($lintDoc.ok) { 'READY' } else { 'HOLD' }
    }

    switch ($proofDisposition) {
        'READY' {
            Add-ProofFinding -Disposition 'PASS' -Name 'production-like-config-lint' -Detail 'Production-like hosted pilot config lint passed with no blocking findings.' -Remediation ''
            return
        }
        'WARN' {
            $advisoryCount = @($lintDoc.advisoryFindings).Count
            $detail = "Production-like hosted pilot config lint returned WARN with $advisoryCount advisory finding(s); externally sendable with caveats."

            Add-ProofFinding -Disposition 'WARN' -Name 'production-like-config-lint' -Detail $detail -Remediation 'Review advisory rows in config-lint-production-like-hosted-pilot.md before sponsor handoff.' -TriageCard 'FP-T022'
            return
        }
        default {
            $detail = "Production-like hosted pilot config lint returned HOLD (exit code $lintExit)."

            Add-ProofFinding -Disposition 'BLOCK' -Name 'production-like-config-lint' -Detail $detail -Remediation 'Fix blocking config lint findings and rerun with --profile production-like-hosted-pilot.' -TriageCard 'FP-T022'
        }
    }
}

function Add-PilotProofPacketFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [Parameter(Mandatory = $true)][string] $RunIdValue
    )

    $packetDir = Join-Path $ProofDirectory 'pilot-proof-packet'
    $cliProject = Join-Path $root 'ArchLucid.Cli\ArchLucid.Cli.csproj'
    $packetArgs = @(
        'run',
        '--project', $cliProject,
        '--',
        'pilot',
        'proof-packet',
        $RunIdValue.Trim(),
        '--out',
        $packetDir
    )

    Push-Location -LiteralPath $root
    try {
        & dotnet @packetArgs 2>&1 | Out-Null
        $packetExit = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    Add-ProofArtifact -Name 'pilot-proof-packet' -Path 'pilot-proof-packet/' -Purpose 'Buyer-safe proof-packet folder (run evidence, ROI sources, limitations).'

    if ($packetExit -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'pilot-proof-packet' -Detail "Wrote proof-packet folder for run $RunIdValue."
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'pilot-proof-packet' -Detail "archlucid pilot proof-packet exited $packetExit." -Remediation 'Confirm API connectivity and run scope, then rerun collect-first-pilot-proof.ps1.' -TriageCard 'FP-T006'
}

function Add-DemoWorkspaceValidationFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    if ($SkipDemoWorkspaceValidation) {
        $script:demoWorkspaceValidationDisposition = 'SKIPPED'
        Add-ProofFinding -Disposition 'WARN' -Name 'demo-workspace-validation' -Detail 'Skipped by -SkipDemoWorkspaceValidation.' -Remediation 'Run ./scripts/verify-demo-workspace.ps1 before a demo-led sponsor send.' -TriageCard 'FP-T023'
        return
    }

    $reportPath = Join-Path $ProofDirectory 'demo-workspace-validation.txt'
    $jsonPath = Join-Path $ProofDirectory 'demo-workspace-validation.json'
    $scriptPath = Join-Path $PSScriptRoot 'verify-demo-workspace.ps1'
    $output = & $scriptPath -BaseUrl $normalizedBase -BearerToken $BearerToken -ApiKey $ApiKey -JsonSummaryOut $jsonPath 2>&1
    $exitCode = $LASTEXITCODE
    $reportText = ($output | Out-String)
    [System.IO.File]::WriteAllText($reportPath, $reportText, [System.Text.UTF8Encoding]::new($false))
    Add-ProofArtifact -Name 'demo-workspace-validation.txt' -Path 'demo-workspace-validation.txt' -Purpose 'Golden demo workspace and preview essentials PASS/HOLD disposition.'
    Add-ProofArtifact -Name 'demo-workspace-validation.json' -Path 'demo-workspace-validation.json' -Purpose 'Machine-readable demo workspace validation summary.'

    if ($exitCode -eq 0) {
        $script:demoWorkspaceValidationDisposition = 'PASS'
        Add-ProofFinding -Disposition 'PASS' -Name 'demo-workspace-validation' -Detail 'Demo workspace and preview essentials passed.' -Remediation ''
        return
    }

    $script:demoWorkspaceValidationDisposition = 'HOLD'
    $detail = "Demo workspace validation returned HOLD (exit code $exitCode)."

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'demo-workspace-validation' -Detail $detail -Remediation 'Run ./scripts/verify-demo-workspace.ps1 and re-seed demo data before demo-led sponsor send.' -TriageCard 'FP-T023'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'demo-workspace-validation' -Detail $detail -Remediation 'Repair demo workspace anchors before using demo as commercial proof.' -TriageCard 'FP-T023'
}

function Add-LiveUiSqlParityFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $candidatePath = $LiveUiSqlResultPath

    if ([string]::IsNullOrWhiteSpace($candidatePath)) {
        $defaultPath = Join-Path $root 'artifacts/release-smoke-live-ui-sql-result.json'

        if (Test-Path -LiteralPath $defaultPath) {
            $candidatePath = $defaultPath
        }
    }

    if ([string]::IsNullOrWhiteSpace($candidatePath) -or -not (Test-Path -LiteralPath $candidatePath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'live-ui-sql-parity' -Detail 'Live UI-SQL parity result was not supplied; attach release-smoke-live-ui-sql output for release-candidate claims.' -Remediation 'Run ./scripts/release-smoke-live-ui-sql.ps1 -ResultOut artifacts/release-smoke-live-ui-sql-result.json and rerun proof with -LiveUiSqlResultPath.' -TriageCard 'FP-T011'
        return
    }

    $jsonDest = Join-Path $ProofDirectory 'live-ui-sql-parity-result.json'
    Copy-Item -LiteralPath $candidatePath -Destination $jsonDest -Force
    Add-ProofArtifact -Name 'live-ui-sql-parity-result.json' -Path 'live-ui-sql-parity-result.json' -Purpose 'Live browser live-api-* parity vs smoke-started API+SQL — not mock Playwright.'

    $mdSource = [System.IO.Path]::ChangeExtension($candidatePath, '.md')

    if (Test-Path -LiteralPath $mdSource) {
        $mdDest = Join-Path $ProofDirectory 'live-ui-sql-parity-result.md'
        Copy-Item -LiteralPath $mdSource -Destination $mdDest -Force
        Add-ProofArtifact -Name 'live-ui-sql-parity-result.md' -Path 'live-ui-sql-parity-result.md' -Purpose 'Human-readable live UI-SQL parity summary.'
    }

    try {
        $payload = Get-Content -LiteralPath $candidatePath -Raw | ConvertFrom-Json -ErrorAction Stop
        $profile = [string]$payload.profile
        $verdict = [string]$payload.verdict
        $liveCheck = @($payload.checks | Where-Object { [string]$_.name -like '*Live Playwright*' })

        if ($profile -ne 'LiveUiSql' -and $liveCheck.Count -eq 0) {
            Add-ProofFinding -Disposition 'WARN' -Name 'live-ui-sql-parity' -Detail "Attached result profile='$profile' is not LiveUiSql; do not cite as live UI-SQL parity evidence." -Remediation 'Re-run release-smoke-live-ui-sql.ps1 with -Profile LiveUiSql.' -TriageCard 'FP-T011'
            return
        }

        Add-ProofFinding -Disposition 'PASS' -Name 'live-ui-sql-parity' -Detail "Live UI-SQL parity artifact attached (profile=$profile, verdict=$verdict)." -Remediation ''
    }
    catch {
        Add-ProofFinding -Disposition 'WARN' -Name 'live-ui-sql-parity' -Detail "Could not parse live UI-SQL parity JSON: $($_.Exception.Message)" -Remediation 'Regenerate release smoke result JSON.' -TriageCard 'FP-T011'
    }
}

function Write-QuoteToProofPacketMarkdown {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [Parameter(Mandatory = $true)][string] $SponsorPacketDisposition,
        [Parameter(Mandatory = $true)][string] $RoiBasisStatus,
        [Parameter(Mandatory = $true)][bool] $RoiSponsorSafe,
        [Parameter(Mandatory = $true)][int] $BlockCount,
        [Parameter(Mandatory = $true)][string[]] $DeferredScopeReasons,
        [Parameter(Mandatory = $true)][object[]] $Findings,
        [string] $RunId = '',
        [string] $DataConsistencyStatus = 'NOT_RUN',
        [object] $AiQualityProof = $null
    )

    function Resolve-FindingDisposition {
        param([string] $Name)

        $match = @($Findings | Where-Object { [string]$_.name -eq $Name })

        if ($match.Count -eq 0) {
            return 'NOT_RUN'
        }

        return [string]$match[0].disposition
    }

    $procurementStatus = Resolve-FindingDisposition -Name 'procurement-deal-ready'
    $routeTierStatus = Resolve-FindingDisposition -Name 'route-tier-policy-nav-parity'
    $evidenceStatus = Resolve-FindingDisposition -Name 'committed-run-evidence'
    $annualReady = ($SponsorPacketDisposition -eq 'READY' -and $RoiSponsorSafe -and $BlockCount -eq 0)
    $commercialDisposition = if ($BlockCount -gt 0) { 'HOLD' } elseif ($SponsorPacketDisposition -eq 'DEFERRED_SCOPE') { 'DEFERRED_SCOPE' } elseif ($SponsorPacketDisposition -in @('READY', 'WARN')) { 'PASS' } else { 'HOLD' }

    $commercialStep = Resolve-CommercialNextStepRecommendation `
        -SponsorPacketDisposition $SponsorPacketDisposition `
        -BlockCount $BlockCount `
        -RoiSponsorSafe $RoiSponsorSafe `
        -RoiBasisStatus $RoiBasisStatus `
        -ProcurementDisposition $procurementStatus `
        -CommittedEvidenceDisposition $evidenceStatus `
        -DeferredScopeReasons @($DeferredScopeReasons)

    $aiQualityStatus = if ($null -eq $AiQualityProof -or $AiQualityProof.collected -ne $true) { 'NOT_COLLECTED' } elseif ($AiQualityProof.sponsorSafe -eq $true) { 'PASS' } else { 'WARN' }
    $runIdLabel = if ([string]::IsNullOrWhiteSpace($RunId)) { 'not supplied' } else { $RunId.Trim() }

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add('# Quote-to-proof packet index (generated)')
    $lines.Add('')
    $lines.Add('> Canonical checklists: [`QUOTE_TO_PROOF_PACKET.md`](../../docs/go-to-market/QUOTE_TO_PROOF_PACKET.md) · [`COMMERCIAL_CONVERSION_CHECKLIST.md`](../../docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md). Pricing and order terms live only in [`PRICING_PHILOSOPHY.md`](../../docs/go-to-market/PRICING_PHILOSOPHY.md) and [`ORDER_FORM_TEMPLATE.md`](../../docs/go-to-market/ORDER_FORM_TEMPLATE.md).')
    $lines.Add('')
    $lines.Add("| Field | Value |")
    $lines.Add("| --- | --- |")
    $lines.Add("| Commercial disposition | **$commercialDisposition** |")
    $lines.Add("| Sponsor packet disposition | **$SponsorPacketDisposition** |")
    $lines.Add("| Run id | $runIdLabel |")
    $lines.Add("| Evidence source (ROI basis) | **$RoiBasisStatus** |")
    $lines.Add("| ROI sponsor-safe | **$RoiSponsorSafe** |")
    $lines.Add("| Data consistency status | **$DataConsistencyStatus** |")
    $lines.Add("| AI quality proof | **$aiQualityStatus** |")
    $lines.Add("| Annual order readiness | **$(if ($annualReady) { 'READY' } else { 'HOLD' })** |")
    $lines.Add("| Commercial next action | **$($commercialStep.action)** |")
    $lines.Add("| Commercial next owner | $($commercialStep.owner) |")
    $lines.Add('')
    $lines.Add('## Commercial next step (single recommendation)')
    $lines.Add('')
    $lines.Add("- **Action:** $($commercialStep.action)")
    $lines.Add("- **Owner:** $($commercialStep.owner)")
    $lines.Add("- **Reason:** $($commercialStep.reason)")
    $lines.Add('')

    if ($commercialDisposition -eq 'PASS') {
        $lines.Add('## After PASS proof (commercial conversion)')
        $lines.Add('')
        $lines.Add('- Follow [`COMMERCIAL_CONVERSION_CHECKLIST.md`](../../docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md): request quote, guided pilot conversion, Professional/Enterprise evaluation, or procurement pack — **not** live Stripe checkout or marketplace publication (deferred).')
        $lines.Add('- Map artifacts with [`QUOTE_TO_PILOT_PACK.md`](../../docs/go-to-market/QUOTE_TO_PILOT_PACK.md) when moving to a paid pilot pack.')
        $lines.Add('')
    }

    $lines.Add('## Recommended next ask')
    $lines.Add('')
    $lines.Add("- $($commercialStep.reason)")
    $lines.Add('')
    $lines.Add('## Packet rows')
    $lines.Add('')
    $lines.Add('| Artifact | Proof status | Path / command |')
    $lines.Add('| --- | --- | --- |')
    $lines.Add("| Sponsor proof ZIP / evidence bundle | $evidenceStatus | ``first-pilot-evidence/`` (when ``-RunId`` supplied) |")
    $lines.Add("| First-value report | $evidenceStatus | ``first-pilot-evidence/first-value-report.md`` |")
    $lines.Add("| Pilot success scorecard | MANUAL | [`PILOT_SUCCESS_SCORECARD.md`](../../docs/go-to-market/PILOT_SUCCESS_SCORECARD.md) |")
    $lines.Add("| ROI basis labels | $RoiBasisStatus | ``go-no-go-summary.json`` · ``roiBasisStatus`` |")
    $lines.Add("| Procurement deal-ready | $procurementStatus | ``procurement-deal-ready-check.txt`` |")
    $lines.Add("| Procurement scope classification | $procurementStatus | ``procurement-deal-ready-classification.md`` |")
    $lines.Add("| LLM budget proof | $(Resolve-FindingDisposition -Name 'llm-budget-proof-status') | ``llm-budget-proof-status.md`` |")
    $lines.Add("| Environment reliability rollup | $(Resolve-FindingDisposition -Name 'environment-reliability-rollup') | ``environment-reliability-rollup.md`` |")
    $lines.Add("| Trace chain summary | $(Resolve-FindingDisposition -Name 'committed-review-trace-chain-summary') | ``committed-review-trace-chain-summary.md`` |")
    $lines.Add("| Route/tier/policy/nav parity | $routeTierStatus | ``route-tier-policy-nav-parity.md`` |")
    $lines.Add("| Governance outcome summary | $(Resolve-FindingDisposition -Name 'governance-outcome-summary') | ``governance-outcome-summary.md`` |")
    $lines.Add("| Policy-pack freshness | $(Resolve-FindingDisposition -Name 'policy-pack-freshness') | ``policy-pack-freshness.md`` |")
    $lines.Add("| Audit evidence summary | $(Resolve-FindingDisposition -Name 'audit-evidence-summary') | ``audit-evidence-summary.md`` |")
    $lines.Add("| Mutating route audit matrix | $(Resolve-FindingDisposition -Name 'mutating-route-audit-matrix') | ``mutating-route-audit-matrix.md`` |")
    $lines.Add("| Production-like config lint | $(Resolve-FindingDisposition -Name 'production-like-config-lint') | ``config-lint-production-like-hosted-pilot.md`` |")
    $lines.Add("| Data consistency readiness | $DataConsistencyStatus | ``data-consistency-readiness/`` |")
    $lines.Add("| AI quality proof | $aiQualityStatus | ``go-no-go-summary.json`` · ``aiQualityProof`` |")
    $lines.Add("| Consolidated AI readiness gate | $(Resolve-FindingDisposition -Name 'ai-readiness-gate') | ``ai-readiness-gate.json`` · ``go-no-go-summary.json`` · ``aiReadinessGate`` |")
    $lines.Add("| Live UI-SQL parity | $(Resolve-FindingDisposition -Name 'live-ui-sql-parity') | ``live-ui-sql-parity-result.json`` (when supplied) |")
    $lines.Add("| Commercial conversion checklist | MANUAL | [`COMMERCIAL_CONVERSION_CHECKLIST.md`](../../docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md) after PASS disposition |")
    $lines.Add("| Selected tier + order form | MANUAL | [`ORDER_FORM_TEMPLATE.md`](../../docs/go-to-market/ORDER_FORM_TEMPLATE.md) after tier is agreed |")
    $lines.Add("| Demo workspace validation | $(Resolve-FindingDisposition -Name 'demo-workspace-validation') | ``demo-workspace-validation.txt`` |")
    $lines.Add("| Trial-to-paid test-mode evidence | $(Resolve-FindingDisposition -Name 'trial-to-paid-test-mode-evidence') | ``trial-to-paid-test-mode-evidence.md`` |")
    $lines.Add("| Accelerator handoff acceptance | $(Resolve-FindingDisposition -Name 'accelerator-handoff-acceptance') | ``accelerator-handoff-acceptance.md`` |")
    $lines.Add("| Quote-to-proof readiness | $(Resolve-FindingDisposition -Name 'quote-to-proof-readiness') | ``quote-to-proof-readiness.md`` |")
    $lines.Add("| Pilot acceptance thresholds | $(Resolve-FindingDisposition -Name 'pilot-acceptance-thresholds') | ``pilot-acceptance-thresholds.md`` |")
    $lines.Add("| Commercial closeout | $(Resolve-FindingDisposition -Name 'commercial-closeout-consistency') | ``commercial-closeout.md`` |")
    $lines.Add("| Tier fit matrix | $(Resolve-FindingDisposition -Name 'tier-fit-validation') | ``tier-fit-validation-matrix.md`` |")
    $lines.Add("| Quote aging SLA | $(Resolve-FindingDisposition -Name 'pricing-quote-aging') | ``quote-aging-sla.md`` (when AdminAuthority API reachable) |")

    if ($DeferredScopeReasons.Count -gt 0) {
        $lines.Add('')
        $lines.Add('## Deferred buyer requirements (not V1 blockers)')
        $lines.Add('')

        foreach ($reason in $DeferredScopeReasons) {
            $lines.Add("- $reason")
        }
    }

    $lines.Add('')
    $target = Join-Path $ProofDirectory 'quote-to-proof-packet.md'
    $lines | Set-Content -LiteralPath $target -Encoding UTF8
    Add-ProofArtifact -Name 'quote-to-proof-packet.md' -Path 'quote-to-proof-packet.md' -Purpose 'Sales-led quote-to-proof packet index mapped from this proof run.'

    $commercialJsonPath = Join-Path $ProofDirectory 'commercial-next-step.json'
    $commercialPayload = [ordered]@{
        action = [string]$commercialStep.action
        owner  = [string]$commercialStep.owner
        reason = [string]$commercialStep.reason
    }
    $commercialPayload | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $commercialJsonPath -Encoding UTF8
    Add-ProofArtifact -Name 'commercial-next-step.json' -Path 'commercial-next-step.json' -Purpose 'Single commercial next-step recommendation for quote-to-proof handoff.'

    return [ordered]@{
        action = [string]$commercialStep.action
        reason = [string]$commercialStep.reason
    }
}

function Add-ProcurementDealReadyFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $reportPath = Join-Path $ProofDirectory 'procurement-deal-ready-check.txt'
    $jsonPath = Join-Path $ProofDirectory 'procurement-deal-ready-summary.json'
    $classificationPath = Join-Path $ProofDirectory 'procurement-deal-ready-classification.md'
    $scriptPath = Join-Path $PSScriptRoot 'build_procurement_pack.py'
    $output = & python $scriptPath --dry-run --deal-ready --json-summary-out $jsonPath --classification-md-out $classificationPath 2>&1
    $exitCode = $LASTEXITCODE
    $script:procurementReportText = ($output | Out-String)
    [System.IO.File]::WriteAllText($reportPath, $script:procurementReportText, [System.Text.UTF8Encoding]::new($false))
    Add-ProofArtifact -Name 'procurement-deal-ready-check.txt' -Path 'procurement-deal-ready-check.txt' -Purpose 'Deal-ready procurement pack dry-run output with deferred-scope labels.'
    Add-ProofArtifact -Name 'procurement-deal-ready-summary.json' -Path 'procurement-deal-ready-summary.json' -Purpose 'Machine-readable procurement deal-ready disposition with deferred realism notes.'
    Add-ProofArtifact -Name 'procurement-deal-ready-classification.md' -Path 'procurement-deal-ready-classification.md' -Purpose 'Deal-ready scope classification table (V1_READY, BLOCKING, DEFERRED_SCOPE, OWNER_REQUIRED, INFORMATIONAL_B_ONLY).'

    $disposition = 'HOLD'
    $blockingCount = 0

    if (Test-Path -LiteralPath $jsonPath) {
        try {
            $summary = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
            $disposition = [string]$summary.disposition
            $blockingCount = @($summary.blocking_violations).Count
        }
        catch {
            $disposition = 'HOLD'
        }
    }

    if ($disposition -eq 'PASS' -or ($blockingCount -eq 0 -and $exitCode -eq 0)) {
        Add-ProofFinding -Disposition 'PASS' -Name 'procurement-deal-ready' -Detail 'Procurement pack deal-ready dry-run passed (deferred procurement realism notes may still apply).' -Remediation ''
        return
    }

    $detail = "Procurement pack deal-ready dry-run failed with exit code $exitCode."

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'procurement-deal-ready' -Detail $detail -Remediation 'Run python scripts/build_procurement_pack.py --deal-ready and fix stale or buyer-unsafe procurement artifacts.' -TriageCard 'FP-T015'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'procurement-deal-ready' -Detail $detail -Remediation 'Refresh procurement pack evidence before sponsor send.' -TriageCard 'FP-T015'
}

function Add-TrialToPaidTestModeEvidenceFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'trial-to-paid-test-mode-evidence.md'
    $jsonPath = Join-Path $ProofDirectory 'trial-to-paid-test-mode-evidence.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_trial_to_paid_test_mode_evidence.py'
    & python $scriptPath --markdown-out $markdownPath --json-summary-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'trial-to-paid-test-mode-evidence.md' -Path 'trial-to-paid-test-mode-evidence.md' -Purpose 'Buyer-safe trial-to-paid TEST-mode evidence; live commerce remains deferred.'
    Add-ProofArtifact -Name 'trial-to-paid-test-mode-evidence.json' -Path 'trial-to-paid-test-mode-evidence.json' -Purpose 'Machine-readable trial-to-paid test-mode evidence summary.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'trial-to-paid-test-mode-evidence' -Detail 'Trial-to-paid test-mode evidence artifacts generated; live checkout remains owner-only deferred.' -Remediation ''
        return
    }

    $detail = "Trial-to-paid test-mode evidence check returned HOLD (exit code $exitCode)."

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'WARN' -Name 'trial-to-paid-test-mode-evidence' -Detail $detail -Remediation 'Repair trial funnel docs/pricing guards before citing test-mode commerce readiness.' -TriageCard 'FP-T017'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'trial-to-paid-test-mode-evidence' -Detail $detail -Remediation 'Review trial funnel docs and pricing.json checkout guards.' -TriageCard 'FP-T017'
}

function Add-AcceleratorHandoffFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'accelerator-handoff-acceptance.md'
    $jsonPath = Join-Path $ProofDirectory 'accelerator-handoff-acceptance.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\check_accelerator_handoff_docs.py'
    & python $scriptPath --markdown-out $markdownPath --json-summary-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'accelerator-handoff-acceptance.md' -Path 'accelerator-handoff-acceptance.md' -Purpose 'Specialty accelerator walkthrough/buyer-job V1-safe acceptance summary.'
    Add-ProofArtifact -Name 'accelerator-handoff-acceptance.json' -Path 'accelerator-handoff-acceptance.json' -Purpose 'Machine-readable accelerator handoff acceptance summary.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'accelerator-handoff-acceptance' -Detail 'Accelerator handoff docs passed V1-only link and connector acceptance checks.' -Remediation ''
        return
    }

    $detail = "Accelerator handoff acceptance failed with exit code $exitCode."

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'accelerator-handoff-acceptance' -Detail $detail -Remediation 'Fix broken accelerator links or accidental V1.1-required wording in walkthrough docs.' -TriageCard 'FP-T014'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'accelerator-handoff-acceptance' -Detail $detail -Remediation 'Run python scripts/ci/check_accelerator_handoff_docs.py and repair accelerator doc drift.' -TriageCard 'FP-T014'
}

function Add-DemoDerivedRoiCommercialGate {
    if ($script:roiBasisStatus -ne 'demo-derived') {
        return
    }

    $detail = "ROI basis is demo-derived; demo workspace validation disposition is $($script:demoWorkspaceValidationDisposition)."

    if ($script:demoWorkspaceValidationDisposition -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'demo-derived-roi-validation' -Detail "$detail Demo evidence is labeled and validated — not current customer proof." -Remediation ''
        return
    }

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'demo-derived-roi-validation' -Detail $detail -Remediation 'Pass demo workspace validation before citing demo-derived ROI in sponsor handoff.' -TriageCard 'FP-T023'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'demo-derived-roi-validation' -Detail $detail -Remediation 'Run ./scripts/verify-demo-workspace.ps1 before using demo-derived ROI in commercial proof.' -TriageCard 'FP-T023'
}

function Add-PricingQuoteAgingFinding {
    param([string] $ProofDirectory = '')

    $uri = "$normalizedBase/v1/admin/marketing/pricing-quote-aging"
    $req = @{
        Uri             = $uri
        Method          = 'Get'
        UseBasicParsing = $true
        TimeoutSec      = 60
    }

    if ($headers.Count -gt 0) {
        $req.Headers = $headers
    }

    try {
        $response = Invoke-WebRequest @req
        $aging = $response.Content | ConvertFrom-Json -ErrorAction Stop
        $openCount = @($aging.rows).Count
        $warnCount = [int]$aging.warnCount
        $breachCount = [int]$aging.breachCount
        $detail = "Open quote requests=$openCount; warn=$warnCount; breach=$breachCount."

        if (-not [string]::IsNullOrWhiteSpace($ProofDirectory)) {
            $jsonPath = Join-Path $ProofDirectory 'quote-aging-sla.json'
            $mdPath = Join-Path $ProofDirectory 'quote-aging-sla.md'
            $aging | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
            Add-ProofArtifact -Name 'quote-aging-sla.json' -Path 'quote-aging-sla.json' -Purpose 'AdminAuthority pricing quote aging export for sales follow-up SLA.'
            $mdLines = @(
                '# Quote aging / follow-up SLA (generated)',
                '',
                "| Open requests | $openCount |",
                "| Warn count | $warnCount |",
                "| Breach count | $breachCount |",
                '',
                'Recommended follow-up SLA: **7 days** from quote request (see QUOTE_TO_PROOF_READINESS_CHECKLIST.md).',
                ''
            )
            $mdLines | Set-Content -LiteralPath $mdPath -Encoding UTF8
            Add-ProofArtifact -Name 'quote-aging-sla.md' -Path 'quote-aging-sla.md' -Purpose 'Human-readable quote aging SLA summary.'
        }

        if ($breachCount -gt 0) {
            $disposition = if ($SponsorHandoff) { 'BLOCK' } else { 'WARN' }
            Add-ProofFinding -Disposition $disposition -Name 'pricing-quote-aging' -Detail $detail -Remediation 'Acknowledge or close breached pricing quote requests before sponsor send.' -TriageCard 'FP-T017'
            return
        }

        if ($warnCount -gt 0) {
            Add-ProofFinding -Disposition 'WARN' -Name 'pricing-quote-aging' -Detail $detail -Remediation 'Follow up on aging pricing quote requests before conversion.' -TriageCard 'FP-T017'
            return
        }

        Add-ProofFinding -Disposition 'PASS' -Name 'pricing-quote-aging' -Detail $detail -Remediation ''
    }
    catch {
        Add-ProofFinding -Disposition 'WARN' -Name 'pricing-quote-aging' -Detail "Could not read pricing quote aging: $($_.Exception.Message)" -Remediation 'Use an AdminAuthority token or review /admin/pricing-quote-aging before conversion.' -TriageCard 'FP-T017'
    }
}

function Add-RoiBasisLabelFinding {
    param(
        [Parameter(Mandatory = $true)][string] $EvidenceRoot,
        [switch] $AllowCaveatedUnsafeBasis
    )

    $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

    if ($null -eq $latestBundle) {
        $script:roiBasisStatus = 'not-collected'
        $script:roiSponsorSafe = $false
        Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail 'Evidence bundle missing; cannot validate ROI basis labels.' -Remediation 'Re-run committed-run evidence collection.' -TriageCard 'FP-T016'
        return
    }

    $reportPath = Join-Path $latestBundle.FullName 'first-value-report.md'
    $deltasPath = Join-Path $latestBundle.FullName 'pilot-run-deltas.json'

    if (-not (Test-Path -LiteralPath $reportPath)) {
        $script:roiBasisStatus = 'not-collected'
        $script:roiSponsorSafe = $false
        Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail 'first-value-report.md is missing from the evidence bundle.' -Remediation 'Regenerate the first-value report for the committed review.' -TriageCard 'FP-T016'
        return
    }

    $reportText = Get-Content -LiteralPath $reportPath -Raw
    $requiredPhrases = @(
        '## Sponsor send readiness (buyer-safe gate)',
        '## Evidence basis',
        '## ROI evidence completeness',
        '## Sponsor artifact evidence badges',
        'ROI evidence confidence'
    )
    $missingPhrases = @($requiredPhrases | Where-Object { $reportText -notlike "*$_*" })

    if ($missingPhrases.Count -gt 0) {
        $script:roiBasisStatus = 'not-collected'
        $script:roiSponsorSafe = $false
        Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail "Missing ROI basis sections: $($missingPhrases -join ', ')." -Remediation 'Regenerate sponsor output and confirm ROI basis labels are present before external send.' -TriageCard 'FP-T016'
        return
    }

    $roiLabel = ''
    $roiEvidenceConfidence = ''
    $sponsorProofReadiness = ''
    $isDemoTenant = $false

    if (Test-Path -LiteralPath $deltasPath) {
        try {
            $deltas = Get-Content -LiteralPath $deltasPath -Raw | ConvertFrom-Json -ErrorAction Stop
            $proof = $deltas.proofPackageCompleteness
            $roiLabel = [string]$proof.roiConfidenceLabel
            $roiEvidenceConfidence = [string]$proof.roiEvidenceConfidence
            $sponsorProofReadiness = [string]$proof.sponsorProofReadiness
            $isDemoTenant = ($deltas.isDemoTenant -eq $true)

            if ([string]::IsNullOrWhiteSpace($roiLabel)) {
                $script:roiBasisStatus = 'not-collected'
                $script:roiSponsorSafe = $false
                Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail 'proofPackageCompleteness.roiConfidenceLabel is missing from pilot-run-deltas.' -Remediation 'Capture tenant ROI baseline posture before sponsor export.' -TriageCard 'FP-T016'
                return
            }
        }
        catch {
            Add-ProofFinding -Disposition 'WARN' -Name 'roi-basis-labels' -Detail "Could not parse pilot-run-deltas.json for ROI basis metadata: $($_.Exception.Message)" -Remediation 'Inspect pilot-run-deltas JSON manually.' -TriageCard 'FP-T016'
            return
        }
    }

    $script:roiBasisStatus = Resolve-RoiBasisStatus `
        -RoiConfidenceLabel $roiLabel `
        -IsDemoTenant $isDemoTenant `
        -RoiEvidenceConfidence $roiEvidenceConfidence `
        -SponsorProofReadiness $sponsorProofReadiness
    $script:roiSponsorSafe = Test-RoiBasisSponsorSafe -RoiBasisStatus $script:roiBasisStatus -AllowCaveatedUnsafeBasis:$AllowCaveatedUnsafeBasis

    if ($SponsorHandoff -and -not $script:roiSponsorSafe) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail "ROI basis status '$($script:roiBasisStatus)' is not sponsor-safe for projected dollar claims without an explicit caveat." -Remediation 'Capture buyer-provided baselines or label the packet with conservative ROI caveats before sponsor send.' -TriageCard 'FP-T018'
        return
    }

    if (-not $SponsorHandoff -and -not $script:roiSponsorSafe) {
        Add-ProofFinding -Disposition 'WARN' -Name 'roi-basis-labels' -Detail "ROI basis status '$($script:roiBasisStatus)' lowers evidence confidence; acceptable for self-serve exploration but not for guided paid pilot sponsor handoff." -Remediation 'Capture buyer-provided baselines per docs/library/PILOT_ROI_MODEL.md before sponsor send.' -TriageCard 'FP-T018'
        return
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'roi-basis-labels' -Detail "First-value report includes sponsor-safe ROI basis sections; basis status=$($script:roiBasisStatus)." -Remediation ''
}

function Add-LlmCostSummaryFinding {
    param([Parameter(Mandatory = $true)][string] $EvidenceRoot)

    $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot
    $summaryPath = if ($null -ne $latestBundle) {
        Join-Path $latestBundle.FullName 'pilot-observability-summary.json'
    }
    else {
        $null
    }

    if ($null -eq $summaryPath -or -not (Test-Path -LiteralPath $summaryPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'pilot-llm-cost-summary' -Detail 'pilot-observability-summary.json is missing; LLM cost summary was not collected.' -Remediation 'Re-run committed-run evidence collection.' -TriageCard 'FP-T004'
        return
    }

    try {
        $summary = Get-Content -LiteralPath $summaryPath -Raw | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        Add-ProofFinding -Disposition 'WARN' -Name 'pilot-llm-cost-summary' -Detail "Could not parse pilot-observability-summary.json: $($_.Exception.Message)" -Remediation 'Regenerate the evidence bundle.' -TriageCard 'FP-T004'
        return
    }

    $costBasisLabel = [string]$summary.llmCostBasisLabel

    if ($summary.llmCostEvidenceResolved -eq $true -and -not [string]::IsNullOrWhiteSpace($costBasisLabel)) {
        Add-ProofFinding -Disposition 'PASS' -Name 'pilot-llm-cost-summary' -Detail "LLM usage summary collected with cost basis label '$costBasisLabel'." -Remediation ''
        return
    }

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'WARN' -Name 'pilot-llm-cost-summary' -Detail 'LLM cost evidence is incomplete; sponsor packet should disclose estimated/simulator/unavailable cost basis.' -Remediation 'Review pilot-cost-summary.md and avoid implying invoice-grade Azure cost truth.' -TriageCard 'FP-T004'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'pilot-llm-cost-summary' -Detail 'LLM cost evidence is incomplete in the observability summary.' -Remediation 'Collect committed-run evidence after execute/commit for cost labels.' -TriageCard 'FP-T004'
}

function Resolve-K6SummaryPath {
    param([string] $ExplicitPath)

    if (-not [string]::IsNullOrWhiteSpace($ExplicitPath) -and (Test-Path -LiteralPath $ExplicitPath)) {
        return (Resolve-Path -LiteralPath $ExplicitPath).Path
    }

    if (-not [string]::IsNullOrWhiteSpace($env:ARCHLUCID_K6_SUMMARY_PATH) -and (Test-Path -LiteralPath $env:ARCHLUCID_K6_SUMMARY_PATH)) {
        return (Resolve-Path -LiteralPath $env:ARCHLUCID_K6_SUMMARY_PATH).Path
    }

    $repoCandidate = Join-Path $root 'k6-summary.json'

    if (Test-Path -LiteralPath $repoCandidate) {
        return (Resolve-Path -LiteralPath $repoCandidate).Path
    }

    return $null
}

function Add-ApiHotPathPerformanceFinding {
    param(
        [string] $SummaryPath,
        [string] $EnvironmentLabel,
        [string] $EvidenceClass
    )

    $reportPath = Join-Path $ProofDirectory 'api-hot-path-performance.md'
    $scriptPath = Join-Path $PSScriptRoot 'report_api_hot_path_performance.py'
    $args = @(
        $scriptPath,
        '--markdown-out', $reportPath,
        '--environment-label', $EnvironmentLabel,
        '--evidence-class', $EvidenceClass
    )

    if (-not [string]::IsNullOrWhiteSpace($SummaryPath)) {
        $args += @('--summary', $SummaryPath)
    }

    $output = & python @args 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        Add-ProofFinding -Disposition 'WARN' -Name 'api-hot-path-performance' -Detail (($output | Out-String).Trim()) -Remediation 'Attach a valid k6 summary JSON or rerun load smoke with summary export enabled.'
        return
    }

    Add-ProofArtifact -Name 'api-hot-path-performance.md' -Path 'api-hot-path-performance.md' -Purpose 'Buyer-safe HTTP p95 evidence from k6 summary JSON (not SLA proof).'

    if ([string]::IsNullOrWhiteSpace($SummaryPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'api-hot-path-performance' -Detail 'No k6 summary JSON was attached; performance evidence markdown records SKIPPED.' -Remediation 'Attach CI smoke or production-like k6 summary output before external performance claims.'
        return
    }

    $reportText = Get-Content -LiteralPath $reportPath -Raw

    if ($reportText -match '\| Status \| \*\*COLLECTED\*\* \|') {
        Add-ProofFinding -Disposition 'PASS' -Name 'api-hot-path-performance' -Detail 'k6 HTTP p95 evidence collected with explicit smoke/production-like labeling.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'api-hot-path-performance' -Detail 'k6 summary was attached but global HTTP p95 was incomplete; see api-hot-path-performance.md.' -Remediation 'Re-export k6 summary JSON with http_req_duration p(95) populated.'
}

function Resolve-StagingSmokeResultsPath {
    param([string] $ExplicitPath)

    if (-not [string]::IsNullOrWhiteSpace($ExplicitPath) -and (Test-Path -LiteralPath $ExplicitPath)) {
        return (Resolve-Path -LiteralPath $ExplicitPath).Path
    }

    $candidates = @(
        (Join-Path $root 'artifacts/staging-smoke-results.json'),
        (Join-Path $root 'staging-smoke-results.json')
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    return $null
}

function Resolve-HostedProbeArtifactsPath {
    param([string] $ExplicitPath)

    if (-not [string]::IsNullOrWhiteSpace($ExplicitPath) -and (Test-Path -LiteralPath $ExplicitPath)) {
        return (Resolve-Path -LiteralPath $ExplicitPath).Path
    }

    if (-not [string]::IsNullOrWhiteSpace($env:HOSTED_PROBE_ARTIFACTS_PATH) -and (Test-Path -LiteralPath $env:HOSTED_PROBE_ARTIFACTS_PATH)) {
        return (Resolve-Path -LiteralPath $env:HOSTED_PROBE_ARTIFACTS_PATH).Path
    }

    $candidate = Join-Path $root 'artifacts/hosted-probes'

    if (Test-Path -LiteralPath $candidate) {
        return (Resolve-Path -LiteralPath $candidate).Path
    }

    return $null
}

function Add-FirstPilotPerformanceBaselineFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [string] $TimingsJsonPath
    )

    $markdownPath = Join-Path $ProofDirectory 'first-pilot-performance-baseline.md'
    $jsonPath = Join-Path $ProofDirectory 'first-pilot-performance-baseline.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_first_pilot_performance_baseline.py'
    $args = @(
        $scriptPath,
        '--markdown-out', $markdownPath,
        '--json-summary-out', $jsonPath
    )

    if (-not [string]::IsNullOrWhiteSpace($TimingsJsonPath)) {
        $args += @('--timings-json', $TimingsJsonPath)
    }

    & python @args 2>&1 | Out-Null
    Add-ProofArtifact -Name 'first-pilot-performance-baseline.md' -Path 'first-pilot-performance-baseline.md' -Purpose 'Observed first-pilot step latencies — not a load test or SLA proof.'
    Add-ProofArtifact -Name 'first-pilot-performance-baseline.json' -Path 'first-pilot-performance-baseline.json' -Purpose 'Machine-readable first-pilot performance baseline summary.'

    if ([string]::IsNullOrWhiteSpace($TimingsJsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'first-pilot-performance-baseline' -Detail 'No staging-smoke timings JSON attached; baseline records NOT_COLLECTED.' -Remediation 'Run ./scripts/staging-smoke.ps1 and rerun proof with -StagingSmokeResultsPath.'
        return
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'first-pilot-performance-baseline' -Detail 'First-pilot step latency baseline attached with explicit not-a-load-test labeling.' -Remediation ''
}

function Add-LlmBudgetStatusFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [string] $EvidenceRoot = '',
        [string] $LlmExecutionMode = 'unknown'
    )

    $statusJsonPath = $null

    if (-not [string]::IsNullOrWhiteSpace($EvidenceRoot)) {
        $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

        if ($null -ne $latestBundle) {
            $candidate = Join-Path $latestBundle.FullName 'llm-budget-status.json'

            if (Test-Path -LiteralPath $candidate) {
                $statusJsonPath = $candidate
            }
            else {
                $observabilityPath = Join-Path $latestBundle.FullName 'pilot-observability-summary.json'

                if (Test-Path -LiteralPath $observabilityPath) {
                    $statusJsonPath = $observabilityPath
                }
            }
        }
    }

    $markdownPath = Join-Path $ProofDirectory 'llm-budget-proof-status.md'
    $jsonPath = Join-Path $ProofDirectory 'llm-budget-proof-status.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_llm_budget_proof_status.py'
    $args = @(
        $scriptPath,
        '--markdown-out', $markdownPath,
        '--json-summary-out', $jsonPath,
        '--llm-mode', $LlmExecutionMode
    )

    if (-not [string]::IsNullOrWhiteSpace($statusJsonPath)) {
        $args += @('--status-json', $statusJsonPath)
    }

    & python @args 2>&1 | Out-Null
    Add-ProofArtifact -Name 'llm-budget-proof-status.md' -Path 'llm-budget-proof-status.md' -Purpose 'Buyer-safe UTC-month LLM budget posture for hosted pilot economics.'
    Add-ProofArtifact -Name 'llm-budget-proof-status.json' -Path 'llm-budget-proof-status.json' -Purpose 'Machine-readable LLM budget proof summary.'

    if ([string]::IsNullOrWhiteSpace($statusJsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'llm-budget-proof-status' -Detail 'LLM budget status was not collected (ExecuteAuthority or budget tables may be unavailable).' -Remediation 'Re-run evidence collection with ExecuteAuthority or review LlmMonthlyTenantDollarBudget configuration.'
        return
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'llm-budget-proof-status' -Detail "LLM budget posture collected for execution mode '$LlmExecutionMode'." -Remediation ''
}

function Add-HostedAvailabilityRollupFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [string] $ProbeArtifactsPath
    )

    $markdownPath = Join-Path $ProofDirectory 'hosted-availability-rollup.md'
    $jsonPath = Join-Path $ProofDirectory 'hosted-availability-rollup.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_hosted_availability_proof.py'
    $args = @(
        $scriptPath,
        '--markdown-out', $markdownPath,
        '--json-summary-out', $jsonPath
    )

    if (-not [string]::IsNullOrWhiteSpace($ProbeArtifactsPath)) {
        if ((Get-Item -LiteralPath $ProbeArtifactsPath).PSIsContainer) {
            $jsonFiles = Get-ChildItem -LiteralPath $ProbeArtifactsPath -Filter '*.json' -Recurse -File -ErrorAction SilentlyContinue

            foreach ($file in $jsonFiles) {
                $args += $file.FullName
            }
        }
        else {
            $args += $ProbeArtifactsPath
        }
    }

    & python @args 2>&1 | Out-Null
    Add-ProofArtifact -Name 'hosted-availability-rollup.md' -Path 'hosted-availability-rollup.md' -Purpose 'Hosted HTTP probe rollup when artifacts exist — not contractual SLA evidence.'
    Add-ProofArtifact -Name 'hosted-availability-rollup.json' -Path 'hosted-availability-rollup.json' -Purpose 'Machine-readable hosted availability rollup disposition.'

    if ([string]::IsNullOrWhiteSpace($ProbeArtifactsPath)) {
        $detail = 'Hosted probe artifacts were not supplied; availability rollup is NOT_COLLECTED.'

        if ($ProductionLikeHostedPilot -and $SponsorHandoff) {
            $detail = "$detail Production-like sponsor handoff lacks hosted probe history — do not imply production SLA evidence."
        }

        Add-ProofFinding -Disposition 'WARN' -Name 'hosted-availability-rollup' -Detail $detail -Remediation 'Collect probe artifacts per docs/runbooks/HOSTED_AVAILABILITY_ROLLUP.md or set -HostedProbeArtifactsPath.'
        return
    }

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'hosted-availability-rollup' -Detail 'Hosted availability rollup JSON missing after probe artifact processing.' -Remediation 'Verify probe artifacts and rerun hosted availability rollup.'
        return
    }

    $rollup = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json
    $overallDisposition = [string]$rollup.overallDisposition

    if ([string]::IsNullOrWhiteSpace($overallDisposition)) {
        $overallDisposition = 'INCONCLUSIVE'
    }

    $buyerSafe = $false

    if ($null -ne $rollup.buyerSafeEvidence) {
        $buyerSafe = [bool]$rollup.buyerSafeEvidence
    }

    switch ($overallDisposition) {
        'PASS' {
            Add-ProofFinding -Disposition 'PASS' -Name 'hosted-availability-rollup' -Detail 'Hosted availability rollup attached with production probe success and buyer-safe evidence flag true.' -Remediation ''
        }
        'WARN' {
            $detail = 'Hosted availability rollup attached; staging or partial probe failures — not buyer-safe production SLA evidence.'

            Add-ProofFinding -Disposition 'WARN' -Name 'hosted-availability-rollup' -Detail $detail -Remediation 'Attach production probe history with both /health/live and /health/ready OK before buyer SLA claims.'
        }
        default {
            $detail = 'Hosted availability rollup is INCONCLUSIVE (missing, mixed, or insufficient probe data).'

            if ($ProductionLikeHostedPilot -and $SponsorHandoff) {
                Add-ProofFinding -Disposition 'BLOCK' -Name 'hosted-availability-rollup' -Detail $detail -Remediation 'Collect non-skipped production probe artifacts before production-like sponsor handoff.' -TriageCard 'FP-T023'
            }
            else {
                Add-ProofFinding -Disposition 'WARN' -Name 'hosted-availability-rollup' -Detail $detail -Remediation 'Collect probe artifacts per docs/runbooks/HOSTED_AVAILABILITY_ROLLUP.md.'
            }
        }
    }
}

function Add-AzureExtractorUploadUxFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'azure-extractor-upload-failure-ux.md'
    $scriptPath = Join-Path $PSScriptRoot 'ci\check_azure_extractor_upload_failure_ux.py'
    & python $scriptPath --markdown-out $markdownPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'azure-extractor-upload-failure-ux.md' -Path 'azure-extractor-upload-failure-ux.md' -Purpose 'Stable Azure extractor upload failure codes mapped to docs and tests.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'azure-extractor-upload-failure-ux' -Detail 'Azure extractor upload failure UX acceptance checks passed.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'azure-extractor-upload-failure-ux' -Detail "Azure extractor upload UX acceptance returned exit code $exitCode." -Remediation 'Repair resolver codes, docs, or extractor failure tests.'
}

function Add-IdentityPreflightScenarioFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'identity-preflight-scenarios.md'
    $jsonPath = Join-Path $ProofDirectory 'identity-preflight-scenarios.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_identity_preflight_scenarios.py'
    & python $scriptPath --markdown-out $markdownPath --json-summary-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'identity-preflight-scenarios.md' -Path 'identity-preflight-scenarios.md' -Purpose 'Redacted OIDC/SAML preflight scenario examples for enterprise identity setup.'
    Add-ProofArtifact -Name 'identity-preflight-scenarios.json' -Path 'identity-preflight-scenarios.json' -Purpose 'Machine-readable identity preflight scenario fixture index.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'identity-preflight-scenarios' -Detail 'Identity preflight scenario fixtures rendered for operator interpretation.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'identity-preflight-scenarios' -Detail "Identity preflight scenario report failed with exit code $exitCode." -Remediation 'Repair scripts/ci/fixtures/identity-preflight-scenarios.json.'
}

function Add-MutatingRouteAuditMatrixFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'mutating-route-audit-matrix.md'
    $jsonPath = Join-Path $ProofDirectory 'mutating-route-audit-matrix.json'
    $driftJsonPath = Join-Path $ProofDirectory 'mutating-route-audit-surface-drift.json'
    $baseRef = if ([string]::IsNullOrWhiteSpace($RouteTierBaseRef)) { 'origin/main' } else { $RouteTierBaseRef.Trim() }
    $driftScript = Join-Path $PSScriptRoot 'ci\detect_mutating_route_audit_surface_changes.py'
    $controllersChanged = $false

    & python $driftScript --base-ref $baseRef --json-out $driftJsonPath 2>&1 | Out-Null

    if (Test-Path -LiteralPath $driftJsonPath) {
        try {
            $driftPayload = Get-Content -LiteralPath $driftJsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
            $controllersChanged = $driftPayload.controllers_changed -eq $true
        }
        catch {
            $controllersChanged = $false
        }
    }

    $scriptPath = Join-Path $PSScriptRoot 'ci\check_audit_matrix.py'
    & python $scriptPath --markdown-out $markdownPath --json-summary-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'mutating-route-audit-matrix.md' -Path 'mutating-route-audit-matrix.md' -Purpose 'Controller mutating route coverage against AUDIT_COVERAGE_MATRIX.md.'
    Add-ProofArtifact -Name 'mutating-route-audit-matrix.json' -Path 'mutating-route-audit-matrix.json' -Purpose 'Machine-readable mutating route audit matrix disposition.'
    Add-ProofArtifact -Name 'mutating-route-audit-surface-drift.json' -Path 'mutating-route-audit-surface-drift.json' -Purpose 'Git diff signal for ArchLucid.Api controller changes vs base ref.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'mutating-route-audit-matrix' -Detail 'All mutating controller routes are documented in the audit coverage matrix or allowlist.' -Remediation ''
        return
    }

    $detail = "Mutating route audit matrix check failed with exit code $exitCode."

    if ($controllersChanged) {
        $detail = "$detail Controller surfaces changed vs $baseRef."
    }

    if ($SponsorHandoff -or $ProductionLikeHostedPilot -or $controllersChanged) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'mutating-route-audit-matrix' -Detail $detail -Remediation 'Add missing routes to docs/library/AUDIT_COVERAGE_MATRIX.md or scripts/ci/openapi_audit_matrix_allowlist.txt.'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'mutating-route-audit-matrix' -Detail $detail -Remediation 'Add missing routes to docs/library/AUDIT_COVERAGE_MATRIX.md or scripts/ci/openapi_audit_matrix_allowlist.txt.'
}

function Add-RetrievalQualityRollupFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'retrieval-quality-rollup.md'
    $jsonPath = Join-Path $ProofDirectory 'retrieval-quality-rollup.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_retrieval_quality_rollup.py'
    & python $scriptPath --markdown-out $markdownPath --json-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'retrieval-quality-rollup.md' -Path 'retrieval-quality-rollup.md' -Purpose 'Combined offline retrieval IR and faithfulness rollup.'
    Add-ProofArtifact -Name 'retrieval-quality-rollup.json' -Path 'retrieval-quality-rollup.json' -Purpose 'Machine-readable retrieval quality rollup.'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'retrieval-quality-rollup' -Detail 'Retrieval quality rollup was not generated.' -Remediation 'Run scripts/ci/eval_retrieval_ir.py and scripts/ci/eval_agent_faithfulness.py.'
        return
    }

    $payload = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
    $disposition = [string]$payload.disposition

    if ($disposition -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'retrieval-quality-rollup' -Detail 'Retrieval IR and faithfulness evidence are attached for offline golden fixtures.' -Remediation ''
        return
    }

    if ($disposition -eq 'FAIL') {
        $proofDisposition = if ($SponsorHandoff) { 'BLOCK' } else { 'WARN' }
        Add-ProofFinding -Disposition $proofDisposition -Name 'retrieval-quality-rollup' -Detail 'Retrieval quality floors were not met on golden fixtures.' -Remediation 'Review docs/quality/retrieval-ir-report.md and faithfulness-report.md.' -TriageCard 'FP-T004'
        return
    }

    $proofDisposition = if ($SponsorHandoff -and $disposition -eq 'NOT_COLLECTED') { 'BLOCK' } else { 'WARN' }
    Add-ProofFinding -Disposition $proofDisposition -Name 'retrieval-quality-rollup' -Detail "Retrieval quality rollup disposition is $disposition." -Remediation 'Generate retrieval IR and faithfulness reports before sponsor handoff when RAG claims are in the packet.' -TriageCard 'FP-T004'
}

function Add-TerraformPilotValidationMatrixFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'terraform-pilot-validation-matrix.md'
    $jsonPath = Join-Path $ProofDirectory 'terraform-pilot-validation-matrix.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\build_terraform_pilot_validation_matrix.py'
    & python $scriptPath --markdown-out $markdownPath --json-out $jsonPath 2>&1 | Out-Null

    Add-ProofArtifact -Name 'terraform-pilot-validation-matrix.md' -Path 'terraform-pilot-validation-matrix.md' -Purpose 'Validate-only Terraform pilot root matrix (no apply).'
    Add-ProofArtifact -Name 'terraform-pilot-validation-matrix.json' -Path 'terraform-pilot-validation-matrix.json' -Purpose 'Machine-readable Terraform pilot validation matrix.'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'terraform-pilot-validation-matrix' -Detail 'Terraform pilot validation matrix was not generated.' -Remediation 'Rerun collect-first-pilot-proof.ps1.'
        return
    }

    $payload = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop

    if ([string]$payload.disposition -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'terraform-pilot-validation-matrix' -Detail 'Essential Terraform pilot roots are present for validate-only CI.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'terraform-pilot-validation-matrix' -Detail 'One or more essential Terraform pilot roots are missing main.tf.' -Remediation 'See docs/runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md and infra/terraform-pilot.'
}

function Add-MutatingRouteIdempotencyPostureFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'mutating-route-idempotency-posture.md'
    $jsonPath = Join-Path $ProofDirectory 'mutating-route-idempotency-posture.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\check_mutating_route_idempotency_posture.py'
    & python $scriptPath --markdown-out $markdownPath --json-out $jsonPath 2>&1 | Out-Null

    Add-ProofArtifact -Name 'mutating-route-idempotency-posture.md' -Path 'mutating-route-idempotency-posture.md' -Purpose 'Mutating HTTP route idempotency posture rollup (INV-009).'
    Add-ProofArtifact -Name 'mutating-route-idempotency-posture.json' -Path 'mutating-route-idempotency-posture.json' -Purpose 'Machine-readable idempotency posture disposition.'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'mutating-route-idempotency-posture' -Detail 'Idempotency posture report was not generated.' -Remediation 'Run python scripts/ci/check_mutating_route_idempotency_posture.py.'
        return
    }

    $payload = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
    $unclassified = [int]$payload.unclassifiedRouteCount

    if ($unclassified -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'mutating-route-idempotency-posture' -Detail 'All mutating routes have a documented idempotency posture.' -Remediation ''
        return
    }

    $driftScript = Join-Path $PSScriptRoot 'ci\detect_mutating_route_idempotency_drift.py'
    & python $driftScript 2>&1 | Out-Null
    $driftExit = $LASTEXITCODE

    if ($driftExit -eq 0) {
        Add-ProofFinding -Disposition 'WARN' -Name 'mutating-route-idempotency-posture' -Detail "Grandfathered backlog: $unclassified unclassified POST route(s); drift guard passed (no new unclassified routes). See docs/library/MUTATING_ROUTE_IDEMPOTENCY_POSTURE.md." -Remediation 'Classify new mutating routes before merge; refresh baseline only when intentionally grandfathering.'
        return
    }

    Add-ProofFinding -Disposition 'BLOCK' -Name 'mutating-route-idempotency-posture' -Detail "New unclassified mutating route(s) detected ($unclassified grandfathered). Drift guard failed." -Remediation 'Run python scripts/ci/check_mutating_route_idempotency_posture.py and classify new routes.' -TriageCard 'FP-T020'
}

function Add-AuditPathSemanticsFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'audit-path-semantics.md'
    $jsonPath = Join-Path $ProofDirectory 'audit-path-semantics.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_audit_path_semantics.py'
    & python $scriptPath --markdown-out $markdownPath --json-out $jsonPath 2>&1 | Out-Null

    Add-ProofArtifact -Name 'audit-path-semantics.md' -Path 'audit-path-semantics.md' -Purpose 'Transactional vs informational audit semantics for high-value flows.'
    Add-ProofArtifact -Name 'audit-path-semantics.json' -Path 'audit-path-semantics.json' -Purpose 'Machine-readable audit path semantics rollup.'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'audit-path-semantics' -Detail 'Audit path semantics report was not generated.' -Remediation 'Run python scripts/ci/report_audit_path_semantics.py.'
        return
    }

    $payload = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop

    if ([string]$payload.disposition -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'audit-path-semantics' -Detail 'High-value flows are classified and referenced in the audit coverage matrix.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'audit-path-semantics' -Detail 'Some high-value audit flows lack matrix documentation hints.' -Remediation 'Update docs/library/AUDIT_COVERAGE_MATRIX.md for transactional vs informational paths.'
}

function Add-CommercialPackagingReadinessFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'commercial-packaging-readiness.md'
    $jsonPath = Join-Path $ProofDirectory 'commercial-packaging-readiness.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_commercial_packaging_readiness.py'
    & python $scriptPath --markdown-out $markdownPath --json-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'commercial-packaging-readiness.md' -Path 'commercial-packaging-readiness.md' -Purpose 'Machine-checked pricing/tier/checkout copy alignment.'
    Add-ProofArtifact -Name 'commercial-packaging-readiness.json' -Path 'commercial-packaging-readiness.json' -Purpose 'Machine-readable commercial packaging readiness.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'commercial-packaging-readiness' -Detail 'Pricing single-source and commercial tier drift checks passed.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'commercial-packaging-readiness' -Detail "Commercial packaging checks exited $exitCode." -Remediation 'Run python scripts/ci/check_pricing_single_source.py and assert_commercial_tier_packaging_drift.py.'
}

function Add-AiModelProvenanceFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [string] $EvidenceRoot = ''
    )

    $observabilityPath = $null

    if (-not [string]::IsNullOrWhiteSpace($EvidenceRoot)) {
        $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

        if ($null -ne $latestBundle) {
            $candidate = Join-Path $latestBundle.FullName 'pilot-observability-summary.json'

            if (Test-Path -LiteralPath $candidate) {
                $observabilityPath = $candidate
            }
        }
    }

    $markdownPath = Join-Path $ProofDirectory 'ai-model-provenance.md'
    $jsonPath = Join-Path $ProofDirectory 'ai-model-provenance.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_ai_model_provenance.py'
    $args = @($scriptPath, '--markdown-out', $markdownPath, '--json-out', $jsonPath)

    if (-not [string]::IsNullOrWhiteSpace($observabilityPath)) {
        $args += @('--observability-json', $observabilityPath)
    }

    & python @args 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'ai-model-provenance.md' -Path 'ai-model-provenance.md' -Purpose 'Buyer-safe model/prompt-pack provenance without raw prompts.'
    Add-ProofArtifact -Name 'ai-model-provenance.json' -Path 'ai-model-provenance.json' -Purpose 'Machine-readable AI model provenance summary.'

    if ($exitCode -ne 0) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'ai-model-provenance' -Detail 'Model provenance report indicates raw prompt or completion leakage.' -Remediation 'Regenerate evidence with buyer-safe redaction.' -TriageCard 'FP-T005'
        return
    }

    if ([string]::IsNullOrWhiteSpace($observabilityPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'ai-model-provenance' -Detail 'Committed-run observability was not available for model provenance.' -Remediation 'Re-run with -RunId after execute/commit.' -TriageCard 'FP-T005'
        return
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'ai-model-provenance' -Detail 'Model and prompt-pack provenance summary collected without raw prompt text.' -Remediation ''
}

function Add-LlmCostEnvelopeFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [string] $EvidenceRoot = ''
    )

    $observabilityPath = $null
    $budgetPath = $null

    if (-not [string]::IsNullOrWhiteSpace($EvidenceRoot)) {
        $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

        if ($null -ne $latestBundle) {
            $obsCandidate = Join-Path $latestBundle.FullName 'pilot-observability-summary.json'

            if (Test-Path -LiteralPath $obsCandidate) {
                $observabilityPath = $obsCandidate
            }

            $budgetCandidate = Join-Path $latestBundle.FullName 'llm-budget-status.json'

            if (Test-Path -LiteralPath $budgetCandidate) {
                $budgetPath = $budgetCandidate
            }
        }
    }

    $markdownPath = Join-Path $ProofDirectory 'llm-cost-envelope.md'
    $jsonPath = Join-Path $ProofDirectory 'llm-cost-envelope.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_llm_cost_envelope.py'
    $args = @($scriptPath, '--markdown-out', $markdownPath, '--json-out', $jsonPath)

    if (-not [string]::IsNullOrWhiteSpace($observabilityPath)) {
        $args += @('--observability-json', $observabilityPath)
    }

    if (-not [string]::IsNullOrWhiteSpace($budgetPath)) {
        $args += @('--budget-status-json', $budgetPath)
    }

    if (-not [string]::IsNullOrWhiteSpace($EvidenceRoot)) {
        $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

        if ($null -ne $latestBundle) {
            $deltasCandidate = Join-Path $latestBundle.FullName 'pilot-run-deltas.json'

            if (Test-Path -LiteralPath $deltasCandidate) {
                $args += @('--pilot-run-deltas-json', $deltasCandidate)
            }
        }
    }

    & python @args 2>&1 | Out-Null

    Add-ProofArtifact -Name 'llm-cost-envelope.md' -Path 'llm-cost-envelope.md' -Purpose 'LLM cost envelope: budget posture and run-level usage labels.'
    Add-ProofArtifact -Name 'llm-cost-envelope.json' -Path 'llm-cost-envelope.json' -Purpose 'Machine-readable LLM cost envelope summary.'

    if ([string]::IsNullOrWhiteSpace($observabilityPath)) {
        $proofDisposition = if ($SponsorHandoff) { 'WARN' } else { 'WARN' }
        Add-ProofFinding -Disposition $proofDisposition -Name 'llm-cost-envelope' -Detail 'LLM cost envelope was not collected (no observability summary).' -Remediation 'Re-run evidence collection after execute/commit.' -TriageCard 'FP-T004'
        return
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'llm-cost-envelope' -Detail 'LLM cost envelope summary attached (estimated USD, not invoiced Azure spend).' -Remediation ''
}

function Add-ProductionLikeAzurePilotProofFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'production-like-azure-pilot-proof.md'
    $jsonPath = Join-Path $ProofDirectory 'production-like-azure-pilot-proof.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_production_like_azure_pilot_proof.py'
    & python $scriptPath --proof-directory $ProofDirectory --markdown-out $markdownPath --json-out $jsonPath 2>&1 | Out-Null

    Add-ProofArtifact -Name 'production-like-azure-pilot-proof.md' -Path 'production-like-azure-pilot-proof.md' -Purpose 'Azure pilot proof: configured IaC vs measured proof signals vs not-enabled assumptions.'
    Add-ProofArtifact -Name 'production-like-azure-pilot-proof.json' -Path 'production-like-azure-pilot-proof.json' -Purpose 'Machine-readable production-like Azure pilot proof rollup.'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'production-like-azure-pilot-proof' -Detail 'Azure pilot proof artifact was not generated.' -Remediation 'Rerun collect-first-pilot-proof.ps1.'
        return
    }

    try {
        $payload = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
        $measuredCount = @($payload.measuredEvidence).Count

        if ($measuredCount -gt 0) {
            Add-ProofFinding -Disposition 'PASS' -Name 'production-like-azure-pilot-proof' -Detail "Azure pilot proof includes $measuredCount measured signal(s) from this proof folder." -Remediation ''
            return
        }

        Add-ProofFinding -Disposition 'WARN' -Name 'production-like-azure-pilot-proof' -Detail 'Azure pilot proof emitted with no measured signals; rerun with -ProductionLikeHostedPilot.' -Remediation 'See docs/runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md.'
    }
    catch {
        Add-ProofFinding -Disposition 'WARN' -Name 'production-like-azure-pilot-proof' -Detail "Could not parse production-like-azure-pilot-proof.json: $($_.Exception.Message)" -Remediation 'Regenerate Azure pilot proof artifact.'
    }
}

function Add-SecurityReviewerOnePagerFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'security-reviewer-one-pager.md'
    $jsonPath = Join-Path $ProofDirectory 'security-reviewer-one-pager.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_security_reviewer_one_pager.py'
    & python $scriptPath --markdown-out $markdownPath --json-out $jsonPath 2>&1 | Out-Null

    Add-ProofArtifact -Name 'security-reviewer-one-pager.md' -Path 'security-reviewer-one-pager.md' -Purpose 'Buyer-safe security reviewer one-pager (self-assessment vs deferred assurance).'
    Add-ProofArtifact -Name 'security-reviewer-one-pager.json' -Path 'security-reviewer-one-pager.json' -Purpose 'Machine-readable security reviewer one-pager sources and deferred list.'

    if (Test-Path -LiteralPath $markdownPath) {
        Add-ProofFinding -Disposition 'PASS' -Name 'security-reviewer-one-pager' -Detail 'Security reviewer one-pager generated from trust center and SOC2 self-assessment sources.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'security-reviewer-one-pager' -Detail 'Security reviewer one-pager was not generated.' -Remediation 'Run scripts/ci/report_security_reviewer_one_pager.py.'
}

function Add-QuoteToProofReadinessFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $summaryPath = Join-Path $ProofDirectory 'go-no-go-summary.json'
    $closeoutPath = Join-Path $ProofDirectory 'commercial-closeout.json'
    $jsonPath = Join-Path $ProofDirectory 'quote-to-proof-readiness.json'
    $mdPath = Join-Path $ProofDirectory 'quote-to-proof-readiness.md'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_quote_to_proof_readiness.py'
    $args = @(
        $scriptPath,
        '--go-no-go-summary', $summaryPath,
        '--json-out', $jsonPath,
        '--markdown-out', $mdPath
    )

    if (Test-Path -LiteralPath $closeoutPath) {
        $args += @('--commercial-closeout', $closeoutPath)
    }

    & python @args 2>&1 | Out-Null

    Add-ProofArtifact -Name 'quote-to-proof-readiness.json' -Path 'quote-to-proof-readiness.json' -Purpose 'Quote-to-proof SEND/HOLD/DEFERRED_SCOPE checklist from proof state.'
    Add-ProofArtifact -Name 'quote-to-proof-readiness.md' -Path 'quote-to-proof-readiness.md' -Purpose 'Human-readable quote-to-proof readiness summary.'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'quote-to-proof-readiness' -Detail 'Quote-to-proof readiness artifact was not generated.' -Remediation 'Repair report_quote_to_proof_readiness.py.'
        return
    }

    $payload = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
    $disposition = [string]$payload.proofDisposition

    if ($disposition -eq 'SEND') {
        Add-ProofFinding -Disposition 'PASS' -Name 'quote-to-proof-readiness' -Detail 'Quote-to-proof readiness is SEND — safe to schedule sponsor review.' -Remediation ''
        return
    }

    if ($disposition -eq 'DEFERRED_SCOPE') {
        Add-ProofFinding -Disposition 'WARN' -Name 'quote-to-proof-readiness' -Detail 'Quote-to-proof readiness is DEFERRED_SCOPE — document buyer asks separately from V1 proof gaps.' -Remediation 'See deferredScopeReasons in go-no-go-summary.json.'
        return
    }

    $proofDisposition = if ($SponsorHandoff) { 'BLOCK' } else { 'WARN' }

    Add-ProofFinding -Disposition $proofDisposition -Name 'quote-to-proof-readiness' -Detail "Quote-to-proof readiness is HOLD ($disposition)." -Remediation 'Resolve blocking proof findings before annual conversion ask.' -TriageCard 'FP-T017'
}

function Add-PilotAcceptanceThresholdFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $summaryPath = Join-Path $ProofDirectory 'go-no-go-summary.json'
    $quotePath = Join-Path $ProofDirectory 'quote-to-proof-readiness.json'
    $firstValuePath = Join-Path $ProofDirectory 'first-pilot-evidence\first-value-report.md'
    $jsonPath = Join-Path $ProofDirectory 'pilot-acceptance-thresholds.json'
    $mdPath = Join-Path $ProofDirectory 'pilot-acceptance-thresholds.md'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_pilot_acceptance_thresholds.py'
    $args = @(
        $scriptPath,
        '--go-no-go-summary', $summaryPath,
        '--json-out', $jsonPath,
        '--markdown-out', $mdPath
    )

    if (Test-Path -LiteralPath $quotePath) {
        $args += @('--quote-to-proof-readiness', $quotePath)
    }

    if (Test-Path -LiteralPath $firstValuePath) {
        $args += @('--first-value-report', $firstValuePath)
    }

    & python @args 2>&1 | Out-Null

    Add-ProofArtifact -Name 'pilot-acceptance-thresholds.json' -Path 'pilot-acceptance-thresholds.json' -Purpose 'PASS/HOLD/DEFERRED_SCOPE pilot acceptance evaluation from proof artifacts.'
    Add-ProofArtifact -Name 'pilot-acceptance-thresholds.md' -Path 'pilot-acceptance-thresholds.md' -Purpose 'Human-readable pilot acceptance threshold summary.'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'pilot-acceptance-thresholds' -Detail 'Pilot acceptance threshold artifact was not generated.' -Remediation 'Repair report_pilot_acceptance_thresholds.py.'
        return
    }

    $payload = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
    $outcome = [string]$payload.pilotOutcome
    $quality = [string]$payload.proofQualityLevel

    if ($outcome -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'pilot-acceptance-thresholds' -Detail "Pilot acceptance PASS ($quality proof quality)." -Remediation ''
        return
    }

    if ($outcome -eq 'DEFERRED_SCOPE') {
        Add-ProofFinding -Disposition 'WARN' -Name 'pilot-acceptance-thresholds' -Detail 'Pilot acceptance DEFERRED_SCOPE — buyer ask outside V1; not a pilot failure.' -Remediation 'Record deferred items; do not treat as proof gap.'
        return
    }

    $proofDisposition = if ($SponsorHandoff) { 'BLOCK' } else { 'WARN' }

    Add-ProofFinding -Disposition $proofDisposition -Name 'pilot-acceptance-thresholds' -Detail "Pilot acceptance HOLD ($quality) — resolve gates before sponsor commercial close." -Remediation 'See pilot-acceptance-thresholds.md and PILOT_ACCEPTANCE_THRESHOLDS.md.' -TriageCard 'FP-T018'
}

function Add-CommercialCloseoutConsistencyFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $scriptPath = Join-Path $PSScriptRoot 'ci\validate_commercial_closeout_consistency.py'
    $summaryPath = Join-Path $ProofDirectory 'go-no-go-summary.json'
    $closeoutJson = Join-Path $ProofDirectory 'commercial-closeout.json'
    $closeoutMd = Join-Path $ProofDirectory 'commercial-closeout.md'
    & python $scriptPath --go-no-go-summary $summaryPath --commercial-closeout $closeoutJson --commercial-closeout-md $closeoutMd 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'commercial-closeout-consistency' -Detail 'commercial-closeout.json agrees with go-no-go-summary.json.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'BLOCK' -Name 'commercial-closeout-consistency' -Detail 'Commercial closeout JSON diverges from go-no-go summary.' -Remediation 'Repair Write-FirstPilotCommercialCloseoutArtifacts mapping.' -TriageCard 'FP-T017'
}

function Add-TierFitValidationFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $checkScript = Join-Path $PSScriptRoot 'ci\check_tier_fit_matrix.py'
    & python $checkScript 2>&1 | Out-Null
    $checkExit = $LASTEXITCODE

    $jsonPath = Join-Path $ProofDirectory 'tier-fit-validation-matrix.json'
    $mdPath = Join-Path $ProofDirectory 'tier-fit-validation-matrix.md'
    $reportScript = Join-Path $PSScriptRoot 'ci\report_tier_fit_matrix_summary.py'
    & python $reportScript --json-out $jsonPath --markdown-out $mdPath 2>&1 | Out-Null

    Add-ProofArtifact -Name 'tier-fit-validation-matrix.json' -Path 'tier-fit-validation-matrix.json' -Purpose 'Tier-to-buyer-job fit matrix for commercial packaging.'
    Add-ProofArtifact -Name 'tier-fit-validation-matrix.md' -Path 'tier-fit-validation-matrix.md' -Purpose 'Human-readable tier fit matrix.'

    if ($checkExit -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'tier-fit-validation' -Detail 'Tier fit matrix validates and GTM docs avoid forbidden V1 tier claims.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'tier-fit-validation' -Detail 'Tier fit matrix validation reported packaging copy issues.' -Remediation 'Run python scripts/ci/check_tier_fit_matrix.py.'
}

function Add-CompliancePostureClarityFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $scriptPath = Join-Path $PSScriptRoot 'ci\check_commercial_overclaim_guard.py'
    & python $scriptPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    $tablePath = Join-Path $ProofDirectory 'compliance-posture-evidence-table.md'
    $tableLines = [System.Collections.Generic.List[string]]::new()
    $tableLines.Add('# Compliance posture evidence table (current vs deferred)')
    $tableLines.Add('')
    $tableLines.Add('| Posture | V1 today | Deferred / informational |')
    $tableLines.Add('| --- | --- | --- |')
    $tableLines.Add('| SOC 2 | Self-assessment narrative | CPA SOC 2 report (deferred) |')
    $tableLines.Add('| Pen test | Internal/security docs | Third-party publication (deferred) |')
    $tableLines.Add('| Policy packs | Architecture review support | Not statutory certification automation |')
    $tableLines.Add('| DPA/SIG/CAIQ | Templates / pre-fills | Not legal guarantees until executed |')
    $tableLines.Add('')
    $tableLines | Set-Content -LiteralPath $tablePath -Encoding UTF8
    Add-ProofArtifact -Name 'compliance-posture-evidence-table.md' -Path 'compliance-posture-evidence-table.md' -Purpose 'Current vs deferred compliance evidence table for procurement handoff.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'commercial-overclaim-guard' -Detail 'Commercial overclaim guard passed (docs + marketing paths).' -Remediation ''
        Add-ProofFinding -Disposition 'PASS' -Name 'compliance-posture-clarity' -Detail 'Compliance posture clarity scan passed (alias of commercial-overclaim-guard).' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'commercial-overclaim-guard' -Detail 'Commercial overclaim guard reported unsupported claims.' -Remediation 'See docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md and fix flagged lines.'
    Add-ProofFinding -Disposition 'WARN' -Name 'compliance-posture-clarity' -Detail 'Compliance posture clarity scan reported ambiguous wording (alias).' -Remediation 'Run python scripts/ci/check_commercial_overclaim_guard.py.'
}

function Add-QualityGatePromotionStatusFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'quality-gate-promotion-status.md'
    $jsonPath = Join-Path $ProofDirectory 'quality-gate-promotion-status.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_quality_gate_promotion_status.py'
    & python $scriptPath --markdown-out $markdownPath --json-out $jsonPath 2>&1 | Out-Null

    Add-ProofArtifact -Name 'quality-gate-promotion-status.md' -Path 'quality-gate-promotion-status.md' -Purpose 'Quality gate promotion plan status — engineering gates only.'
    Add-ProofArtifact -Name 'quality-gate-promotion-status.json' -Path 'quality-gate-promotion-status.json' -Purpose 'Machine-readable quality gate promotion status.'

    if (Test-Path -LiteralPath $jsonPath) {
        Add-ProofFinding -Disposition 'PASS' -Name 'quality-gate-promotion-status' -Detail 'Quality gate promotion status artifact emitted; deferred commercial gates remain non-blocking.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'quality-gate-promotion-status' -Detail 'Quality gate promotion status was not generated.' -Remediation 'See docs/library/QUALITY_GATE_PROMOTION_PLAN.md.'
}

function Add-GovernancePolicyPackProofFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'governance-policy-pack-dry-run-proof.md'
    $jsonPath = Join-Path $ProofDirectory 'governance-policy-pack-dry-run-proof.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_governance_policy_pack_proof.py'
    & python $scriptPath --markdown-out $markdownPath --json-summary-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'governance-policy-pack-dry-run-proof.md' -Path 'governance-policy-pack-dry-run-proof.md' -Purpose 'Sample policy-pack governance dry-run proof — architecture-review evidence, not certification.'
    Add-ProofArtifact -Name 'governance-policy-pack-dry-run-proof.json' -Path 'governance-policy-pack-dry-run-proof.json' -Purpose 'Machine-readable governance policy-pack proof disposition.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'governance-policy-pack-dry-run-proof' -Detail 'Governance policy-pack dry-run proof fixture and walkthrough boundaries validated.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'governance-policy-pack-dry-run-proof' -Detail "Governance policy-pack proof fixture check failed with exit code $exitCode." -Remediation 'Repair scripts/ci/fixtures/governance-policy-pack-dry-run-proof.json and accelerator walkthrough non-certification language.'
}

function Add-TenantRetrievalBoundaryProofFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'tenant-retrieval-boundary-proof.md'
    $jsonPath = Join-Path $ProofDirectory 'tenant-retrieval-boundary-proof.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_tenant_retrieval_boundary_proof.py'
    & python $scriptPath --out-md $markdownPath --out-json $jsonPath 2>&1 | Out-Null

    Add-ProofArtifact -Name 'tenant-retrieval-boundary-proof.md' -Path 'tenant-retrieval-boundary-proof.md' -Purpose 'Tenant scope and retrieval filter controls — buyer-safe PASS/HOLD summary.'
    Add-ProofArtifact -Name 'tenant-retrieval-boundary-proof.json' -Path 'tenant-retrieval-boundary-proof.json' -Purpose 'Machine-readable tenant/retrieval boundary proof.'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'tenant-retrieval-boundary-proof' -Detail 'Tenant/retrieval boundary proof was not generated.' -Remediation 'Run python scripts/ci/report_tenant_retrieval_boundary_proof.py.'
        return
    }

    $payload = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop

    if ([string]$payload.disposition -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'tenant-retrieval-boundary-proof' -Detail 'Tenant scope binding and retrieval filter controls documented with regression tests.' -Remediation ''
        return
    }

    $proofDisposition = if ($SponsorHandoff) { 'BLOCK' } else { 'WARN' }
    Add-ProofFinding -Disposition $proofDisposition -Name 'tenant-retrieval-boundary-proof' -Detail 'Tenant/retrieval boundary proof reported HOLD — missing evidence files.' -Remediation 'Restore scope binding and retrieval filter tests before sponsor handoff.'
}

function Add-IacParityScanFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'iac-runtime-parity-scan.md'
    $jsonPath = Join-Path $ProofDirectory 'iac-runtime-parity-scan.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_iac_parity_scan.py'
    & python $scriptPath --out-md $markdownPath --out-json $jsonPath 2>&1 | Out-Null

    Add-ProofArtifact -Name 'iac-runtime-parity-scan.md' -Path 'iac-runtime-parity-scan.md' -Purpose 'Configured runtime services vs Terraform roots (TB-091+).'
    Add-ProofArtifact -Name 'iac-runtime-parity-scan.json' -Path 'iac-runtime-parity-scan.json' -Purpose 'Machine-readable IaC parity scan disposition.'

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'iac-runtime-parity-scan' -Detail 'IaC parity scan was not generated.' -Remediation 'Run python scripts/ci/report_iac_parity_scan.py.'
        return
    }

    $payload = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
    $disposition = [string]$payload.disposition

    if ($disposition -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'iac-runtime-parity-scan' -Detail 'Essential configured services map to Terraform roots.' -Remediation ''
        return
    }

    if ($disposition -eq 'HOLD') {
        $proofDisposition = if ($SponsorHandoff) { 'BLOCK' } else { 'WARN' }
        Add-ProofFinding -Disposition $proofDisposition -Name 'iac-runtime-parity-scan' -Detail 'Pilot-essential service configured without matching Terraform root.' -Remediation 'See docs/library/IAC_RUNTIME_PARITY.md.'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'iac-runtime-parity-scan' -Detail "IaC parity scan disposition is $disposition." -Remediation 'See docs/library/IAC_RUNTIME_PARITY.md.'
}

function Add-StarterProofPackValidationFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $jsonPath = Join-Path $ProofDirectory 'starter-proof-pack-validation.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\check_starter_proof_packs.py'
    & python $scriptPath --json-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'starter-proof-pack-validation.json' -Path 'starter-proof-pack-validation.json' -Purpose 'Starter proof pack metadata and required-file validation (TB-115/TB-116).'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'starter-proof-pack-validation' -Detail 'All starter proof packs passed metadata and required-file validation.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'starter-proof-pack-validation' -Detail "Starter proof pack validation failed with exit code $exitCode." -Remediation 'Run python scripts/ci/check_starter_proof_packs.py and repair pack metadata.'
}

Write-Host "Collecting first-pilot proof @ $normalizedBase"
Write-Host "Output: $proofDir"

$resolvedK6SummaryPath = Resolve-K6SummaryPath -ExplicitPath $K6SummaryPath
$resolvedStagingSmokePath = Resolve-StagingSmokeResultsPath -ExplicitPath $StagingSmokeResultsPath
$resolvedHostedProbePath = Resolve-HostedProbeArtifactsPath -ExplicitPath $HostedProbeArtifactsPath
$performanceEnvironmentLabel = if ($ProductionLikeHostedPilot) { 'production-like-hosted' } else { 'local-or-readiness' }
$performanceEvidenceClass = if ($ProductionLikeHostedPilot) { 'production-like-k6-not-sla' } else { 'ci-smoke-or-attached-not-sla' }
Add-ApiHotPathPerformanceFinding -SummaryPath $resolvedK6SummaryPath -EnvironmentLabel $performanceEnvironmentLabel -EvidenceClass $performanceEvidenceClass
Add-FirstPilotPerformanceBaselineFinding -ProofDirectory $proofDir -TimingsJsonPath $resolvedStagingSmokePath

$performanceBaselineJsonForEnvelope = Join-Path $proofDir 'first-pilot-performance-baseline.json'

if (-not (Test-Path -LiteralPath $performanceBaselineJsonForEnvelope)) {
    $performanceBaselineJsonForEnvelope = ''
}

$k6SummaryJsonForEnvelope = if ([string]::IsNullOrWhiteSpace($resolvedK6SummaryPath)) { '' } else { $resolvedK6SummaryPath }

Add-ScaleEnvelopeEvidenceFinding `
    -ProofDirectory $proofDir `
    -PerformanceBaselineJsonPath $performanceBaselineJsonForEnvelope `
    -K6SummaryJsonPath $k6SummaryJsonForEnvelope

Add-HostedAvailabilityRollupFinding -ProofDirectory $proofDir -ProbeArtifactsPath $resolvedHostedProbePath
Add-AzureExtractorUploadUxFinding -ProofDirectory $proofDir
Add-IdentityPreflightScenarioFinding -ProofDirectory $proofDir
Add-MutatingRouteAuditMatrixFinding -ProofDirectory $proofDir
Add-MutatingRouteIdempotencyPostureFinding -ProofDirectory $proofDir
Add-TerraformPilotValidationMatrixFinding -ProofDirectory $proofDir
Add-AuditPathSemanticsFinding -ProofDirectory $proofDir
Add-GovernancePolicyPackProofFinding -ProofDirectory $proofDir
Add-TenantRetrievalBoundaryProofFinding -ProofDirectory $proofDir
Add-IacParityScanFinding -ProofDirectory $proofDir
Add-StarterProofPackValidationFinding -ProofDirectory $proofDir
Add-ProductionLikeAzurePilotProofFinding -ProofDirectory $proofDir
Add-SecurityReviewerOnePagerFinding -ProofDirectory $proofDir
Add-CompliancePostureClarityFinding -ProofDirectory $proofDir
Add-QualityGatePromotionStatusFinding -ProofDirectory $proofDir

if ($SkipPreflight) {
    Add-ProofFinding -Disposition 'WARN' -Name 'pilot-preflight' -Detail 'Skipped by -SkipPreflight.' -Remediation 'Run without -SkipPreflight before customer handoff.'
}
else {
    $preflightJsonPath = Join-Path $proofDir 'preflight.json'
    $preflightTextPath = Join-Path $proofDir 'preflight-output.txt'
    $savedApiKey = $env:ARCHLUCID_API_KEY

    try {
        if (-not [string]::IsNullOrWhiteSpace($ApiKey)) {
            $env:ARCHLUCID_API_KEY = $ApiKey.Trim()
        }

        $cliProject = Join-Path $root 'ArchLucid.Cli\ArchLucid.Cli.csproj'
        $preflightArgs = @('--json', 'pilot', 'preflight', '--api-base-url', $normalizedBase)

        if ($ProductionLikeHostedPilot -or $SponsorHandoff) {
            $preflightArgs += '--simulate-production'
        }

        $preflightOutput = & dotnet run --project $cliProject -- @preflightArgs 2>&1
        $preflightExit = $LASTEXITCODE
        $preflightText = ($preflightOutput | Out-String).Trim()

        if (-not [string]::IsNullOrWhiteSpace($preflightText)) {
            [System.IO.File]::WriteAllText($preflightTextPath, $preflightText, [System.Text.UTF8Encoding]::new($false))
        }

        try {
            $preflight = $preflightText | ConvertFrom-Json -ErrorAction Stop
            $preflight | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $preflightJsonPath -Encoding UTF8
            Add-ProofArtifact -Name 'preflight.json' -Path 'preflight.json' -Purpose 'CLI pilot preflight checks for config, health, version, and OpenAPI.'

            foreach ($step in @($preflight.steps)) {
                $disposition = Convert-StepDisposition -Disposition ([string]$step.disposition)
                $triage = Get-TriageCardForPreflightStep -Name ([string]$step.name) -Detail ([string]$step.detail)
                Add-ProofFinding -Disposition $disposition -Name ([string]$step.name) -Detail ([string]$step.detail) -Remediation ([string]$step.remediation) -TriageCard $triage
            }
        }
        catch {
            Add-ProofArtifact -Name 'preflight-output.txt' -Path 'preflight-output.txt' -Purpose 'Raw preflight output; JSON parse failed.'
            Add-ProofFinding -Disposition 'BLOCK' -Name 'pilot-preflight-json' -Detail $_.Exception.Message -Remediation 'Run archlucid --json pilot preflight manually and inspect CLI output.' -TriageCard 'FP-T012'
        }

        if ($preflightExit -ne 0) {
            Add-ProofFinding -Disposition 'BLOCK' -Name 'pilot-preflight-exit' -Detail "archlucid pilot preflight exited $preflightExit." -Remediation 'Fix BLOCK preflight rows before first value.' -TriageCard 'FP-T021'
        }
    }
    finally {
        if ($null -eq $savedApiKey) {
            Remove-Item Env:\ARCHLUCID_API_KEY -ErrorAction SilentlyContinue
        }
        else {
            $env:ARCHLUCID_API_KEY = $savedApiKey
        }
    }
}

if ($SkipTelemetryExport) {
    Add-ProofFinding -Disposition 'WARN' -Name 'telemetry-export-readiness' -Detail 'Skipped by -SkipTelemetryExport.' -Remediation 'Run telemetry export readiness before hosted sponsor handoff.' -TriageCard 'FP-T013'
}
else {
    Add-TelemetryExportReadinessFinding -ProofDirectory $proofDir
}

$script:dataConsistencyProofRollup = $null

if ($SkipDataConsistency) {
    $script:dataConsistencyStatus = 'NOT_RUN'
    $resolved = Resolve-DataConsistencyProofFinding -Status 'NOT_RUN' -SponsorHandoff:$SponsorHandoff -RunId $RunId
    $script:dataConsistencyProofRollup = $resolved.rollup
    Add-ProofFinding -Disposition ([string]$resolved.disposition) -Name 'data-consistency-readiness' -Detail ([string]$resolved.detail) -Remediation ([string]$resolved.remediation) -TriageCard 'FP-T019'
}
else {
    $dataOut = Join-Path $proofDir 'data-consistency-readiness'
    $dataScript = Join-Path $PSScriptRoot 'collect-data-consistency-readiness.ps1'
    & $dataScript -BaseUrl $normalizedBase -BearerToken $BearerToken -ApiKey $ApiKey -OutputDirectory $dataOut
    $dataExit = $LASTEXITCODE
    $script:dataConsistencyStatus = Resolve-DataConsistencyStatusFromCollector -CollectorExitCode $dataExit -Skipped:$false

    Add-ProofArtifact -Name 'data-consistency-readiness' -Path 'data-consistency-readiness/' -Purpose 'Read-only data consistency readiness summary.'

    $dataSummary = $null

    try {
        $dataSummary = Get-DataConsistencySummaryFromProofDirectory -ProofDirectory $proofDir
    }
    catch {
        $dataSummary = $null
    }

    $resolved = Resolve-DataConsistencyProofFinding `
        -Status $script:dataConsistencyStatus `
        -Summary $dataSummary `
        -SponsorHandoff:$SponsorHandoff `
        -RunId $RunId `
        -CollectorExitCode $dataExit

    $script:dataConsistencyProofRollup = $resolved.rollup
    Add-ProofFinding -Disposition ([string]$resolved.disposition) -Name 'data-consistency-readiness' -Detail ([string]$resolved.detail) -Remediation ([string]$resolved.remediation) -TriageCard 'FP-T019'
}

if ($SkipCommercialHandoff) {
    Add-ProofFinding -Disposition 'WARN' -Name 'commercial-handoff-checks' -Detail 'Skipped by -SkipCommercialHandoff.' -Remediation 'Run commercial handoff checks before sponsor send.'
}
else {
    Add-RetrievalIrEvidenceFinding -ProofDirectory $proofDir -SponsorHandoff:$SponsorHandoff
    Add-RetrievalQualityRollupFinding -ProofDirectory $proofDir
    Add-ConsolidatedAiReadinessGateFinding -ProofDirectory $proofDir
    Add-CommittedRealLlmFixtureFinding -ProofDirectory $proofDir -SponsorHandoff:$SponsorHandoff
    Add-CommercialPackagingReadinessFinding -ProofDirectory $proofDir
    Add-LiveUiSqlParityFinding -ProofDirectory $proofDir
    Add-DemoWorkspaceValidationFinding -ProofDirectory $proofDir
    Add-ProductionLikeConfigLintFinding -ProofDirectory $proofDir
    Add-RouteTierPolicyNavFinding -ProofDirectory $proofDir
    Add-PolicyPackFreshnessFinding -ProofDirectory $proofDir
    Add-ProcurementDealReadyFinding -ProofDirectory $proofDir
    Add-TrialToPaidTestModeEvidenceFinding -ProofDirectory $proofDir
    Add-AcceleratorHandoffFinding -ProofDirectory $proofDir
    Add-PricingQuoteAgingFinding -ProofDirectory $proofDir
}

if ([string]::IsNullOrWhiteSpace($RunId)) {
    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'committed-run-evidence' -Detail 'No RunId supplied; committed-review evidence collection was skipped in sponsor handoff mode.' -Remediation 'Re-run with -RunId after the first golden manifest is committed.' -TriageCard 'FP-T006'
    }
    else {
        Add-ProofFinding -Disposition 'WARN' -Name 'committed-run-evidence' -Detail 'No RunId supplied; committed-review evidence collection was skipped.' -Remediation 'Re-run with -RunId after the first golden manifest is committed.' -TriageCard 'FP-T006'
    }
}
else {
    $evidenceOut = Join-Path $proofDir 'first-pilot-evidence'
    $evidenceScript = Join-Path $PSScriptRoot 'collect-first-pilot-evidence.ps1'
    & $evidenceScript -BaseUrl $normalizedBase -RunId $RunId -OutputDirectory $evidenceOut -BearerToken $BearerToken -ApiKey $ApiKey
    $evidenceExit = $LASTEXITCODE

    if ($evidenceExit -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'committed-run-evidence' -Detail "Evidence bundle collected for run $RunId."
        Add-ProofArtifact -Name 'first-pilot-evidence' -Path 'first-pilot-evidence/' -Purpose 'Buyer-safe committed-review evidence bundle.'
        Add-AgentQualitySponsorGateFinding -EvidenceRoot $evidenceOut
        Add-AiQualityProofFinding -EvidenceRoot $evidenceOut
        Add-ConsolidatedAiReadinessGateFinding -ProofDirectory $proofDir -EvidenceRoot $evidenceOut
        Add-CommittedRealLlmFixtureFinding -ProofDirectory $proofDir -SponsorHandoff:$SponsorHandoff

        $llmMode = 'unknown'

        try {
            $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $evidenceOut

            if ($null -ne $latestBundle) {
                $observabilityPath = Join-Path $latestBundle.FullName 'pilot-observability-summary.json'

                if (Test-Path -LiteralPath $observabilityPath) {
                    $obsPayload = Get-Content -LiteralPath $observabilityPath -Raw | ConvertFrom-Json -ErrorAction Stop
                    $llmMode = [string]$obsPayload.llmExecutionMode
                }
            }
        }
        catch {
            $llmMode = 'unknown'
        }

        Add-LlmBudgetStatusFinding -ProofDirectory $proofDir -EvidenceRoot $evidenceOut -LlmExecutionMode $llmMode

        Add-PilotProofPacketFinding -ProofDirectory $proofDir -RunIdValue $RunId

        if (-not $SkipCommercialHandoff) {
            Add-RoiBasisLabelFinding -EvidenceRoot $evidenceOut
            Add-DemoDerivedRoiCommercialGate
            Add-LlmCostSummaryFinding -EvidenceRoot $evidenceOut
            Add-AiModelProvenanceFinding -ProofDirectory $proofDir -EvidenceRoot $evidenceOut
            Add-LlmCostEnvelopeFinding -ProofDirectory $proofDir -EvidenceRoot $evidenceOut
        }
    }
    else {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'committed-run-evidence' -Detail "Collector exited $evidenceExit." -Remediation 'Confirm the run is committed and accessible in the current tenant/workspace/project scope.' -TriageCard 'FP-T006'
    }
}

$proofCollectionElapsedMs = [int](((Get-Date).ToUniversalTime() - $proofCollectionStartedUtc).TotalMilliseconds)

Add-FirstPilotTimingBudgetFinding `
    -ProofDirectory $proofDir `
    -PerformanceBaselineJsonPath $performanceBaselineJsonForEnvelope `
    -ProofCollectionElapsedMs $proofCollectionElapsedMs

Add-AdminOperationalPostureFinding -ProofDirectory $proofDir
Add-EnvironmentReliabilityRollupFinding -ProofDirectory $proofDir
Add-OptionalIntegrationCorrectnessDrillFinding -ProofDirectory $proofDir

$evidenceRootForTrace = Join-Path $proofDir 'first-pilot-evidence'
$pilotDeltasPath = Get-PilotRunDeltasJsonPath -EvidenceRoot $evidenceRootForTrace

if ([string]::IsNullOrWhiteSpace($pilotDeltasPath)) {
    $demoDeltasPath = Join-Path $root 'docs\go-to-market\reference-customers\samples\pilot-run-deltas.demo-tenant.json'

    if (Test-Path -LiteralPath $demoDeltasPath) {
        $pilotDeltasPath = $demoDeltasPath
    }
}

Add-GovernanceOutcomeSummaryFinding -ProofDirectory $proofDir -RunIdValue $RunId -DeltasJsonPath $pilotDeltasPath
Add-BuyerSafeAuditEvidenceSummaryFinding -ProofDirectory $proofDir -RunIdValue $RunId -DeltasJsonPath $pilotDeltasPath

if (-not [string]::IsNullOrWhiteSpace($RunId) -and (Test-Path -LiteralPath $evidenceRootForTrace)) {
    Add-CommittedReviewTraceChainSummaryFinding `
        -ProofDirectory $proofDir `
        -EvidenceRoot $evidenceRootForTrace `
        -RunId $RunId
}

$blockCount = @($findings | Where-Object { $_.disposition -eq 'BLOCK' }).Count
$warnCount = @($findings | Where-Object { $_.disposition -eq 'WARN' }).Count
$verdict = if ($blockCount -gt 0) { 'BLOCK' } elseif ($warnCount -gt 0) { 'PASS_WITH_WARNINGS' } else { 'PASS' }
$blockingReasons = Get-BlockingReasonsFromFindings -Findings @($findings)
$deferredScopeReasons = Resolve-DeferredScopeReasons `
    -ExplicitRequirements @($DeferredBuyerRequirement) `
    -ProcurementReportText $script:procurementReportText
$sponsorPacketDisposition = Resolve-SponsorPacketDisposition `
    -SponsorHandoff:$SponsorHandoff `
    -BlockCount $blockCount `
    -WarnCount $warnCount `
    -DeferredScopeReasons $deferredScopeReasons

$triageCardPath = Join-Path $root 'docs/runbooks/FIRST_PILOT_TRIAGE_CARDS.md'
$registeredTriageCards = Get-RegisteredTriageCardIdsFromMarkdown -MarkdownPath $triageCardPath
$usedTriageCards = @($findings | ForEach-Object { [string]$_.triageCard } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
$triageValidation = Test-TriageCardIdsResolve -UsedTriageCardIds $usedTriageCards -RegisteredTriageCardIds $registeredTriageCards

if (-not $triageValidation.valid) {
    throw "Proof pipeline emitted unresolved triage card ids: $($triageValidation.missing -join ', ')"
}

$commercialStepResult = Write-QuoteToProofPacketMarkdown `
    -ProofDirectory $proofDir `
    -SponsorPacketDisposition $sponsorPacketDisposition `
    -RoiBasisStatus $script:roiBasisStatus `
    -RoiSponsorSafe $script:roiSponsorSafe `
    -BlockCount $blockCount `
    -DeferredScopeReasons @($deferredScopeReasons) `
    -Findings @($findings) `
    -RunId $RunId `
    -DataConsistencyStatus $script:dataConsistencyStatus `
    -AiQualityProof $script:aiQualityProof

$procurementDispositionForCloseout = 'NOT_RUN'
$procMatch = @($findings | Where-Object { [string]$_.name -eq 'procurement-deal-ready' })

if ($procMatch.Count -gt 0) {
    $procurementDispositionForCloseout = [string]$procMatch[0].disposition
}

$commercialStepPayload = [ordered]@{
    action = [string]$commercialStepResult.action
    owner  = 'Sales / pilot operator'
    reason = [string]$commercialStepResult.reason
}

if (Test-Path -LiteralPath (Join-Path $proofDir 'commercial-next-step.json')) {
    try {
        $commercialStepPayload = Get-Content -LiteralPath (Join-Path $proofDir 'commercial-next-step.json') -Raw | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        # Keep fallback payload from Write-QuoteToProofPacketMarkdown.
    }
}

$closeoutPaths = Write-FirstPilotCommercialCloseoutArtifacts `
    -ProofDirectory $proofDir `
    -SponsorPacketDisposition $sponsorPacketDisposition `
    -RoiBasisStatus $script:roiBasisStatus `
    -RoiSponsorSafe $script:roiSponsorSafe `
    -BlockCount $blockCount `
    -DeferredScopeReasons @($deferredScopeReasons) `
    -CommercialStep $commercialStepPayload `
    -DataConsistencyStatus $script:dataConsistencyStatus `
    -ProcurementDisposition $procurementDispositionForCloseout `
    -RunId $RunId

Add-ProofArtifact -Name 'commercial-closeout.md' -Path 'commercial-closeout.md' -Purpose 'Single commercial closeout with deterministic next action from proof states.'
Add-ProofArtifact -Name 'commercial-closeout.json' -Path 'commercial-closeout.json' -Purpose 'Machine-readable commercial closeout payload.'

$workflowHandoffPaths = Write-V1WorkflowHandoffArtifacts `
    -ProofDirectory $proofDir `
    -SponsorPacketDisposition $sponsorPacketDisposition `
    -BlockCount $blockCount `
    -DeferredScopeReasons @($deferredScopeReasons) `
    -Findings @($findings) `
    -RunId $RunId `
    -CommercialNextAction ([string]$commercialStepResult.action) `
    -CommercialNextReason ([string]$commercialStepResult.reason)

Add-ProofArtifact -Name 'v1-workflow-handoff-comment.md' -Path $workflowHandoffPaths.mdPath -Purpose 'Paste-ready GitHub/Azure DevOps comment block for V1 workflow handoff.'
Add-ProofArtifact -Name 'v1-workflow-handoff-comment.json' -Path $workflowHandoffPaths.jsonPath -Purpose 'Structured V1 workflow handoff comment payload.'

$commandCenter = Build-FirstPilotCommandCenter `
    -Findings @($findings) `
    -RunId $RunId `
    -SponsorPacketDisposition $sponsorPacketDisposition `
    -BlockCount $blockCount `
    -DeferredScopeReasons @($deferredScopeReasons) `
    -DataConsistencyStatus $script:dataConsistencyStatus `
    -AiReadinessGate $script:aiReadinessGate

$commandCenterPaths = Write-FirstPilotCommandCenterArtifacts -ProofDirectory $proofDir -CommandCenter $commandCenter
Add-ProofArtifact -Name 'first-pilot-command-center.json' -Path $commandCenterPaths.jsonPath -Purpose 'Single phased go/no-go command center (JSON) — primary first-pilot status surface.'
Add-ProofArtifact -Name 'first-pilot-command-center.md' -Path $commandCenterPaths.mdPath -Purpose 'Single phased go/no-go command center (Markdown) aligned to FIRST_PILOT_OPERATOR_PATH labels.'

$summary = [ordered]@{
    formatVersion             = '1.2'
    generatedUtc              = $timestamp
    baseUrl                   = $normalizedBase
    runId                     = if ([string]::IsNullOrWhiteSpace($RunId)) { $null } else { $RunId.Trim() }
    sponsorHandoffMode        = [bool]$SponsorHandoff
    productionLikeHostedPilot = [bool]$ProductionLikeHostedPilot
    verdict                   = $verdict
    sponsorPacketDisposition  = $sponsorPacketDisposition
    blockingReasons           = $blockingReasons
    deferredScopeReasons      = $deferredScopeReasons
    dataConsistencyStatus     = $script:dataConsistencyStatus
    dataConsistencyProof      = $script:dataConsistencyProofRollup
    timingBudget              = if (Test-Path -LiteralPath (Join-Path $proofDir 'first-pilot-timing-budget.json')) {
        Get-Content -LiteralPath (Join-Path $proofDir 'first-pilot-timing-budget.json') -Raw | ConvertFrom-Json
    }
    else {
        $null
    }
    commercialNextStep        = if (Test-Path -LiteralPath (Join-Path $proofDir 'commercial-next-step.json')) {
        Get-Content -LiteralPath (Join-Path $proofDir 'commercial-next-step.json') -Raw | ConvertFrom-Json
    }
    else {
        $null
    }
    roiBasisStatus            = $script:roiBasisStatus
    roiSponsorSafe            = $script:roiSponsorSafe
    aiQualityProof            = $script:aiQualityProof
    aiReadinessGate           = $script:aiReadinessGate
    commandCenter             = [ordered]@{
        jsonPath            = $commandCenterPaths.jsonPath
        mdPath              = $commandCenterPaths.mdPath
        readinessOnly       = $commandCenter.readinessOnly
        nextActionSummary   = [string]$commandCenter.nextAction.summary
    }
    blockCount                = $blockCount
    warnCount                 = $warnCount
    findings                  = $findings
    artifacts                 = $artifacts
}

$summaryJsonPath = Join-Path $proofDir 'go-no-go-summary.json'
$summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $summaryJsonPath -Encoding UTF8

Add-QuoteToProofReadinessFinding -ProofDirectory $proofDir
Add-PilotAcceptanceThresholdFinding -ProofDirectory $proofDir
Add-CommercialCloseoutConsistencyFinding -ProofDirectory $proofDir
Add-TierFitValidationFinding -ProofDirectory $proofDir

$summaryMdPath = Join-Path $proofDir 'go-no-go-summary.md'
$runIdLabel = if ([string]::IsNullOrWhiteSpace($RunId)) { 'Not supplied - readiness-only pass' } else { $RunId.Trim() }
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# First-pilot go/no-go summary')
$lines.Add('')
$lines.Add('> **Primary status surface:** [`first-pilot-command-center.md`](first-pilot-command-center.md) — phased READY / WARN / HOLD / DEFERRED and one **NEXT ACTION**. This file retains the full findings table.')
$lines.Add('')
$lines.Add('| Field | Value |')
$lines.Add('| --- | --- |')
$lines.Add("| Generated UTC | $timestamp |")
$lines.Add("| Base URL | $normalizedBase |")
$lines.Add("| Run ID | $runIdLabel |")
$lines.Add("| Sponsor handoff mode | $([bool]$SponsorHandoff) |")
$lines.Add("| Production-like hosted pilot | $([bool]$ProductionLikeHostedPilot) |")
$lines.Add("| Verdict | **$verdict** |")
$lines.Add("| Sponsor packet disposition | **$sponsorPacketDisposition** |")
$lines.Add("| Data consistency status | **$($script:dataConsistencyStatus)** |")
$lines.Add("| Data consistency summary | ``data-consistency-readiness/data-consistency-summary.json`` |")
$lines.Add("| Timing budget | ``first-pilot-timing-budget.md`` |")
$lines.Add("| ROI basis status | **$($script:roiBasisStatus)** |")
$lines.Add("| ROI sponsor-safe | **$($script:roiSponsorSafe)** |")
$lines.Add("| Blocking findings | $blockCount |")
$lines.Add("| Warnings | $warnCount |")
$lines.Add('')

foreach ($aiLine in (Format-AiQualityProofMarkdownSection -AiQualityProof $script:aiQualityProof)) {
    $lines.Add($aiLine)
}

if ($null -ne $script:aiReadinessGate) {
    $gateForMarkdown = $script:aiReadinessGate.gate
    $dispForMarkdown = [ordered]@{
        disposition = [string]$script:aiReadinessGate.disposition
        summary     = [string]$script:aiReadinessGate.summary
    }

    foreach ($gateLine in (Format-ConsolidatedAiReadinessGateMarkdown -Gate $gateForMarkdown -DispositionResult $dispForMarkdown)) {
        $lines.Add($gateLine)
    }
}

foreach ($dcLine in (Format-DataConsistencyProofMarkdownSection -Rollup $script:dataConsistencyProofRollup)) {
    $lines.Add($dcLine)
}

$dataConsistencySummaryPath = Join-Path $proofDir 'data-consistency-readiness/data-consistency-summary.json'

if (Test-Path -LiteralPath $dataConsistencySummaryPath) {
    try {
        $dataSummary = Get-Content -LiteralPath $dataConsistencySummaryPath -Raw | ConvertFrom-Json -ErrorAction Stop
        $holdProbes = @($dataSummary.probes | Where-Object { [string]$_.status -eq 'HOLD' -or [string]$_.status -eq 'WARN' })

        if ($holdProbes.Count -gt 0) {
            $lines.Add('')
            $lines.Add('## Data consistency actions')
            $lines.Add('')

            foreach ($probe in $holdProbes) {
                $stopLabel = if ($probe.sponsorHandoffMustStop -eq $true) { 'STOP sponsor handoff' } else { 'Review before send' }
                $lines.Add("- **$($probe.probe)** ($($probe.status)) — $($probe.riskMeaning) Remediation: $($probe.remediation) ($stopLabel)")
            }
        }
    }
    catch {
        $lines.Add('')
        $lines.Add("## Data consistency actions")
        $lines.Add('')
        $lines.Add("- Could not parse data-consistency-summary.json: $($_.Exception.Message)")
    }
}

$lines.Add('')
$lines.Add('## Sponsor Handoff Disposition')
$lines.Add('')
$lines.Add("| Field | Value |")
$lines.Add("| --- | --- |")
$lines.Add("| Disposition | **$sponsorPacketDisposition** |")
$lines.Add("| Sponsor handoff mode | $([bool]$SponsorHandoff) |")
$lines.Add("| Blocking reasons | $($blockingReasons.Count) |")
$lines.Add("| Deferred scope reasons | $($deferredScopeReasons.Count) |")

if ($blockingReasons.Count -gt 0) {
    $lines.Add('')
    $lines.Add('### Blocking reasons')
    $lines.Add('')

    foreach ($reason in $blockingReasons) {
        $triageSuffix = if ([string]::IsNullOrWhiteSpace([string]$reason.triageCard)) { '' } else { " ($($reason.triageCard))" }
        $lines.Add("- **$($reason.name)**$triageSuffix — $($reason.detail)")
        $supportStep = Get-FirstPilotSupportNextStepForFinding -Name ([string]$reason.name) -RunId $RunId
        $docLink = Get-FirstPilotRemediationDocLink -FindingName ([string]$reason.name)
        $inAppLink = Get-FirstPilotRemediationInAppLink -FindingName ([string]$reason.name) -RunId $RunId

        if (-not [string]::IsNullOrWhiteSpace($supportStep)) {
            $lines.Add("  - Support: ``$supportStep``")
        }

        if (-not [string]::IsNullOrWhiteSpace($docLink)) {
            $lines.Add("  - Doc: [$docLink]($docLink)")
        }

        if (-not [string]::IsNullOrWhiteSpace($inAppLink)) {
            $lines.Add("  - In-app: ``$inAppLink``")
        }
    }
}

if ($deferredScopeReasons.Count -gt 0) {
    $lines.Add('')
    $lines.Add('### Deferred buyer requirements (V1.1/V2/(B) — not V1 blockers)')
    $lines.Add('')

    foreach ($reason in $deferredScopeReasons) {
        $lines.Add("- $reason")
    }
}

$lines.Add('')
$lines.Add('## Findings')
$lines.Add('')
$lines.Add('| Disposition | Check | Triage | Detail | Remediation | Support next step | Doc | In-app |')
$lines.Add('| --- | --- | --- | --- | --- | --- | --- | --- |')

foreach ($finding in $findings) {
    $detail = ([string]$finding.detail).Replace('|', '\|').Replace("`r", ' ').Replace("`n", ' ')
    $next = ([string]$finding.remediation).Replace('|', '\|').Replace("`r", ' ').Replace("`n", ' ')
    $support = ([string]$finding.supportNextStep).Replace('|', '\|').Replace("`r", ' ').Replace("`n", ' ')
    $docLink = ([string]$finding.remediationDocLink).Replace('|', '\|').Replace("`r", ' ').Replace("`n", ' ')
    $inAppLink = ([string]$finding.remediationInAppLink).Replace('|', '\|').Replace("`r", ' ').Replace("`n", ' ')
    $triage = if ([string]::IsNullOrWhiteSpace([string]$finding.triageCard)) { '' } else { [string]$finding.triageCard }
    $lines.Add("| $($finding.disposition) | $($finding.name) | $triage | $detail | $next | $support | $docLink | $inAppLink |")
}

$lines.Add('')
$lines.Add('## Workflow handoff (optional)')
$lines.Add('')
$lines.Add('Attach proof artifacts to GitHub or Azure DevOps using [`docs/runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md`](../../docs/runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md). Minimum attach: `first-pilot-command-center.md`, `go-no-go-summary.md`, `first-pilot-evidence/first-value-report.md`, `pilot-observability-summary.md`, `first-pilot-evidence/artifact-manifest.json`.')
$lines.Add('')
$lines.Add('## Artifacts')
$lines.Add('')
$lines.Add('| Artifact | Path | Purpose |')
$lines.Add('| --- | --- | --- |')

foreach ($artifact in $artifacts) {
    $artifactPath = '``' + [string]$artifact.path + '``'
    $lines.Add("| $($artifact.name) | $artifactPath | $($artifact.purpose) |")
}

$lines.Add('')
$lines.Add('## Triage card index')
$lines.Add('')
$lines.Add('See `docs/runbooks/FIRST_PILOT_TRIAGE_CARDS.md`. Card ids in this report map directly to that table.')
$lines.Add('')
$lines.Add('## Safety')
$lines.Add('')
$lines.Add('This pipeline is read-only. It does not delete, quarantine, apply Terraform, mutate policy packs, or replay failed jobs.')
$lines | Set-Content -LiteralPath $summaryMdPath -Encoding UTF8

Write-Host "Wrote $summaryMdPath"
Write-Host "Verdict: $verdict ($blockCount block, $warnCount warn)"
Write-Host ""
Write-Host "Primary status surface: $proofDir\first-pilot-command-center.md"
Write-Host "NEXT ACTION: $([string]$commandCenter.nextAction.summary)"

$snapshotScript = Join-Path $PSScriptRoot 'ci\write_first_pilot_proof_status_snapshot.py'

if (Test-Path -LiteralPath $snapshotScript) {
    & python $snapshotScript 2>&1 | ForEach-Object { Write-Host $_ }
}

if ($blockCount -gt 0) {
    exit 1
}

exit 0
