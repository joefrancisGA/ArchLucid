#requires -Version 5.1
# Run: Invoke-Pester -Strict -EnableExit -Path 'scripts/ci/tests/FirstPilotCommercialNextStep.Tests.ps1'

BeforeAll {
    $scriptsRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    . (Join-Path $scriptsRoot 'FirstPilotCommercialNextStep.ps1')
}

Describe 'Resolve-CommercialNextStepRecommendation' {
    It 'returns Deferred buyer requirement when sponsor disposition is DEFERRED_SCOPE' {
        $result = Resolve-CommercialNextStepRecommendation `
            -SponsorPacketDisposition 'DEFERRED_SCOPE' `
            -BlockCount 0 `
            -RoiSponsorSafe $true `
            -RoiBasisStatus 'buyer-provided' `
            -ProcurementDisposition 'PASS' `
            -CommittedEvidenceDisposition 'PASS' `
            -DeferredScopeReasons @('SOC2 CPA')

        $result.action | Should -Be 'Deferred buyer requirement'
    }

    It 'returns Evidence Pack when block count is positive' {
        $result = Resolve-CommercialNextStepRecommendation `
            -SponsorPacketDisposition 'HOLD' `
            -BlockCount 2 `
            -RoiSponsorSafe $false `
            -RoiBasisStatus 'missing' `
            -ProcurementDisposition 'HOLD' `
            -CommittedEvidenceDisposition 'BLOCK' `
            -DeferredScopeReasons ([string[]]@())

        $result.action | Should -Be 'Evidence Pack'
    }

    It 'returns ARB Report when annual ready' {
        $result = Resolve-CommercialNextStepRecommendation `
            -SponsorPacketDisposition 'READY' `
            -BlockCount 0 `
            -RoiSponsorSafe $true `
            -RoiBasisStatus 'buyer-provided' `
            -ProcurementDisposition 'WARN' `
            -CommittedEvidenceDisposition 'PASS' `
            -DeferredScopeReasons ([string[]]@())

        $result.action | Should -Be 'ARB Report'
    }
}
