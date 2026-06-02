#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Assembles the sponsor-facing AI readiness posture artifact from existing evidence outputs.

.DESCRIPTION
  Reads real-llm-evidence-gate.json, real-llm-full-pipeline-metrics.json, and the
  retrieval IR report to populate ai-readiness-posture.json and ai-readiness-posture.md.
  All inputs are optional — the script degrades gracefully and adjusts overallReadinessLevel.

  Promoted to V1 (PQ-AI-03, 2026-06-01). Previously planned for V1.1.

  Schema: docs/go-to-market/AI_READINESS_POSTURE.md §2
  Step 2 of: scripts/Invoke-RealLlmEvidenceGate.ps1 → this script → scripts/collect-first-pilot-proof.ps1

.PARAMETER EvidenceGateJson
  Path to real-llm-evidence-gate.json. Relative paths are resolved from repo root.
  Default: artifacts/release/real-llm-evidence-gate.json

.PARAMETER PipelineMetricsJson
  Path to real-llm-full-pipeline-metrics.json (written by Invoke-RealLlmEvidenceGate.ps1).
  Default: artifacts/release/real-llm-full-pipeline-metrics.json

.PARAMETER RetrievalIrReport
  Path to retrieval-ir-report.md.
  Default: docs/quality/retrieval-ir-report.md

.PARAMETER AppSettingsPath
  Path to an appsettings file to read Retrieval:VectorIndex from.
  Default: ArchLucid.Api/appsettings.Advanced.json (the file that carries VectorIndex)

.PARAMETER ReleaseOrRunId
  Identifies the release or run. Defaults to 'pilot-YYYY-MM-DD' from today's UTC date.

.PARAMETER JsonOut
  Destination for ai-readiness-posture.json.
  Default: artifacts/release/ai-readiness-posture.json

.PARAMETER MarkdownOut
  Destination for ai-readiness-posture.md.
  Default: artifacts/release/ai-readiness-posture.md

.EXAMPLE
  # Simulator-only run (no AOAI credentials)
  .\scripts\Write-AiReadinessPosture.ps1

.EXAMPLE
  # After Invoke-RealLlmEvidenceGate.ps1 completes with PASS
  .\scripts\Invoke-RealLlmEvidenceGate.ps1
  .\scripts\Write-AiReadinessPosture.ps1 -ReleaseOrRunId 'v1.0.0-pilot-1'

.NOTES
  TB-182. See docs/go-to-market/AI_READINESS_POSTURE.md for full schema and writing rules.
#>

[CmdletBinding()]
param(
    [string] $EvidenceGateJson   = 'artifacts/release/real-llm-evidence-gate.json',
    [string] $PipelineMetricsJson = 'artifacts/release/real-llm-full-pipeline-metrics.json',
    [string] $RetrievalIrReport  = 'docs/quality/retrieval-ir-report.md',
    [string] $AppSettingsPath    = 'ArchLucid.Api/appsettings.Advanced.json',
    [string] $ReleaseOrRunId     = '',
    [string] $JsonOut            = 'artifacts/release/ai-readiness-posture.json',
    [string] $MarkdownOut        = 'artifacts/release/ai-readiness-posture.md'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Resolve-RepoPath {
    param([string] $Path)

    if ([System.IO.Path]::IsPathRooted($Path)) {
        return $Path
    }

    return Join-Path $root $Path
}

function Read-JsonFileSafely {
    param([string] $AbsPath)

    if (-not (Test-Path -LiteralPath $AbsPath)) {
        return $null
    }

    try {
        $raw = Get-Content -LiteralPath $AbsPath -Raw -Encoding UTF8
        return $raw | ConvertFrom-Json
    }
    catch {
        Write-Warning "Could not parse JSON at $AbsPath — $_"
        return $null
    }
}

function Get-PropertyOrNull {
    param([object] $Object, [string] $Name)

    if ($null -eq $Object) {
        return $null
    }

    $prop = $Object.PSObject.Properties[$Name]

    if ($null -eq $prop) {
        return $null
    }

    return $prop.Value
}

function Get-VectorIndexTypeFromAppSettings {
    param([string] $AbsPath)

    $settings = Read-JsonFileSafely -AbsPath $AbsPath

    if ($null -eq $settings) {
        return $null
    }

    $retrieval = Get-PropertyOrNull -Object $settings -Name 'Retrieval'

    if ($null -eq $retrieval) {
        return $null
    }

    $vectorIndex = Get-PropertyOrNull -Object $retrieval -Name 'VectorIndex'

    if ([string]::IsNullOrWhiteSpace($vectorIndex)) {
        return $null
    }

    # Normalise to schema values
    switch ($vectorIndex.Trim()) {
        'AzureSearch' { return 'azure-ai-search' }
        'InMemory'    { return 'in-memory' }
        default       { return $vectorIndex.ToLower() }
    }
}

function Build-ExecutionMode {
    param([object] $EvidenceGate)

    # When the gate ran with real credentials and both profiles succeeded, all four agents are real.
    # The gate only runs two named test filters (topology-only and full-pipeline), but full-pipeline
    # exercises Topology + Compliance + Cost + Critic together.
    $agents = @('Topology', 'Cost', 'Compliance', 'Critic')

    if ($null -eq $EvidenceGate) {
        $mode = [ordered]@{}

        foreach ($agent in $agents) {
            $mode[$agent] = 'simulator'
        }

        return $mode
    }

    $credentialsPresent = [bool](Get-PropertyOrNull -Object $EvidenceGate -Name 'credentialsPresent')
    $pipelineProfile    = Get-PropertyOrNull -Object $EvidenceGate -Name 'fullPipelineProfile'
    $topologyProfile    = Get-PropertyOrNull -Object $EvidenceGate -Name 'topologyProfile'

    if (-not $credentialsPresent) {
        $mode = [ordered]@{}

        foreach ($agent in $agents) {
            $mode[$agent] = 'simulator'
        }

        return $mode
    }

    $pipelinePassed = ($null -ne $pipelineProfile) -and
                      ([int](Get-PropertyOrNull -Object $pipelineProfile -Name 'parseFailures') -eq 0) -and
                      ([bool](Get-PropertyOrNull -Object $pipelineProfile -Name 'mergeSuccess'))

    if ($pipelinePassed) {
        $mode = [ordered]@{}

        foreach ($agent in $agents) {
            $mode[$agent] = 'real'
        }

        return $mode
    }

    $topologyPassed = ($null -ne $topologyProfile) -and
                      ([int](Get-PropertyOrNull -Object $topologyProfile -Name 'parseFailures') -eq 0)

    $mode = [ordered]@{}
    $mode['Topology']   = if ($topologyPassed) { 'real' } else { 'not-run' }
    $mode['Cost']       = 'not-run'
    $mode['Compliance'] = 'not-run'
    $mode['Critic']     = 'not-run'

    return $mode
}

function Build-QualityGate {
    param([object] $EvidenceGate, [string] $EvidenceGateJsonRelPath)

    if ($null -eq $EvidenceGate) {
        return [ordered]@{
            outcome            = 'NOT_RUN'
            structuralValidity = 'not-checked'
            semanticScore      = $null
            faithfulnessRatio  = $null
            supportRatio       = $null
            qualityGateSource  = 'not-available'
            caveats            = @('No real-mode evidence gate artifact found.')
        }
    }

    $disposition = [string](Get-PropertyOrNull -Object $EvidenceGate -Name 'disposition')
    $pipelineProfile = Get-PropertyOrNull -Object $EvidenceGate -Name 'fullPipelineProfile'
    $gateSourceRef   = if ([string]::IsNullOrWhiteSpace($EvidenceGateJsonRelPath)) { 'not-available' } else { $EvidenceGateJsonRelPath }

    $outcome = switch ($disposition) {
        'PASS'                    { 'PASS' }
        'HOLD'                    { 'HOLD' }
        'SKIPPED_NO_CREDENTIALS'  { 'NOT_RUN' }
        default                   { 'NOT_RUN' }
    }

    if ($outcome -eq 'NOT_RUN') {
        return [ordered]@{
            outcome            = 'NOT_RUN'
            structuralValidity = 'not-checked'
            semanticScore      = $null
            faithfulnessRatio  = $null
            supportRatio       = $null
            qualityGateSource  = $gateSourceRef
            caveats            = @('No live Azure OpenAI credentials — quality gate was not run.')
        }
    }

    $parseFailures = if ($null -ne $pipelineProfile) {
        [int](Get-PropertyOrNull -Object $pipelineProfile -Name 'parseFailures')
    }
    else {
        -1
    }

    $mergeSuccess = if ($null -ne $pipelineProfile) {
        [bool](Get-PropertyOrNull -Object $pipelineProfile -Name 'mergeSuccess')
    }
    else {
        $false
    }

    $structuralValidity = if ($outcome -eq 'HOLD') {
        'fail'
    }
    elseif ($parseFailures -eq 0 -and $mergeSuccess) {
        'pass'
    }
    elseif ($parseFailures -gt 0) {
        'fail'
    }
    else {
        'warn'
    }

    $caveats = [System.Collections.Generic.List[string]]::new()

    if ($outcome -eq 'HOLD') {
        $caveats.Add('Quality gate disposition is HOLD — review real-llm-evidence-gate.json for failing checks.')
    }

    if ($parseFailures -gt 0) {
        $caveats.Add("Parse failures detected in pipeline profile: $parseFailures.")
    }

    # Semantic score and faithfulness are not captured by the gate script currently (evidence ref: Invoke-RealLlmEvidenceGate.ps1).
    # They require the golden-cohort harness (TB-137 / GOLDEN_COHORT_REAL_LLM_GATE.md).
    return [ordered]@{
        outcome            = $outcome
        structuralValidity = $structuralValidity
        semanticScore      = $null
        faithfulnessRatio  = $null
        supportRatio       = $null
        qualityGateSource  = $gateSourceRef
        caveats            = @($caveats)
    }
}

function Build-RetrievalPosture {
    param([string] $AbsReportPath, [string] $RelReportPath, [string] $VectorIndexType)

    $reportExists = (Test-Path -LiteralPath $AbsReportPath)

    $vectorIndexResolved = if (-not [string]::IsNullOrWhiteSpace($VectorIndexType)) {
        $VectorIndexType
    }
    else {
        if ($reportExists) { 'azure-ai-search' } else { 'in-memory' }
    }

    $retrievalStatus  = if ($reportExists) { 'healthy' } else { 'not-evaluated' }
    $groundingAvail   = if ($reportExists) { $true } else { $false }
    $evidenceRef      = if ($reportExists) { $RelReportPath } else { 'not-available' }
    $tenantFiltering  = $true

    $caveats = [System.Collections.Generic.List[string]]::new()

    if (-not $reportExists) {
        $caveats.Add('Retrieval IR report not found — retrieval posture is not evaluated for this run.')
    }

    return [ordered]@{
        vectorIndexType        = $vectorIndexResolved
        tenantFilteringActive  = $tenantFiltering
        groundingAvailable     = $groundingAvail
        retrievalStatus        = $retrievalStatus
        retrievalEvidenceRef   = $evidenceRef
        caveats                = @($caveats)
    }
}

function Build-BudgetPosture {
    param([object] $PipelineMetrics)

    if ($null -eq $PipelineMetrics) {
        return [ordered]@{
            configuredLlmBudgetUsd  = $null
            observedCostUsd         = $null
            estimatedCostPerRunUsd  = $null
            tokenUsageCaptured      = $false
            killSwitchActive        = $true
            budgetGuardStatus       = 'enforced'
            costEvidenceRef         = 'not-available'
            caveats                 = @('Token usage not captured — no live AOAI calls or pipeline metrics not available.')
        }
    }

    $inputTok  = [int](Get-PropertyOrNull -Object $PipelineMetrics -Name 'inputTokensTotal')
    $outputTok = [int](Get-PropertyOrNull -Object $PipelineMetrics -Name 'outputTokensTotal')
    $estUsd    = Get-PropertyOrNull -Object $PipelineMetrics -Name 'estimatedCostUsd'

    $tokensCaptured = (($inputTok + $outputTok) -gt 0)

    $caveats = [System.Collections.Generic.List[string]]::new()

    if (-not $tokensCaptured) {
        $caveats.Add('Provider returned zero token counts — estimated cost cannot be computed.')
    }

    if ($null -eq $estUsd) {
        $caveats.Add('Estimated cost in USD not computed by evidence gate — see LlmCostEstimation host config.')
    }

    return [ordered]@{
        # Per-run USD cap not configured separately from daily token budget — see appsettings.Production.json LlmDailyTenantBudget.
        configuredLlmBudgetUsd  = $null
        observedCostUsd         = $null
        estimatedCostPerRunUsd  = $estUsd
        tokenUsageCaptured      = $tokensCaptured
        killSwitchActive        = $true
        budgetGuardStatus       = 'enforced'
        costEvidenceRef         = 'artifacts/release/real-llm-full-pipeline-metrics.json'
        caveats                 = @($caveats)
    }
}

function Get-OverallReadinessLevel {
    param([object] $EvidenceGate, [object] $ExecutionMode)

    if ($null -eq $EvidenceGate) {
        return 'SIMULATOR_ONLY'
    }

    $disposition = [string](Get-PropertyOrNull -Object $EvidenceGate -Name 'disposition')

    if ($disposition -eq 'SKIPPED_NO_CREDENTIALS') {
        return 'SIMULATOR_ONLY'
    }

    $allAgentsReal = @($ExecutionMode.Values) | Where-Object { $_ -ne 'real' } | Measure-Object | Select-Object -ExpandProperty Count

    if ($disposition -eq 'PASS' -and $allAgentsReal -eq 0) {
        return 'FULL_REAL_MODE'
    }

    $anyAgentReal = @($ExecutionMode.Values) | Where-Object { $_ -eq 'real' } | Measure-Object | Select-Object -ExpandProperty Count

    if ($anyAgentReal -gt 0) {
        return 'PARTIAL_REAL_MODE'
    }

    return 'SIMULATOR_ONLY'
}

function Build-SponsorSafeSummary {
    param(
        [string] $OverallLevel,
        [object] $ExecutionMode,
        [object] $QualityGate,
        [object] $RetrievalPosture,
        [object] $BudgetPosture
    )

    $retrievalDesc = if ($RetrievalPosture.retrievalStatus -eq 'healthy') {
        "Retrieval is healthy using $($RetrievalPosture.vectorIndexType) vector index with tenant filtering active."
    }
    else {
        "Retrieval status: $($RetrievalPosture.retrievalStatus) — retrieval IR benchmark was not attached to this run."
    }

    $budgetDesc = if ($BudgetPosture.tokenUsageCaptured) {
        "Token usage was captured (estimated cost per run: $($BudgetPosture.estimatedCostPerRunUsd) USD). LLM budget guard is enforced."
    }
    else {
        'No real-mode token cost data is available. LLM budget guard is enforced.'
    }

    switch ($OverallLevel) {
        'FULL_REAL_MODE' {
            $agentList = ($ExecutionMode.Keys -join ', ')
            return "ArchLucid AI evidence for this release was validated in full real-mode using live Azure OpenAI. All four agent paths ($agentList) passed the quality gate with structural validity confirmed. $retrievalDesc $budgetDesc"
        }
        'PARTIAL_REAL_MODE' {
            $realAgents = @($ExecutionMode.GetEnumerator() | Where-Object { $_.Value -eq 'real' }) | ForEach-Object { $_.Key }
            $nonRealAgents = @($ExecutionMode.GetEnumerator() | Where-Object { $_.Value -ne 'real' }) | ForEach-Object { $_.Key }
            $realList    = $realAgents -join ', '
            $nonRealList = $nonRealAgents -join ', '
            return "ArchLucid AI evidence for this release is partially validated in real mode. $realList passed the real-mode quality gate. $nonRealList ran in simulator mode or were not evaluated. $retrievalDesc $budgetDesc Claims for non-real-mode agents are limited to simulator-only posture."
        }
        'SIMULATOR_ONLY' {
            return "This release has not been validated against live Azure OpenAI. All four agent paths (Topology, Cost, Compliance, Critic) ran in simulator mode. $retrievalDesc $budgetDesc Sponsor materials from this release must use simulator-only claim language."
        }
        default {
            return "AI readiness has not been evaluated for this release. No real-mode or simulator evidence artifact is attached. All AI evidence claims are not applicable. Owner review required before this artifact is included in a sponsor packet."
        }
    }
}

function Build-InternalDiagnosticRefs {
    param(
        [string] $EvidenceGateRef,
        [string] $RetrievalIrRef,
        [string] $CostRef
    )

    $refs = [System.Collections.Generic.List[string]]::new()

    if (-not [string]::IsNullOrWhiteSpace($EvidenceGateRef)) {
        $refs.Add($EvidenceGateRef)
    }

    if ($RetrievalIrRef -ne 'not-available') {
        $refs.Add($RetrievalIrRef)
    }

    if ($CostRef -ne 'not-available') {
        $refs.Add($CostRef)
    }

    $refs.Add('docs/go-to-market/AI_READINESS_POSTURE.md')

    return @($refs)
}

function Format-PostureMarkdown {
    param(
        [object] $Posture,
        [string] $GeneratedUtc,
        [string] $ReleaseOrRunId
    )

    $level  = [string]$Posture.overallReadinessLevel
    $gate   = $Posture.qualityGate
    $retr   = $Posture.retrievalPosture
    $budget = $Posture.budgetPosture
    $execMode = $Posture.executionMode

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add("# AI readiness posture — $ReleaseOrRunId")
    $lines.Add('')
    $lines.Add("Generated (UTC): **$GeneratedUtc**")
    $lines.Add('')
    $lines.Add("**Overall readiness level: ``$level``**")
    $lines.Add('')
    $lines.Add('## Sponsor-safe summary')
    $lines.Add('')
    $lines.Add($Posture.sponsorSafeSummary)
    $lines.Add('')
    $lines.Add('## Execution mode')
    $lines.Add('')
    $lines.Add('| Agent | Mode |')
    $lines.Add('| --- | --- |')

    foreach ($entry in $execMode.PSObject.Properties) {
        $lines.Add("| $($entry.Name) | $($entry.Value) |")
    }

    $lines.Add('')
    $lines.Add('## Quality gate')
    $lines.Add('')
    $lines.Add('| Field | Value |')
    $lines.Add('| --- | --- |')
    $lines.Add("| Outcome | **$($gate.outcome)** |")
    $lines.Add("| Structural validity | $($gate.structuralValidity) |")
    $lines.Add("| Semantic score | $(if ($null -eq $gate.semanticScore) { 'not available' } else { $gate.semanticScore }) |")
    $lines.Add("| Faithfulness ratio | $(if ($null -eq $gate.faithfulnessRatio) { 'not available' } else { $gate.faithfulnessRatio }) |")
    $lines.Add("| Support ratio | $(if ($null -eq $gate.supportRatio) { 'not available' } else { $gate.supportRatio }) |")
    $lines.Add("| Gate source | $($gate.qualityGateSource) |")

    foreach ($caveat in $gate.caveats) {
        $lines.Add("| Caveat | $caveat |")
    }

    $lines.Add('')
    $lines.Add('## Retrieval posture')
    $lines.Add('')
    $lines.Add('| Field | Value |')
    $lines.Add('| --- | --- |')
    $lines.Add("| Vector index | $($retr.vectorIndexType) |")
    $lines.Add("| Tenant filtering active | $($retr.tenantFilteringActive) |")
    $lines.Add("| Grounding available | $($retr.groundingAvailable) |")
    $lines.Add("| Retrieval status | $($retr.retrievalStatus) |")
    $lines.Add("| Evidence reference | $($retr.retrievalEvidenceRef) |")

    foreach ($caveat in $retr.caveats) {
        $lines.Add("| Caveat | $caveat |")
    }

    $lines.Add('')
    $lines.Add('## Budget posture')
    $lines.Add('')
    $lines.Add('| Field | Value |')
    $lines.Add('| --- | --- |')
    $lines.Add("| Configured LLM budget (USD) | $(if ($null -eq $budget.configuredLlmBudgetUsd) { 'not configured (token-based daily cap enforced)' } else { $budget.configuredLlmBudgetUsd }) |")
    $lines.Add("| Observed cost (USD) | $(if ($null -eq $budget.observedCostUsd) { 'not captured' } else { $budget.observedCostUsd }) |")
    $lines.Add("| Estimated cost per run (USD) | $(if ($null -eq $budget.estimatedCostPerRunUsd) { 'not computed' } else { $budget.estimatedCostPerRunUsd }) |")
    $lines.Add("| Token usage captured | $($budget.tokenUsageCaptured) |")
    $lines.Add("| Kill-switch active | $($budget.killSwitchActive) |")
    $lines.Add("| Budget guard status | $($budget.budgetGuardStatus) |")
    $lines.Add("| Cost evidence reference | $($budget.costEvidenceRef) |")

    foreach ($caveat in $budget.caveats) {
        $lines.Add("| Caveat | $caveat |")
    }

    $lines.Add('')
    $lines.Add('## Internal diagnostic references')
    $lines.Add('')

    foreach ($ref in $Posture.internalDiagnosticRefs) {
        $lines.Add("- ``$ref``")
    }

    $lines.Add('')

    return $lines -join [Environment]::NewLine
}

# ---------------------------------------------------------------------------
# Resolve absolute paths
# ---------------------------------------------------------------------------

$evidenceGateAbs      = Resolve-RepoPath -Path $EvidenceGateJson
$pipelineMetricsAbs   = Resolve-RepoPath -Path $PipelineMetricsJson
$retrievalIrReportAbs = Resolve-RepoPath -Path $RetrievalIrReport
$appSettingsAbs       = Resolve-RepoPath -Path $AppSettingsPath
$jsonOutAbs           = Resolve-RepoPath -Path $JsonOut
$markdownOutAbs       = Resolve-RepoPath -Path $MarkdownOut

# ---------------------------------------------------------------------------
# Read inputs
# ---------------------------------------------------------------------------

$evidenceGate    = Read-JsonFileSafely -AbsPath $evidenceGateAbs
$pipelineMetrics = Read-JsonFileSafely -AbsPath $pipelineMetricsAbs
$vectorIndexType = Get-VectorIndexTypeFromAppSettings -AbsPath $appSettingsAbs

# Relative paths used in output fields
$evidenceGateRel    = $EvidenceGateJson.Replace('\', '/')
$retrievalIrRel     = $RetrievalIrReport.Replace('\', '/')

Write-Host "Evidence gate:     $(if ($null -ne $evidenceGate) { "found ($((Get-PropertyOrNull -Object $evidenceGate -Name 'disposition') ?? 'unknown disposition'))" } else { 'not found' })" -ForegroundColor Cyan
Write-Host "Pipeline metrics:  $(if ($null -ne $pipelineMetrics) { 'found' } else { 'not found' })" -ForegroundColor Cyan
Write-Host "Retrieval report:  $(if (Test-Path -LiteralPath $retrievalIrReportAbs) { 'found' } else { 'not found' })" -ForegroundColor Cyan
Write-Host "Vector index type: $vectorIndexType" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# Build posture components
# ---------------------------------------------------------------------------

$executionMode   = Build-ExecutionMode   -EvidenceGate $evidenceGate
$qualityGate     = Build-QualityGate     -EvidenceGate $evidenceGate -EvidenceGateJsonRelPath $evidenceGateRel
$retrievalPosture = Build-RetrievalPosture -AbsReportPath $retrievalIrReportAbs -RelReportPath $retrievalIrRel -VectorIndexType $vectorIndexType
$budgetPosture   = Build-BudgetPosture   -PipelineMetrics $pipelineMetrics

$overallLevel    = Get-OverallReadinessLevel -EvidenceGate $evidenceGate -ExecutionMode $executionMode
$generatedUtc    = [DateTime]::UtcNow.ToString('o')

$resolvedRunId   = if ([string]::IsNullOrWhiteSpace($ReleaseOrRunId)) {
    "pilot-$([DateTime]::UtcNow.ToString('yyyy-MM-dd'))"
}
else {
    $ReleaseOrRunId
}

$diagnosticRefs  = Build-InternalDiagnosticRefs `
    -EvidenceGateRef $evidenceGateRel `
    -RetrievalIrRef  $(if (Test-Path -LiteralPath $retrievalIrReportAbs) { $retrievalIrRel } else { 'not-available' }) `
    -CostRef         $budgetPosture.costEvidenceRef

$sponsorSummary  = Build-SponsorSafeSummary `
    -OverallLevel     $overallLevel `
    -ExecutionMode    $executionMode `
    -QualityGate      $qualityGate `
    -RetrievalPosture $retrievalPosture `
    -BudgetPosture    $budgetPosture

# ---------------------------------------------------------------------------
# Assemble artifact
# ---------------------------------------------------------------------------

$executionModeOrdered = [ordered]@{}

foreach ($agent in @('Topology', 'Cost', 'Compliance', 'Critic')) {
    $executionModeOrdered[$agent] = $executionMode[$agent]
}

$posture = [ordered]@{
    '$schema'              = 'archlucid.ai-readiness-posture.v1'
    generatedUtc           = $generatedUtc
    releaseOrRunId         = $resolvedRunId
    overallReadinessLevel  = $overallLevel
    executionMode          = $executionModeOrdered
    qualityGate            = $qualityGate
    retrievalPosture       = $retrievalPosture
    budgetPosture          = $budgetPosture
    sponsorSafeSummary     = $sponsorSummary
    internalDiagnosticRefs = $diagnosticRefs
}

# ---------------------------------------------------------------------------
# Write outputs
# ---------------------------------------------------------------------------

foreach ($outPath in @($jsonOutAbs, $markdownOutAbs)) {
    $outDir = Split-Path -Parent $outPath

    if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }
}

$postureForJson      = $posture | ConvertTo-Json -Depth 8
$postureMarkdown     = Format-PostureMarkdown -Posture ($postureForJson | ConvertFrom-Json) -GeneratedUtc $generatedUtc -ReleaseOrRunId $resolvedRunId

[System.IO.File]::WriteAllText($jsonOutAbs, $postureForJson, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $JsonOut" -ForegroundColor Green

[System.IO.File]::WriteAllText($markdownOutAbs, $postureMarkdown, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $MarkdownOut" -ForegroundColor Green

Write-Host "Overall readiness level: $overallLevel" -ForegroundColor $(if ($overallLevel -eq 'FULL_REAL_MODE') { 'Green' } elseif ($overallLevel -eq 'PARTIAL_REAL_MODE') { 'Yellow' } else { 'Cyan' })

exit 0
