#Requires -Version 7.0
# Run: Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/Write-AiReadinessPosture.Tests.ps1'
Set-StrictMode -Version Latest

Describe 'Write-AiReadinessPosture.ps1' {

    BeforeAll {
        [string]$script:repoRoot = Split-Path -Parent $PSScriptRoot
        [string]$script:writerScript = Join-Path $script:repoRoot 'Write-AiReadinessPosture.ps1'
    }

    It 'writes ai-readiness-posture.json with v1 schema when evidence inputs are absent' {
        [string]$jsonOut = Join-Path $TestDrive 'ai-readiness-posture.json'
        [string]$markdownOut = Join-Path $TestDrive 'ai-readiness-posture.md'

        & $script:writerScript `
            -JsonOut $jsonOut `
            -MarkdownOut $markdownOut `
            -ReleaseOrRunId 'tb-182-test'

        Test-Path -LiteralPath $jsonOut | Should -Be $true
        Test-Path -LiteralPath $markdownOut | Should -Be $true

        $posture = Get-Content -LiteralPath $jsonOut -Raw -Encoding UTF8 | ConvertFrom-Json

        [string]$posture.'$schema' | Should -Be 'archlucid.ai-readiness-posture.v1'
        [string]$posture.releaseOrRunId | Should -Be 'tb-182-test'
        [string]$posture.overallReadinessLevel | Should -Not -BeNullOrEmpty
        $posture.executionMode.Topology | Should -Not -BeNullOrEmpty
        $posture.qualityGate.outcome | Should -Not -BeNullOrEmpty
        $posture.retrievalPosture.vectorIndexType | Should -Not -BeNullOrEmpty
        $posture.budgetPosture.budgetGuardStatus | Should -Not -BeNullOrEmpty
        [string]$posture.sponsorSafeSummary | Should -Not -BeNullOrEmpty
        $posture.internalDiagnosticRefs.Count | Should -BeGreaterThan 0
    }
}
