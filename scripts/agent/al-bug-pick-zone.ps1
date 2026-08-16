#Requires -Version 5.1
<#
.SYNOPSIS
  Scores curated /al-bug hunt zones and prints the next zone as JSON.

.DESCRIPTION
  Reads docs/library/AL_BUG_HUNT_LEDGER.md. Scoring is deterministic (not LLM ranking).
  This script does not write the ledger — the agent updates it after the hunt.

.PARAMETER LedgerPath
  Ledger markdown path. Default: docs/library/AL_BUG_HUNT_LEDGER.md under the repo root.

.PARAMETER Hint
  Pin a zone by id or alias (user hunt hint). Throws if no zone matches.

.PARAMETER Status
  Human preview on the host plus JSON on stdout (read-only next-zone preview).

.PARAMETER Preview
  Same host preview as -Status; JSON still on stdout.

.PARAMETER Refresh
  Recompute git commit counts since last-hunt into JSON (codeChangedSince / reopened).
  Does not write the ledger.

.PARAMETER SkipGit
  Do not call git. Churn comes from the ledger code-changed-since field (Pester).

.PARAMETER RepoRoot
  Optional repository root. Default: walk up from this script looking for .git.

.EXAMPLE
  .\scripts\agent\al-bug-pick-zone.ps1 -Preview

.EXAMPLE
  .\scripts\agent\al-bug-pick-zone.ps1 -Hint 'topology merge gate' -Preview
#>
[CmdletBinding()]
param(
    [string] $LedgerPath,

    [string] $Hint,

    [switch] $Status,

    [switch] $Preview,

    [switch] $Refresh,

    [switch] $SkipGit,

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

    throw 'Could not locate git repository root from scripts/agent.'
}

function ConvertTo-NormalizedHint {
    param([string] $Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return ''
    }

    $normalized = $Value.ToLowerInvariant() -replace '[_\s]+', '-'

    return $normalized.Trim('-')
}

function ConvertTo-IntSafe {
    param([string] $Value, [int] $Default = 0)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $Default
    }

    $parsed = 0

    if ([int]::TryParse($Value.Trim(), [ref] $parsed)) {
        return [Math]::Max(0, $parsed)
    }

    return $Default
}

function ConvertTo-ObjectArray {
    param($Value)

    # Windows PowerShell 5.1 + StrictMode throws "Argument types do not match"
    # when wrapping List[T] in @() or returning List[T]. Copy via ArrayList.
    $copy = New-Object System.Collections.ArrayList

    if ($null -eq $Value) {
        return ,([object[]]@())
    }

    if ($Value -is [string]) {
        [void]$copy.Add($Value)
        return ,([object[]]$copy.ToArray())
    }

    foreach ($item in $Value) {
        [void]$copy.Add($item)
    }

    if ($copy.Count -eq 0) {
        return ,([object[]]@())
    }

    return ,([object[]]$copy.ToArray())
}

function ConvertTo-ChurnCount {
    param([string] $Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return 0
    }

    $trimmed = $Value.Trim().ToLowerInvariant()

    if ($trimmed -eq 'unknown' -or $trimmed -eq 'no' -or $trimmed -eq 'never') {
        return 0
    }

    if ($trimmed -eq 'yes') {
        return 1
    }

    return ConvertTo-IntSafe -Value $trimmed -Default 0
}

function Get-RelatedIdCount {
    param([string] $Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return 0
    }

    $tokens = $Value -split '[,;\s]+' |
        ForEach-Object { $_.Trim() } |
        Where-Object {
            -not [string]::IsNullOrWhiteSpace($_) -and
            $_.ToLowerInvariant() -ne 'none' -and
            $_.ToLowerInvariant() -ne 'n/a'
        }

    return @($tokens).Count
}

function Get-HistoricalYield {
    param([int] $Hunts, [int] $BugsFound)

    # Untried zones get a 0.5 floor so a high-yield zone cannot dominate forever.
    if ($Hunts -le 0) {
        return 0.5
    }

    return [double]$BugsFound / [double]$Hunts
}

function Get-GitChurnCount {
    param(
        [string] $GitRepoRoot,
        [string[]] $Paths,
        [string] $LastHunt,
        [switch] $SkipGitCalls,
        [int] $LedgerChurn
    )

    if ($SkipGitCalls) {
        return [Math]::Max(0, $LedgerChurn)
    }

    if ($null -eq $Paths -or @($Paths).Count -eq 0) {
        return 0
    }

    $since = '30 days ago'

    if (-not [string]::IsNullOrWhiteSpace($LastHunt) -and $LastHunt.Trim().ToLowerInvariant() -ne 'never') {
        $since = $LastHunt.Trim()
    }

    $gitArgs = @(
        '-C', $GitRepoRoot,
        'log',
        '--pretty=format:%H',
        "--since=$since",
        '--'
    ) + @($Paths)

    $output = & git @gitArgs 2>&1
    $gitFailed = $false

    if (Test-Path -Path 'variable:LASTEXITCODE') {
        $gitFailed = ($LASTEXITCODE -ne 0)
    }

    if ($gitFailed) {
        Write-Warning "git log failed for zone paths (churn treated as 0): $output"
        return 0
    }

    $hashes = @($output |
        ForEach-Object { "$_".Trim() } |
        Where-Object { $_ -match '^[0-9a-f]{7,40}$' } |
        Select-Object -Unique)

    return @($hashes).Count
}

function Read-AlBugHuntLedger {
    param([string] $Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Hunt ledger not found: $Path"
    }

    $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    $parts = [regex]::Split($raw, '(?m)^## Zone:')
    $zones = New-Object System.Collections.ArrayList
    $fileIndex = 0

    foreach ($part in $parts) {
        if ($part -notmatch '(?m)^\s*-\s+\*\*id:\*\*') {
            continue
        }

        $fields = @{}
        foreach ($match in [regex]::Matches($part, '(?m)^\s*-\s+\*\*([^*]+):\*\*\s*(.*?)\s*$')) {
            $fields[$match.Groups[1].Value.Trim().ToLowerInvariant()] = $match.Groups[2].Value.Trim()
        }

        if (-not $fields.ContainsKey('id') -or [string]::IsNullOrWhiteSpace($fields['id'])) {
            continue
        }

        $openHypotheses = New-Object System.Collections.ArrayList
        $closedHypotheses = New-Object System.Collections.ArrayList
        $hypoMatch = [regex]::Match($part, '(?ms)### Hypotheses\s*(.*?)(?=\n## |\n### |\z)')

        if ($hypoMatch.Success) {
            foreach ($line in ($hypoMatch.Groups[1].Value -split '\r?\n')) {
                if ($line -match '^\s*-\s+\[\s*\]\s+(.+)$') {
                    [void]$openHypotheses.Add($Matches[1].Trim())
                    continue
                }

                if ($line -match '^\s*-\s+\[[xX]\]\s+(.+)$') {
                    [void]$closedHypotheses.Add($Matches[1].Trim())
                }
            }
        }

        $paths = @()

        if ($fields.ContainsKey('paths') -and -not [string]::IsNullOrWhiteSpace($fields['paths'])) {
            $paths = @(
                $fields['paths'] -split ';' |
                    ForEach-Object { $_.Trim() } |
                    Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
            )
        }

        $aliases = @()

        if ($fields.ContainsKey('aliases') -and -not [string]::IsNullOrWhiteSpace($fields['aliases'])) {
            $aliases = @(
                $fields['aliases'] -split ';' |
                    ForEach-Object { $_.Trim() } |
                    Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
            )
        }

        $status = 'open'

        if ($fields.ContainsKey('status') -and -not [string]::IsNullOrWhiteSpace($fields['status'])) {
            $status = $fields['status'].Trim().ToLowerInvariant()
        }

        $zone = [pscustomobject]@{
            FileIndex           = $fileIndex
            Id                  = $fields['id']
            Status              = $status
            Aliases             = $aliases
            Paths               = $paths
            TestFilter          = $(if ($fields.ContainsKey('test-filter')) { $fields['test-filter'] } else { '' })
            Hunts               = ConvertTo-IntSafe $(if ($fields.ContainsKey('hunts')) { $fields['hunts'] } else { '0' })
            BugsFound           = ConvertTo-IntSafe $(if ($fields.ContainsKey('bugs-found')) { $fields['bugs-found'] } else { '0' })
            ConsecutiveDryHunts = ConvertTo-IntSafe $(if ($fields.ContainsKey('consecutive-dry-hunts')) { $fields['consecutive-dry-hunts'] } else { '0' })
            LastHunt            = $(if ($fields.ContainsKey('last-hunt')) { $fields['last-hunt'] } else { 'never' })
            LastBug             = $(if ($fields.ContainsKey('last-bug')) { $fields['last-bug'] } else { 'never' })
            RelatedPdTb         = $(if ($fields.ContainsKey('related-pd-tb')) { $fields['related-pd-tb'] } else { '' })
            LedgerChurn         = ConvertTo-ChurnCount $(if ($fields.ContainsKey('code-changed-since')) { $fields['code-changed-since'] } else { '' })
            OpenHypotheses      = ConvertTo-ObjectArray -Value $openHypotheses
            ClosedHypotheses    = ConvertTo-ObjectArray -Value $closedHypotheses
            CommitCount         = 0
            Score               = 0.0
            Why                 = @()
            Reopened            = $false
        }

        [void]$zones.Add($zone)
        $fileIndex++
    }

    if ($zones.Count -eq 0) {
        throw "No hunt zones parsed from ledger: $Path"
    }

    return ConvertTo-ObjectArray -Value $zones
}

function Test-HintMatchesZone {
    param($Zone, [string] $Hint)

    $normHint = ConvertTo-NormalizedHint $Hint

    if ([string]::IsNullOrWhiteSpace($normHint)) {
        return $false
    }

    $normId = ConvertTo-NormalizedHint $Zone.Id

    if ($normHint -eq $normId) {
        return $true
    }

    if ($normHint.Length -ge 4 -and $normId.Contains($normHint)) {
        return $true
    }

    if ($normId.Length -ge 8 -and $normHint.Contains($normId)) {
        return $true
    }

    foreach ($alias in @($Zone.Aliases)) {
        $normAlias = ConvertTo-NormalizedHint $alias

        if ($normAlias.Length -lt 4) {
            continue
        }

        if ($normHint -eq $normAlias) {
            return $true
        }

        if ($normHint.Contains($normAlias) -or $normAlias.Contains($normHint)) {
            return $true
        }
    }

    return $false
}

function Get-ZoneScoreBreakdown {
    param($Zone)

    $yield = Get-HistoricalYield -Hunts $Zone.Hunts -BugsFound $Zone.BugsFound
    $churn = [Math]::Min(3, [Math]::Max(0, [int]$Zone.CommitCount))
    $openCount = @($Zone.OpenHypotheses).Count
    $relatedCount = [Math]::Min(2, (Get-RelatedIdCount $Zone.RelatedPdTb))
    $dry = [Math]::Max(0, [int]$Zone.ConsecutiveDryHunts)
    $score = (3.0 * $yield) + (2.0 * $churn) + (2.0 * $openCount) + (1.0 * $relatedCount) - (2.0 * $dry)
    $why = New-Object System.Collections.ArrayList

    if ($Zone.Hunts -le 0) {
        [void]$why.Add('untried yield floor 0.50')
    }
    else {
        [void]$why.Add(('historical yield {0:N2}' -f $yield))
    }

    if ($openCount -gt 0) {
        [void]$why.Add("$openCount open hypotheses")
    }

    if ($Zone.CommitCount -gt 0) {
        [void]$why.Add("$($Zone.CommitCount) commits since last hunt")
    }

    if ($relatedCount -gt 0) {
        [void]$why.Add("$relatedCount related PD/TB ids")
    }

    if ($dry -gt 0) {
        [void]$why.Add("$dry consecutive dry hunts")
    }

    if ($Zone.Reopened) {
        [void]$why.Add('reopened after git churn')
    }

    return [pscustomobject]@{
        Score = [Math]::Round($score, 2)
        Why   = ConvertTo-ObjectArray -Value $why
    }
}

function Set-ZoneComputedFields {
    param(
        $Zones,
        [string] $GitRepoRoot,
        [switch] $SkipGitCalls
    )

    foreach ($zone in $Zones) {
        $ledgerChurn = [int]$zone.LedgerChurn
        $zone.CommitCount = Get-GitChurnCount `
            -GitRepoRoot $GitRepoRoot `
            -Paths @($zone.Paths) `
            -LastHunt $zone.LastHunt `
            -SkipGitCalls:$SkipGitCalls `
            -LedgerChurn $ledgerChurn

        if ($zone.Status -eq 'exhausted' -and $zone.CommitCount -gt 0) {
            $zone.Reopened = $true
        }

        $breakdown = Get-ZoneScoreBreakdown -Zone $zone
        $zone.Score = $breakdown.Score
        $zone.Why = $breakdown.Why
    }
}

function Get-EligibleZones {
    param($Zones)

    $hasOpen = @($Zones | Where-Object { $_.Status -eq 'open' }).Count -gt 0
    $eligible = New-Object System.Collections.Generic.List[object]

    foreach ($zone in $Zones) {
        switch ($zone.Status) {
            'open' {
                [void]$eligible.Add($zone)
            }
            'cooling' {
                # Cooling waits while any open zone still has work.
                if (-not $hasOpen) {
                    [void]$eligible.Add($zone)
                }
            }
            'exhausted' {
                if ($zone.CommitCount -gt 0) {
                    [void]$eligible.Add($zone)
                }
            }
        }
    }

    return ConvertTo-ObjectArray -Value $eligible
}

function ConvertTo-PickResult {
    param(
        $Zone,
        [int] $EligibleCount,
        [bool] $ExhaustedAll,
        [bool] $HintOverride,
        [bool] $RefreshRequested
    )

    if ($null -eq $Zone) {
        return [pscustomobject]@{
            zoneId              = $null
            status              = $null
            score               = 0.0
            why                 = @('no eligible hunt zone')
            openHypotheses      = @()
            paths               = @()
            testFilter          = ''
            hunts               = 0
            bugsFound           = 0
            consecutiveDryHunts = 0
            lastHunt            = 'never'
            exhausted           = $true
            reopened            = $false
            exhaustedAll        = $true
            eligibleCount       = 0
            hintOverride        = $false
            codeChangedSince    = 0
            refreshRequested    = $RefreshRequested
        }
    }

    $why = @($Zone.Why)

    if ($HintOverride) {
        $why = @('hint override') + $why
    }

    return [pscustomobject]@{
        zoneId              = $Zone.Id
        status              = $Zone.Status
        score               = $Zone.Score
        why                 = $why
        openHypotheses      = @($Zone.OpenHypotheses)
        paths               = @($Zone.Paths)
        testFilter          = $Zone.TestFilter
        hunts               = $Zone.Hunts
        bugsFound           = $Zone.BugsFound
        consecutiveDryHunts = $Zone.ConsecutiveDryHunts
        lastHunt            = $Zone.LastHunt
        exhausted           = ($Zone.Status -eq 'exhausted' -and -not $Zone.Reopened)
        reopened            = [bool]$Zone.Reopened
        exhaustedAll        = $ExhaustedAll
        eligibleCount       = $EligibleCount
        hintOverride        = $HintOverride
        codeChangedSince    = $Zone.CommitCount
        refreshRequested    = $RefreshRequested
    }
}

function Write-ZonePreview {
    param($Result)

    if ($null -eq $Result.zoneId) {
        Write-Host ''
        Write-Host '## Next /al-bug zone'
        Write-Host ''
        Write-Host 'No eligible hunt zone remains (all exhausted without git churn).'
        Write-Host 'Update `docs/library/AL_BUG_HUNT_LEDGER.md` or wait for production-path commits.'
        return
    }

    $hypoLines = @($Result.openHypotheses)

    if ($hypoLines.Count -eq 0) {
        $hypoLines = @('(none open)')
    }

    Write-Host ''
    Write-Host '## Next /al-bug zone'
    Write-Host ''
    Write-Host ('| Field | Value |')
    Write-Host ('| --- | --- |')
    Write-Host ("| Zone | `{0}` |" -f $Result.zoneId)
    Write-Host ("| Status | {0} |" -f $Result.status)
    Write-Host ("| Score | {0} |" -f $Result.score)
    Write-Host ("| Why | {0} |" -f ($Result.why -join '; '))
    Write-Host ("| Hypotheses left | {0} |" -f @($Result.openHypotheses).Count)
    Write-Host ("| Test filter | `{0}` |" -f $Result.testFilter)
    Write-Host ("| Reopened | {0} |" -f $Result.reopened)
    Write-Host ''
    Write-Host 'Open hypotheses:'
    Write-Host ''

    foreach ($item in $hypoLines) {
        Write-Host ("- {0}" -f $item)
    }
}

$resolvedRoot = Get-RepoRoot -ExplicitRoot $RepoRoot
$resolvedLedger = $LedgerPath

if ([string]::IsNullOrWhiteSpace($resolvedLedger)) {
    $resolvedLedger = Join-Path $resolvedRoot 'docs\library\AL_BUG_HUNT_LEDGER.md'
}
elseif (-not [IO.Path]::IsPathRooted($resolvedLedger)) {
    $resolvedLedger = Join-Path $resolvedRoot ($resolvedLedger -replace '/', [IO.Path]::DirectorySeparatorChar)
}

$zones = Read-AlBugHuntLedger -Path $resolvedLedger
Set-ZoneComputedFields -Zones $zones -GitRepoRoot $resolvedRoot -SkipGitCalls:$SkipGit

$eligible = Get-EligibleZones -Zones $zones
$picked = $null
$hintOverride = $false

if (-not [string]::IsNullOrWhiteSpace($Hint)) {
    $matched = @($zones | Where-Object { Test-HintMatchesZone -Zone $_ -Hint $Hint })

    if ($matched.Count -eq 0) {
        $ids = ($zones | ForEach-Object { $_.Id }) -join ', '
        throw "Hunt hint '$Hint' did not match a ledger zone. Known ids: $ids"
    }

    $picked = @($matched | Sort-Object -Property @{ Expression = 'Score'; Descending = $true }, @{ Expression = 'FileIndex'; Descending = $false })[0]
    $hintOverride = $true
}
elseif ($eligible.Count -gt 0) {
    $picked = @(
        $eligible | Sort-Object -Property @{ Expression = { $_.Score }; Descending = $true }, @{ Expression = { $_.FileIndex }; Descending = $false }
    )[0]
}

$exhaustedAll = ($null -eq $picked)
$result = ConvertTo-PickResult `
    -Zone $picked `
    -EligibleCount @($eligible).Count `
    -ExhaustedAll $exhaustedAll `
    -HintOverride $hintOverride `
    -RefreshRequested ([bool]$Refresh)

if ($Status -or $Preview) {
    Write-ZonePreview -Result $result
}

ConvertTo-Json -InputObject $result -Depth 6
