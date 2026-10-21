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
        $stats.archlucidShared.bugsFound24h | Should -Be 1
        $stats.securenow.bugsFound24h | Should -Be 0
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
        $stats.archlucidShared.dryRuns24h | Should -Be 1
        $stats.archlucidShared.bugsFound24h | Should -Be 1
    }

    It 'records productLine and splits SecureNow vs ArchLucid shared in rolling stats' {
        $log = Join-Path $TestDrive 'product-line.jsonl'
        $now = '2026-08-19T18:00:00Z'

        Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId 'ui-infra-resource-hub' -HuntOutcome hit -AtUtc '2026-08-19T10:00:00Z' | Out-Null
        Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId 'topology-proposal-merge' -HuntOutcome dry -AtUtc '2026-08-19T11:00:00Z' | Out-Null

        $line = Get-Content -LiteralPath $log -Encoding UTF8 | Select-Object -First 1
        $parsed = $line | ConvertFrom-Json
        $parsed.productLine | Should -Be 'securenow'

        $output = Invoke-RollingStats -LogPath $log -Rolling24h -AtUtc $now
        $stats = Get-StatsJsonFromOutput -Output $output

        $stats.securenow.bugsFound24h | Should -Be 1
        $stats.archlucidShared.dryRuns24h | Should -Be 1
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

    It 'RecordHunt never decreases physical line count even when older rows exist' {
        $log = Join-Path $TestDrive 'append-only.jsonl'
        $old = '{"at":"2020-01-01T00:00:00Z","zoneId":"zone-legacy","outcome":"hit","productLine":"archlucid-shared"}'
        $recent = '{"at":"2026-08-19T10:00:00Z","zoneId":"zone-recent","outcome":"dry","productLine":"archlucid-shared"}'
        Set-Content -LiteralPath $log -Value @($old, $recent) -Encoding UTF8

        $before = @(Get-Content -LiteralPath $log -Encoding UTF8).Count

        Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId 'zone-new' -HuntOutcome hit -AtUtc '2026-08-19T12:00:00Z' | Out-Null
        Invoke-RollingStats -LogPath $log -RecordHunt -HuntZoneId 'zone-newer' -HuntOutcome dry -AtUtc '2026-08-19T13:00:00Z' | Out-Null

        $after = @(Get-Content -LiteralPath $log -Encoding UTF8).Count
        $after | Should -BeGreaterOrEqual ($before + 2)
        $after | Should -Be ($before + 2)

        $parsedOld = ($old | ConvertFrom-Json)
        $stillHasLegacy = Get-Content -LiteralPath $log -Encoding UTF8 | Where-Object { $_ -match $parsedOld.zoneId }
        $stillHasLegacy | Should -Not -BeNullOrEmpty
    }
}

Describe 'al-bug zone set run logs' {
    It 'records into the requested run log and refuses a zone from another set' {
        [string]$config = Join-Path $TestDrive 'zone-set-stats.json'
        [string]$log = Join-Path $TestDrive 'set-1.jsonl'
        @'
{
  "sets": [
    {"id": 1, "title": "A", "command": "/al-bug1", "branch": "bugsmash-1", "ledger": "docs/library/AL_BUG_HUNT_LEDGER_1.md", "runLog": "docs/library/AL_BUG_HUNT_RUN_LOG_1.jsonl", "zones": ["zone-a"]},
    {"id": 2, "title": "B", "command": "/al-bug2", "branch": "bugsmash-2", "ledger": "docs/library/AL_BUG_HUNT_LEDGER_2.md", "runLog": "docs/library/AL_BUG_HUNT_RUN_LOG_2.jsonl", "zones": ["zone-b"]},
    {"id": 3, "title": "C", "command": "/al-bug3", "branch": "bugsmash-3", "ledger": "docs/library/AL_BUG_HUNT_LEDGER_3.md", "runLog": "docs/library/AL_BUG_HUNT_RUN_LOG_3.jsonl", "zones": []},
    {"id": 4, "title": "D", "command": "/al-bug4", "branch": "bugsmash-4", "ledger": "docs/library/AL_BUG_HUNT_LEDGER_4.md", "runLog": "docs/library/AL_BUG_HUNT_RUN_LOG_4.jsonl", "zones": []}
  ]
}
'@ | Set-Content -LiteralPath $config -Encoding UTF8

        & $script:statsScript -Set 1 -SetConfigPath $config -RunLogPath $log -RecordHunt -HuntZoneId 'zone-a' -HuntOutcome dry -AtUtc '2026-08-02T00:00:00Z' | Out-Null

        Test-Path -LiteralPath $log | Should -BeTrue
        (Get-Content -LiteralPath $log -Raw -Encoding UTF8) | Should -Match 'zone-a'

        { & $script:statsScript -Set 1 -SetConfigPath $config -RunLogPath $log -RecordHunt -HuntZoneId 'zone-b' -HuntOutcome dry -AtUtc '2026-08-02T00:00:00Z' } | Should -Throw
    }
}
