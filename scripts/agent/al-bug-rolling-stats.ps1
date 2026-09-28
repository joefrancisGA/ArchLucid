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
        $at = ConvertTo-UtcDateTime -IsoTimestamp ([string]$entry.at)

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

    $entries = @($entries) + @($newEntry)
    $entries = Prune-HuntRunLog -Entries $entries -NowUtc $nowUtc
    Write-HuntRunLog -Path $resolvedLog -Entries $entries
}

if ($Rolling24h) {
    $stats = Get-Rolling24HourHuntStats -Entries $entries -NowUtc $nowUtc -RepoRoot $resolvedRoot
    Write-Rolling24HourHuntPreview -Stats $stats
    $stats | ConvertTo-Json -Compress -Depth 4
}
