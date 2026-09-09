#Requires -Version 5.1
Set-StrictMode -Version Latest

BeforeAll {
    [string]$script:testsDir = $PSScriptRoot
    [string]$script:scriptsDir = Split-Path -Parent $script:testsDir
    [string]$script:seederScript = Join-Path (Join-Path $script:scriptsDir 'agent') 'al-bug-seed-from-surviving-mutants.ps1'
    [string]$script:fixtureReport = Join-Path $script:testsDir 'fixtures/surviving-mutants-sample.json'

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

Describe 'al-bug-seed-from-surviving-mutants.ps1' {

    It 'emits a survived mutant under the application commit orchestrator and omits killed mutants' {
        [string]$ledger = New-LedgerFixture -Content @"
# fixture

## Zone: application-commit

- **id:** application-commit
- **paths:** ArchLucid.Application/Runs/Orchestration/

### Hypotheses

- [ ] open row
"@

        $output = @(
            & $script:seederScript `
                -ZoneId 'application-commit' `
                -LedgerPath $ledger `
                -ReportPath $script:fixtureReport `
                -Preview
        )
        $result = Get-SeederJsonFromOutput -Output $output
        @($result.candidates).Count | Should -Be 1
        $result.candidates[0] | Should -Match 'mutant #1: NegateCondition'
        $result.candidates[0] | Should -Match 'AuthorityDrivenArchitectureRunCommitOrchestrator.cs:42'
        $result.candidates[0] | Should -Not -Match 'BlockRemoval'
        $result.candidates[0] | Should -Match '\[class:other\]'
    }

    It 'omits a survived UI mutant when the zone is Application' {
        [string]$ledger = New-LedgerFixture -Content @"
# fixture

## Zone: application-commit

- **id:** application-commit
- **paths:** ArchLucid.Application/Runs/Orchestration/
"@

        $output = @(
            & $script:seederScript `
                -ZoneId 'application-commit' `
                -LedgerPath $ledger `
                -ReportPath $script:fixtureReport `
                -Preview
        )
        $result = Get-SeederJsonFromOutput -Output $output
        ($result.candidates -join ' ') | Should -Not -Match 'archlucid-ui'
    }

    It 'dedups a mutant already listed as an open candidate' {
        [string]$ledger = New-LedgerFixture -Content @"
# fixture

## Zone: application-commit

- **id:** application-commit
- **paths:** ArchLucid.Application/Runs/Orchestration/

### Hypotheses

- [ ] (candidate) mutant #1: NegateCondition at ArchLucid.Application/Runs/Orchestration/AuthorityDrivenArchitectureRunCommitOrchestrator.cs:42 survived — existing
"@

        $output = @(
            & $script:seederScript `
                -ZoneId 'application-commit' `
                -LedgerPath $ledger `
                -ReportPath $script:fixtureReport `
                -Preview
        )
        $result = Get-SeederJsonFromOutput -Output $output
        @($result.candidates).Count | Should -Be 0
    }

    It 'exits non-zero on malformed JSON and does not write the ledger' {
        [string]$ledger = New-LedgerFixture -Content @"
# fixture

## Zone: application-commit

- **id:** application-commit
- **paths:** ArchLucid.Application/Runs/Orchestration/
"@
        [string]$badReport = Join-Path $TestDrive 'bad.json'
        Set-Content -LiteralPath $badReport -Value '{ not json' -Encoding UTF8
        [string]$before = Get-Content -LiteralPath $ledger -Raw -Encoding UTF8

        { & $script:seederScript -ZoneId 'application-commit' -LedgerPath $ledger -ReportPath $badReport -Preview } | Should -Throw
        [string]$after = Get-Content -LiteralPath $ledger -Raw -Encoding UTF8
        $after | Should -Be $before
    }
}
