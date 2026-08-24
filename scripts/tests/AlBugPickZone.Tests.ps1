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
        $result.score | Should Be 6
        $result.meanHuntsPerBug | Should Be 2
        $result.exploreBonus | Should Be 1
        $result.exhaustedAll | Should Be $false
        $result.seedHunt | Should Be $true
        @($result.openHypotheses).Count | Should Be 1
        @($result.candidateHypotheses).Count | Should Be 1
        @($result.huntReadyHypotheses).Count | Should Be 0
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

        # Untried 6.00 + related 2 = 8.00 vs sibling untried 6.00 (candidates do not add hyp bonus)
        $result.zoneId | Should Be 'zone-pd'
        $result.score | Should Be 8
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
        $result.score | Should Be 6
    }

    It 'exploits a fast sampled zone after the untried sibling has a dry hunt' {
        $content = Get-TwoZoneLedger -ZoneBHunts 1 -ZoneBBugs 0 -ZoneBDry 1
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should Be 'zone-a'
        $result.meanHuntsPerBug | Should Be 1.5
    }

    It 'does not let extra candidate rows raise an untried zone score' {
        $one = Get-TwoZoneLedger -ZoneBOpenCount 1
        $three = Get-TwoZoneLedger -ZoneBOpenCount 3
        [string]$ledgerOne = New-LedgerFixture -Content $one
        $resultOne = Invoke-Picker -LedgerPath $ledgerOne
        [string]$ledgerThree = New-LedgerFixture -Content $three
        $resultThree = Invoke-Picker -LedgerPath $ledgerThree

        $resultOne.zoneId | Should Be 'zone-b'
        $resultThree.zoneId | Should Be 'zone-b'
        $resultOne.score | Should Be $resultThree.score
        $resultOne.score | Should Be 6
        @($resultThree.candidateHypotheses).Count | Should Be 2
    }

    It 'counts only hunt-ready rows in the hypothesis tie-break' {
        $content = @"
# fixture

## Zone: zone-candidates

- **id:** zone-candidates
- **status:** open
- **aliases:** many templates
- **paths:** ArchLucid.Application/Templates.cs
- **test-filter:** FullyQualifiedName~TemplateTests
- **hunts:** 4
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-01
- **last-bug:** 2026-08-01
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [ ] (candidate) Template one
- [ ] (candidate) Template two
- [ ] (candidate) Template three

## Zone: zone-ready

- **id:** zone-ready
- **status:** open
- **aliases:** named branch
- **paths:** ArchLucid.Application/Ready.cs
- **test-filter:** FullyQualifiedName~ReadyTests
- **hunts:** 4
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-01
- **last-bug:** 2026-08-01
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [ ] (hunt-ready) SelectById omits TenantId for the same Guid
"@
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should Be 'zone-ready'
        @($result.huntReadyHypotheses).Count | Should Be 1
        $result.seedHunt | Should Be $false
    }

    It 'prefers higher hypothesis precision when speed is equal' {
        $content = @"
# fixture

## Zone: zone-low-precision

- **id:** zone-low-precision
- **aliases:** noisy templates
- **paths:** ArchLucid.Application/Noisy.cs
- **test-filter:** FullyQualifiedName~NoisyTests
- **hunts:** 6
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-01
- **last-bug:** 2026-08-01
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [ ] Remaining noisy hypothesis
- [x] (proven) Real bug one
- [x] (invalid) Path does not exist
- [x] (invalid) Retired: not applicable
- [x] (valid-no-repro) Listed hypotheses do not hold

## Zone: zone-high-precision

- **id:** zone-high-precision
- **aliases:** accurate claims
- **paths:** ArchLucid.Application/Accurate.cs
- **test-filter:** FullyQualifiedName~AccurateTests
- **hunts:** 6
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-01
- **last-bug:** 2026-08-01
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [ ] Remaining accurate hypothesis
- [x] (proven) Real bug one
- [x] (proven) Real bug two
"@
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should Be 'zone-high-precision'
        $result.hypothesisPrecision | Should Be 1
        $result.provenCount | Should Be 2
        $result.invalidCount | Should Be 0
    }

    It 'treats unseeded like open for eligibility and cooling wait' {
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

## Zone: zone-seed

- **id:** zone-seed
- **status:** unseeded
- **aliases:** never read
- **paths:** ArchLucid.Application/Seed.cs
- **test-filter:** FullyQualifiedName~SeedTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [ ] (candidate) Cross-tenant leak
"@
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should Be 'zone-seed'
        $result.status | Should Be 'unseeded'
        $result.seedHunt | Should Be $true
        @($result.candidateHypotheses).Count | Should Be 1
    }

    It 'does not count valid-no-repro toward precision' {
        $content = @"
# fixture

## Zone: zone-exhausted-correct

- **id:** zone-exhausted-correct
- **status:** open
- **aliases:** already correct
- **paths:** ArchLucid.Application/Correct.cs
- **test-filter:** FullyQualifiedName~CorrectTests
- **hunts:** 1
- **bugs-found:** 0
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-16
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] (valid-no-repro) Primary submit stays enabled — listed hypotheses do not hold
- [x] (valid-no-repro) Toast-only errors — do not hold on current form
"@
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should Be 'zone-exhausted-correct'
        $result.hypothesisPrecision | Should Be $null
        $result.validNoReproCount | Should Be 2
        $result.invalidCount | Should Be 0
        $result.provenCount | Should Be 0
    }

    It 'forces a reseed when a previously hunted open zone has no hypotheses left' {
        $content = @"
# fixture

## Zone: zone-spent

- **id:** zone-spent
- **status:** open
- **aliases:** hypotheses consumed
- **paths:** ArchLucid.Application/Spent.cs
- **test-filter:** FullyQualifiedName~SpentTests
- **hunts:** 8
- **bugs-found:** 7
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] (proven) Every stored hypothesis has been consumed
"@
        [string]$ledger = New-LedgerFixture -Content $content
        $result = Invoke-Picker -LedgerPath $ledger

        $result.zoneId | Should Be 'zone-spent'
        $result.seedHunt | Should Be $true
        @($result.openHypotheses).Count | Should Be 0
    }
}
