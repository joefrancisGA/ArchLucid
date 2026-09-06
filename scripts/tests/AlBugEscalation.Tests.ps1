#Requires -Version 5.1
# Run: Invoke-Pester -Path 'scripts/tests/AlBugEscalation.Tests.ps1'
Set-StrictMode -Version Latest

[string]$script:testsDir = $PSScriptRoot
[string]$script:scriptsDir = Split-Path -Parent $script:testsDir
[string]$script:escalationScript = Join-Path $script:scriptsDir 'agent\al-bug-escalation.ps1'

. $script:escalationScript

Describe 'al-bug-escalation.ps1' {

    It 'flags a file after three jsonl hits with paths' {
        $now = [datetime]::UtcNow
        $entries = @(
            [pscustomobject]@{ at = $now.AddDays(-1).ToString('o'); outcome = 'hit'; paths = @('ArchLucid.Core/AzureExtractor/AzureExtractorSensitivePropertyRedactor.cs') },
            [pscustomobject]@{ at = $now.AddDays(-2).ToString('o'); outcome = 'hit'; paths = @('ArchLucid.Core/AzureExtractor/AzureExtractorSensitivePropertyRedactor.cs') },
            [pscustomobject]@{ at = $now.AddDays(-3).ToString('o'); outcome = 'hit'; paths = @('ArchLucid.Core/AzureExtractor/AzureExtractorSensitivePropertyRedactor.cs') }
        )

        $files = Get-EscalatedProductionFiles -RunLogEntries $entries -GitLogText '' -NowUtc $now

        $files | Should Contain 'ArchLucid.Core/AzureExtractor/AzureExtractorSensitivePropertyRedactor.cs'
    }

    It 'holds low-severity hits for triage' {
        Test-AlBugShouldHoldHit -Severity 'low' -EscalatedFiles @() -ChangedPaths @('ArchLucid.Core/Foo.cs') | Should Be $true
        Test-AlBugShouldHoldHit -Severity 'high' -EscalatedFiles @() -ChangedPaths @('ArchLucid.Core/Foo.cs') | Should Be $false
    }

    It 'holds hits that touch escalated files' {
        $escalated = @('ArchLucid.Core/AzureExtractor/AzureExtractorSensitivePropertyRedactor.cs')
        Test-AlBugShouldHoldHit -Severity 'high' -EscalatedFiles $escalated -ChangedPaths @('ArchLucid.Core/AzureExtractor/AzureExtractorSensitivePropertyRedactor.cs') | Should Be $true
    }
}
