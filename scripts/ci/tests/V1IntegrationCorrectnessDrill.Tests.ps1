#requires -Version 5.1
# Run: Invoke-Pester -Strict -EnableExit -Path 'scripts/ci/tests/V1IntegrationCorrectnessDrill.Tests.ps1'

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
. (Join-Path $repoRoot 'scripts/V1IntegrationCorrectnessDrill.ps1')

Describe 'V1 integration correctness drill helpers' {
    It 'Resolves PASS when status matches' {
        Resolve-V1IntegrationDrillDisposition -ExpectedStatus 200 -ActualStatus 200 | Should Be 'PASS'
    }

    It 'Resolves WARN for allowed alternate status' {
        Resolve-V1IntegrationDrillDisposition -ExpectedStatus 200 -ActualStatus 201 -AllowedStatuses @(201) | Should Be 'WARN'
    }

    It 'Resolves HOLD when status mismatches' {
        Resolve-V1IntegrationDrillDisposition -ExpectedStatus 404 -ActualStatus 500 | Should Be 'HOLD'
    }

    It 'Parses run-not-found problem type from JSON' {
        $json = '{"type":"https://archlucid.example.org/errors#run-not-found","correlationId":"abc-123"}'
        Get-V1IntegrationDrillProblemType -JsonContent $json | Should Be 'https://archlucid.example.org/errors#run-not-found'
        Get-V1IntegrationDrillProblemCorrelationId -JsonContent $json | Should Be 'abc-123'
    }

    It 'Detects committed run by goldenManifestId' {
        $payload = [pscustomobject]@{ run = [pscustomobject]@{ goldenManifestId = '11111111-1111-1111-1111-111111111111'; status = 2 } }
        Test-V1IntegrationRunCommitted -RunDetailPayload $payload | Should Be $true
    }

    It 'Writes JSON and Markdown artifacts' {
        $report = [ordered]@{
            formatVersion             = '1.0'
            generatedUtc              = '2026-05-28T12:00:00Z'
            baseUrl                   = 'http://localhost:5128'
            overallDisposition        = 'PASS'
            integrationModelObserved  = 'authority-pipeline'
            runId                     = '22222222-2222-2222-2222-222222222222'
            manifestId                = '11111111-1111-1111-1111-111111111111'
            coordinatorExecuteInvoked = $false
            rows                      = @(
                (New-V1IntegrationDrillRow -Name 'health-ready' -Route 'GET /health/ready' -ExpectedStatus 200 -ActualStatus 200 -Disposition 'PASS')
            )
        }

        $outDir = Join-Path $TestDrive 'drill'
        $paths = Write-V1IntegrationCorrectnessDrillArtifacts -OutputDirectory $outDir -Report $report
        Test-Path -LiteralPath $paths.jsonPath | Should Be $true
        Test-Path -LiteralPath $paths.mdPath | Should Be $true

        $saved = Get-Content -LiteralPath $paths.jsonPath -Raw | ConvertFrom-Json
        $saved.integrationModelObserved | Should Be 'authority-pipeline'
    }
}
