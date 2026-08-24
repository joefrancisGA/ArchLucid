#Requires -Version 5.1
<#
.SYNOPSIS
  Scores curated /al-bug hunt zones and prints the next zone as JSON.

.DESCRIPTION
  Reads docs/library/AL_BUG_HUNT_LEDGER.md. Scoring is deterministic explore/exploit
  (not LLM ranking): prefer shorter mean hunts-per-bug, sample untried zones.
  Hunt-ready hypotheses are a small tie-break; candidate templates do not score.
  Precision (proven / (proven + invalid)) is a small bonus after two attempts.
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

function Get-MeanHuntsPerBug {
    param([int] $Hunts, [int] $BugsFound)

    # Time unit is hunts, not wall-clock. Lower mean = faster to find a bug.
    if ($BugsFound -gt 0) {
        return [double]$Hunts / [double]$BugsFound
    }

    # Untried / dry prior: 2 hunts to first bug; each extra hunt makes first-bug slower.
    return [double]$Hunts + 2.0
}

function Get-ExploreBonus {
    param([int] $Hunts)

    # 1/sqrt(n+1) samples untried catalog so a high-hypothesis zone cannot lock the picker.
    return 1.0 / [Math]::Sqrt([double]$Hunts + 1.0)
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

function Get-OpenHypothesisKind {
    param(
        [string] $Text,
        [string] $ZoneStatus,
        [int] $Hunts
    )

    $trimmed = $Text.Trim()

    if ($trimmed -match '^\(candidate\)\s*') {
        return 'candidate'
    }

    if ($trimmed -match '^\(hunt-ready\)\s*') {
        return 'hunt-ready'
    }

    # Untagged rows on an untried or unseeded zone are templates until a seed
    # hunt reads the files and promotes them. Do not treat them as hunt-ready.
    if ($ZoneStatus -eq 'unseeded' -or $Hunts -eq 0) {
        return 'candidate'
    }

    return 'hunt-ready'
}

function Get-ClosedHypothesisKind {
    param([string] $Text)

    $trimmed = $Text.Trim()

    # valid-no-repro: the claim matches this code, but current behavior is correct.
    if ($trimmed -match '\(valid-no-repro\)' -or $trimmed -match '(?i)do not hold') {
        return 'valid-no-repro'
    }

    if ($trimmed -match '\(invalid\)' -or
        $trimmed -match '(?i)retired\s*\(\s*invalid' -or
        $trimmed -match '(?i)retired:\s*invalid' -or
        $trimmed -match '(?i)retired:\s*not applicable') {
        return 'invalid'
    }

    # Proven: explicit tag, or a "fixed:" / "fixed as" disposition.
    # Do not match ordinary English ("errors are fixed strings").
    if ($trimmed -match '\(proven\)' -or
        $trimmed -match '(?i)\bfixed\s+as\b' -or
        $trimmed -match '(?i)\bfixed:') {
        return 'proven'
    }

    if ($trimmed -match '(?i)\bretired\b') {
        return 'invalid'
    }

    # Ticked with no disposition = hunt protocol "tick the proven hypothesis".
    return 'proven'
}

function Get-HypothesisPrecision {
    param(
        [int] $ProvenCount,
        [int] $InvalidCount
    )

    $attempted = $ProvenCount + $InvalidCount

    if ($attempted -lt 2) {
        return $null
    }

    return [Math]::Round(([double]$ProvenCount / [double]$attempted), 2)
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

        $status = 'open'

        if ($fields.ContainsKey('status') -and -not [string]::IsNullOrWhiteSpace($fields['status'])) {
            $status = $fields['status'].Trim().ToLowerInvariant()
        }

        $hunts = ConvertTo-IntSafe $(if ($fields.ContainsKey('hunts')) { $fields['hunts'] } else { '0' })
        $huntReadyHypotheses = New-Object System.Collections.ArrayList
        $candidateHypotheses = New-Object System.Collections.ArrayList
        $provenCount = 0
        $invalidCount = 0
        $validNoReproCount = 0

        foreach ($openText in $openHypotheses) {
            $kind = Get-OpenHypothesisKind -Text $openText -ZoneStatus $status -Hunts $hunts

            if ($kind -eq 'candidate') {
                [void]$candidateHypotheses.Add($openText)
            }
            else {
                [void]$huntReadyHypotheses.Add($openText)
            }
        }

        foreach ($closedText in $closedHypotheses) {
            $closedKind = Get-ClosedHypothesisKind -Text $closedText

            switch ($closedKind) {
                'proven' { $provenCount++ }
                'invalid' { $invalidCount++ }
                'valid-no-repro' { $validNoReproCount++ }
                default { }
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

        $precision = Get-HypothesisPrecision -ProvenCount $provenCount -InvalidCount $invalidCount

        $zone = [pscustomobject]@{
            FileIndex              = $fileIndex
            Id                     = $fields['id']
            Status                 = $status
            Aliases                = $aliases
            Paths                  = $paths
            TestFilter             = $(if ($fields.ContainsKey('test-filter')) { $fields['test-filter'] } else { '' })
            Hunts                  = $hunts
            BugsFound              = ConvertTo-IntSafe $(if ($fields.ContainsKey('bugs-found')) { $fields['bugs-found'] } else { '0' })
            ConsecutiveDryHunts    = ConvertTo-IntSafe $(if ($fields.ContainsKey('consecutive-dry-hunts')) { $fields['consecutive-dry-hunts'] } else { '0' })
            LastHunt               = $(if ($fields.ContainsKey('last-hunt')) { $fields['last-hunt'] } else { 'never' })
            LastBug                = $(if ($fields.ContainsKey('last-bug')) { $fields['last-bug'] } else { 'never' })
            RelatedPdTb            = $(if ($fields.ContainsKey('related-pd-tb')) { $fields['related-pd-tb'] } else { '' })
            LedgerChurn            = ConvertTo-ChurnCount $(if ($fields.ContainsKey('code-changed-since')) { $fields['code-changed-since'] } else { '' })
            OpenHypotheses         = ConvertTo-ObjectArray -Value $openHypotheses
            ClosedHypotheses       = ConvertTo-ObjectArray -Value $closedHypotheses
            HuntReadyHypotheses    = ConvertTo-ObjectArray -Value $huntReadyHypotheses
            CandidateHypotheses    = ConvertTo-ObjectArray -Value $candidateHypotheses
            ProvenCount            = $provenCount
            InvalidCount           = $invalidCount
            ValidNoReproCount      = $validNoReproCount
            HypothesisPrecision    = $precision
            CommitCount            = 0
            Score                  = 0.0
            MeanHuntsPerBug        = 0.0
            ExploreBonus           = 0.0
            Why                    = @()
            Reopened               = $false
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

    $mean = Get-MeanHuntsPerBug -Hunts $Zone.Hunts -BugsFound $Zone.BugsFound
    $speed = 1.0 / $mean
    $explore = Get-ExploreBonus -Hunts $Zone.Hunts
    $churn = [Math]::Min(3, [Math]::Max(0, [int]$Zone.CommitCount))
    $openCount = @($Zone.OpenHypotheses).Count
    $huntReadyCount = @($Zone.HuntReadyHypotheses).Count
    $candidateCount = @($Zone.CandidateHypotheses).Count
    $relatedCount = [Math]::Min(2, (Get-RelatedIdCount $Zone.RelatedPdTb))
    $dry = [Math]::Max(0, [int]$Zone.ConsecutiveDryHunts)
    # Hunt-ready count is a small tie-break only. Candidate/template rows do not score.
    $hyp = [Math]::Min(3, $huntReadyCount) * 0.25
    $precisionBonus = 0.0

    if ($null -ne $Zone.HypothesisPrecision) {
        $precisionBonus = 0.5 * [double]$Zone.HypothesisPrecision
    }

    $score = (6.0 * $speed) + (3.0 * $explore) + (2.0 * $churn) + (1.0 * $relatedCount) + $hyp + $precisionBonus - (2.0 * $dry)
    $why = New-Object System.Collections.ArrayList

    if ($Zone.Status -eq 'unseeded' -or ($Zone.Hunts -le 0 -and $huntReadyCount -eq 0 -and $candidateCount -gt 0)) {
        [void]$why.Add('seed hunt (candidates until files are read)')
    }
    elseif ($Zone.Hunts -le 0) {
        [void]$why.Add('untried catalog sample')
    }
    else {
        [void]$why.Add(('mean hunts/bug {0:N2}' -f $mean))
    }

    [void]$why.Add(('speed {0:N2}' -f $speed))
    [void]$why.Add(('explore bonus {0:N2}' -f $explore))

    if ($huntReadyCount -gt 0) {
        [void]$why.Add("$huntReadyCount hunt-ready hypotheses")
    }

    if ($candidateCount -gt 0) {
        [void]$why.Add("$candidateCount candidate hypotheses")
    }

    if ($openCount -gt 0 -and $huntReadyCount -eq 0 -and $candidateCount -eq 0) {
        [void]$why.Add("$openCount open hypotheses")
    }

    if ($null -ne $Zone.HypothesisPrecision) {
        [void]$why.Add(('precision {0:N2}' -f $Zone.HypothesisPrecision))
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
        Score           = [Math]::Round($score, 2)
        MeanHuntsPerBug = [Math]::Round($mean, 2)
        ExploreBonus    = [Math]::Round($explore, 2)
        Why             = ConvertTo-ObjectArray -Value $why
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
        $zone.MeanHuntsPerBug = $breakdown.MeanHuntsPerBug
        $zone.ExploreBonus = $breakdown.ExploreBonus
        $zone.Why = $breakdown.Why
    }
}

function Get-EligibleZones {
    param($Zones)

    $hasOpen = @($Zones | Where-Object { $_.Status -eq 'open' -or $_.Status -eq 'unseeded' }).Count -gt 0
    $eligible = New-Object System.Collections.ArrayList

    foreach ($zone in $Zones) {
        switch ($zone.Status) {
            'open' {
                [void]$eligible.Add($zone)
            }
            'unseeded' {
                [void]$eligible.Add($zone)
            }
            'cooling' {
                # Cooling waits while any open or unseeded zone still has work.
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

function Test-ZoneNeedsSeedHunt {
    param($Zone)

    if ($null -eq $Zone) {
        return $false
    }

    $huntReadyCount = @($Zone.HuntReadyHypotheses).Count
    $candidateCount = @($Zone.CandidateHypotheses).Count

    if ($Zone.Status -eq 'unseeded') {
        return $true
    }

    # A previously productive zone can consume every stored hypothesis while
    # defects remain. Force a fresh source read instead of treating an empty
    # hypothesis list as a dry hunt.
    if ($huntReadyCount -eq 0 -and $candidateCount -eq 0) {
        return $true
    }

    if ($Zone.Hunts -eq 0 -and $huntReadyCount -eq 0 -and $candidateCount -gt 0) {
        return $true
    }

    return $false
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
            zoneId                 = $null
            status                 = $null
            score                  = 0.0
            why                    = @('no eligible hunt zone')
            openHypotheses         = @()
            huntReadyHypotheses    = @()
            candidateHypotheses    = @()
            seedHunt               = $false
            hypothesisPrecision    = $null
            provenCount            = 0
            invalidCount           = 0
            validNoReproCount      = 0
            paths                  = @()
            testFilter             = ''
            hunts                  = 0
            bugsFound              = 0
            meanHuntsPerBug        = 0.0
            exploreBonus           = 0.0
            consecutiveDryHunts    = 0
            lastHunt               = 'never'
            exhausted              = $true
            reopened               = $false
            exhaustedAll           = $true
            eligibleCount          = 0
            hintOverride           = $false
            codeChangedSince       = 0
            refreshRequested       = $RefreshRequested
        }
    }

    $why = ConvertTo-ObjectArray -Value $Zone.Why

    if ($HintOverride) {
        $why = @('hint override') + @($why)
    }

    return [pscustomobject]@{
        zoneId                 = $Zone.Id
        status                 = $Zone.Status
        score                  = $Zone.Score
        why                    = $why
        openHypotheses         = ConvertTo-ObjectArray -Value $Zone.OpenHypotheses
        huntReadyHypotheses    = ConvertTo-ObjectArray -Value $Zone.HuntReadyHypotheses
        candidateHypotheses    = ConvertTo-ObjectArray -Value $Zone.CandidateHypotheses
        seedHunt               = [bool](Test-ZoneNeedsSeedHunt -Zone $Zone)
        hypothesisPrecision    = $Zone.HypothesisPrecision
        provenCount            = [int]$Zone.ProvenCount
        invalidCount           = [int]$Zone.InvalidCount
        validNoReproCount      = [int]$Zone.ValidNoReproCount
        paths                  = ConvertTo-ObjectArray -Value $Zone.Paths
        testFilter             = $Zone.TestFilter
        hunts                  = $Zone.Hunts
        bugsFound              = $Zone.BugsFound
        meanHuntsPerBug        = $Zone.MeanHuntsPerBug
        exploreBonus           = $Zone.ExploreBonus
        consecutiveDryHunts    = $Zone.ConsecutiveDryHunts
        lastHunt               = $Zone.LastHunt
        exhausted              = ($Zone.Status -eq 'exhausted' -and -not $Zone.Reopened)
        reopened               = [bool]$Zone.Reopened
        exhaustedAll           = $ExhaustedAll
        eligibleCount          = $EligibleCount
        hintOverride           = $HintOverride
        codeChangedSince       = $Zone.CommitCount
        refreshRequested       = $RefreshRequested
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
    Write-Host ("| Seed hunt | {0} |" -f $Result.seedHunt)
    Write-Host ("| Score | {0} |" -f $Result.score)
    Write-Host ("| Mean hunts/bug | {0} |" -f $Result.meanHuntsPerBug)
    Write-Host ("| Explore bonus | {0} |" -f $Result.exploreBonus)
    Write-Host ("| Why | {0} |" -f ($Result.why -join '; '))
    Write-Host ("| Hunt-ready | {0} |" -f @($Result.huntReadyHypotheses).Count)
    Write-Host ("| Candidates | {0} |" -f @($Result.candidateHypotheses).Count)
    Write-Host ("| Precision | {0} |" -f $(if ($null -eq $Result.hypothesisPrecision) { 'n/a' } else { $Result.hypothesisPrecision }))
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

    $picked = @($matched | Sort-Object @{ Expression = { $_.Score }; Descending = $true }, @{ Expression = { $_.FileIndex }; Descending = $false })[0]
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
