#Requires -Version 5.1
<#
.SYNOPSIS
  Loads the four /al-bug zone sets (ledger, run log, branch, zone ids).
#>

function Get-AlBugZoneSetRepoRoot {
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

    throw 'Could not locate git repository root from scripts/agent.'
}

function Get-AlBugZoneSetConfigPath {
    param(
        [string] $ConfigPath,
        [string] $RepoRoot
    )

    if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
        return Join-Path $RepoRoot 'scripts\agent\al-bug-zone-sets.json'
    }

    if ([IO.Path]::IsPathRooted($ConfigPath)) {
        return $ConfigPath
    }

    return Join-Path $RepoRoot ($ConfigPath -replace '/', [IO.Path]::DirectorySeparatorChar)
}

function Read-AlBugZoneSetCatalog {
    param(
        [string] $ConfigPath,
        [string] $RepoRoot
    )

    $root = Get-AlBugZoneSetRepoRoot -ExplicitRoot $RepoRoot
    $path = Get-AlBugZoneSetConfigPath -ConfigPath $ConfigPath -RepoRoot $root

    if (-not (Test-Path -LiteralPath $path)) {
        throw "Zone set catalog not found: $path"
    }

    $catalog = Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json

    if ($null -eq $catalog.sets) {
        throw "Zone set catalog '$path' has no sets."
    }

    return $catalog
}

function Get-AlBugZoneSet {
    param(
        [Parameter(Mandatory)]
        [int] $Id,

        [string] $ConfigPath,

        [string] $RepoRoot
    )

    if ($Id -lt 1 -or $Id -gt 4) {
        throw "Zone set must be 1, 2, 3, or 4. Received $Id."
    }

    $catalog = Read-AlBugZoneSetCatalog -ConfigPath $ConfigPath -RepoRoot $RepoRoot
    $match = @($catalog.sets | Where-Object { [int]$_.id -eq $Id })

    if ($match.Count -ne 1) {
        throw "Zone set $Id is missing from the catalog."
    }

    return $match[0]
}

function Get-AlBugZoneSetForZoneId {
    param(
        [Parameter(Mandatory)]
        [string] $ZoneId,

        [string] $ConfigPath,

        [string] $RepoRoot
    )

    $normalized = ($ZoneId.ToLowerInvariant() -replace '[_\s]+', '-').Trim('-')
    $catalog = Read-AlBugZoneSetCatalog -ConfigPath $ConfigPath -RepoRoot $RepoRoot

    foreach ($set in @($catalog.sets)) {
        foreach ($candidate in @($set.zones)) {
            $candidateNorm = ([string]$candidate).ToLowerInvariant() -replace '[_\s]+', '-'
            $candidateNorm = $candidateNorm.Trim('-')

            if ($candidateNorm -eq $normalized) {
                return $set
            }
        }
    }

    return $null
}

function Add-AlBugZoneSetResultFields {
    param(
        $Result,

        [int] $RequestedSet = 0,

        [string] $ConfigPath,

        [string] $RepoRoot
    )

    $owning = $null

    if ($null -ne $Result.zoneId -and -not [string]::IsNullOrWhiteSpace([string]$Result.zoneId)) {
        $owning = Get-AlBugZoneSetForZoneId -ZoneId ([string]$Result.zoneId) -ConfigPath $ConfigPath -RepoRoot $RepoRoot
    }

    $active = $owning

    if ($RequestedSet -gt 0) {
        $active = Get-AlBugZoneSet -Id $RequestedSet -ConfigPath $ConfigPath -RepoRoot $RepoRoot
    }

    $setId = $null
    $ledger = 'docs/library/AL_BUG_HUNT_LEDGER.md'
    $runLog = 'docs/library/AL_BUG_HUNT_RUN_LOG.jsonl'
    $branch = 'bugsmash'
    $command = '/al-bug'

    if ($null -ne $active) {
        $setId = [int]$active.id
        $ledger = [string]$active.ledger
        $command = [string]$active.command

        if ($RequestedSet -gt 0) {
            $runLog = [string]$active.runLog
            $branch = [string]$active.branch
        }
        else {
            $command = '/al-bug'
        }
    }

    $Result | Add-Member -NotePropertyName set -NotePropertyValue $setId -Force
    $Result | Add-Member -NotePropertyName command -NotePropertyValue $command -Force
    $Result | Add-Member -NotePropertyName targetBranch -NotePropertyValue $branch -Force
    $Result | Add-Member -NotePropertyName ledgerPath -NotePropertyValue $ledger -Force
    $Result | Add-Member -NotePropertyName runLogPath -NotePropertyValue $runLog -Force

    return $Result
}
