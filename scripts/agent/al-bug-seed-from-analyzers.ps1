#Requires -Version 5.1
<#
.SYNOPSIS
  Seeds hunt ledger zones with analyzer/SARIF diagnostics as (candidate) rows only.

.DESCRIPTION
  Parses SARIF or diagnostic JSON and prints paste-ready (candidate) hypotheses.
  Does not write the ledger unless explicitly extended — default is -Preview only.

.PARAMETER ZoneId
  Ledger zone id whose paths scope diagnostics.

.PARAMETER LedgerPath
  Hunt ledger markdown path.

.PARAMETER SarifPath
  Optional SARIF JSON file (owner-exported).

.PARAMETER Preview
  Print markdown preview (default behavior).

.EXAMPLE
  .\scripts\agent\al-bug-seed-from-analyzers.ps1 -ZoneId 'topology-proposal-merge' -SarifPath .\out.sarif -Preview
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $ZoneId,

    [string] $LedgerPath,

    [string] $SarifPath,

    [switch] $Preview,

    [string] $RepoRoot
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

function ConvertFrom-SarifDiagnostics {
    param([string] $SarifJson)

    $doc = $SarifJson | ConvertFrom-Json
    $results = New-Object System.Collections.ArrayList

    foreach ($run in @($doc.runs)) {
        foreach ($result in @($run.results)) {
            $ruleId = [string]$result.ruleId
            $message = [string]$result.message.text

            if ([string]::IsNullOrWhiteSpace($message) -and $null -ne $result.message.arguments) {
                $message = ($result.message.arguments | ForEach-Object { [string]$_ }) -join ' '
            }

            foreach ($location in @($result.locations)) {
                $artifact = $location.physicalLocation.artifactLocation.uri
                $line = [int]$location.physicalLocation.region.startLine
                $path = ([string]$artifact).Replace('file:///', '').Replace('file://', '')

                [void]$results.Add([pscustomobject]@{
                        ruleId  = $ruleId
                        message = $message
                        path    = $path
                        line    = $line
                    })
            }
        }
    }

    return ,([object[]]$results.ToArray())
}

function Build-CandidateLines {
    param(
        [object[]] $Diagnostics,
        [string[]] $ZonePrefixes,
        [string[]] $ExistingOpenRows,
        [int] $Cap = 15
    )

    $lines = New-Object System.Collections.ArrayList
    $seen = New-Object 'System.Collections.Generic.HashSet[string]'

    foreach ($row in $ExistingOpenRows) {
        if ($row -match 'analyzer\s+(\S+)\s+at\s+([^:]+):(\d+)') {
            [void]$seen.Add(('{0}|{1}|{2}' -f $Matches[1], $Matches[2], $Matches[3]))
        }
    }

    foreach ($diag in $Diagnostics) {
        if ($lines.Count -ge $Cap) {
            break
        }

        $path = [string]$diag.path

        if (Test-SeedPathExcluded -Path $path) {
            continue
        }

        if (-not (Test-PathUnderZonePrefixes -Path $path -ZonePrefixes $ZonePrefixes)) {
            continue
        }

        $key = ('{0}|{1}|{2}' -f $diag.ruleId, $path, $diag.line)

        if ($seen.Contains($key)) {
            continue
        }

        [void]$seen.Add($key)
        $candidate = ('(candidate) analyzer {0} at {1}:{2} — {3} [class:other]' -f $diag.ruleId, $path, $diag.line, $diag.message)
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

if ([string]::IsNullOrWhiteSpace($SarifPath)) {
    throw '-SarifPath is required (export SARIF from dotnet build or CodeQL).'
}

$sarifJson = Get-Content -LiteralPath $SarifPath -Raw -Encoding UTF8
$diagnostics = ConvertFrom-SarifDiagnostics -SarifJson $sarifJson
$candidates = Build-CandidateLines -Diagnostics $diagnostics -ZonePrefixes $zonePrefixes -ExistingOpenRows $existingOpen

if ($Preview) {
    Write-Host ''
    Write-Host ('## Analyzer seed preview — zone `{0}`' -f $ZoneId)
    Write-Host ''
    Write-Host 'Paste as **(candidate)** only — not hunt-ready until ABQ-05 bar is met.'
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
