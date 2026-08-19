#Requires -Version 5.1
# Run: Invoke-Pester -Path 'scripts/tests/AlBugRollingStats.Tests.ps1'
# Pester 3.4 syntax (Windows PowerShell 5.1). Do not use Pester 5 -Be / BeforeAll.
Set-StrictMode -Version Latest

[string]$script:testsDir = $PSScriptRoot
[string]$script:scriptsDir = Split-Path -Parent $script:testsDir
[string]$script:statsScript = Join-Path $script:scriptsDir 'agent\al-bug-rolling-stats.ps1'

Describe 'al-bug-rolling-stats.ps1' {

    function Invoke-RollingStats {
        param(
            [string] $LogPath,
            [switch] $RecordHunt,
            [string] $HuntZoneId,
            [string] $HuntOutcome,
            [switch] $Rolling24h,
            [string] $AtUtc
        )

        $args = @{
            RunLogPath = $LogPath
        }

        if ($RecordHunt) {
            $args.RecordHunt = $true
            $args.HuntZoneId = $HuntZoneId
            $args.HuntOutcome = $HuntOutcome
        }

        if ($Rolling24h) {
            $args.Rolling24h = $true
        }

        if (-not [string]::IsNullOrWhiteSpace($AtUtc)) {
            $args.AtUtc = $AtUtc
        }

        return @(& $script:statsScript @args)
    }

    function Get-StatsJsonFromOutput {
        param([object[]] $Output)

        $jsonLine = @($Output | Where-Object { $_ -match '^\{' })[-1]

        if ($null -eq $jsonLine) {
            throw 'Rolling 24h JSON line was not found in script output.'
        }

        return ($jsonLine | ConvertFrom-Json)
    }

    It 'records a hit and reports rolling 24h stats' {
        $log = Join-Path $TestDrive 'hit-only.jsonl'
        $at = '2026-08-19T12:00:00Z'

        Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId 'zone-a' -HuntOutcome hit -AtUtc $at | Out-Null
        $output = Invoke-RollingStats -LogPath $log -Rolling24h -AtUtc $at
        $stats = Get-StatsJsonFromOutput -Output $output

        $stats.bugsFound24h | Should Be 1
        $stats.dryRuns24h | Should Be 0
    }

    It 'counts dry runs inside the 24h window and excludes older events' {
        $log = Join-Path $TestDrive 'mixed-window.jsonl'
        $now = '2026-08-19T18:00:00Z'

        Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId 'zone-a' -HuntOutcome dry -AtUtc '2026-08-18T17:59:59Z' | Out-Null
        Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId 'zone-b' -HuntOutcome dry -AtUtc '2026-08-19T10:00:00Z' | Out-Null
        Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId 'zone-c' -HuntOutcome hit -AtUtc '2026-08-19T11:00:00Z' | Out-Null
        Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId 'zone-d' -HuntOutcome seed-only -AtUtc '2026-08-19T12:00:00Z' | Out-Null

        $output = Invoke-RollingStats -LogPath $log -Rolling24h -AtUtc $now
        $stats = Get-StatsJsonFromOutput -Output $output

        $stats.bugsFound24h | Should Be 1
        $stats.dryRuns24h | Should Be 1
        $stats.seedOnly24h | Should Be 1
    }

    It 'requires HuntZoneId and HuntOutcome when recording' {
        $log = Join-Path $TestDrive 'validation.jsonl'

        { & $script:statsScript -RunLogPath $log -RecordHunt -HuntOutcome dry } | Should Throw 'HuntZoneId'
        { & $script:statsScript -RunLogPath $log -RecordHunt -HuntZoneId 'zone-a' } | Should Throw 'HuntOutcome'
    }
}
