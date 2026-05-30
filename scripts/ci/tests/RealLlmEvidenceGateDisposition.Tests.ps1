#requires -Version 5.1
Set-StrictMode -Version Latest

$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
. (Join-Path $root 'scripts\RealLlmEvidenceGateDisposition.ps1')

Describe 'RealLlmEvidenceGateDisposition' {
    It 'returns SKIPPED_NO_CREDENTIALS when credentials are absent' {
        Get-RealLlmEvidenceGateDisposition -CredentialsPresent $false -DotnetExitCode 0 |
            Should -Be 'SKIPPED_NO_CREDENTIALS'
    }

    It 'returns HOLD when dotnet exit code is non-zero' {
        Get-RealLlmEvidenceGateDisposition -CredentialsPresent $true -DotnetExitCode 1 |
            Should -Be 'HOLD'
    }

    It 'returns HOLD when a required evidence row failed' {
        $rows = @(
            [pscustomobject]@{ Check = 'Run executed (topology smoke)'; Result = 'Failed'; Detail = 'exit 1' }
        )

        Get-RealLlmEvidenceGateDisposition `
            -CredentialsPresent $true `
            -DotnetExitCode 0 `
            -EvidenceRows $rows `
            -TopologyMetrics ([pscustomobject]@{ liveEvidenceProfile = 'topology-only' }) `
            -PipelineMetrics ([pscustomobject]@{ liveEvidenceProfile = 'full-pipeline' }) |
            Should -Be 'HOLD'
    }

    It 'returns HOLD when either metrics profile is missing' {
        Get-RealLlmEvidenceGateDisposition `
            -CredentialsPresent $true `
            -DotnetExitCode 0 `
            -EvidenceRows @() `
            -TopologyMetrics ([pscustomobject]@{ liveEvidenceProfile = 'topology-only' }) `
            -PipelineMetrics $null |
            Should -Be 'HOLD'
    }

    It 'returns PASS when both profiles succeeded and no rows failed' {
        $topology = [pscustomobject]@{
            liveEvidenceProfile = 'topology-only'
            deploymentName      = 'gpt-4o'
            parseAttempts       = 1
            parseFailures       = 0
            mergeSuccess        = $false
            manifestServiceCount = 0
            decisionsCount      = 0
            totalClaims         = 2
            inputTokensTotal    = 100
            outputTokensTotal   = 50
            estimatedCostUsd    = $null
            evidenceRefsObserved = $true
            durableSqlPersistenceExercised = $false
        }

        $pipeline = [pscustomobject]@{
            liveEvidenceProfile = 'full-pipeline'
            deploymentName      = 'gpt-4o'
            parseAttempts       = 4
            parseFailures       = 0
            mergeSuccess        = $true
            manifestServiceCount = 3
            decisionsCount      = 2
            totalClaims         = 8
            inputTokensTotal    = 900
            outputTokensTotal   = 400
            estimatedCostUsd    = $null
            evidenceRefsObserved = $true
            durableSqlPersistenceExercised = $false
        }

        Get-RealLlmEvidenceGateDisposition `
            -CredentialsPresent $true `
            -DotnetExitCode 0 `
            -EvidenceRows @() `
            -TopologyMetrics $topology `
            -PipelineMetrics $pipeline |
            Should -Be 'PASS'
    }

    It 'does not exit non-zero for skipped credentials' {
        Test-RealLlmEvidenceGateShouldExitNonZero -Disposition 'SKIPPED_NO_CREDENTIALS' |
            Should -Be $false
    }

    It 'exits non-zero for HOLD' {
        Test-RealLlmEvidenceGateShouldExitNonZero -Disposition 'HOLD' |
            Should -Be $true
    }
}
