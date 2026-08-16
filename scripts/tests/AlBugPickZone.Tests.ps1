#Requires -Version 5.1
# Run: Invoke-Pester -Path 'scripts/tests/AlBugPickZone.Tests.ps1'
# Pester 3.4 syntax (Windows PowerShell 5.1). Do not use Pester 5 -Be / BeforeAll.
Set-StrictMode -Version Latest

[string]$script:testsDir = $PSScriptRoot
[string]$script:scriptsDir = Split-Path -Parent $script:testsDir
[string]$script:pickerScript = Join-Path $script:scriptsDir 'agent\al-bug-pick-zone.ps1'

Describe 'al-bug-pick-zone.ps1' {

    function New-LedgerFixture {
        param([string] $Content)

        [string]$path = Join-Path $TestDrive 'AL_BUG_HUNT_LEDGER.md'
        Set-Content -LiteralPath $path -Value $Content -Encoding UTF8
        return $path
    }

    function Invoke-Picker {
        param(
            [string] $LedgerPath,
            [string] $Hint,
            [switch] $Refresh
        )

        $pickerArgs = @{
            LedgerPath = $LedgerPath
            SkipGit    = $true
        }

        if (-not [string]::IsNullOrWhiteSpace($Hint)) {
            $pickerArgs.Hint = $Hint
        }

        if ($Refresh) {
            $pickerArgs.Refresh = $true
        }

        # 5.1 ConvertTo-Json may emit multiple lines; join before ConvertFrom-Json.
        [string]$json = @(& $script:pickerScript @pickerArgs) -join "`n"
        return ($json | ConvertFrom-Json)
    }

    function Get-TwoZoneLedger {
        param(
            [string] $ZoneAStatus = 'open',
            [string] $ZoneBStatus = 'open',
            [string] $ZoneAChurn = '0',
            [string] $ZoneBChurn = '0',
            [int] $ZoneBOpenCount = 1,
            [int] $ZoneAHunts = 12,
            [int] $ZoneABugs = 8,
            [int] $ZoneADry = 0,
            [int] $ZoneBHunts = 0,
            [int] $ZoneBBugs = 0,
            [int] $ZoneBDry = 0,
            [string] $ZoneBRelated = 'none'
        )

        $bOpen = "- [ ] Untried hypothesis one`n"

        if ($ZoneBOpenCount -gt 1) {
            $bOpen += "- [ ] Untried hypothesis two`n"
        }

        return @"
# fixture

## Zone: zone-a

- **id:** zone-a
- **status:** $ZoneAStatus
- **aliases:** high yield
- **paths:** ArchLucid.Application/Foo.cs
- **test-filter:** FullyQualifiedName~FooTests
- **hunts:** $ZoneAHunts
- **bugs-found:** $ZoneABugs
- **consecutive-dry-hunts:** $ZoneADry
- **last-hunt:** 2026-08-01
- **last-bug:** 2026-08-01
- **related-pd-tb:** none
- **code-changed-since:** $ZoneAChurn

### Hypotheses

- [ ] Remaining hypothesis one
- [ ] Remaining hypothesis two
- [ ] Remaining hypothesis three
- [x] Already covered

## Zone: zone-b

- **id:** zone-b
- **status:** $ZoneBStatus
- **aliases:** untried area
- **paths:** ArchLucid.Application/Bar.cs
- **test-filter:** FullyQualifiedName~BarTests
- **hunts:** $ZoneBHunts
- **bugs-found:** $ZoneBBugs
- **consecutive-dry-hunts:** $ZoneBDry
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** $ZoneBRelated
- **code-changed-since:** $ZoneBChurn

### Hypotheses

$bOpen
"@
    }

    It 'samples an untried zone ahead of a high-hypothesis sampled zone' {
        [string]$ledger = New-LedgerFixture -Content (Get-TwoZoneLedger)
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should Be 'zone-b'
        $result.score | Should Be 6.25
        $result.meanHuntsPerBug | Should Be 2
        $result.exploreBonus | Should Be 1
        $result.exhaustedAll | Should Be $false
        @($result.openHypotheses).Count | Should Be 1
    }

    It 'pins the hinted zone even when another zone scores higher' {
        [string]$ledger = New-LedgerFixture -Content (Get-TwoZoneLedger)
        $result = Invoke-Picker -LedgerPath $ledger -Hint 'zone-b'

        $result.zoneId | Should Be 'zone-b'
        $result.hintOverride | Should Be $true
    }

    It 'matches a hint against an alias' {
        [string]$ledger = New-LedgerFixture -Content (Get-TwoZoneLedger)
        $result = Invoke-Picker -LedgerPath $ledger -Hint 'untried area'

        $result.zoneId | Should Be 'zone-b'
    }

    It 'skips exhausted zones when ledger churn is 0' {
        $content = Get-TwoZoneLedger -ZoneAStatus 'exhausted' -ZoneAChurn '0'
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should Be 'zone-b'
        $result.reopened | Should Be $false
    }

    It 'reopens an exhausted zone when ledger churn is greater than 0' {
        $content = @"
# fixture

## Zone: zone-d

- **id:** zone-d
- **status:** exhausted
- **aliases:** done zone
- **paths:** ArchLucid.Application/Done.cs
- **test-filter:** FullyQualifiedName~DoneTests
- **hunts:** 5
- **bugs-found:** 5
- **consecutive-dry-hunts:** 3
- **last-hunt:** 2026-07-01
- **last-bug:** 2026-06-01
- **related-pd-tb:** none
- **code-changed-since:** 2

### Hypotheses

- [x] Covered
"@
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger -Refresh

        $result.zoneId | Should Be 'zone-d'
        $result.reopened | Should Be $true
        $result.codeChangedSince | Should Be 2
        $result.exhaustedAll | Should Be $false
    }

    It 'skips cooling while any open zone exists' {
        $content = @"
# fixture

## Zone: zone-cool

- **id:** zone-cool
- **status:** cooling
- **aliases:** cooling zone
- **paths:** ArchLucid.Application/Cool.cs
- **test-filter:** FullyQualifiedName~CoolTests
- **hunts:** 10
- **bugs-found:** 10
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-01
- **last-bug:** 2026-08-01
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [ ] Cooling hypothesis one
- [ ] Cooling hypothesis two
- [ ] Cooling hypothesis three
- [ ] Cooling hypothesis four
- [ ] Cooling hypothesis five

## Zone: zone-open

- **id:** zone-open
- **status:** open
- **aliases:** still open
- **paths:** ArchLucid.Application/Open.cs
- **test-filter:** FullyQualifiedName~OpenTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [ ] Open hypothesis
"@
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should Be 'zone-open'
    }

    It 'picks cooling when no open zone remains' {
        $content = @"
# fixture

## Zone: zone-cool

- **id:** zone-cool
- **status:** cooling
- **aliases:** cooling zone
- **paths:** ArchLucid.Application/Cool.cs
- **test-filter:** FullyQualifiedName~CoolTests
- **hunts:** 2
- **bugs-found:** 0
- **consecutive-dry-hunts:** 2
- **last-hunt:** 2026-08-01
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [ ] Still open in cooling
"@
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should Be 'zone-cool'
        $result.status | Should Be 'cooling'
    }

    It 'returns exhaustedAll when no zone is eligible' {
        $content = @"
# fixture

## Zone: zone-d

- **id:** zone-d
- **status:** exhausted
- **aliases:** done zone
- **paths:** ArchLucid.Application/Done.cs
- **test-filter:** FullyQualifiedName~DoneTests
- **hunts:** 5
- **bugs-found:** 5
- **consecutive-dry-hunts:** 3
- **last-hunt:** 2026-07-01
- **last-bug:** 2026-06-01
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] Covered
"@
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should BeNullOrEmpty
        $result.exhaustedAll | Should Be $true
        $result.exhausted | Should Be $true
    }

    It 'throws when the hint matches no zone' {
        [string]$ledger = New-LedgerFixture -Content (Get-TwoZoneLedger)
        { Invoke-Picker -LedgerPath $ledger -Hint 'no-such-zone' } | Should Throw
    }

    It 'adds related PD/TB weight to the untried score' {
        $content = @"
# fixture

## Zone: zone-plain

- **id:** zone-plain
- **status:** open
- **aliases:** plain zone
- **paths:** ArchLucid.Persistence/Bar.cs
- **test-filter:** FullyQualifiedName~BarTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [ ] One open hypothesis

## Zone: zone-pd

- **id:** zone-pd
- **status:** open
- **aliases:** pd zone
- **paths:** ArchLucid.Persistence/Foo.cs
- **test-filter:** FullyQualifiedName~FooTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** PD-003, TB-2005
- **code-changed-since:** 0

### Hypotheses

- [ ] One open hypothesis
"@
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        # Untried 6.25 + related 2 = 8.25 vs sibling untried 6.25
        $result.zoneId | Should Be 'zone-pd'
        $result.score | Should Be 8.25
    }

    It 'prefers faster hunts-per-bug once both zones have been sampled' {
        $content = @"
# fixture

## Zone: zone-slow

- **id:** zone-slow
- **status:** open
- **aliases:** slow zone
- **paths:** ArchLucid.Application/Slow.cs
- **test-filter:** FullyQualifiedName~SlowTests
- **hunts:** 20
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-01
- **last-bug:** 2026-08-01
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [ ] Slow remaining hypothesis

## Zone: zone-fast

- **id:** zone-fast
- **status:** open
- **aliases:** fast zone
- **paths:** ArchLucid.Application/Fast.cs
- **test-filter:** FullyQualifiedName~FastTests
- **hunts:** 12
- **bugs-found:** 8
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-01
- **last-bug:** 2026-08-01
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [ ] Fast remaining hypothesis
"@
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should Be 'zone-fast'
        $result.meanHuntsPerBug | Should Be 1.5
    }

    It 'prefers a fresh untried zone over a dry-streak zone' {
        $content = Get-TwoZoneLedger -ZoneAHunts 1 -ZoneABugs 0 -ZoneADry 1
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should Be 'zone-b'
        $result.score | Should Be 6.25
    }

    It 'exploits a fast sampled zone after the untried sibling has a dry hunt' {
        $content = Get-TwoZoneLedger -ZoneBHunts 1 -ZoneBBugs 0 -ZoneBDry 1
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should Be 'zone-a'
        $result.meanHuntsPerBug | Should Be 1.5
    }
}
