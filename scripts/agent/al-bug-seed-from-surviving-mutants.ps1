#Requires -Version 5.1
<#
.SYNOPSIS
  Seeds hunt ledger zones with surviving Stryker mutants as (candidate) rows only.

.DESCRIPTION
  Parses an already-produced mutation-testing-elements mutation-report.json.
  Does not run dotnet stryker. Does not write the ledger. Default is preview-only.

  Mutant status mapping: keep Survived; skip Killed, Timeout, CompileError,
  NoCoverage, RuntimeError, Ignored, Pending. Some reports use mutantStatus
  instead of status.

.PARAMETER ZoneId
  Ledger zone id whose paths scope mutants.

.PARAMETER LedgerPath
  Hunt ledger markdown path.

.PARAMETER ReportPath
  Path to mutation-report.json (required).

.PARAMETER StrykerLabel
  Optional scheduled Stryker label; when set, drop files outside that label's
  path prefixes in al-bug-stryker-zone-map.json.

.PARAMETER Preview
  Print paste-ready markdown (default behavior; ledger is never written).

.EXAMPLE
  .\scripts\agent\al-bug-seed-from-surviving-mutants.ps1 -ZoneId 'application-commit' -ReportPath .\mutation-report.json -Preview
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $ZoneId,

    [string] $LedgerPath,

    [Parameter(Mandatory = $true)]
    [string] $ReportPath,

    [string] $StrykerLabel,

    [switch] $Preview,

    [string] $RepoRoot,

    [string] $StrykerZoneMapPath
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

    throw 'Could not locate git repository root.'
}

function Get-ZonePathsFromLedger {
    param(
        [string] $LedgerText,
        [string] $TargetZoneId
    )

    $parts = [regex]::Split($LedgerText, '(?m)^## Zone:')

    foreach ($part in $parts) {
        if ($part -notmatch '\*\*id:\*\*\s+(.+)') {
            continue
        }

        $zoneId = $Matches[1].Trim()

        if ($zoneId -ne $TargetZoneId) {
            continue
        }

        if ($part -notmatch '\*\*paths:\*\*\s+(.+)') {
            return @()
        }

        return @(
            $Matches[1].Trim() -split ';' |
                ForEach-Object { $_.Trim() } |
                Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        )
    }

    throw "Zone '$TargetZoneId' was not found in the ledger."
}

function Test-SeedPathExcluded {
    param([string] $Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return $true
    }

    $normalized = $Path.Replace('\', '/')

    if ($normalized -match '(?i)Tests|__tests__|\.generated\.|node_modules|package-lock\.json') {
        return $true
    }

    return $false
}

function Test-PathUnderZonePrefixes {
    param(
        [string] $Path,
        [string[]] $ZonePrefixes
    )

    $normalized = $Path.Replace('\', '/')

    foreach ($prefix in $ZonePrefixes) {
        $prefixNorm = $prefix.Replace('\', '/').TrimEnd('/')

        if ($normalized -eq $prefixNorm -or $normalized.StartsWith($prefixNorm + '/', [StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
    }

    return $false
}

function Get-ExistingOpenRows {
    param(
        [string] $LedgerText,
        [string] $TargetZoneId
    )

    $rows = New-Object System.Collections.ArrayList
    $parts = [regex]::Split($LedgerText, '(?m)^## Zone:')

    foreach ($part in $parts) {
        if ($part -notmatch '\*\*id:\*\*\s+(.+)') {
            continue
        }

        if ($Matches[1].Trim() -ne $TargetZoneId) {
            continue
        }

        foreach ($line in ($part -split "`n")) {
            if ($line -match '^\s*-\s+\[\s\]\s+(.+)$') {
                [void]$rows.Add($Matches[1].Trim())
            }
        }
    }

    return ,([string[]]$rows.ToArray())
}

function Get-StrykerLabelPrefixes {
    param(
        [string] $MapJson,
        [string] $Label
    )

    if ([string]::IsNullOrWhiteSpace($Label) -or [string]::IsNullOrWhiteSpace($MapJson)) {
        return @()
    }

    $doc = $MapJson | ConvertFrom-Json
    $prefixes = New-Object System.Collections.ArrayList

    foreach ($entry in @($doc.labels)) {
        if ([string]$entry.label -ne $Label) {
            continue
        }

        foreach ($prefix in @($entry.pathPrefixes)) {
            [void]$prefixes.Add([string]$prefix)
        }
    }

    return ,([string[]]$prefixes.ToArray())
}

function ConvertFrom-MutationReportSurvivors {
    param([string] $ReportJson)

    # mutation-testing-elements: top-level files map, each with mutants[].
    # Status field is `status` (Stryker.NET) or `mutantStatus` (some exporters).
    $doc = $ReportJson | ConvertFrom-Json
    $results = New-Object System.Collections.ArrayList
    $skip = @(
        'Killed', 'Timeout', 'CompileError', 'NoCoverage',
        'RuntimeError', 'Ignored', 'Pending'
    )

    if ($null -eq $doc.files) {
        return ,([object[]]@())
    }

    foreach ($prop in @($doc.files.PSObject.Properties)) {
        $path = [string]$prop.Name
        $fileNode = $prop.Value

        if ($null -eq $fileNode -or $null -eq $fileNode.mutants) {
            continue
        }

        foreach ($mutant in @($fileNode.mutants)) {
            $status = [string]$mutant.status

            if ([string]::IsNullOrWhiteSpace($status)) {
                $status = [string]$mutant.mutantStatus
            }

            if ([string]::IsNullOrWhiteSpace($status) -or $skip -contains $status) {
                continue
            }

            if ($status -ne 'Survived') {
                continue
            }

            $line = 0

            if ($null -ne $mutant.location -and $null -ne $mutant.location.start) {
                $line = [int]$mutant.location.start.line
            }

            $mutator = [string]$mutant.mutatorName

            if ([string]::IsNullOrWhiteSpace($mutator)) {
                $mutator = [string]$mutant.mutator
            }

            $replacement = [string]$mutant.replacement
            $id = [string]$mutant.id

            [void]$results.Add([pscustomobject]@{
                    id           = $id
                    mutator      = $mutator
                    path         = $path.Replace('\', '/')
                    line         = $line
                    replacement  = $replacement
                })
        }
    }

    return ,([object[]]$results.ToArray())
}

function Get-MutantDefectClass {
    param(
        [string] $Path,
        [string] $Mutator
    )

    return 'other'
}

function Build-MutantCandidateLines {
    param(
        [object[]] $Mutants,
        [string[]] $ZonePrefixes,
        [string[]] $ExistingOpenRows,
        [string[]] $LabelPrefixes,
        [int] $Cap = 15
    )

    $lines = New-Object System.Collections.ArrayList
    $seen = New-Object 'System.Collections.Generic.HashSet[string]'

    foreach ($row in $ExistingOpenRows) {
        if ($row -match 'mutant\s+#\S+:\s+(\S+)\s+at\s+([^:]+):(\d+)') {
            [void]$seen.Add(('{0}|{1}|{2}' -f $Matches[1], $Matches[2], $Matches[3]))
        }
    }

    foreach ($mutant in $Mutants) {
        if ($lines.Count -ge $Cap) {
            break
        }

        $path = [string]$mutant.path

        if (Test-SeedPathExcluded -Path $path) {
            continue
        }

        if (-not (Test-PathUnderZonePrefixes -Path $path -ZonePrefixes $ZonePrefixes)) {
            continue
        }

        if ($LabelPrefixes.Count -gt 0 -and -not (Test-PathUnderZonePrefixes -Path $path -ZonePrefixes $LabelPrefixes)) {
            continue
        }

        $key = ('{0}|{1}|{2}' -f $mutant.mutator, $path, $mutant.line)

        if ($seen.Contains($key)) {
            continue
        }

        [void]$seen.Add($key)
        $classTag = Get-MutantDefectClass -Path $path -Mutator ([string]$mutant.mutator)
        $description = [string]$mutant.replacement

        if ([string]::IsNullOrWhiteSpace($description)) {
            $description = [string]$mutant.mutator
        }

        $idPart = [string]$mutant.id

        if ([string]::IsNullOrWhiteSpace($idPart)) {
            $idPart = 'n'
        }

        $candidate = ('(candidate) mutant #{0}: {1} at {2}:{3} survived — {4} [class:{5}]' -f $idPart, $mutant.mutator, $path, $mutant.line, $description, $classTag)
        [void]$lines.Add($candidate)
    }

    return ,([string[]]$lines.ToArray())
}

$resolvedRoot = Get-RepoRoot -ExplicitRoot $RepoRoot
$resolvedLedger = $LedgerPath

if ([string]::IsNullOrWhiteSpace($resolvedLedger)) {
    $resolvedLedger = Join-Path $resolvedRoot 'docs\library\AL_BUG_HUNT_LEDGER.md'
}
elseif (-not [IO.Path]::IsPathRooted($resolvedLedger)) {
    $resolvedLedger = Join-Path $resolvedRoot ($resolvedLedger -replace '/', [IO.Path]::DirectorySeparatorChar)
}

$ledgerText = Get-Content -LiteralPath $resolvedLedger -Raw -Encoding UTF8
$zonePrefixes = Get-ZonePathsFromLedger -LedgerText $ledgerText -TargetZoneId $ZoneId
$existingOpen = Get-ExistingOpenRows -LedgerText $ledgerText -TargetZoneId $ZoneId

$reportJson = Get-Content -LiteralPath $ReportPath -Raw -Encoding UTF8
$mutants = ConvertFrom-MutationReportSurvivors -ReportJson $reportJson

$labelPrefixes = @()

if (-not [string]::IsNullOrWhiteSpace($StrykerLabel)) {
    $mapPath = $StrykerZoneMapPath

    if ([string]::IsNullOrWhiteSpace($mapPath)) {
        $mapPath = Join-Path $resolvedRoot 'scripts\agent\al-bug-stryker-zone-map.json'
    }

    $mapJson = Get-Content -LiteralPath $mapPath -Raw -Encoding UTF8
    $labelPrefixes = Get-StrykerLabelPrefixes -MapJson $mapJson -Label $StrykerLabel
}

$candidates = Build-MutantCandidateLines `
    -Mutants $mutants `
    -ZonePrefixes $zonePrefixes `
    -ExistingOpenRows $existingOpen `
    -LabelPrefixes $labelPrefixes

if ($Preview) {
    Write-Host ''
    Write-Host ('## Surviving-mutant seed preview — zone `{0}`' -f $ZoneId)
    Write-Host ''
    Write-Host 'Paste as **(candidate)** only — not hunt-ready until ABQ-05 bar is met. Do not run dotnet stryker.'
    Write-Host ''

    foreach ($line in $candidates) {
        Write-Host ("- [ ] {0}" -f $line)
    }
}

@{
    zoneId     = $ZoneId
    preview    = [bool]$Preview
    candidates = $candidates
} | ConvertTo-Json -Depth 4
