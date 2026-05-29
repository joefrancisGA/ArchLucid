#requires -Version 5.1
Set-StrictMode -Version Latest

. (Join-Path $PSScriptRoot 'FirstPilotSupportNextStep.ps1')

function Get-FirstPilotCommandCenterPhaseCatalog {
    return @(
        [ordered]@{ id = 'platform-ready'; title = 'Platform ready'; operatorPathPhase = 'Phase A - Platform ready' }
        [ordered]@{ id = 'evidence-ingest'; title = 'Evidence ingest'; operatorPathPhase = 'Phase B - Evidence ingest' }
        [ordered]@{ id = 'review-lifecycle'; title = 'Review lifecycle'; operatorPathPhase = 'Phase C - Review lifecycle' }
        [ordered]@{ id = 'sponsor-package'; title = 'Sponsor package'; operatorPathPhase = 'Phase D - Review package and sponsor export' }
        [ordered]@{ id = 'procurement-posture'; title = 'Procurement posture'; operatorPathPhase = 'Phase D - Review package and sponsor export (procurement/commercial)' }
    )
}

function Get-FirstPilotFindingPhaseMap {
    $map = @{}

    foreach ($name in @(
        'pilot-preflight',
        'pilot-preflight-exit',
        'pilot-preflight-json',
        'data-consistency-readiness',
        'identity-preflight-scenarios',
        'mutating-route-audit-matrix',
        'telemetry-export-readiness',
        'production-like-config-lint',
        'api-hot-path-performance',
        'first-pilot-performance-baseline',
        'first-pilot-timing-budget',
        'scale-envelope-evidence',
        'admin-operational-posture',
        'environment-reliability-rollup',
        'v1-integration-correctness-drill',
        'committed-review-trace-chain-summary',
        'production-like-azure-pilot-proof',
        'quality-gate-promotion-status',
        'hosted-availability-rollup',
        'pilot-llm-budget-status'
    )) {
        $map[$name] = 'platform-ready'
    }

    $map['azure-extractor-upload-failure-ux'] = 'evidence-ingest'

    $map['committed-run-evidence'] = 'review-lifecycle'
    $map['committed-review-trace-chain-summary'] = 'sponsor-package'
    $map['governance-policy-pack-dry-run-proof'] = 'review-lifecycle'

    foreach ($name in @(
        'real-llm-sponsor-evidence',
        'ai-quality-proof',
        'ai-readiness-gate',
        'roi-basis-labels',
        'pilot-llm-cost-summary',
        'demo-derived-roi-validation',
        'retrieval-ir-evidence'
    )) {
        $map[$name] = 'sponsor-package'
    }

    foreach ($name in @(
        'procurement-deal-ready',
        'route-tier-policy-nav-parity',
        'trial-to-paid-test-mode-evidence',
        'accelerator-handoff-acceptance',
        'pricing-quote-aging',
        'demo-workspace-validation',
        'live-ui-sql-parity',
        'security-reviewer-one-pager',
        'compliance-posture-clarity'
    )) {
        $map[$name] = 'procurement-posture'
    }

    return $map
}

function Convert-ProofDispositionToOperatorLabel {
    param([Parameter(Mandatory = $true)][string] $Disposition)

    switch ($Disposition) {
        'PASS' { return 'READY' }
        'WARN' { return 'WARN' }
        'BLOCK' { return 'HOLD' }
        default { return 'WARN' }
    }
}

function Compare-OperatorLabelSeverity {
    param(
        [Parameter(Mandatory = $true)][string] $Current,
        [Parameter(Mandatory = $true)][string] $Candidate
    )

    $rank = @{ 'READY' = 0; 'WARN' = 1; 'DEFERRED' = 2; 'HOLD' = 3 }

    if ($rank[$Candidate] -gt $rank[$Current]) {
        return $Candidate
    }

    return $Current
}

function Build-FirstPilotCommandCenter {
    param(
        [object[]] $Findings = @(),
        [string] $RunId = '',
        [Parameter(Mandatory = $true)][string] $SponsorPacketDisposition,
        [Parameter(Mandatory = $true)][int] $BlockCount,
        [string[]] $DeferredScopeReasons = @(),
        [string] $DataConsistencyStatus = 'NOT_RUN',
        [object] $AiReadinessGate = $null
    )

    $phaseMap = Get-FirstPilotFindingPhaseMap
    $phaseState = @{}

    foreach ($phase in Get-FirstPilotCommandCenterPhaseCatalog) {
        $phaseState[[string]$phase.id] = [ordered]@{
            id                 = [string]$phase.id
            title              = [string]$phase.title
            operatorPathPhase    = [string]$phase.operatorPathPhase
            status             = 'READY'
            summary            = 'No blocking proof rows for this phase.'
            holdFindingName    = $null
            remediationDocLink = $null
            findingNames       = [System.Collections.Generic.List[string]]::new()
        }
    }

    foreach ($finding in @($Findings)) {
        $name = [string]$finding.name

        if (-not $phaseMap.ContainsKey($name)) {
            if ($name -like 'pilot-preflight*') {
                $phaseId = 'platform-ready'
            }
            elseif ($name -like 'data-consistency*') {
                $phaseId = 'platform-ready'
            }
            else {
                continue
            }
        }
        else {
            $phaseId = [string]$phaseMap[$name]
        }

        $label = Convert-ProofDispositionToOperatorLabel -Disposition ([string]$finding.disposition)
        $state = $phaseState[$phaseId]
        $state.status = Compare-OperatorLabelSeverity -Current $state.status -Candidate $label
        [void]$state.findingNames.Add($name)

        if ($label -eq 'HOLD' -and $null -eq $state.holdFindingName) {
            $state.holdFindingName = $name
            $state.remediationDocLink = Get-FirstPilotRemediationDocLink -FindingName $name
            $state.summary = [string]$finding.detail
        }
        elseif ($label -eq 'WARN' -and $state.status -ne 'HOLD' -and $null -eq $state.holdFindingName) {
            $state.holdFindingName = $name
            $state.remediationDocLink = Get-FirstPilotRemediationDocLink -FindingName $name
            $state.summary = [string]$finding.detail
        }
    }

    $hasRunId = -not [string]::IsNullOrWhiteSpace($RunId)

    if (-not $hasRunId) {
        $review = $phaseState['review-lifecycle']
        $review.status = Compare-OperatorLabelSeverity -Current $review.status -Candidate 'WARN'
        $review.summary = 'No committed review RunId was supplied - readiness-only pass; re-run with -RunId after the first golden manifest commit.'
        $review.holdFindingName = 'committed-run-evidence'
        $review.remediationDocLink = Get-FirstPilotRemediationDocLink -FindingName 'committed-run-evidence'
        [void]$review.findingNames.Add('committed-run-evidence-missing-runid')

        $sponsor = $phaseState['sponsor-package']
        $sponsor.status = Compare-OperatorLabelSeverity -Current $sponsor.status -Candidate 'WARN'
        if ($sponsor.status -ne 'HOLD') {
            $sponsor.summary = 'Sponsor package proof requires a committed review - collect evidence after finalize.'
            $sponsor.remediationDocLink = Get-FirstPilotRemediationDocLink -FindingName 'committed-run-evidence'
        }
    }

    if ($DataConsistencyStatus -eq 'HOLD' -or $DataConsistencyStatus -eq 'WARN') {
        $platform = $phaseState['platform-ready']
        $candidate = if ($DataConsistencyStatus -eq 'HOLD') { 'HOLD' } else { 'WARN' }
        $platform.status = Compare-OperatorLabelSeverity -Current $platform.status -Candidate $candidate
        $platform.summary = "Data consistency readiness is $DataConsistencyStatus."
        $platform.remediationDocLink = Get-FirstPilotRemediationDocLink -FindingName 'data-consistency-readiness'
    }

    if ($null -ne $AiReadinessGate -and [string]$AiReadinessGate.disposition -eq 'HOLD') {
        $sponsor = $phaseState['sponsor-package']
        $sponsor.status = 'HOLD'
        $sponsor.summary = [string]$AiReadinessGate.summary
        $sponsor.remediationDocLink = Get-FirstPilotRemediationDocLink -FindingName 'ai-readiness-gate'
    }

    $deferredRows = @()

    foreach ($reason in @($DeferredScopeReasons)) {
        if ([string]::IsNullOrWhiteSpace([string]$reason)) {
            continue
        }

        $deferredRows += [ordered]@{
            status             = 'DEFERRED'
            summary            = [string]$reason
            remediationDocLink = 'docs/library/V1_DEFERRED.md'
        }
    }

    $nextAction = Resolve-FirstPilotCommandCenterNextAction `
        -PhaseState $phaseState `
        -HasRunId $hasRunId `
        -SponsorPacketDisposition $SponsorPacketDisposition `
        -BlockCount $BlockCount `
        -DeferredScopeReasons @($DeferredScopeReasons)

    return [ordered]@{
        formatVersion          = '1.0'
        sponsorPacketDisposition = $SponsorPacketDisposition
        runId                  = if ($hasRunId) { $RunId.Trim() } else { $null }
        readinessOnly          = -not $hasRunId
        phases                 = @($phaseState.Values)
        deferredBuyerRequirements = $deferredRows
        nextAction             = $nextAction
    }
}

function Resolve-FirstPilotCommandCenterNextAction {
    param(
        [Parameter(Mandatory = $true)][hashtable] $PhaseState,
        [Parameter(Mandatory = $true)][bool] $HasRunId,
        [Parameter(Mandatory = $true)][string] $SponsorPacketDisposition,
        [Parameter(Mandatory = $true)][int] $BlockCount,
        [string[]] $DeferredScopeReasons = @()
    )

    foreach ($phaseId in @('platform-ready', 'review-lifecycle', 'sponsor-package', 'procurement-posture', 'evidence-ingest')) {
        $state = $PhaseState[$phaseId]

        if ($state.status -eq 'HOLD' -and $null -ne $state.remediationDocLink) {
            return [ordered]@{
                label              = 'NEXT ACTION'
                summary            = "Resolve $($state.title) blocker: $($state.summary)"
                remediationDocLink = [string]$state.remediationDocLink
                operatorPathPhase  = [string]$state.operatorPathPhase
            }
        }
    }

    if (-not $HasRunId) {
        return [ordered]@{
            label              = 'NEXT ACTION'
            summary            = 'Commit the first architecture review, then re-run ./scripts/collect-first-pilot-proof.ps1 -RunId <committed-run-id>.'
            remediationDocLink = Get-FirstPilotRemediationDocLink -FindingName 'committed-run-evidence'
            operatorPathPhase  = 'Phase C - Review lifecycle'
        }
    }

    if ($BlockCount -gt 0) {
        return [ordered]@{
            label              = 'NEXT ACTION'
            summary            = 'Resolve HOLD rows in this command center and go-no-go-summary.md before sponsor handoff.'
            remediationDocLink = 'docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md'
            operatorPathPhase  = 'Phase D - Review package and sponsor export'
        }
    }

    if ($SponsorPacketDisposition -eq 'DEFERRED_SCOPE' -and $DeferredScopeReasons.Count -gt 0) {
        return [ordered]@{
            label              = 'NEXT ACTION'
            summary            = 'V1 proof passed with deferred buyer requirements - document DEFERRED_SCOPE items separately; do not treat them as V1 blockers.'
            remediationDocLink = 'docs/library/V1_DEFERRED.md'
            operatorPathPhase  = 'Phase D - Review package and sponsor export'
        }
    }

    if ($SponsorPacketDisposition -eq 'SEND') {
        return [ordered]@{
            label              = 'NEXT ACTION'
            summary            = 'Collect proof with -SponsorHandoff and follow the sponsor handoff runbook before external circulation.'
            remediationDocLink = 'docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md'
            operatorPathPhase  = 'Phase D - Review package and sponsor export'
        }
    }

    return [ordered]@{
        label              = 'NEXT ACTION'
        summary            = 'Review WARN rows, then rerun ./scripts/collect-first-pilot-proof.ps1 with -RunId and optional -SponsorHandoff.'
        remediationDocLink = 'docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md#phase-e--decide-next-action'
        operatorPathPhase  = 'Phase E - Decide next action'
    }
}

function Format-FirstPilotCommandCenterMarkdown {
    param([Parameter(Mandatory = $true)][object] $CommandCenter)

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add('# First-pilot command center')
    $lines.Add('')
    $lines.Add('Single status surface for the first-pilot operator path. Labels match [`FIRST_PILOT_OPERATOR_PATH.md`](../../docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md): **READY**, **WARN**, **HOLD**, **DEFERRED**, **NEXT ACTION**.')
    $lines.Add('')
    $lines.Add('| Field | Value |')
    $lines.Add('| --- | --- |')
    $lines.Add("| Sponsor packet disposition | **$($CommandCenter.sponsorPacketDisposition)** |")
    $runLabel = if ($null -eq $CommandCenter.runId) { 'Not supplied (readiness-only)' } else { $CommandCenter.runId }
    $lines.Add("| Run ID | $runLabel |")
    $lines.Add("| Readiness-only pass | **$($CommandCenter.readinessOnly)** |")
    $lines.Add('')
    $lines.Add('## Phases')
    $lines.Add('')
    $lines.Add('| Phase | Status | Summary | Remediation (one link) |')
    $lines.Add('| --- | --- | --- | --- |')

    foreach ($phase in @($CommandCenter.phases)) {
        $link = if ($null -ne $phase.remediationDocLink) {
            "[$($phase.remediationDocLink)](../../$($phase.remediationDocLink))"
        }
        else {
            '-'
        }

        $lines.Add("| $($phase.title) | **$($phase.status)** | $($phase.summary) | $link |")
    }

    if ($CommandCenter.deferredBuyerRequirements.Count -gt 0) {
        $lines.Add('')
        $lines.Add('## Deferred buyer requirements (V1.1 / V2 / (B))')
        $lines.Add('')

        foreach ($row in @($CommandCenter.deferredBuyerRequirements)) {
            $lines.Add("- **DEFERRED:** $($row.summary) - see [docs/library/V1_DEFERRED.md](../../docs/library/V1_DEFERRED.md)")
        }
    }

    $next = $CommandCenter.nextAction
    $lines.Add('')
    $lines.Add('## Next action')
    $lines.Add('')
    $lines.Add("| Label | **$($next.label)** |")
    $lines.Add("| Operator path | $($next.operatorPathPhase) |")
    $lines.Add("| Action | $($next.summary) |")
    $lines.Add("| Remediation | [$($next.remediationDocLink)](../../$($next.remediationDocLink)) |")
    $lines.Add('')
    return $lines
}

function Write-FirstPilotCommandCenterArtifacts {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [Parameter(Mandatory = $true)][object] $CommandCenter
    )

    $payload = [ordered]@{
        formatVersion            = '1.0'
        sponsorPacketDisposition = $CommandCenter.sponsorPacketDisposition
        runId                    = $CommandCenter.runId
        readinessOnly            = $CommandCenter.readinessOnly
        phases                   = $CommandCenter.phases
        deferredBuyerRequirements = $CommandCenter.deferredBuyerRequirements
        nextAction               = $CommandCenter.nextAction
    }

    $jsonPath = Join-Path $ProofDirectory 'first-pilot-command-center.json'
    $payload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

    $mdPath = Join-Path $ProofDirectory 'first-pilot-command-center.md'
    $mdLines = Format-FirstPilotCommandCenterMarkdown -CommandCenter $CommandCenter
    Set-Content -LiteralPath $mdPath -Value $mdLines -Encoding UTF8

    return [ordered]@{
        jsonPath = 'first-pilot-command-center.json'
        mdPath   = 'first-pilot-command-center.md'
    }
}
