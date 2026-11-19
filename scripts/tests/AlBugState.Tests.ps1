#Requires -Version 5.1
# Run: Invoke-Pester -Path 'scripts/tests/AlBugState.Tests.ps1'
Set-StrictMode -Version Latest

BeforeAll {
    [string]$script:testsDir = $PSScriptRoot
    [string]$script:scriptsDir = Split-Path -Parent $script:testsDir
    [string]$script:stateScript = Join-Path (Join-Path $script:scriptsDir 'agent') 'al-bug-state.ps1'

    function Invoke-BugState {
        param(
            [string] $ConfigPath,
            [string] $RepoRoot,
            [string] $AtUtc
        )

        $args = @{
            RepoRoot      = $RepoRoot
            SetConfigPath = $ConfigPath
            Local         = $true
        }

        if (-not [string]::IsNullOrWhiteSpace($AtUtc)) {
            $args.AtUtc = $AtUtc
        }

        return @(& $script:stateScript @args)
    }

    function Get-BugStateJsonFromOutput {
        param([object[]] $Output)

        $jsonLine = @($Output | Where-Object { $_ -match '^\{' })[-1]

        if ($null -eq $jsonLine) {
            throw 'Bug state JSON line was not found in script output.'
        }

        return ($jsonLine | ConvertFrom-Json)
    }
}

Describe 'al-bug-state.ps1' {

    It 'counts non-seed hits and dry runs per set in the 24h window' {
        $fixtureRoot = Join-Path $TestDrive 'repo'
        $libraryDir = Join-Path $fixtureRoot 'docs\library'
        New-Item -ItemType Directory -Path $libraryDir -Force | Out-Null

        $log1 = Join-Path $libraryDir 'AL_BUG_HUNT_RUN_LOG_1.jsonl'
        $log2 = Join-Path $libraryDir 'AL_BUG_HUNT_RUN_LOG_2.jsonl'

        @(
            '{"at":"2026-08-19T10:00:00Z","zoneId":"topology-proposal-merge","outcome":"hit"}'
            '{"at":"2026-08-19T11:00:00Z","zoneId":"topology-proposal-merge","outcome":"dry"}'
            '{"at":"2026-08-19T12:00:00Z","zoneId":"topology-proposal-merge","outcome":"seed-only"}'
        ) | Set-Content -LiteralPath $log1 -Encoding UTF8

        @(
            '{"at":"2026-08-18T00:00:00Z","zoneId":"api-key-auth","outcome":"hit"}'
            '{"at":"2026-08-19T15:00:00Z","zoneId":"api-key-auth","outcome":"dry"}'
            '{"at":"2026-08-19T16:00:00Z","zoneId":"api-key-auth","outcome":"dry"}'
        ) | Set-Content -LiteralPath $log2 -Encoding UTF8

        $config = @{
            sets = @(
                @{
                    id      = 1
                    title   = 'Set 1'
                    command = '/al-bug1'
                    branch  = 'bugsmash-1'
                    ledger  = 'docs/library/AL_BUG_HUNT_LEDGER_1.md'
                    runLog  = 'docs/library/AL_BUG_HUNT_RUN_LOG_1.jsonl'
                    zones   = @('topology-proposal-merge')
                }
                @{
                    id      = 2
                    title   = 'Set 2'
                    command = '/al-bug2'
                    branch  = 'bugsmash-2'
                    ledger  = 'docs/library/AL_BUG_HUNT_LEDGER_2.md'
                    runLog  = 'docs/library/AL_BUG_HUNT_RUN_LOG_2.jsonl'
                    zones   = @('api-key-auth')
                }
            )
        } | ConvertTo-Json -Depth 5

        $configPath = Join-Path $fixtureRoot 'al-bug-zone-sets.json'
        Set-Content -LiteralPath $configPath -Value $config -Encoding UTF8

        $now = '2026-08-19T18:00:00Z'
        $output = Invoke-BugState -ConfigPath $configPath -RepoRoot $fixtureRoot -AtUtc $now
        $report = Get-BugStateJsonFromOutput -Output $output

        $set1 = @($report.sets | Where-Object { $_.setId -eq 1 })[0]
        $set2 = @($report.sets | Where-Object { $_.setId -eq 2 })[0]

        $set1.bugsFound24h | Should -Be 1
        $set1.dryRuns24h | Should -Be 1
        $set1.nonSeed24h | Should -Be 2
        $set1.seedOnly24h | Should -Be 1

        $set2.bugsFound24h | Should -Be 0
        $set2.dryRuns24h | Should -Be 2
        $set2.nonSeed24h | Should -Be 2

        $report.totals.bugsFound24h | Should -Be 1
        $report.totals.dryRuns24h | Should -Be 3
        $report.totals.nonSeed24h | Should -Be 4
    }
}