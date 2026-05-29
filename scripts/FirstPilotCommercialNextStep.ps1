#requires -Version 5.1
Set-StrictMode -Version Latest

function Resolve-CommercialNextStepRecommendation {
    param(
        [Parameter(Mandatory = $true)][string] $SponsorPacketDisposition,
        [Parameter(Mandatory = $true)][int] $BlockCount,
        [Parameter(Mandatory = $true)][bool] $RoiSponsorSafe,
        [Parameter(Mandatory = $true)][string] $RoiBasisStatus,
        [Parameter(Mandatory = $true)][string] $ProcurementDisposition,
        [Parameter(Mandatory = $true)][string] $CommittedEvidenceDisposition,
        [string[]] $DeferredScopeReasons = @()
    )

    $owner = 'Sales / pilot operator'
    $annualReady = ($SponsorPacketDisposition -eq 'SEND' -and $RoiSponsorSafe -and $BlockCount -eq 0)

    if ($BlockCount -gt 0 -or $SponsorPacketDisposition -eq 'HOLD') {
        return [ordered]@{
            action = 'Evidence Pack'
            owner  = $owner
            reason = 'Proof has blocking rows - complete evidence pack collection after resolving HOLD findings; do not advance to ARB or order form yet.'
        }
    }

    if ($SponsorPacketDisposition -eq 'DEFERRED_SCOPE' -or @($DeferredScopeReasons).Count -gt 0) {
        return [ordered]@{
            action = 'Deferred buyer requirement'
            owner  = 'Executive owner'
            reason = 'Document deferred V1.1/V2/(B) buyer requirements separately; they are not V1 product blockers.'
        }
    }

    if (-not $RoiSponsorSafe -or $RoiBasisStatus -in @('missing', 'not-collected', 'demo-derived', 'defaulted')) {
        return [ordered]@{
            action = 'Evidence Pack'
            owner  = $owner
            reason = "ROI basis status is '$RoiBasisStatus' - attach sponsor-safe baselines before ARB readout or annual order discussion."
        }
    }

    if ($CommittedEvidenceDisposition -ne 'PASS') {
        return [ordered]@{
            action = 'Evidence Pack'
            owner  = $owner
            reason = 'Collect committed-run evidence with -RunId before executive ARB or order-form handoff.'
        }
    }

    if ($ProcurementDisposition -eq 'HOLD') {
        return [ordered]@{
            action = 'Evidence Pack'
            owner  = 'Procurement owner'
            reason = 'Procurement deal-ready is HOLD - refresh procurement pack artifacts before security review or order form.'
        }
    }

    if ($annualReady) {
        if ($ProcurementDisposition -eq 'PASS') {
            return [ordered]@{
                action = 'Annual Enterprise order'
                owner  = 'Sales + legal'
                reason = 'Sponsor disposition SEND with sponsor-safe ROI and passing procurement deal-ready - proceed to order-form path when tier is Enterprise.'
            }
        }

        return [ordered]@{
            action = 'ARB Report'
            owner  = 'Pilot operator + architecture review board'
            reason = 'Sponsor disposition SEND with evidence-backed ROI - circulate ARB/executive review before annual order form.'
        }
    }

    return [ordered]@{
        action = 'Evidence Pack'
        owner  = $owner
        reason = 'Complete first committed review proof (-RunId) before ARB or annual conversion ask.'
    }
}
