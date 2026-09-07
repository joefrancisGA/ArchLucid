#Requires -Version 5.1
# Run: Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/Run-GReal06ProofRuns.Tests.ps1'
Set-StrictMode -Version Latest

Describe 'Run-GReal06ProofRuns.ps1 source shape' {
    BeforeAll {
        $script:scriptRoot = Split-Path -Parent $PSScriptRoot
        $script:orchestratorPath = Join-Path $script:scriptRoot 'Run-GReal06ProofRuns.ps1'
        $script:content = Get-Content -LiteralPath $script:orchestratorPath -Raw
    }

    It 'declares CollectRun2b phase for optional overlay runs' {
        ($script:content -match "CollectRun2b") | Should -Be $true
    }

    It 'points interactive Run 2 at demo-policy-pack-delta offline and ShowFindingDelta' {
        ($script:content -match 'demo-policy-pack-delta\.ps1') | Should -Be $true
        ($script:content -match 'OfflineFindingDelta') | Should -Be $true
        ($script:content -match 'ShowFindingDelta') | Should -Be $true
        ($script:content -match 'DeclarationPriorityFloor P1') | Should -Be $true
    }

    It 'warns agents not to label Simulator output as Real in G4 log' {
        ($script:content -match 'do not append G4') | Should -Be $true
        ($script:content -match 'Simulator output as Real') | Should -Be $true
    }

    It 'references CLAIM_READINESS_STATUS proof-packet run log' {
        ($script:content -match 'CLAIM_READINESS_STATUS\.md#proof-packet-run-log') | Should -Be $true
    }

    It 'delegates proof collection to collect-first-pilot-proof.ps1 with SponsorHandoff and FailOnHold' {
        ($script:content -match 'collect-first-pilot-proof\.ps1') | Should -Be $true
        ($script:content -match 'SponsorHandoff') | Should -Be $true
        ($script:content -match 'FailOnHold') | Should -Be $true
    }
}

Describe 'THREE_REAL_MODE_PROOF_RUNS.md G-REAL-06 agent-prep' {
    BeforeAll {
        $script:repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
        $script:runbookPath = Join-Path $script:repoRoot 'docs/runbooks/THREE_REAL_MODE_PROOF_RUNS.md'
        $script:content = Get-Content -LiteralPath $script:runbookPath -Raw
    }

    It 'documents scenario briefs for runs 1-3 and optional 2b overlay' {
        ($script:content -match 'g-real-06-run1-core-pilot') | Should -Be $true
        ($script:content -match 'g-real-06-run2-pack-delta') | Should -Be $true
        ($script:content -match 'g-real-06-run2b-overlay') | Should -Be $true
        ($script:content -match 'g-real-06-run3-compare') | Should -Be $true
        ($script:content -match 'cost\.requireBudgetCap') | Should -Be $true
    }

    It 'includes capture scripts inventory and canonical G4 log pointer' {
        ($script:content -match 'Capture scripts inventory') | Should -Be $true
        ($script:content -match 'CLAIM_READINESS_STATUS\.md#proof-packet-run-log') | Should -Be $true
        ($script:content -match 'Agents must not append G4 rows') | Should -Be $true
    }
}
