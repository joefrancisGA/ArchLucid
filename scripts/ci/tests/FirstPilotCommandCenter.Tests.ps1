#requires -Version 5.1
# Run: Invoke-Pester -Strict -EnableExit -Path 'scripts/ci/tests/FirstPilotCommandCenter.Tests.ps1'

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
. (Join-Path $repoRoot 'scripts/FirstPilotCommandCenter.ps1')

Describe 'First-pilot command center' {
    It 'Marks review lifecycle WARN when RunId is missing' {
        $findings = @(
            [ordered]@{ disposition = 'WARN'; name = 'committed-run-evidence'; detail = 'No RunId supplied.'; remediation = 'Re-run with -RunId.' }
        )
        $center = Build-FirstPilotCommandCenter `
            -Findings $findings `
            -RunId '' `
            -SponsorPacketDisposition 'READINESS_ONLY' `
            -BlockCount 0

        $review = @($center.phases | Where-Object { $_.id -eq 'review-lifecycle' })[0]
        $review.status | Should Be 'WARN'
        $center.readinessOnly | Should Be $true
    }

    It 'Rolls BLOCK findings into HOLD phase labels' {
        $findings = @(
            [ordered]@{ disposition = 'BLOCK'; name = 'procurement-deal-ready'; detail = 'Stale pack.'; remediation = 'Rebuild procurement pack.' }
        )
        $center = Build-FirstPilotCommandCenter `
            -Findings $findings `
            -RunId '00000000-0000-0000-0000-000000000001' `
            -SponsorPacketDisposition 'HOLD' `
            -BlockCount 1

        $procurement = @($center.phases | Where-Object { $_.id -eq 'procurement-posture' })[0]
        $procurement.status | Should Be 'HOLD'
        $procurement.remediationDocLink | Should Be 'docs/runbooks/PROCUREMENT_DEAL_READY.md'
    }

    It 'Surfaces deferred buyer requirements without HOLD on phases' {
        $center = Build-FirstPilotCommandCenter `
            -Findings @() `
            -RunId '00000000-0000-0000-0000-000000000001' `
            -SponsorPacketDisposition 'DEFERRED_SCOPE' `
            -BlockCount 0 `
            -DeferredScopeReasons @('SOC 2 CPA report')

        $center.deferredBuyerRequirements.Count | Should Be 1
        $center.deferredBuyerRequirements[0].status | Should Be 'DEFERRED'
        $procurement = @($center.phases | Where-Object { $_.id -eq 'procurement-posture' })[0]
        $procurement.status | Should Be 'READY'
    }

    It 'Prioritizes platform HOLD in NEXT ACTION' {
        $findings = @(
            [ordered]@{ disposition = 'BLOCK'; name = 'pilot-preflight-exit'; detail = 'Preflight failed.'; remediation = 'Fix preflight.' }
            [ordered]@{ disposition = 'BLOCK'; name = 'procurement-deal-ready'; detail = 'Stale pack.'; remediation = 'Rebuild pack.' }
        )
        $center = Build-FirstPilotCommandCenter `
            -Findings $findings `
            -RunId '' `
            -SponsorPacketDisposition 'HOLD' `
            -BlockCount 2

        $center.nextAction.label | Should Be 'NEXT ACTION'
        $center.nextAction.remediationDocLink | Should Be 'docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md#phase-a--platform-ready'
    }

    It 'Writes JSON and Markdown artifacts' {
        $proofDir = Join-Path $TestDrive 'proof'
        New-Item -ItemType Directory -Path $proofDir -Force | Out-Null
        $center = Build-FirstPilotCommandCenter `
            -Findings @() `
            -RunId '' `
            -SponsorPacketDisposition 'READINESS_ONLY' `
            -BlockCount 0

        $paths = Write-FirstPilotCommandCenterArtifacts -ProofDirectory $proofDir -CommandCenter $center
        Test-Path -LiteralPath (Join-Path $proofDir $paths.jsonPath) | Should Be $true
        Test-Path -LiteralPath (Join-Path $proofDir $paths.mdPath) | Should Be $true

        $json = Get-Content -LiteralPath (Join-Path $proofDir $paths.jsonPath) -Raw | ConvertFrom-Json
        $json.nextAction.label | Should Be 'NEXT ACTION'
        $json.phases.Count | Should Be 5
    }
}
