#requires -Version 5.1
Set-StrictMode -Version Latest

function Get-OptionalPropertyValue {
    param(
        [object] $Object,
        [Parameter(Mandatory = $true)][string] $Name
    )

    if ($null -eq $Object) {
        return $null
    }

    $property = $Object.PSObject.Properties[$Name]

    if ($null -eq $property) {
        return $null
    }

    return $property.Value
}

function Get-RetrievalIrStatusFromProofDirectory {
    param([string] $ProofDirectory)

    if ([string]::IsNullOrWhiteSpace($ProofDirectory)) {
        return [ordered]@{
            status          = 'not-collected'
            meanRecallAt5   = $null
            meanMrr         = $null
            reportPath      = $null
        }
    }

    $reportPath = Join-Path $ProofDirectory 'retrieval-ir-report.md'

    if (-not (Test-Path -LiteralPath $reportPath)) {
        return [ordered]@{
            status          = 'not-collected'
            meanRecallAt5   = $null
            meanMrr         = $null
            reportPath      = $null
        }
    }

    $reportText = Get-Content -LiteralPath $reportPath -Raw
    $meanRecall = $null
    $meanMrr = $null

    if ($reportText -match 'Mean recall@5:\*\*\s+([0-9.]+)') {
        $meanRecall = [double]$Matches[1]
    }

    if ($reportText -match 'Mean MRR:\*\*\s+([0-9.]+)') {
        $meanMrr = [double]$Matches[1]
    }

    return [ordered]@{
        status          = 'present'
        meanRecallAt5   = $meanRecall
        meanMrr         = $meanMrr
        reportPath      = 'retrieval-ir-report.md'
    }
}

function Get-LlmBudgetPostureFromObservability {
    param([object] $Observability)

    if ($null -eq $Observability -or $Observability.llmBudgetStatusCollected -ne $true) {
        return [ordered]@{
            status              = 'not-collected'
            blocksExecution     = $null
            monitoringActive    = $null
        }
    }

    $budget = $Observability.llmBudgetStatus

    if ($null -eq $budget) {
        return [ordered]@{
            status              = 'not-collected'
            blocksExecution     = $null
            monitoringActive    = $null
        }
    }

    return [ordered]@{
        status              = 'collected'
        blocksExecution     = $budget.blocksAdditionalLlmExecution
        monitoringActive    = $budget.monthlyBudgetMonitoringActive
    }
}

function Build-ConsolidatedAiReadinessGate {
    param(
        [object] $Observability,
        [object] $RetrievalGroundingSummary,
        [object] $RetrievalIrStatus,
        [object] $AiQualityProof
    )

    $aiProof = Build-AiQualityProofSnapshot -Observability $Observability -RetrievalGroundingSummary $RetrievalGroundingSummary
    $collected = ($null -ne $Observability)

    $llmExecutionMode = if ($collected) { [string]$Observability.llmExecutionMode } else { 'unknown' }
    $qualityGateMode = if ($collected) { [string]$Observability.qualityGateMode } else { $null }
    $qualityGateDisposition = if ($collected) { [string]$Observability.qualityGateDisposition } else { 'not-collected' }

    $faithfulnessConfigured = if ($collected) {
        $Observability.pilotStrictMinAgentResultFaithfulnessSupportRatio
    }
    else {
        $null
    }

    $faithfulnessObserved = if ($null -ne $AiQualityProof -and $null -ne $AiQualityProof.citationCoverageMean) {
        $AiQualityProof.citationCoverageMean
    }
    elseif ($null -ne $aiProof.citationCoverageMean) {
        $aiProof.citationCoverageMean
    }
    else {
        $null
    }

    $llmBudget = Get-LlmBudgetPostureFromObservability -Observability $Observability
    $irStatus = if ($null -ne $RetrievalIrStatus) { [string]$RetrievalIrStatus.status } else { 'not-collected' }

    $realModeConfiguredOrDetected = ($qualityGateMode -eq 'PilotStrict') -or ($llmExecutionMode -eq 'real')
    $simulatorOnlyPosture = ($llmExecutionMode -eq 'simulator' -or $llmExecutionMode -eq 'unknown') -and ($qualityGateMode -ne 'PilotStrict')

    $reasons = [System.Collections.Generic.List[string]]::new()

    if (-not $collected) {
        $reasons.Add('Committed-run observability summary was not collected.')
    }

    if ($aiProof.rawPromptOrCompletionIncluded -eq $true) {
        $reasons.Add('Buyer-safe bundle must not include raw prompt or completion text.')
    }

    if ($aiProof.secretsIncluded -eq $true) {
        $reasons.Add('Buyer-safe bundle must not include secrets.')
    }

    if ($qualityGateDisposition -eq 'pilot-strict-violates-sponsor-evidence') {
        $reasons.Add('PilotStrict sponsor-evidence checks reported failures for this run.')
    }

    if ($qualityGateDisposition -eq 'pilot-strict-signals-unresolved') {
        $reasons.Add('PilotStrict quality signals are unresolved for this run.')
    }

    if ($Observability.unresolvedQualitySignalsPresent -eq $true) {
        $reasons.Add('Unresolved quality signals remain on the observability summary.')
    }

    if ($realModeConfiguredOrDetected -and $qualityGateDisposition -ne 'pilot-strict-sponsor-evidence-pass') {
        $reasons.Add('Real-mode or PilotStrict configuration requires passing sponsor-evidence disposition.')
    }

    if ($simulatorOnlyPosture) {
        $reasons.Add('Simulator-only posture does not attest real LLM quality — label explicitly before sponsor send.')
    }

    if ($irStatus -eq 'not-collected') {
        $reasons.Add('Offline retrieval IR benchmark was not attached to the proof folder.')
    }

    if ($llmBudget.status -eq 'not-collected') {
        $reasons.Add('LLM monthly budget status was not collected from the API.')
    }

    if ($aiProof.retrievalGroundingTracePresent -ne $true) {
        $reasons.Add('No retrieval grounding traces were attested for this committed run.')
    }

    return [ordered]@{
        formatVersion                         = '1.0'
        collected                             = $collected
        agentExecutionMode                    = $llmExecutionMode
        qualityGateMode                       = $qualityGateMode
        qualityGateDisposition                = $qualityGateDisposition
        faithfulnessSupportRatioConfigured    = $faithfulnessConfigured
        faithfulnessSupportRatioObserved      = $faithfulnessObserved
        faithfulnessSupportRatioObservedLabel = if ($null -eq $faithfulnessObserved) { 'not-collected' } else { 'citation-coverage-mean' }
        retrievalIrStatus                     = $irStatus
        retrievalIrMeanRecallAt5              = Get-OptionalPropertyValue -Object $RetrievalIrStatus -Name 'meanRecallAt5'
        retrievalIrMeanMrr                    = Get-OptionalPropertyValue -Object $RetrievalIrStatus -Name 'meanMrr'
        llmBudgetStatus                       = $llmBudget.status
        llmBudgetBlocksExecution              = $llmBudget.blocksExecution
        llmBudgetMonitoringActive             = $llmBudget.monitoringActive
        retrievalGroundingTracePresent        = $aiProof.retrievalGroundingTracePresent
        llmCallCountResolved                  = $aiProof.llmCallCountResolved
        realModeConfiguredOrDetected          = $realModeConfiguredOrDetected
        simulatorOnlyPosture                  = $simulatorOnlyPosture
        sponsorSafeAiQualityPosture           = ($aiProof.sponsorSafe -eq $true)
        reasons                               = @($reasons)
        aiQualityProof                        = $aiProof
    }
}

function Resolve-ConsolidatedAiReadinessDisposition {
    param(
        [object] $Gate,
        [switch] $SponsorHandoff
    )

    if ($null -eq $Gate -or $Gate.collected -ne $true) {
        if ($SponsorHandoff) {
            return [ordered]@{
                disposition = 'HOLD'
                summary     = 'AI readiness gate could not evaluate committed-run observability — withhold sponsor handoff.'
            }
        }

        return [ordered]@{
            disposition = 'WARN'
            summary     = 'AI readiness gate is readiness-only (no committed-run observability).'
        }
    }

    $holdReasons = [System.Collections.Generic.List[string]]::new()

    if ($Gate.aiQualityProof.rawPromptOrCompletionIncluded -eq $true -or $Gate.aiQualityProof.secretsIncluded -eq $true) {
        $holdReasons.Add('Buyer-safe redaction posture failed.')
    }

    if ($Gate.qualityGateDisposition -eq 'pilot-strict-violates-sponsor-evidence') {
        $holdReasons.Add("Quality gate disposition is $($Gate.qualityGateDisposition).")
    }

    if ($Gate.qualityGateDisposition -eq 'pilot-strict-signals-unresolved' -and $SponsorHandoff) {
        $holdReasons.Add("Quality gate disposition is $($Gate.qualityGateDisposition).")
    }

    if ($Gate.aiQualityProof.unresolvedQualitySignalsPresent -eq $true -and $SponsorHandoff) {
        $holdReasons.Add('Unresolved quality signals are present.')
    }

    if ($SponsorHandoff -and $Gate.realModeConfiguredOrDetected -eq $true -and $Gate.sponsorSafeAiQualityPosture -ne $true) {
        $holdReasons.Add('Real-mode or PilotStrict host requires passing AI quality evidence before sponsor send.')
    }

    if ($holdReasons.Count -gt 0) {
        return [ordered]@{
            disposition = 'HOLD'
            summary     = ($holdReasons -join ' ')
        }
    }

    if ($Gate.sponsorSafeAiQualityPosture -eq $true) {
        return [ordered]@{
            disposition = 'PASS'
            summary     = 'Consolidated AI readiness posture is sponsor-safe (PilotStrict pass, grounding attested, buyer-safe redaction).'
        }
    }

    if ($Gate.simulatorOnlyPosture -eq $true) {
        return [ordered]@{
            disposition = 'WARN'
            summary     = 'Simulator-only environment — do not present as proof of real LLM quality.'
        }
    }

    return [ordered]@{
        disposition = 'WARN'
        summary     = 'AI readiness signals are partial — review retrieval grounding and PilotStrict posture before sponsor send.'
    }
}

function Format-ConsolidatedAiReadinessGateMarkdown {
    param(
        [object] $Gate,
        [object] $DispositionResult
    )

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add('## Consolidated AI readiness gate')
    $lines.Add('')
    $lines.Add('Single PASS/WARN/HOLD rollup for agent execution mode, quality-gate posture, faithfulness/citation signals, offline retrieval IR, and LLM budget status.')
    $lines.Add('')
    $lines.Add('| Field | Value |')
    $lines.Add('| --- | --- |')

    if ($null -eq $Gate) {
        $lines.Add('| Disposition | **HOLD** |')
        $lines.Add('| Summary | Gate inputs missing |')
        $lines.Add('')
        return $lines
    }

    $disp = if ($null -ne $DispositionResult) { [string]$DispositionResult.disposition } else { 'WARN' }
    $summary = if ($null -ne $DispositionResult) { [string]$DispositionResult.summary } else { 'Disposition not evaluated.' }

    $lines.Add("| **Disposition** | **$disp** |")
    $lines.Add("| Summary | $summary |")
    $lines.Add("| Agent execution mode | $($Gate.agentExecutionMode) |")
    $lines.Add("| Quality gate mode | $($Gate.qualityGateMode) |")
    $lines.Add("| Quality gate disposition | $($Gate.qualityGateDisposition) |")
    $lines.Add("| Faithfulness floor (configured) | $($Gate.faithfulnessSupportRatioConfigured) |")
    $faithObserved = if ($null -eq $Gate.faithfulnessSupportRatioObserved) { 'not-collected' } else { $Gate.faithfulnessSupportRatioObserved }
    $lines.Add("| Faithfulness/citation observed ($($Gate.faithfulnessSupportRatioObservedLabel)) | $faithObserved |")
    $lines.Add("| Retrieval IR status | $($Gate.retrievalIrStatus) |")
    $lines.Add("| Retrieval grounding trace present | $($Gate.retrievalGroundingTracePresent) |")
    $lines.Add("| LLM budget status | $($Gate.llmBudgetStatus) |")
    $lines.Add("| Real-mode configured or detected | $($Gate.realModeConfiguredOrDetected) |")
    $lines.Add("| Simulator-only posture | $($Gate.simulatorOnlyPosture) |")
    $lines.Add("| Sponsor-safe AI quality posture | $($Gate.sponsorSafeAiQualityPosture) |")
    $lines.Add('')

    if ($Gate.reasons.Count -gt 0) {
        $lines.Add('**Signals to review:**')
        $lines.Add('')

        foreach ($reason in $Gate.reasons) {
            $lines.Add("- $reason")
        }

        $lines.Add('')
    }

    if ($disp -eq 'HOLD') {
        $lines.Add('> **HOLD:** Do not treat this packet as production-like real-mode AI proof until disposition is PASS or explicitly labeled simulator/demo.')
    }
    elseif ($disp -eq 'WARN' -and $Gate.simulatorOnlyPosture -eq $true) {
        $lines.Add('> **WARN:** Simulator-only — cite qualitative architecture proof, not live-model attestation.')
    }

    $lines.Add('')
    return $lines
}

function Write-ConsolidatedAiReadinessGateArtifacts {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [Parameter(Mandatory = $true)][object] $Gate,
        [Parameter(Mandatory = $true)][object] $DispositionResult
    )

    $payload = [ordered]@{
        formatVersion = '1.0'
        disposition   = [string]$DispositionResult.disposition
        summary       = [string]$DispositionResult.summary
        gate          = $Gate
    }

    $jsonPath = Join-Path $ProofDirectory 'ai-readiness-gate.json'
    $payload | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

    $mdPath = Join-Path $ProofDirectory 'ai-readiness-gate.md'
    $mdLines = Format-ConsolidatedAiReadinessGateMarkdown -Gate $Gate -DispositionResult $DispositionResult
    Set-Content -LiteralPath $mdPath -Value $mdLines -Encoding UTF8

    return [ordered]@{
        jsonPath = 'ai-readiness-gate.json'
        mdPath   = 'ai-readiness-gate.md'
    }
}

function Map-ConsolidatedAiReadinessToProofFindingDisposition {
    param(
        [string] $GateDisposition,
        [switch] $SponsorHandoff
    )

    switch ($GateDisposition) {
        'PASS' { return 'PASS' }
        'WARN' { return 'WARN' }
        'HOLD' {
            if ($SponsorHandoff) { return 'BLOCK' }

            return 'WARN'
        }
        default { return 'WARN' }
    }
}
