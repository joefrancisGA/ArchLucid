#Requires -Version 5.1
Set-StrictMode -Version Latest

BeforeAll {
    [string]$script:testsDir = $PSScriptRoot
    [string]$script:scriptsDir = Split-Path -Parent $script:testsDir
    [string]$script:seederScript = Join-Path (Join-Path $script:scriptsDir 'agent') 'al-bug-seed-from-analyzers.ps1'
    [string]$script:fixtureSarif = Join-Path $script:testsDir 'fixtures/analyzer-seed-sample.sarif.json'

    function New-LedgerFixture {
        param([string] $Content)

        [string]$path = Join-Path $TestDrive 'AL_BUG_HUNT_LEDGER.md'
        Set-Content -LiteralPath $path -Value $Content -Encoding UTF8
        return $path
    }

    function Get-SeederJsonFromOutput {
        param([object[]] $Output)

        $jsonLine = @($Output | Where-Object { $_ -match '^\{' })[-1]

        if ($null -eq $jsonLine) {
            throw 'Seeder JSON line was not found in script output.'
        }

        return ($jsonLine | ConvertFrom-Json)
    }
}

Describe 'al-bug-seed-from-analyzers.ps1' {

    It 'emits only in-zone non-test candidates and dedups' {
        [string]$ledger = New-LedgerFixture -Content @"
# fixture

## Zone: topology-proposal-merge

- **id:** topology-proposal-merge
- **paths:** ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalMergeGate.cs

### Hypotheses

- [ ] (candidate) analyzer CA1062 at ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalMergeGate.cs:42 — existing
"@

        $output = @(
            & $script:seederScript `
                -ZoneId 'topology-proposal-merge' `
                -LedgerPath $ledger `
                -SarifPath $script:fixtureSarif `
                -Preview
        )
        $result = Get-SeederJsonFromOutput -Output $output
        @($result.candidates).Count | Should -Be 0
    }

    It 'caps new candidates at fifteen' {
        [string]$ledger = New-LedgerFixture -Content @"
# fixture

## Zone: topology-proposal-merge

- **id:** topology-proposal-merge
- **paths:** ArchLucid.Application/Runs/Orchestration/

### Hypotheses

- [ ] open row
"@

        $output = @(
            & $script:seederScript `
                -ZoneId 'topology-proposal-merge' `
                -LedgerPath $ledger `
                -SarifPath $script:fixtureSarif `
                -Preview
        )
        $result = Get-SeederJsonFromOutput -Output $output
        @($result.candidates).Count | Should -BeLessOrEqual 15
        $result.candidates[0] | Should -Match '^\(candidate\) analyzer'
    }
}
