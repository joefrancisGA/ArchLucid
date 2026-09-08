#Requires -Version 5.1
<#
.SYNOPSIS
  Records /al-bug hunt outcomes and prints rolling 24-hour yield stats.

.DESCRIPTION
  Appends hunt events to docs/library/AL_BUG_HUNT_RUN_LOG.jsonl (one JSON object per line).
  Use after each /al-bug invocation that completes a hunt (hit, dry, or seed-only).
  Do not record for --status preview-only runs.

.PARAMETER RecordHunt
  Append a hunt outcome to the run log.

.PARAMETER HuntZoneId
  Ledger zone id for the completed hunt (required with -RecordHunt).

.PARAMETER HuntOutcome
  hit | dry | seed-only

.PARAMETER Rolling24h
  Print a markdown table of bugs found and dry runs in the previous 24 hours.

.PARAMETER AtUtc
  Optional UTC timestamp for the recorded event (ISO 8601). Tests only.

.PARAMETER RepoRoot
  Optional repository root.

.PARAMETER RunLogPath
  Optional override for the JSONL log path.

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

    [string] $AtUtc,

    [string] $RepoRoot,

    [string] $RunLogPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

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

function Get-Rolling24HourHuntStats {
    param(
        [object[]] $Entries,
        [datetime] $NowUtc
    )

    $cutoff = $NowUtc.AddHours(-24)
    $bugsFound = 0
    $dryRuns = 0
    $seedOnly = 0
    $huntsInWindow = 0

    foreach ($entry in $Entries) {
        $at = ConvertTo-UtcDateTime -IsoTimestamp ([string]$entry.at)

        if ($at -lt $cutoff) {
            continue
        }

        switch ([string]$entry.outcome) {
            'hit' {
                $bugsFound++
                $huntsInWindow++
            }
            'dry' {
                $dryRuns++
                $huntsInWindow++
            }
            'seed-only' { $seedOnly++ }
            'held-for-triage' { }
            default {
                throw "Unknown hunt outcome '$($entry.outcome)' in run log."
            }
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
        bugsFound24h   = $bugsFound
        dryRuns24h     = $dryRuns
        seedOnly24h    = $seedOnly
        huntsInWindow  = $huntsInWindow
        hitRate24h     = [Math]::Round($hitRate, 2)
        warning24h     = $warning
        windowStart    = $cutoff.ToString('o')
        windowEnd      = $NowUtc.ToString('o')
    }
}

function Write-Rolling24HourHuntPreview {
    param($Stats)

    Write-Host ''
    Write-Host '## /al-bug rolling 24h'
    Write-Host ''
    Write-Host '| Field | Value |'
    Write-Host '| --- | --- |'
    Write-Host ("| Bugs found | {0} |" -f $Stats.bugsFound24h)
    Write-Host ("| Dry runs | {0} |" -f $Stats.dryRuns24h)
    Write-Host ("| Hit rate | {0} |" -f $Stats.hitRate24h)

    if (-not [string]::IsNullOrWhiteSpace($Stats.warning24h)) {
        Write-Host ("| Warning | {0} |" -f $Stats.warning24h)
    }

    Write-Host ("| Window (UTC) | {0} -> {1} |" -f $Stats.windowStart, $Stats.windowEnd)
}

function Prune-HuntRunLog {
    param(
        [object[]] $Entries,
        [datetime] $NowUtc
    )

    $retentionCutoff = $NowUtc.AddDays(-30)

    return @(
        $Entries | Where-Object {
            $at = ConvertTo-UtcDateTime -IsoTimestamp ([string]$_.at)
            $at -ge $retentionCutoff
        }
    )
}

function Write-HuntRunLog {
    param(
        [string] $Path,
        [object[]] $Entries
    )

    $parent = Split-Path -Parent $Path

    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    if ($Entries.Count -eq 0) {
        if (Test-Path -LiteralPath $Path) {
            Set-Content -LiteralPath $Path -Value '' -Encoding UTF8 -NoNewline
        }

        return
    }

    $lines = $Entries | ForEach-Object {
        ($_ | ConvertTo-Json -Compress)
    }

    Set-Content -LiteralPath $Path -Value $lines -Encoding UTF8
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
$resolvedLog = $RunLogPath

if ([string]::IsNullOrWhiteSpace($resolvedLog)) {
    $resolvedLog = Get-DefaultHuntRunLogPath -Root $resolvedRoot
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
    $newEntry = [pscustomobject]@{
        at      = $nowUtc.ToString('o')
        zoneId  = $HuntZoneId
        outcome = $HuntOutcome
    }

    if ($HuntPaths -and $HuntPaths.Count -gt 0) {
        $newEntry | Add-Member -NotePropertyName paths -NotePropertyValue @($HuntPaths)
    }

    if (-not [string]::IsNullOrWhiteSpace($Severity)) {
        $newEntry | Add-Member -NotePropertyName severity -NotePropertyValue $Severity
    }

    if (-not [string]::IsNullOrWhiteSpace($DefectClass)) {
        $newEntry | Add-Member -NotePropertyName defectClass -NotePropertyValue $DefectClass
    }

    $entries = @($entries) + @($newEntry)
    $entries = Prune-HuntRunLog -Entries $entries -NowUtc $nowUtc
    Write-HuntRunLog -Path $resolvedLog -Entries $entries
}

if ($Rolling24h) {
    $stats = Get-Rolling24HourHuntStats -Entries $entries -NowUtc $nowUtc
    Write-Rolling24HourHuntPreview -Stats $stats
    $stats | ConvertTo-Json -Compress
}
