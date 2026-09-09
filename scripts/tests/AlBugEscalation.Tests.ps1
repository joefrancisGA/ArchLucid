#Requires -Version 5.1
# Run: Invoke-Pester -Path 'scripts/tests/AlBugEscalation.Tests.ps1'
# Pester 5 syntax to match the version pinned by .github/workflows/ci.yml.
Set-StrictMode -Version Latest

BeforeAll {
    [string]$script:testsDir = $PSScriptRoot
    [string]$script:scriptsDir = Split-Path -Parent $script:testsDir
    [string]$script:agentDir = Join-Path $script:scriptsDir 'agent'
    [string]$script:escalationScript = Join-Path $script:agentDir 'al-bug-escalation.ps1'
    [string]$script:sequentialScript = Join-Path $script:agentDir 'al-bug-sequential-run.ps1'

    . $script:escalationScript

    [string]$script:redactorPath = 'ArchLucid.Core/AzureExtractor/AzureExtractorSensitivePropertyRedactor.cs'

    function New-HitEntry {
        param(
            [datetime] $At,
            [string[]] $Paths
        )

        return [pscustomobject]@{ at = $At.ToString('o'); outcome = 'hit'; paths = $Paths }
    }
}

Describe 'al-bug-escalation.ps1' {

    It 'flags a file after three jsonl hits with paths' {
        $now = [datetime]::UtcNow
        $entries = @(
            New-HitEntry -At $now.AddDays(-1) -Paths @($script:redactorPath)
            New-HitEntry -At $now.AddDays(-2) -Paths @($script:redactorPath)
            New-HitEntry -At $now.AddDays(-3) -Paths @($script:redactorPath)
        )

        $files = Get-EscalatedProductionFiles -RunLogEntries $entries -GitLogText '' -NowUtc $now

        $files | Should -Contain $script:redactorPath
    }

    It 'does not flag a file below the hit threshold' {
        $now = [datetime]::UtcNow
        $entries = @(New-HitEntry -At $now.AddDays(-1) -Paths @($script:redactorPath))

        $files = Get-EscalatedProductionFiles -RunLogEntries $entries -GitLogText '' -NowUtc $now

        $files | Should -Not -Contain $script:redactorPath
    }

    It 'ignores hits that fall outside the escalation window' {
        $now = [datetime]::UtcNow
        $entries = @(
            New-HitEntry -At $now.AddDays(-40) -Paths @($script:redactorPath)
            New-HitEntry -At $now.AddDays(-41) -Paths @($script:redactorPath)
            New-HitEntry -At $now.AddDays(-42) -Paths @($script:redactorPath)
        )

        $files = Get-EscalatedProductionFiles -RunLogEntries $entries -GitLogText '' -NowUtc $now

        $files | Should -Not -Contain $script:redactorPath
    }

    It 'excludes test and markdown paths from escalation' {
        Test-IsProductionEscalationPath -Path 'ArchLucid.Core.Tests/Foo.cs' | Should -BeFalse
        Test-IsProductionEscalationPath -Path 'docs/library/AL_BUG_HUNT_LEDGER.md' | Should -BeFalse
        Test-IsProductionEscalationPath -Path $script:redactorPath | Should -BeTrue
    }

    It 'holds low-severity hits for triage' {
        Test-AlBugShouldHoldHit -Severity 'low' -EscalatedFiles @() -ChangedPaths @('ArchLucid.Core/Foo.cs') | Should -BeTrue
        Test-AlBugShouldHoldHit -Severity 'high' -EscalatedFiles @() -ChangedPaths @('ArchLucid.Core/Foo.cs') | Should -BeFalse
    }

    It 'holds hits that touch escalated files' {
        $escalated = @($script:redactorPath)

        Test-AlBugShouldHoldHit -Severity 'high' -EscalatedFiles $escalated -ChangedPaths @($script:redactorPath) | Should -BeTrue
    }

    It 'combines ledger hits with bugsmash git paths to reach the threshold' {
        $now = [datetime]::UtcNow
        $entries = @(
            New-HitEntry -At $now.AddDays(-1) -Paths @($script:redactorPath)
            New-HitEntry -At $now.AddDays(-2) -Paths @($script:redactorPath)
        )

        $files = Get-EscalatedProductionFiles -RunLogEntries $entries -GitLogText $script:redactorPath -NowUtc $now

        $files | Should -Contain $script:redactorPath
    }
}

Describe 'al-bug-sequential-run.ps1 escalation wiring' {

    It 'resolves escalated files from the real run log instead of an empty list' {
        # Regression guard: the hold check previously received a hard-coded empty
        # escalated-file list, so only the low-severity branch could ever fire.
        $text = Get-Content -LiteralPath $script:sequentialScript -Raw -Encoding UTF8

        $text | Should -Not -Match '-EscalatedFiles\s+@\(\)'
        $text | Should -Match 'Get-CurrentEscalatedFiles'
    }

    It 'points escalation at the jsonl hunt run log' {
        $text = Get-Content -LiteralPath $script:sequentialScript -Raw -Encoding UTF8

        $text | Should -Match 'AL_BUG_HUNT_RUN_LOG\.jsonl'
    }
}
