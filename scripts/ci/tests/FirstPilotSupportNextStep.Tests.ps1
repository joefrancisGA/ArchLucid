#requires -Version 5.1

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent (Split-Path -Parent $here)
. (Join-Path $repoRoot 'FirstPilotSupportNextStep.ps1')

Describe 'Get-FirstPilotSupportNextStepForFinding' {
    It 'returns route-tier remediation for parity failures' {
        $step = Get-FirstPilotSupportNextStepForFinding -Name 'route-tier-policy-nav-parity'
        $step | Should Match 'assert_route_tier_policy_nav'
    }

    It 'returns support-bundle guidance for unknown findings' {
        $step = Get-FirstPilotSupportNextStepForFinding -Name 'unknown-finding' -CorrelationId 'abc-123'
        $step | Should Match 'support-bundle'
        $step | Should Match 'abc-123'
    }

    It 'does not embed connection strings in support steps' {
        $step = Get-FirstPilotSupportNextStepForFinding -Name 'data-consistency-readiness'
        $step | Should Not Match 'Server='
        $step | Should Not Match 'Password='
    }

    It 'adds remediation doc and in-app links on finding rows' {
        $row = Add-SupportNextStepToFindingRow -Finding @{
            name        = 'roi-basis-labels'
            disposition = 'WARN'
        } -RunId 'run-1'

        $row.remediationDocLink | Should Match 'roi-baseline'
        $row.remediationInAppLink | Should Be '/scorecard#roi-baselines'
    }
}
