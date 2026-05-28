#requires -Version 5.1
Set-StrictMode -Version Latest

function Get-RetrievalGroundingSummaryFromFile {
    param([string] $Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return [ordered]@{
            resolved                     = $false
            retrievalGroundingTracePresent = $false
            traceCount                   = 0
            meanCitationCoverage         = $null
            hasDegradedMetadata          = $null
        }
    }

    try {
        $grounding = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        return [ordered]@{
            resolved                     = $false
            retrievalGroundingTracePresent = $false
            traceCount                   = 0
            meanCitationCoverage         = $null
            hasDegradedMetadata          = $null
            parseError                   = $_.Exception.Message
        }
    }

    $traceCount = [int]$grounding.traceCount
    $rows = @($grounding.rows)
    $coverageValues = @(
        $rows |
            ForEach-Object { $_.citationCoverage } |
            Where-Object { $null -ne $_ }
    )

    $meanCoverage = $null

    if ($coverageValues.Count -gt 0) {
        $meanCoverage = ($coverageValues | Measure-Object -Average).Average
    }

    return [ordered]@{
        resolved                       = $true
        retrievalGroundingTracePresent = ($traceCount -gt 0)
        traceCount                     = $traceCount
        meanCitationCoverage           = $meanCoverage
        hasDegradedMetadata            = $grounding.hasDegradedMetadata
    }
}

function Build-AiQualityProofSnapshot {
    param(
        [object] $Observability,
        [object] $RetrievalGroundingSummary
    )

    if ($null -eq $Observability) {
        return [ordered]@{
            collected                      = $false
            pilotStrictDisposition         = 'not-collected'
            qualityGateMode                = $null
            llmCallCountResolved           = $false
            retrievalGroundingTracePresent = $false
            citationCoverageMean           = $null
            rawPromptOrCompletionIncluded  = $false
            secretsIncluded                = $false
            unresolvedQualitySignalsPresent = $true
            sponsorSafe                    = $false
        }
    }

    $grounding = if ($null -ne $RetrievalGroundingSummary) {
        $RetrievalGroundingSummary
    }
    else {
        [ordered]@{
            resolved                       = $false
            retrievalGroundingTracePresent = $false
            traceCount                     = 0
            meanCitationCoverage           = $null
        }
    }

    $disposition = [string]$Observability.qualityGateDisposition
    $unresolved = ($Observability.unresolvedQualitySignalsPresent -eq $true)
    $llmResolved = ($Observability.llmCallCountResolved -eq $true)
    $rawIncluded = ($Observability.rawPromptOrCompletionIncluded -eq $true)
    $secretsIncluded = ($Observability.secretsIncluded -eq $true)
    $tracePresent = ($grounding.retrievalGroundingTracePresent -eq $true)
    $sponsorSafe = ($disposition -eq 'pilot-strict-sponsor-evidence-pass') -and -not $unresolved -and -not $rawIncluded -and -not $secretsIncluded

    return [ordered]@{
        collected                      = $true
        pilotStrictDisposition         = if ([string]::IsNullOrWhiteSpace($disposition)) { 'not-collected' } else { $disposition }
        qualityGateMode                = [string]$Observability.qualityGateMode
        llmCallCountResolved           = $llmResolved
        retrievalGroundingTracePresent = $tracePresent
        retrievalGroundingTraceCount   = [int]$grounding.traceCount
        citationCoverageMean           = $grounding.meanCitationCoverage
        rawPromptOrCompletionIncluded  = $rawIncluded
        secretsIncluded                = $secretsIncluded
        unresolvedQualitySignalsPresent = $unresolved
        sponsorSafe                    = $sponsorSafe
    }
}

function Resolve-AiQualityProofFinding {
    param(
        [object] $AiQualityProof,
        [switch] $SponsorHandoff
    )

    if ($null -eq $AiQualityProof -or $AiQualityProof.collected -ne $true) {
        if ($SponsorHandoff) {
            return [ordered]@{
                disposition = 'BLOCK'
                detail      = 'AI quality proof signals were not collected (missing committed-run observability summary).'
            }
        }

        return [ordered]@{
            disposition = 'WARN'
            detail      = 'AI quality proof signals were not collected; readiness-only pass without RunId.'
        }
    }

    if ($AiQualityProof.rawPromptOrCompletionIncluded -eq $true -or $AiQualityProof.secretsIncluded -eq $true) {
        return [ordered]@{
            disposition = 'BLOCK'
            detail      = 'Buyer-safe bundle reported raw prompt/completion or secret inclusion — withhold sponsor send.'
        }
    }

    if ($AiQualityProof.pilotStrictDisposition -eq 'pilot-strict-violates-sponsor-evidence' -or
        $AiQualityProof.pilotStrictDisposition -eq 'pilot-strict-signals-unresolved' -or
        ($AiQualityProof.unresolvedQualitySignalsPresent -eq $true -and $SponsorHandoff)) {
        return [ordered]@{
            disposition = 'BLOCK'
            detail      = "PilotStrict AI quality posture is not sponsor-safe (disposition=$($AiQualityProof.pilotStrictDisposition))."
        }
    }

    if ($AiQualityProof.sponsorSafe -eq $true) {
        return [ordered]@{
            disposition = 'PASS'
            detail      = 'PilotStrict sponsor-evidence disposition passed with buyer-safe redaction posture.'
        }
    }

    if ($SponsorHandoff -and $AiQualityProof.llmCallCountResolved -eq $true -and $AiQualityProof.pilotStrictDisposition -ne 'pilot-strict-sponsor-evidence-pass') {
        return [ordered]@{
            disposition = 'BLOCK'
            detail      = "Real-mode LLM signals present but PilotStrict disposition is $($AiQualityProof.pilotStrictDisposition)."
        }
    }

    if ($AiQualityProof.retrievalGroundingTracePresent -ne $true) {
        return [ordered]@{
            disposition = if ($SponsorHandoff) { 'WARN' } else { 'WARN' }
            detail      = 'No retrieval grounding traces were attested for this run; label simulator/demo posture explicitly before sponsor send.'
        }
    }

    return [ordered]@{
        disposition = 'WARN'
        detail      = "AI quality proof collected with disposition=$($AiQualityProof.pilotStrictDisposition); review before external sponsor send."
    }
}

function Format-AiQualityProofMarkdownSection {
    param([object] $AiQualityProof)

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add('## AI Quality Proof')
    $lines.Add('')
    $lines.Add('Buyer-safe AI posture for sponsor handoff. Missing signals are labeled explicitly — values are not invented.')
    $lines.Add('')
    $lines.Add('| Signal | Value |')
    $lines.Add('| --- | --- |')

    if ($null -eq $AiQualityProof -or $AiQualityProof.collected -ne $true) {
        $lines.Add('| Collected | **false** |')
        $lines.Add('| PilotStrict disposition | not-collected |')
        $lines.Add('| Retrieval grounding trace present | unknown |')
        $lines.Add('| Citation coverage (mean) | not-collected |')
        $lines.Add('| LLM call count resolved | false |')
        $lines.Add('| Raw prompt/completion included | false |')
        $lines.Add('| Secrets included | false |')
        $lines.Add('')
        $lines.Add('> **Note:** Re-run with `-RunId` after the first committed review to populate AI quality proof.')
        return $lines
    }

    $coverageLabel = if ($null -eq $AiQualityProof.citationCoverageMean) {
        'not-collected'
    }
    else {
        [string]::Format([System.Globalization.CultureInfo]::InvariantCulture, '{0:F3}', [double]$AiQualityProof.citationCoverageMean)
    }

    $lines.Add("| Collected | **true** |")
    $lines.Add("| PilotStrict disposition | **$($AiQualityProof.pilotStrictDisposition)** |")
    $lines.Add("| Quality gate mode | $($AiQualityProof.qualityGateMode) |")
    $lines.Add("| Retrieval grounding trace present | **$($AiQualityProof.retrievalGroundingTracePresent)** (count=$($AiQualityProof.retrievalGroundingTraceCount)) |")
    $lines.Add("| Citation coverage (mean) | $coverageLabel |")
    $lines.Add("| LLM call count resolved | **$($AiQualityProof.llmCallCountResolved)** |")
    $lines.Add("| Unresolved quality signals | **$($AiQualityProof.unresolvedQualitySignalsPresent)** |")
    $lines.Add("| Raw prompt/completion included | **$($AiQualityProof.rawPromptOrCompletionIncluded)** |")
    $lines.Add("| Secrets included | **$($AiQualityProof.secretsIncluded)** |")
    $lines.Add("| Sponsor-safe posture | **$($AiQualityProof.sponsorSafe)** |")
    $lines.Add('')

    if ($AiQualityProof.sponsorSafe -ne $true) {
        $lines.Add('> **Caution:** Do not present this packet as fully grounded customer proof until PilotStrict disposition passes and retrieval grounding is attested.')
    }

    return $lines
}
