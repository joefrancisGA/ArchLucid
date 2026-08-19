#Requires -Version 7.0
# Run: Invoke-Pester -Strict 'scripts/azure/tests/ArchLucid.ExtractorTelemetry.helpers.Tests.ps1'
Set-StrictMode -Version Latest

Describe 'ArchLucid.ExtractorTelemetry.helpers.ps1' {

    BeforeAll {
        [string]$script:helpersPath =
            Join-Path (Split-Path -Parent $PSScriptRoot) 'ArchLucid.ExtractorTelemetry.helpers.ps1'

        . $script:helpersPath
    }

    It 'records step outcomes and warnings for manifest telemetry' {
        $telemetry = New-ArchLucidExtractorTelemetryContext
        [System.Diagnostics.Stopwatch]$watch = [System.Diagnostics.Stopwatch]::StartNew()
        Start-Sleep -Milliseconds 5

        Complete-ArchLucidExtractorStep `
            -Telemetry $telemetry `
            -Step Inventory `
            -Outcome Succeeded `
            -Stopwatch $watch `
            -Context @{ resourceCount = 3 }

        Add-ArchLucidExtractorWarning `
            -Telemetry $telemetry `
            -Step PolicyCompliance `
            -Message 'Simulated policy read failure.'

        [object]$manifestFragment = Get-ArchLucidExtractorTelemetryForManifest -Telemetry $telemetry

        $manifestFragment.warningCount | Should -Be 1
        $manifestFragment.steps.Count | Should -Be 1
        $manifestFragment.steps[0].name | Should -Be 'Inventory'
        $manifestFragment.steps[0].outcome | Should -Be 'Succeeded'
        $manifestFragment.warnings[0].step | Should -Be 'PolicyCompliance'
    }

    It 'builds an empty policy compliance document with a reader note' {
        [object]$doc = New-ArchLucidEmptyPolicyComplianceDocument `
            -ScopeDescriptor '/subscriptions/test-sub' `
            -CollectionTimestampUtc '2026-06-21T00:00:00.0000000Z' `
            -ReaderNote 'Policy read failed.'

        $doc.recordCount | Should -Be 0
        $doc.records.Count | Should -Be 0
        $doc.readerNote | Should -Be 'Policy read failed.'
        $doc.policyComplianceSchemaVersion | Should -Be 1
    }
}
