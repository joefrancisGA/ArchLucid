#requires -Version 5.1
Set-StrictMode -Version Latest

function Write-FirstPilotCommercialCloseoutArtifacts {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [Parameter(Mandatory = $true)][string] $SponsorPacketDisposition,
        [Parameter(Mandatory = $true)][string] $RoiBasisStatus,
        [Parameter(Mandatory = $true)][bool] $RoiSponsorSafe,
        [Parameter(Mandatory = $true)][int] $BlockCount,
        [Parameter(Mandatory = $true)][string[]] $DeferredScopeReasons,
        [Parameter(Mandatory = $true)][object] $CommercialStep,
        [string] $DataConsistencyStatus = 'NOT_RUN',
        [string] $ProcurementDisposition = 'NOT_RUN',
        [string] $TierRecommendation = 'Agree with buyer after PASS proof',
        [string] $RunId = ''
    )

    $commercialDisposition = if ($BlockCount -gt 0) {
        'HOLD'
    }
    elseif ($SponsorPacketDisposition -eq 'DEFERRED_SCOPE') {
        'DEFERRED_SCOPE'
    }
    elseif ($SponsorPacketDisposition -in @('READY', 'WARN')) {
        'PASS'
    }
    else {
        'HOLD'
    }

    $runIdLabel = if ([string]::IsNullOrWhiteSpace($RunId)) { 'not supplied (readiness-only)' } else { $RunId.Trim() }
    $action = [string]$CommercialStep.action
    $owner = [string]$CommercialStep.owner
    $reason = [string]$CommercialStep.reason

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add('# Commercial closeout (generated)')
    $lines.Add('')
    $lines.Add('> Deterministic next commercial action from first-pilot proof states. Pricing and legal terms: [`PRICING_PHILOSOPHY.md`](../../docs/go-to-market/PRICING_PHILOSOPHY.md) · [`ORDER_FORM_TEMPLATE.md`](../../docs/go-to-market/ORDER_FORM_TEMPLATE.md).')
    $lines.Add('')
    $lines.Add('| Field | Value |')
    $lines.Add('| --- | --- |')
    $lines.Add("| Recommended next action | **$action** |")
    $lines.Add("| Owner | $owner |")
    $lines.Add("| Commercial disposition | **$commercialDisposition** |")
    $lines.Add("| Sponsor packet disposition | **$SponsorPacketDisposition** |")
    $lines.Add("| Run id | $runIdLabel |")
    $lines.Add("| ROI basis status | **$RoiBasisStatus** |")
    $lines.Add("| ROI sponsor-safe | **$RoiSponsorSafe** |")
    $lines.Add("| Data consistency status | **$DataConsistencyStatus** |")
    $lines.Add("| Procurement deal-ready | **$ProcurementDisposition** |")
    $lines.Add("| Tier recommendation | $TierRecommendation |")
    $lines.Add('')
    $lines.Add('## Why this action')
    $lines.Add('')
    $lines.Add($reason)
    $lines.Add('')
    $lines.Add('## Caveats')
    $lines.Add('')
    $lines.Add('- Do not ask for annual conversion from a vague demo without committed-run proof (`-RunId`).')
    $lines.Add('- Demo-derived ROI is walkthrough shape only — not buyer outcome claims.')
    $lines.Add('- Deferred buyer requirements are **DEFERRED_SCOPE**, not V1 product failures.')
    $lines.Add('- Live Stripe / Marketplace checkout remains deferred per [`V1_DEFERRED.md`](../../docs/library/V1_DEFERRED.md).')
    $lines.Add('')
    $lines.Add('## Linked proof artifacts')
    $lines.Add('')
    $lines.Add('| Artifact | Path |')
    $lines.Add('| --- | --- |')
    $lines.Add('| Command center | [`first-pilot-command-center.md`](first-pilot-command-center.md) |')
    $lines.Add('| Quote-to-proof index | [`quote-to-proof-packet.md`](quote-to-proof-packet.md) |')
    $lines.Add('| Commercial next step JSON | [`commercial-next-step.json`](commercial-next-step.json) |')
    $lines.Add('| Go/no-go summary | [`go-no-go-summary.json`](go-no-go-summary.json) |')
    $lines.Add('| LLM cost envelope (internal COGS labels) | [`llm-cost-envelope.md`](llm-cost-envelope.md) |')
    $lines.Add('')

    if ($DeferredScopeReasons.Count -gt 0) {
        $lines.Add('## Deferred buyer requirements')
        $lines.Add('')

        foreach ($item in $DeferredScopeReasons) {
            $lines.Add("- $item")
        }

        $lines.Add('')
    }

    $mdPath = Join-Path $ProofDirectory 'commercial-closeout.md'
    $jsonPath = Join-Path $ProofDirectory 'commercial-closeout.json'
    $lines | Set-Content -LiteralPath $mdPath -Encoding UTF8

    $payload = [ordered]@{
        recommendedNextAction   = $action
        owner                   = $owner
        reason                  = $reason
        commercialDisposition   = $commercialDisposition
        sponsorPacketDisposition = $SponsorPacketDisposition
        roiBasisStatus          = $RoiBasisStatus
        roiSponsorSafe          = $RoiSponsorSafe
        dataConsistencyStatus   = $DataConsistencyStatus
        procurementDisposition  = $ProcurementDisposition
        tierRecommendation      = $TierRecommendation
        deferredScopeReasons    = @($DeferredScopeReasons)
    }
    $payload | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

    return [ordered]@{
        mdPath   = $mdPath
        jsonPath = $jsonPath
    }
}
