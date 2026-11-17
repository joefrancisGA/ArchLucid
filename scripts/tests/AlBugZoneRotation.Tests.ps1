#Requires -Version 5.1
# Run: Invoke-Pester -Path 'scripts/tests/AlBugZoneRotation.Tests.ps1'
Set-StrictMode -Version Latest

BeforeAll {
    [string]$script:testsDir = $PSScriptRoot
    [string]$script:scriptsDir = Split-Path -Parent $script:testsDir
    [string]$script:rotationScript = Join-Path (Join-Path $script:scriptsDir 'agent') 'al-bug-zone-rotation.ps1'
    [string]$script:statsScript = Join-Path (Join-Path $script:scriptsDir 'agent') 'al-bug-rolling-stats.ps1'
    [string]$script:setConfig = Join-Path (Join-Path $script:scriptsDir 'agent') 'al-bug-zone-sets.json'

    function Invoke-Rotation {
        param(
            [string] $LogPath,
            [int] $Set = 2,
            [switch] $PreviewPick,
            [string] $LedgerPath,
            [int] $MinLowYieldStreak = 3
        )

        [hashtable]$rotationArgs = @{
            Set            = $Set
            RunLogPath     = $LogPath
            SetConfigPath  = $script:setConfig
            RepoRoot       = (Split-Path -Parent (Split-Path -Parent $script:scriptsDir))
            MinLowYieldStreak = $MinLowYieldStreak
            SkipGitPicker  = $true
        }

        if ($PreviewPick) {
            $rotationArgs.PreviewPick = $true
        }

        if (-not [string]::IsNullOrWhiteSpace($LedgerPath)) {
            $rotationArgs.LedgerPath = $LedgerPath
        }

        [string]$json = @(& $script:rotationScript @rotationArgs) -join "`n"
        return ($json | ConvertFrom-Json)
    }

    function Write-RunLogLines {
        param(
            [string] $Path,
            [string[]] $Lines
        )

        Set-Content -LiteralPath $Path -Value $Lines -Encoding UTF8
    }
}

Describe 'al-bug-zone-rotation.ps1' {

    It 'does not rotate when the streak is below the threshold' {
        $log = Join-Path $TestDrive 'short-streak.jsonl'
        Write-RunLogLines -Path $log -Lines @(
            '{"at":"2026-10-01T00:00:00Z","zoneId":"zone-a","outcome":"dry"}'
            '{"at":"2026-10-02T00:00:00Z","zoneId":"zone-a","outcome":"seed-only"}'
        )

        $result = Invoke-Rotation -LogPath $log -MinLowYieldStreak 3

        $result.shouldRotate | Should -Be $false
        $result.lowYieldStreak | Should -Be 2
        $result.avoidZoneId | Should -BeNullOrEmpty
    }

    It 'rotates after three consecutive low-yield hunts on the same zone' {
        $log = Join-Path $TestDrive 'admin-streak.jsonl'
        Write-RunLogLines -Path $log -Lines @(
            '{"at":"2026-10-01T00:00:00Z","zoneId":"api-authority-admin-controllers","outcome":"seed-only"}'
            '{"at":"2026-10-02T00:00:00Z","zoneId":"api-authority-admin-controllers","outcome":"seed-only"}'
            '{"at":"2026-10-03T00:00:00Z","zoneId":"api-authority-admin-controllers","outcome":"dry"}'
        )

        $result = Invoke-Rotation -LogPath $log

        $result.shouldRotate | Should -Be $true
        $result.avoidZoneId | Should -Be 'api-authority-admin-controllers'
        $result.lowYieldStreak | Should -Be 3
    }

    It 'stops the streak at the most recent hit on the same zone' {
        $log = Join-Path $TestDrive 'hit-breaks.jsonl'
        Write-RunLogLines -Path $log -Lines @(
            '{"at":"2026-10-01T00:00:00Z","zoneId":"zone-a","outcome":"dry"}'
            '{"at":"2026-10-02T00:00:00Z","zoneId":"zone-a","outcome":"hit"}'
            '{"at":"2026-10-03T00:00:00Z","zoneId":"zone-a","outcome":"dry"}'
        )

        $result = Invoke-Rotation -LogPath $log

        $result.shouldRotate | Should -Be $false
        $result.lowYieldStreak | Should -Be 1
    }
}
