#requires -Version 5.1

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent (Split-Path -Parent $here)
. (Join-Path $repoRoot 'FirstPilotDataConsistencyProof.ps1')

Describe 'Resolve-DataConsistencyProofFinding' {
    It 'maps HOLD to BLOCK for sponsor handoff' {
        $summary = [pscustomobject]@{
            probes = @(
                [pscustomobject]@{
                    probe                  = '/health/ready'
                    status                 = 'HOLD'
                    sponsorHandoffMustStop = $true
                }
            )
        }

        $resolved = Resolve-DataConsistencyProofFinding -Status 'HOLD' -Summary $summary -SponsorHandoff -RunId 'run-1' -CollectorExitCode 1

        $resolved.disposition | Should Be 'BLOCK'
        $resolved.detail | Should Match 'blocks sponsor handoff'
    }

    It 'maps skipped collection to WARN without sponsor handoff' {
        $resolved = Resolve-DataConsistencyProofFinding -Status 'NOT_RUN'

        $resolved.disposition | Should Be 'WARN'
    }

    It 'maps skipped collection to BLOCK for sponsor handoff' {
        $resolved = Resolve-DataConsistencyProofFinding -Status 'NOT_RUN' -SponsorHandoff

        $resolved.disposition | Should Be 'BLOCK'
    }

    It 'maps PASS to PASS' {
        $resolved = Resolve-DataConsistencyProofFinding -Status 'PASS' -Summary $null

        $resolved.disposition | Should Be 'PASS'
    }
}
