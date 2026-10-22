#Requires -Version 5.1
# Run: Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/collect-first-pilot-proof.Tests.ps1'
# Run: Invoke-Pester -Path 'scripts/tests/collect-first-pilot-proof.Tests.ps1'
Set-StrictMode -Version Latest




BeforeAll {
    $scriptRoot = Split-Path -Parent $PSScriptRoot
    $stickinessScript = Join-Path $scriptRoot 'FirstPilotMultiRunStickinessProof.ps1'
    . $stickinessScript
}

Describe 'FirstPilotMultiRunStickinessProof' {
    It 'RunNumber 1 resolves pilot-proof bundle directory' {
        $proofRoot = Join-Path $TestDrive 'stickiness-proof'
        $dir = Resolve-FirstPilotStickinessBundleDirectory -ProofDirectory $proofRoot -RunNumber 1
        $dir | Should -Be (Join-Path $proofRoot 'pilot-proof')
    }

    It 'RunNumber 2 resolves pilot-proof-run2 bundle directory' {
        $proofRoot = Join-Path $TestDrive 'stickiness-proof'
        $dir = Resolve-FirstPilotStickinessBundleDirectory -ProofDirectory $proofRoot -RunNumber 2
        $dir | Should -Be (Join-Path $proofRoot 'pilot-proof-run2')
    }

    It 'RunNumber 2 requires CompareBaseRunId' {
        { Assert-FirstPilotMultiRunParameters -RunNumber 2 -RunId 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' -CompareBaseRunId '' } |
            Should -Throw '*CompareBaseRunId*'
    }

    It 'stickinessSignals section includes expected keys' {
        $signals = Get-FirstPilotStickinessSignals -ComparePayload $null -BaseDeltasPayload $null -CurrentDeltasPayload $null -DecisionsPayload $null
        $signals.Contains('findingsReduced') | Should -Be $true
        $signals.Contains('findingsAdded') | Should -Be $true
        $signals.Contains('cycleTimeDeltaMinutes') | Should -Be $true
        $signals.Contains('governanceComplianceDelta') | Should -Be $true
    }
}

Describe 'FirstPilotProofDisposition real-mode rollup' {
    BeforeAll {
        . (Join-Path $scriptRoot 'FirstPilotProofDisposition.ps1')
    }

    It 'maps PASS finding to PASS rollup with evidence captured' {
        $findings = @([ordered]@{ name = 'real-llm-sponsor-evidence'; disposition = 'PASS'; detail = 'ok'; remediation = '' })
        $rollup = Get-RealModeEvidenceRollupFromFindings -Findings $findings -SponsorHandoff
        $rollup.status | Should -Be 'PASS'
        $rollup.evidenceCaptured | Should -Be $true
    }

    It 'maps missing real-mode signal to HOLD when SponsorHandoff is set' {
        $findings = @([ordered]@{ name = 'real-llm-sponsor-evidence'; disposition = 'WARN'; detail = 'no signal'; remediation = 'use real mode' })
        $rollup = Get-RealModeEvidenceRollupFromFindings -Findings $findings -SponsorHandoff
        $rollup.status | Should -Be 'HOLD'
        $rollup.evidenceCaptured | Should -Be $false
    }

    It 'maps missing real-mode signal to WARN in readiness-only mode' {
        $findings = @([ordered]@{ name = 'real-llm-sponsor-evidence'; disposition = 'WARN'; detail = 'no signal'; remediation = 'use real mode' })
        $rollup = Get-RealModeEvidenceRollupFromFindings -Findings $findings
        $rollup.status | Should -Be 'WARN'
    }
}

Describe 'collect-first-pilot-proof.ps1 parameters' {
    It 'declares RunNumber and CompareBaseRunId' {
        $content = Get-Content -LiteralPath (Join-Path $scriptRoot 'collect-first-pilot-proof.ps1') -Raw
        ($content -match 'RunNumber') | Should -Be $true
        ($content -match 'CompareBaseRunId') | Should -Be $true
        ($content -match 'stickinessSignals') | Should -Be $true
        ($content -match 'realModeEvidenceStatus') | Should -Be $true
        ($content -match 'Get-RealModeEvidenceRollupFromFindings') | Should -Be $true
    }
}