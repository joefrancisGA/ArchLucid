#requires -Version 5.1
Set-StrictMode -Version Latest

BeforeAll {
    $script:RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    . (Join-Path $script:RepoRoot 'scripts\FirstPilotWorkflowHandoff.ps1')
}

Describe 'FirstPilotWorkflowHandoff' {
    It 'writes markdown and json with deferred scope and top findings' {
        $temp = Join-Path $TestDrive 'proof-handoff'
        New-Item -ItemType Directory -Path $temp -Force | Out-Null

        $findings = @(
            [pscustomobject]@{ disposition = 'BLOCK'; name = 'pilot-strict'; detail = 'Real-mode evidence missing.' },
            [pscustomobject]@{ disposition = 'WARN'; name = 'demo-data'; detail = 'Contoso seed detected.' }
        )

        $paths = Write-V1WorkflowHandoffArtifacts `
            -ProofDirectory $temp `
            -SponsorPacketDisposition 'HOLD' `
            -BlockCount 1 `
            -DeferredScopeReasons @('Buyer requires SOC 2 CPA attestation (V1.1/(B) deferral).') `
            -Findings $findings `
            -RunId 'run-test-001' `
            -CommercialNextAction 'HOLD sponsor send' `
            -CommercialNextReason 'PilotStrict not satisfied'

        Test-Path -LiteralPath (Join-Path $temp $paths.mdPath) | Should -Be $true
        Test-Path -LiteralPath (Join-Path $temp $paths.jsonPath) | Should -Be $true

        $md = Get-Content -LiteralPath (Join-Path $temp $paths.mdPath) -Raw -Encoding UTF8
        $md | Should -Match 'run-test-001'
        $md | Should -Match 'Deferred scope'
        $md | Should -Match 'V1.1 connectors'
        $md | Should -Match 'pilot-strict'

        $json = Get-Content -LiteralPath (Join-Path $temp $paths.jsonPath) -Raw -Encoding UTF8 | ConvertFrom-Json
        $json.deferredScopeReasons.Count | Should -Be 1
        $json.topFindings.Count | Should -BeGreaterThan 0
    }
}
