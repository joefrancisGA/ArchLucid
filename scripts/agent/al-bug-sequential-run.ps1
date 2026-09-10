#Requires -Version 5.1
<#
.SYNOPSIS
  Orchestrates sequential /al-bug hunts and logs rolling 24h stats after each attempt.

.DESCRIPTION
  Mechanical loop: pick zone, print stats banner. The agent completes each hunt
  (find/fix/ledger) then calls this script with -CompleteHunt to record outcome
  and print rolling 24h yield.

  For unattended batching, pair with an agent that hunts the printed zoneId.

.PARAMETER MaxHunts
  Number of hunt attempts (default 100).

.PARAMETER CompleteHunt
  Record outcome for the current hunt and advance the attempt counter.

.PARAMETER HuntZoneId
  Zone id for -CompleteHunt (required with -CompleteHunt).

.PARAMETER HuntOutcome
  hit | dry | seed-only for -CompleteHunt.

.PARAMETER LogPath
  Append-only progress log (default docs/library/AL_BUG_SEQUENTIAL_100_LOG.md).

.EXAMPLE
  .\scripts\agent\al-bug-sequential-run.ps1 -MaxHunts 100

.EXAMPLE
  .\scripts\agent\al-bug-sequential-run.ps1 -CompleteHunt -HuntZoneId cli-draft-new -HuntOutcome hit
#>
[CmdletBinding()]
param(
    [int] $MaxHunts = 100,

    [switch] $CompleteHunt,

    [string] $HuntZoneId,

    [ValidateSet('hit', 'dry', 'seed-only', 'held-for-triage')]
    [string] $HuntOutcome,

    [ValidateSet('high', 'medium', 'low')]
    [string] $Severity,

    [string[]] $HuntPaths,

    [string] $LogPath,

    [string] $RepoRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = $PSScriptRoot
$pickerScript = Join-Path $scriptDir 'al-bug-pick-zone.ps1'
$statsScript = Join-Path $scriptDir 'al-bug-rolling-stats.ps1'
$escalationScript = Join-Path $scriptDir 'al-bug-escalation.ps1'
$stateFile = Join-Path $scriptDir '.al-bug-sequential-state.json'

if (Test-Path -LiteralPath $escalationScript) {
    . $escalationScript
}

function Get-RepoRootFromScript {
    param([string] $ExplicitRoot)

    if (-not [string]::IsNullOrWhiteSpace($ExplicitRoot)) {
        return (Resolve-Path -LiteralPath $ExplicitRoot).Path
    }

    $dir = $scriptDir

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

function Read-State {
    param([string] $Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return [pscustomobject]@{
            attempt     = 0
            maxHunts    = $MaxHunts
            lastZoneId  = ''
            lastOutcome = ''
        }
    }

    return (Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json)
}

function Get-HuntRunLogJsonlPath {
    param([string] $Root)

    return Join-Path $Root ('docs/library/AL_BUG_HUNT_RUN_LOG.jsonl' -replace '/', [IO.Path]::DirectorySeparatorChar)
}

function Get-CurrentEscalatedFiles {
    param([string] $Root)

    # Hit counts come from per-hunt ledger entries; recent bugsmash commits add one more
    # point per distinct file, so a file repeatedly patched by both signals crosses the threshold.
    if (-not (Get-Command Get-EscalatedProductionFiles -ErrorAction SilentlyContinue)) {
        return @()
    }

    $entries = Read-EscalationRunLogEntries -Path (Get-HuntRunLogJsonlPath -Root $Root)
    $gitPaths = Get-GitBugsmashProductionPaths -GitRepoRoot $Root

    return @(Get-EscalatedProductionFiles `
            -RunLogEntries $entries `
            -GitLogText ($gitPaths -join [Environment]::NewLine) `
            -NowUtc ([datetime]::UtcNow))
}

function Write-State {
    param(
        [string] $Path,
        [object] $State
    )

    Set-Content -LiteralPath $Path -Value ($State | ConvertTo-Json -Compress) -Encoding UTF8 -NoNewline
}

function Append-LogLine {
    param(
        [string] $Path,
        [string] $Line
    )

    $parent = Split-Path -Parent $Path

    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    Add-Content -LiteralPath $Path -Value $Line -Encoding UTF8
}

$resolvedRoot = Get-RepoRootFromScript -ExplicitRoot $RepoRoot
$resolvedLog = $LogPath

if ([string]::IsNullOrWhiteSpace($resolvedLog)) {
    $resolvedLog = Join-Path $resolvedRoot 'docs\library\AL_BUG_SEQUENTIAL_100_LOG.md'
}
elseif (-not [IO.Path]::IsPathRooted($resolvedLog)) {
    $resolvedLog = Join-Path $resolvedRoot ($resolvedLog -replace '/', [IO.Path]::DirectorySeparatorChar)
}

$state = Read-State -Path $stateFile
$state.maxHunts = $MaxHunts

if ($CompleteHunt) {
    if ([string]::IsNullOrWhiteSpace($HuntZoneId)) {
        throw '-HuntZoneId is required with -CompleteHunt.'
    }

    if ([string]::IsNullOrWhiteSpace($HuntOutcome)) {
        throw '-HuntOutcome is required with -CompleteHunt.'
    }

    $resolvedSeverity = $(if ([string]::IsNullOrWhiteSpace($Severity)) { 'medium' } else { $Severity })

    if ($HuntOutcome -eq 'hit' -and (Get-Command Test-AlBugShouldHoldHit -ErrorAction SilentlyContinue)) {
        $escalatedFiles = Get-CurrentEscalatedFiles -Root $resolvedRoot
        $shouldHold = Test-AlBugShouldHoldHit -Severity $resolvedSeverity -EscalatedFiles $escalatedFiles -ChangedPaths @($HuntPaths)

        if ($shouldHold) {
            $HuntOutcome = 'held-for-triage'
            Write-Host ''
            Write-Host '**Held for triage:** low-severity or escalated-file hit — do not auto-push instance-list fixes.'
            Write-Host ''
        }
    }

    $statsArgs = @{
        RecordHunt  = $true
        HuntZoneId  = $HuntZoneId
        HuntOutcome = $HuntOutcome
        Rolling24h  = $true
        RepoRoot    = $resolvedRoot
    }

    if ($HuntPaths -and $HuntPaths.Count -gt 0) {
        $statsArgs.HuntPaths = $HuntPaths
    }

    if (-not [string]::IsNullOrWhiteSpace($resolvedSeverity)) {
        $statsArgs.Severity = $resolvedSeverity
    }

    $statsOutput = & $statsScript @statsArgs
    $statsJson = $statsOutput | Select-Object -Last 1
    $stats = $statsJson | ConvertFrom-Json

    $state.attempt++
    $state.lastZoneId = $HuntZoneId
    $state.lastOutcome = $HuntOutcome
    Write-State -Path $stateFile -State $state

    $line = "| {0} | {1} | {2} | {3} | {4} |" -f $state.attempt, $HuntZoneId, $HuntOutcome, $stats.bugsFound24h, $stats.dryRuns24h
    Append-LogLine -Path $resolvedLog -Line $line

    Write-Host ''
    Write-Host ("========== Hunt attempt {0}/{1} complete ==========" -f $state.attempt, $state.maxHunts)
    Write-Host ("Zone: {0} | Outcome: {1}" -f $HuntZoneId, $HuntOutcome)
    Write-Host ("Bugs found (24h): {0} | Dry runs (24h): {1}" -f $stats.bugsFound24h, $stats.dryRuns24h)
    Write-Host ''

    if ($state.attempt -ge $state.maxHunts) {
        Write-Host 'Reached MaxHunts. Sequential run complete.'
        exit 0
    }

    exit 0
}

if (-not (Test-Path -LiteralPath $resolvedLog)) {
    $header = @(
        '# /al-bug sequential run log',
        '',
        '| Attempt | Zone | Outcome | Bugs found (24h) | Dry runs (24h) |',
        '| --- | --- | --- | --- | --- |'
    )

    Set-Content -LiteralPath $resolvedLog -Value $header -Encoding UTF8
}

if ($state.attempt -ge $state.maxHunts) {
    Write-Host "Already completed $state.attempt hunts (max $state.maxHunts)."
    exit 0
}

$nextAttempt = $state.attempt + 1
Write-Host ''
Write-Host ("========== /al-bug hunt attempt {0}/{1} ==========" -f $nextAttempt, $state.maxHunts)
Write-Host ''

$pickerJson = & $pickerScript -Preview -RepoRoot $resolvedRoot | Select-Object -Last 1
$zone = $pickerJson | ConvertFrom-Json

Write-Host ("Next zone: {0} (status={1}, seedHunt={2})" -f $zone.zoneId, $zone.status, $zone.seedHunt)
Write-Host ("Test filter: {0}" -f $zone.testFilter)
Write-Host ''

if ($zone.exhaustedAll) {
    Write-Host 'All zones exhausted. Stopping sequential run.'
    exit 2
}

exit 0
