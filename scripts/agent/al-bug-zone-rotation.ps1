#Requires -Version 5.1
<#
.SYNOPSIS
  Decide when /al-bug should avoid the default zone after a low-yield streak.

.DESCRIPTION
  Reads the set run log from the end and counts consecutive low-yield outcomes
  (dry, seed-only, held-for-triage) on the same zoneId. When the streak meets
  -MinLowYieldStreak (default 3), emits shouldRotate=true and avoidZoneId so the
  picker can choose the next eligible zone via -AvoidZoneId.

  Use -PreviewPick to run al-bug-pick-zone.ps1 in the same invocation (respects
  -AvoidZoneId when rotating; skips avoidance when -Hint is set).

.PARAMETER Set
  Zone set 1, 2, 3, or 4 (required).

.PARAMETER MinLowYieldStreak
  Consecutive same-zone low-yield hunts before rotation (default 3).

.PARAMETER PreviewPick
  Include picker JSON (with -Preview) as property pickResult.

.PARAMETER Hint
  Optional hunt hint forwarded to the picker (disables avoidance).

.PARAMETER Refresh
  Forward -Refresh to the picker.

.PARAMETER RepoRoot
  Optional repository root.

.PARAMETER RunLogPath
  Override run log path (tests).

.PARAMETER SetConfigPath
  Override al-bug-zone-sets.json (tests).

.PARAMETER LedgerPath
  Override ledger path for picker (tests).

.EXAMPLE
  .\scripts\agent\al-bug-zone-rotation.ps1 -Set 2 -PreviewPick -SkipGitPicker
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateRange(1, 4)]
    [int] $Set,

    [int] $MinLowYieldStreak = 3,

    [switch] $PreviewPick,

    [string] $Hint,

    [switch] $Refresh,

    [string] $RepoRoot,

    [string] $RunLogPath,

    [string] $SetConfigPath,

    [string] $LedgerPath,

    [switch] $SkipGitPicker
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

function Test-JsonEntryHasProperty {
    param(
        [Parameter(Mandatory)]
        [object] $InputObject,

        [Parameter(Mandatory)]
        [string] $PropertyName
    )

    if ($null -eq $InputObject) {
        return $false
    }

    return $InputObject.PSObject.Properties.Name.Contains($PropertyName)
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

        $parsed = $line | ConvertFrom-Json

        if (-not (Test-JsonEntryHasProperty -InputObject $parsed -PropertyName 'zoneId') -and
            (Test-JsonEntryHasProperty -InputObject $parsed -PropertyName 'zone')) {
            $parsed | Add-Member -NotePropertyName zoneId -NotePropertyValue ([string]$parsed.zone) -Force
        }

        $entries += ,$parsed
    }

    return $entries
}

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

function Test-LowYieldOutcome {
    param([string] $Outcome)

    switch ($Outcome) {
        'dry' { return $true }
        'seed-only' { return $true }
        'held-for-triage' { return $true }
        default { return $false }
    }
}

function Get-LowYieldStreak {
    param(
        [Parameter(Mandatory)]
        [object[]] $Entries
    )

    if (@($Entries).Count -eq 0) {
        return @{
            zoneId   = $null
            count    = 0
            outcomes = @()
        }
    }

    $last = $Entries[-1]

    if (-not (Test-JsonEntryHasProperty -InputObject $last -PropertyName 'zoneId')) {
        return @{
            zoneId   = $null
            count    = 0
            outcomes = @()
        }
    }

    [string]$zoneId = [string]$last.zoneId
    [int]$count = 0
    [System.Collections.Generic.List[string]]$outcomes = New-Object 'System.Collections.Generic.List[string]'

    for ($i = $Entries.Count - 1; $i -ge 0; $i--) {
        $entry = $Entries[$i]

        if (-not (Test-JsonEntryHasProperty -InputObject $entry -PropertyName 'zoneId')) {
            break
        }

        if ([string]$entry.zoneId -ne $zoneId) {
            break
        }

        [string]$outcome = ''

        if (Test-JsonEntryHasProperty -InputObject $entry -PropertyName 'outcome') {
            $outcome = [string]$entry.outcome
        }

        if ($outcome -eq 'hit') {
            break
        }

        if (-not (Test-LowYieldOutcome -Outcome $outcome)) {
            break
        }

        $count++
        $outcomes.Add($outcome) | Out-Null
    }

    return @{
        zoneId   = $zoneId
        count    = $count
        outcomes = @($outcomes)
    }
}

$resolvedRoot = Get-RepoRoot -ExplicitRoot $RepoRoot
$requestedSet = Get-AlBugZoneSet -Id $Set -ConfigPath $SetConfigPath -RepoRoot $resolvedRoot

if ([string]::IsNullOrWhiteSpace($RunLogPath)) {
    $logRelative = [string]$requestedSet.runLog
    $RunLogPath = Join-Path $resolvedRoot ($logRelative -replace '/', [IO.Path]::DirectorySeparatorChar)
}

$entries = @(Read-HuntRunLog -Path $RunLogPath)
$streak = Get-LowYieldStreak -Entries $entries

$shouldRotate = ($streak.count -ge $MinLowYieldStreak -and -not [string]::IsNullOrWhiteSpace($streak.zoneId))
$avoidZoneId = $null
$reason = 'No low-yield streak; keep default picker choice.'

if ($shouldRotate) {
    $avoidZoneId = [string]$streak.zoneId
    $reason = ("{0} consecutive low-yield hunt(s) on '{1}' (outcomes: {2})." -f $streak.count, $avoidZoneId, (($streak.outcomes | Select-Object -First 5) -join ', '))

    if ($streak.outcomes.Count -gt 5) {
        $reason += ' …'
    }
}

$result = [ordered]@{
    set                 = $Set
    runLogPath          = ($requestedSet.runLog)
    shouldRotate        = [bool]$shouldRotate
    avoidZoneId         = $avoidZoneId
    lowYieldStreak      = $streak.count
    streakZoneId        = $streak.zoneId
    streakOutcomes      = @($streak.outcomes)
    minLowYieldStreak   = $MinLowYieldStreak
    reason              = $reason
    hintBlocksRotation  = -not [string]::IsNullOrWhiteSpace($Hint)
}

if ($PreviewPick) {
    $pickerScript = Join-Path $PSScriptRoot 'al-bug-pick-zone.ps1'

    if (-not (Test-Path -LiteralPath $pickerScript)) {
        throw "Missing picker: '$pickerScript'."
    }

    [hashtable]$pickerArgs = @{
        Set      = $Set
        Preview  = $true
        SkipGit  = [bool]$SkipGitPicker
    }

    if (-not [string]::IsNullOrWhiteSpace($SetConfigPath)) {
        $pickerArgs.SetConfigPath = $SetConfigPath
    }

    if (-not [string]::IsNullOrWhiteSpace($RepoRoot)) {
        $pickerArgs.RepoRoot = $RepoRoot
    }

    if (-not [string]::IsNullOrWhiteSpace($LedgerPath)) {
        $pickerArgs.LedgerPath = $LedgerPath
    }

    if (-not [string]::IsNullOrWhiteSpace($RunLogPath)) {
        $pickerArgs.RunLogPath = $RunLogPath
    }

    if ($Refresh) {
        $pickerArgs.Refresh = $true
    }

    if (-not [string]::IsNullOrWhiteSpace($Hint)) {
        $pickerArgs.Hint = $Hint
    }
    elseif ($shouldRotate) {
        $pickerArgs.AvoidZoneId = $avoidZoneId
    }

    [string[]]$pickerOutput = @(& $pickerScript @pickerArgs)
    [string]$jsonLine = @($pickerOutput | Where-Object { $_ -match '^\{' }) | Select-Object -Last 1

    if ([string]::IsNullOrWhiteSpace($jsonLine)) {
        throw 'Picker did not emit JSON.'
    }

    $result.pickResult = ($jsonLine | ConvertFrom-Json)
    $result.avoidZoneApplied = (-not [string]::IsNullOrWhiteSpace($Hint)) -eq $false -and $shouldRotate
}

ConvertTo-Json -InputObject ([pscustomobject]$result) -Depth 8
