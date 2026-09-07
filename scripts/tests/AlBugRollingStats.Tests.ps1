#Requires -Version 5.1
# Run: Invoke-Pester -Path 'scripts/tests/AlBugRollingStats.Tests.ps1'
# Pester 5 syntax to match the version pinned by .github/workflows/ci.yml.
Set-StrictMode -Version Latest

BeforeAll {
    [string]$script:testsDir = $PSScriptRoot
    [string]$script:scriptsDir = Split-Path -Parent $script:testsDir
    [string]$script:statsScript = Join-Path (Join-Path $script:scriptsDir 'agent') 'al-bug-rolling-stats.ps1'

    function Invoke-RollingStats {
        param(
            [string] $LogPath,
            [switch] $RecordHunt,
            [string] $HuntZoneId,
            [string] $HuntOutcome,
            [switch] $Rolling24h,
            [string] $AtUtc,
            [string] $DefectClass
        )

        # Splatted so each optional switch stays absent rather than passing $false.
        [hashtable] $scriptArgs = @{
            RunLogPath = $LogPath
        }

        if ($RecordHunt) {
            $scriptArgs.RecordHunt = $true
            $scriptArgs.HuntZoneId = $HuntZoneId
            $scriptArgs.HuntOutcome = $HuntOutcome
        }

        if ($Rolling24h) {
            $scriptArgs.Rolling24h = $true
        }

        if (-not [string]::IsNullOrWhiteSpace($AtUtc)) {
            $scriptArgs.AtUtc = $AtUtc
        }

        if (-not [string]::IsNullOrWhiteSpace($DefectClass)) {
            $scriptArgs.DefectClass = $DefectClass
        }

        return @(& $script:statsScript @scriptArgs)
    }

    function Get-StatsJsonFromOutput {
        param([object[]] $Output)

        $jsonLine = @($Output | Where-Object { $_ -match '^\{' })[-1]

        if ($null -eq $jsonLine) {
            throw 'Rolling 24h JSON line was not found in script output.'
        }

        return ($jsonLine | ConvertFrom-Json)
    }
}

Describe 'al-bug-rolling-stats.ps1' {

    It 'records a hit and reports rolling 24h stats' {
        $log = Join-Path $TestDrive 'hit-only.jsonl'
        $at = '2026-08-19T12:00:00Z'

        Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId 'zone-a' -HuntOutcome hit -AtUtc $at | Out-Null
        $output = Invoke-RollingStats -LogPath $log -Rolling24h -AtUtc $at
        $stats = Get-StatsJsonFromOutput -Output $output

        $stats.bugsFound24h | Should -Be 1
        $stats.dryRuns24h | Should -Be 0
        $stats.hitRate24h | Should -Be 1
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

        $stats.bugsFound24h | Should -Be 1
        $stats.dryRuns24h | Should -Be 1
        $stats.seedOnly24h | Should -Be 1
    }

    It 'warns on implausible 24h hit rate' {
        $log = Join-Path $TestDrive 'high-hit-rate.jsonl'
        $now = '2026-08-19T18:00:00Z'

        for ($i = 0; $i -lt 6; $i++) {
            Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId ('zone-{0}' -f $i) -HuntOutcome hit -AtUtc ('2026-08-19T1{0}:00:00Z' -f $i) | Out-Null
        }

        Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId 'zone-dry' -HuntOutcome dry -AtUtc '2026-08-19T11:00:00Z' | Out-Null
        Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId 'zone-dry2' -HuntOutcome dry -AtUtc '2026-08-19T12:00:00Z' | Out-Null

        $output = Invoke-RollingStats -LogPath $log -Rolling24h -AtUtc $now
        $stats = Get-StatsJsonFromOutput -Output $output

        $stats.hitRate24h | Should -BeGreaterThan 0.6
        $stats.warning24h | Should -Not -BeNullOrEmpty
    }

    It 'requires HuntZoneId and HuntOutcome when recording' {
        $log = Join-Path $TestDrive 'validation.jsonl'

        { & $script:statsScript -RunLogPath $log -RecordHunt -HuntOutcome dry } | Should -Throw -ExpectedMessage '*HuntZoneId*'
        { & $script:statsScript -RunLogPath $log -RecordHunt -HuntZoneId 'zone-a' } | Should -Throw -ExpectedMessage '*HuntOutcome*'
    }

    It 'records optional defectClass on hunt hits' {
        $log = Join-Path $TestDrive 'defect-class.jsonl'
        $at = '2026-08-19T12:00:00Z'

        Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId 'zone-a' -HuntOutcome hit -AtUtc $at -DefectClass 'boolean-coercion' | Out-Null
        $line = Get-Content -LiteralPath $log -Encoding UTF8 | Select-Object -Last 1
        $parsed = $line | ConvertFrom-Json

        $parsed.defectClass | Should -Be 'boolean-coercion'
    }
}
