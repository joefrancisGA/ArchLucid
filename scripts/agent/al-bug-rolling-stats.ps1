#Requires -Version 5.1
<#
.SYNOPSIS
  Records /al-bug hunt outcomes and prints rolling 24-hour yield stats.

.DESCRIPTION
  Appends hunt events to docs/library/AL_BUG_HUNT_RUN_LOG.jsonl (one JSON object per line).
  -RecordHunt opens the log in append mode and never rewrites or prunes the file.
  Optional -PruneEntriesOlderThanDays rewrites via a temp file and requires -AllowLineCountDecrease.
  Use after each /al-bug invocation that completes a hunt (hit, dry, or seed-only).
  Do not record for --status preview-only runs.

.PARAMETER RecordHunt
  Append a hunt outcome to the run log.

.PARAMETER HuntZoneId
  Ledger zone id for the completed hunt (required with -RecordHunt).

.PARAMETER HuntOutcome
  hit | dry | seed-only

.PARAMETER Rolling24h
  Print a markdown table of bugs found and dry runs in the previous 24 hours,
  split by product line (SecureNow vs ArchLucid + shared libraries).

.PARAMETER ProductLine
  Optional product line for -RecordHunt: securenow | archlucid-shared (inferred from zone/paths when omitted).

.PARAMETER AtUtc
  Optional UTC timestamp for the recorded event (ISO 8601). Tests only.

.PARAMETER RepoRoot
  Optional repository root.

.PARAMETER RunLogPath
  Optional override for the JSONL log path.

.PARAMETER Set
  Record and report against zone set 1, 2, 3, or 4. The set run log is the default path.

.PARAMETER SetConfigPath
  Override scripts/agent/al-bug-zone-sets.json (tests).

.EXAMPLE
  .\scripts\agent\al-bug-rolling-stats.ps1 -RecordHunt -HuntZoneId 'topology-proposal-merge' -HuntOutcome dry -Rolling24h
#>
[CmdletBinding()]
param(
    [switch] $RecordHunt,

    [string] $HuntZoneId,

    [ValidateSet('hit', 'dry', 'seed-only', 'held-for-triage')]
    [string] $HuntOutcome,

    [string[]] $HuntPaths,

    [ValidateSet('high', 'medium', 'low')]
    [string] $Severity,

    [ValidateSet(
        'fail-open-validation',
        'boolean-coercion',
        'strictmode-script',
        'state-machine-gap',
        'null-deref',
        'off-by-one',
        'authz-scope',
        'other'
    )]
    [string] $DefectClass,

    [switch] $Rolling24h,

    [ValidateSet('securenow', 'archlucid-shared')]
    [string] $ProductLine,

    [string] $AtUtc,

    [string] $RepoRoot,

    [string] $RunLogPath,

    [int] $Set = 0,

    [string] $SetConfigPath,

    [int] $PruneEntriesOlderThanDays,

    [switch] $AllowLineCountDecrease
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runLogUtilsScript = Join-Path $PSScriptRoot 'al-bug-run-log-utils.ps1'

if (-not (Test-Path -LiteralPath $runLogUtilsScript)) {
    throw "Missing run log helper: '$runLogUtilsScript'."
}

. $runLogUtilsScript

$zoneSetScript = Join-Path $PSScriptRoot 'al-bug-zone-set.ps1'

if (-not (Test-Path -LiteralPath $zoneSetScript)) {
    throw "Missing zone set helper: '$zoneSetScript'."
}

. $zoneSetScript

function Get-RepoRoot {
    param([string] $ExplicitRoot)

    if (-not [string]::IsNullOrWhiteSpace($ExplicitRoot)) {
        return (Resolve-Path -LiteralPath $ExplicitRoot).Path
    }

    $dir = $PSScriptRoot

    while ($null -ne $dir) {
        if (Test-Path -LiteralPath (Join-Path $dir '.git')) {
            return (Resolve-Path -LiteralPath $dir).Path
        }

        $parent = Split-Path -Parent $dir

        if ([string]::IsNullOrEmpty($parent) -or $parent -eq $dir) {
            break
        }

        $dir = $parent
    }

    throw 'Could not locate repository root (.git).'
}

function Get-DefaultHuntRunLogPath {
    param([string] $Root)

    return Join-Path $Root 'docs\library\AL_BUG_HUNT_RUN_LOG.jsonl'
}

function Read-HuntRunLog {
    param([string] $Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return @()
    }

    $entries = @()
    $lines = Get-Content -LiteralPath $Path -Encoding UTF8

    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        try {
            $parsed = $line | ConvertFrom-Json

            if ($parsed.PSObject.Properties.Name -notcontains 'zoneId' -and ($parsed.PSObject.Properties.Name -contains 'zone')) {
                $parsed | Add-Member -NotePropertyName zoneId -NotePropertyValue ([string]$parsed.zone) -Force
            }

            $entries += ,$parsed
        }
        catch {
            throw "Invalid JSONL line in '$Path': $line"
        }
    }

    return $entries
}

function ConvertTo-UtcDateTime {
    param([string] $IsoTimestamp)

    return [datetime]::SpecifyKind(
        [datetime]::Parse(
            $IsoTimestamp,
            $null,
            [System.Globalization.DateTimeStyles]::AdjustToUniversal -bor [System.Globalization.DateTimeStyles]::AssumeUniversal
        ),
        [System.DateTimeKind]::Utc
    )
}

function Get-ProductLineClassifierScriptPath {
    param([string] $Root)

    return Join-Path $Root 'scripts\agent\al_bug_hunt_product_line.py'
}

function Invoke-HuntProductLineClassifier {
    param(
        [string] $RepoRoot,
        [string] $ZoneId,
        [string[]] $Paths,
        [string] $ExplicitProductLine
    )

    $scriptPath = Get-ProductLineClassifierScriptPath -Root $RepoRoot

    if (-not (Test-Path -LiteralPath $scriptPath)) {
        throw "Missing product-line classifier at '$scriptPath'."
    }

    $python = if (Get-Command python3 -ErrorAction SilentlyContinue) { 'python3' } else { 'python' }
    $argList = @(
        $scriptPath,
        '--classify',
        '--zone-id',
        $ZoneId
    )

    if ($Paths -and $Paths.Count -gt 0) {
        $argList += @('--paths', ($Paths -join ','))
    }

    if (-not [string]::IsNullOrWhiteSpace($ExplicitProductLine)) {
        $argList += @('--product-line', $ExplicitProductLine)
    }

    $result = & $python @argList 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "Product-line classifier failed: $result"
    }

    $line = @($result | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })[-1]

    if ($line -notin @('securenow', 'archlucid-shared')) {
        throw "Unexpected product-line classifier output: '$line'."
    }

    return [string]$line
}

function New-ProductLine24HourBucket {
    return [pscustomobject]@{
        bugsFound24h = 0
        dryRuns24h   = 0
        hitRate24h   = 0.0
    }
}

function Update-ProductLine24HourBucket {
    param(
        $Bucket,
        [ValidateSet('hit', 'dry')]
        [string] $Outcome
    )

    switch ($Outcome) {
        'hit' { $Bucket.bugsFound24h++ }
        'dry' { $Bucket.dryRuns24h++ }
    }

    $denominator = $Bucket.bugsFound24h + $Bucket.dryRuns24h

    if ($denominator -gt 0) {
        $Bucket.hitRate24h = [Math]::Round([double]$Bucket.bugsFound24h / [double]$denominator, 2)
    }
}

function Get-Rolling24HourHuntStats {
    param(
        [object[]] $Entries,
        [datetime] $NowUtc,
        [string] $RepoRoot
    )

    $cutoff = $NowUtc.AddHours(-24)
    $bugsFound = 0
    $dryRuns = 0
    $seedOnly = 0
    $huntsInWindow = 0
    $securenow = New-ProductLine24HourBucket
    $archlucidShared = New-ProductLine24HourBucket

    foreach ($entry in $Entries) {
        if (-not (Test-RunLogEntryHasCanonicalTimestamp -Entry $entry)) {
            $zoneHint = 'unknown'

            if ($entry.PSObject.Properties.Name.Contains('zoneId')) {
                $zoneHint = [string]$entry.zoneId
            }

            Write-Warning ("AL_BUG_HUNT_RUN_LOG entry for zone '$zoneHint' is missing a usable timestamp; skipping for rolling stats.")
            continue
        }

        $at = ConvertTo-UtcDateTime -IsoTimestamp (Get-RunLogEntryIsoTimestamp -Entry $entry)

        if ($at -lt $cutoff) {
            continue
        }

        $outcome = [string]$entry.outcome
        $countedHunt = $false
        $productLine = $null

        switch ($outcome) {
            'hit' {
                $bugsFound++
                $huntsInWindow++
                $countedHunt = $true
            }
            'dry' {
                $dryRuns++
                $huntsInWindow++
                $countedHunt = $true
            }
            'seed-only' { $seedOnly++ }
            'held-for-triage' { }
            default {
                throw "Unknown hunt outcome '$outcome' in run log."
            }
        }

        if (-not $countedHunt) {
            continue
        }

        $entryPaths = @()

        if ($entry.PSObject.Properties.Name -contains 'paths' -and $null -ne $entry.paths) {
            $entryPaths = @($entry.paths)
        }

        $entryProductLine = $null

        if ($entry.PSObject.Properties.Name -contains 'productLine') {
            $entryProductLine = [string]$entry.productLine
        }

        $productLine = Invoke-HuntProductLineClassifier `
            -RepoRoot $RepoRoot `
            -ZoneId ([string]$entry.zoneId) `
            -Paths $entryPaths `
            -ExplicitProductLine $entryProductLine

        if ($productLine -eq 'securenow') {
            Update-ProductLine24HourBucket -Bucket $securenow -Outcome $outcome
        }
        else {
            Update-ProductLine24HourBucket -Bucket $archlucidShared -Outcome $outcome
        }
    }

    $hitRate = 0.0
    $denominator = $bugsFound + $dryRuns

    if ($denominator -gt 0) {
        $hitRate = [double]$bugsFound / [double]$denominator
    }

    $warning = $null

    if ($denominator -ge 8 -and $hitRate -ge 0.6) {
        $warning = 'Implausible 24h hit rate — review hunt-ready bar and instance-list fixes before celebrating yield.'
    }

    return [pscustomobject]@{
        bugsFound24h        = $bugsFound
        dryRuns24h          = $dryRuns
        seedOnly24h         = $seedOnly
        huntsInWindow       = $huntsInWindow
        hitRate24h          = [Math]::Round($hitRate, 2)
        warning24h          = $warning
        windowStart         = $cutoff.ToString('o')
        windowEnd           = $NowUtc.ToString('o')
        securenow           = $securenow
        archlucidShared     = $archlucidShared
    }
}

function Write-Rolling24HourHuntPreview {
    param($Stats)

    Write-Host ''
    Write-Host '## /al-bug rolling 24h'
    Write-Host ''
    Write-Host '| Field | Value |'
    Write-Host '| --- | --- |'
    Write-Host ("| Bugs found (total) | {0} |" -f $Stats.bugsFound24h)
    Write-Host ("| Dry runs (total) | {0} |" -f $Stats.dryRuns24h)
    Write-Host ("| Hit rate (total) | {0} |" -f $Stats.hitRate24h)
    Write-Host ''
    Write-Host '### SecureNow'
    Write-Host ''
    Write-Host '| Field | Value |'
    Write-Host '| --- | --- |'
    Write-Host ("| Bugs found (24h) | {0} |" -f $Stats.securenow.bugsFound24h)
    Write-Host ("| Dry runs (24h) | {0} |" -f $Stats.securenow.dryRuns24h)
    Write-Host ("| Hit rate | {0} |" -f $Stats.securenow.hitRate24h)
    Write-Host ''
    Write-Host '### ArchLucid + shared libraries'
    Write-Host ''
    Write-Host '| Field | Value |'
    Write-Host '| --- | --- |'
    Write-Host ("| Bugs found (24h) | {0} |" -f $Stats.archlucidShared.bugsFound24h)
    Write-Host ("| Dry runs (24h) | {0} |" -f $Stats.archlucidShared.dryRuns24h)
    Write-Host ("| Hit rate | {0} |" -f $Stats.archlucidShared.hitRate24h)

    if (-not [string]::IsNullOrWhiteSpace($Stats.warning24h)) {
        Write-Host ''
        Write-Host ("| Warning | {0} |" -f $Stats.warning24h)
    }

    Write-Host ''
    Write-Host ("| Window (UTC) | {0} -> {1} |" -f $Stats.windowStart, $Stats.windowEnd)
}

function Prune-HuntRunLog {
    param(
        [object[]] $Entries,
        [datetime] $NowUtc,
        [int] $OlderThanDays = 30
    )

    if ($OlderThanDays -le 0) {
        return @($Entries)
    }

    $retentionCutoff = $NowUtc.AddDays(-1 * $OlderThanDays)

    return @(
        $Entries | Where-Object {
            $at = ConvertTo-UtcDateTime -IsoTimestamp (Get-RunLogEntryIsoTimestamp -Entry $_)
            $at -ge $retentionCutoff
        }
    )
}

function Convert-HuntRunLogEntriesToJsonLines {
    param([object[]] $Entries)

    return @(
        $Entries | ForEach-Object {
            ($_ | ConvertTo-Json -Compress)
        }
    )
}

function Write-HuntRunLogPruned {
    param(
        [string] $Path,
        [object[]] $Entries,
        [switch] $AllowLineCountDecrease
    )

    $lines = Convert-HuntRunLogEntriesToJsonLines -Entries $Entries
    Rewrite-HuntRunLogWithLineCountGuard -Path $Path -NewLines $lines -AllowLineCountDecrease:$AllowLineCountDecrease
}

if (-not $RecordHunt -and -not $Rolling24h) {
    throw 'Specify -RecordHunt and/or -Rolling24h.'
}

if ($RecordHunt) {
    if ([string]::IsNullOrWhiteSpace($HuntZoneId)) {
        throw '-HuntZoneId is required with -RecordHunt.'
    }

    if ([string]::IsNullOrWhiteSpace($HuntOutcome)) {
        throw '-HuntOutcome is required with -RecordHunt.'
    }
}

$resolvedRoot = Get-RepoRoot -ExplicitRoot $RepoRoot

if ($Set -ne 0 -and ($Set -lt 1 -or $Set -gt 4)) {
    throw "Zone set must be 1, 2, 3, or 4. Received $Set."
}

$requestedSet = $null

if ($Set -gt 0) {
    $requestedSet = Get-AlBugZoneSet -Id $Set -ConfigPath $SetConfigPath -RepoRoot $resolvedRoot

    if ($RecordHunt) {
        $owner = Get-AlBugZoneSetForZoneId -ZoneId $HuntZoneId -ConfigPath $SetConfigPath -RepoRoot $resolvedRoot

        if ($null -eq $owner -or [int]$owner.id -ne $Set) {
            $ownerLabel = if ($null -eq $owner) { 'no set' } else { "set $($owner.id) ($($owner.command))" }
            throw "Hunt zone '$HuntZoneId' belongs to $ownerLabel. This record is for set $Set ($($requestedSet.command))."
        }
    }
}

$resolvedLog = $RunLogPath

if ([string]::IsNullOrWhiteSpace($resolvedLog)) {
    if ($null -ne $requestedSet) {
        $resolvedLog = Join-Path $resolvedRoot ($requestedSet.runLog -replace '/', [IO.Path]::DirectorySeparatorChar)
    }
    else {
        $resolvedLog = Get-DefaultHuntRunLogPath -Root $resolvedRoot
    }
}
elseif (-not [IO.Path]::IsPathRooted($resolvedLog)) {
    $resolvedLog = Join-Path $resolvedRoot ($resolvedLog -replace '/', [IO.Path]::DirectorySeparatorChar)
}

$nowUtc = [datetime]::UtcNow

if (-not [string]::IsNullOrWhiteSpace($AtUtc)) {
    $nowUtc = ConvertTo-UtcDateTime -IsoTimestamp $AtUtc
}

$entries = Read-HuntRunLog -Path $resolvedLog

if ($RecordHunt) {
    $resolvedPaths = @()

    if ($HuntPaths -and $HuntPaths.Count -gt 0) {
        $resolvedPaths = @($HuntPaths)
    }

    $resolvedProductLine = $ProductLine

    if ([string]::IsNullOrWhiteSpace($resolvedProductLine)) {
        $resolvedProductLine = Invoke-HuntProductLineClassifier `
            -RepoRoot $resolvedRoot `
            -ZoneId $HuntZoneId `
            -Paths $resolvedPaths `
            -ExplicitProductLine ''
    }

    $newEntry = [pscustomobject]@{
        at          = $nowUtc.ToString('o')
        zoneId      = $HuntZoneId
        outcome     = $HuntOutcome
        productLine = $resolvedProductLine
    }

    if ($resolvedPaths.Count -gt 0) {
        $newEntry | Add-Member -NotePropertyName paths -NotePropertyValue $resolvedPaths
    }

    if (-not [string]::IsNullOrWhiteSpace($Severity)) {
        $newEntry | Add-Member -NotePropertyName severity -NotePropertyValue $Severity
    }

    if (-not [string]::IsNullOrWhiteSpace($DefectClass)) {
        $newEntry | Add-Member -NotePropertyName defectClass -NotePropertyValue $DefectClass
    }

    $beforeLineCount = Get-HuntRunLogPhysicalLineCount -Path $resolvedLog
    $jsonLine = $newEntry | ConvertTo-Json -Compress
    Add-HuntRunLogEntryLine -Path $resolvedLog -JsonLine $jsonLine
    $afterLineCount = Get-HuntRunLogPhysicalLineCount -Path $resolvedLog

    if ($afterLineCount -lt ($beforeLineCount + 1)) {
        throw @"
AL_BUG_HUNT_RUN_LOG append failed: expected line count >= $($beforeLineCount + 1) but found $afterLineCount.
"@
    }

    $entries = @($entries) + @($newEntry)
}

if ($PruneEntriesOlderThanDays -gt 0) {
    $entries = Read-HuntRunLog -Path $resolvedLog
    $pruned = Prune-HuntRunLog -Entries $entries -NowUtc $nowUtc -OlderThanDays $PruneEntriesOlderThanDays
    $lines = Convert-HuntRunLogEntriesToJsonLines -Entries $pruned
    Rewrite-HuntRunLogWithLineCountGuard -Path $resolvedLog -NewLines $lines -AllowLineCountDecrease:$AllowLineCountDecrease
    $entries = $pruned
}

if ($Rolling24h) {
    $stats = Get-Rolling24HourHuntStats -Entries $entries -NowUtc $nowUtc -RepoRoot $resolvedRoot
    Write-Rolling24HourHuntPreview -Stats $stats
    $stats | ConvertTo-Json -Compress -Depth 4
}
