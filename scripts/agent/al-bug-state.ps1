#Requires -Version 5.1
[CmdletBinding()]
param(
    [switch] $Local,
    [switch] $Fetch,
    [int] $Set = 0,
    [string] $AtUtc,
    [string] $RepoRoot,
    [string] $SetConfigPath
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'al-bug-run-log-utils.ps1')
. (Join-Path $PSScriptRoot 'al-bug-zone-set.ps1')
function ConvertTo-UtcDateTime {
    param([string] $IsoTimestamp)
    return [datetime]::SpecifyKind([datetime]::Parse($IsoTimestamp, $null, [System.Globalization.DateTimeStyles]::AdjustToUniversal -bor [System.Globalization.DateTimeStyles]::AssumeUniversal), [System.DateTimeKind]::Utc)
}
function Read-HuntRunLogLines {
    param([string[]] $Lines)
    $entries = @()
    foreach ($line in $Lines) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $parsed = $line | ConvertFrom-Json
        if ($parsed.PSObject.Properties.Name -notcontains 'zoneId' -and ($parsed.PSObject.Properties.Name -contains 'zone')) {
            $parsed | Add-Member -NotePropertyName zoneId -NotePropertyValue ([string]$parsed.zone) -Force
        }
        $entries += ,$parsed
    }
    return $entries
}
function Read-HuntRunLogFromPath {
    param([string] $Path)
    if (-not (Test-Path -LiteralPath $Path)) { return @() }
    return Read-HuntRunLogLines -Lines (Get-Content -LiteralPath $Path -Encoding UTF8)
}
function Read-HuntRunLogFromGitRef {
    param([string] $Root, [string] $GitRef, [string] $BlobPath)
    $spec = ('{0}:{1}' -f $GitRef, ($BlobPath -replace '\\', '/'))
    $output = & git -C $Root show $spec 2>&1
    if ($LASTEXITCODE -ne 0) { return @() }
    return Read-HuntRunLogLines -Lines @($output | ForEach-Object { [string]$_ })
}
function Get-NonSeed24HourStats {
    param([object[]] $Entries, [datetime] $NowUtc)
    $cutoff = $NowUtc.AddHours(-24)
    $bugsFound = 0; $dryRuns = 0; $seedOnly = 0; $heldForTriage = 0; $nonSeed = 0
    foreach ($entry in $Entries) {
        if (-not (Test-RunLogEntryHasCanonicalTimestamp -Entry $entry)) { continue }
        $at = ConvertTo-UtcDateTime -IsoTimestamp (Get-RunLogEntryIsoTimestamp -Entry $entry)
        if ($at -lt $cutoff) { continue }
        switch ([string]$entry.outcome) {
            'hit' { $bugsFound++; $nonSeed++ }
            'dry' { $dryRuns++; $nonSeed++ }
            'seed-only' { $seedOnly++ }
            'held-for-triage' { $heldForTriage++ }
            default { throw "Unknown hunt outcome '$($entry.outcome)' in run log." }
        }
    }
    $hitRate = 0.0
    $denominator = $bugsFound + $dryRuns
    if ($denominator -gt 0) { $hitRate = [Math]::Round([double]$bugsFound / [double]$denominator, 2) }
    return [pscustomobject]@{ bugsFound24h = $bugsFound; dryRuns24h = $dryRuns; nonSeed24h = $nonSeed; seedOnly24h = $seedOnly; heldForTriage24h = $heldForTriage; hitRate24h = $hitRate }
}
function Write-PerSetBugStatePreview {
    param($Report)
    Write-Host ''
    Write-Host '## /al-bugstate — rolling 24h by bugsmash repo'
    Write-Host ''
    Write-Host ("| Source | {0} |" -f $Report.source)
    Write-Host ("| Window (UTC) | {0} -> {1} |" -f $Report.windowStart, $Report.windowEnd)
    Write-Host ''
    Write-Host '| Set | Branch | Command | Defects (hit) | Dry | Non-seed | Hit rate |'
    Write-Host '| --- | --- | --- | ---: | ---: | ---: | ---: |'
    foreach ($row in $Report.sets) {
        Write-Host ("| {0} | {1} | {2} | {3} | {4} | {5} | {6} |" -f $row.setId, $row.branch, $row.command, $row.bugsFound24h, $row.dryRuns24h, $row.nonSeed24h, $row.hitRate24h)
    }
    Write-Host ''
    Write-Host ("| **All sets** | | | **{0}** | **{1}** | **{2}** | **{3}** |" -f $Report.totals.bugsFound24h, $Report.totals.dryRuns24h, $Report.totals.nonSeed24h, $Report.totals.hitRate24h)
}
if ($Set -ne 0 -and ($Set -lt 1 -or $Set -gt 4)) { throw "Zone set must be 1, 2, 3, or 4. Received $Set." }
$resolvedRoot = if ([string]::IsNullOrWhiteSpace($RepoRoot)) { Get-AlBugZoneSetRepoRoot -ExplicitRoot '' } else { (Resolve-Path -LiteralPath $RepoRoot).Path }
$catalog = Read-AlBugZoneSetCatalog -ConfigPath $SetConfigPath -RepoRoot $resolvedRoot
$sets = @($catalog.sets)
if ($Set -gt 0) { $sets = @($sets | Where-Object { [int]$_.id -eq $Set }) }
if ($Fetch) {
    foreach ($setRow in $sets) {
        $branch = [string]$setRow.branch
        $null = & git -C $resolvedRoot fetch origin $branch --quiet 2>&1
        if ($LASTEXITCODE -ne 0) { Write-Warning ("git fetch origin $branch failed; using local ref if present.") }
    }
}
$nowUtc = [datetime]::UtcNow
if (-not [string]::IsNullOrWhiteSpace($AtUtc)) { $nowUtc = ConvertTo-UtcDateTime -IsoTimestamp $AtUtc }
$cutoff = $nowUtc.AddHours(-24)
$sourceLabel = if (-not $Local) { 'origin/bugsmash branch tips' } else { 'working tree run logs' }
$setRows = @(); $totalBugs = 0; $totalDry = 0
foreach ($setRow in $sets) {
    $runLogRel = [string]$setRow.runLog
    $branch = [string]$setRow.branch
    if (-not $Local) { $entries = Read-HuntRunLogFromGitRef -Root $resolvedRoot -GitRef "origin/$branch" -BlobPath $runLogRel }
    else { $entries = Read-HuntRunLogFromPath -Path (Join-Path $resolvedRoot ($runLogRel -replace '/', [IO.Path]::DirectorySeparatorChar)) }
    $stats = Get-NonSeed24HourStats -Entries $entries -NowUtc $nowUtc
    $totalBugs += $stats.bugsFound24h; $totalDry += $stats.dryRuns24h
    $setRows += [pscustomobject]@{ setId = [int]$setRow.id; branch = $branch; command = [string]$setRow.command; title = [string]$setRow.title; runLog = $runLogRel; bugsFound24h = $stats.bugsFound24h; dryRuns24h = $stats.dryRuns24h; nonSeed24h = $stats.nonSeed24h; seedOnly24h = $stats.seedOnly24h; heldForTriage24h = $stats.heldForTriage24h; hitRate24h = $stats.hitRate24h }
}
$totalNonSeed = $totalBugs + $totalDry
$totalHitRate = 0.0
if ($totalNonSeed -gt 0) { $totalHitRate = [Math]::Round([double]$totalBugs / [double]$totalNonSeed, 2) }
$report = [pscustomobject]@{ source = $sourceLabel; windowStart = $cutoff.ToString('o'); windowEnd = $nowUtc.ToString('o'); sets = $setRows; totals = [pscustomobject]@{ bugsFound24h = $totalBugs; dryRuns24h = $totalDry; nonSeed24h = $totalNonSeed; hitRate24h = $totalHitRate } }
Write-PerSetBugStatePreview -Report $report
$report | ConvertTo-Json -Compress -Depth 5