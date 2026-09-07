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

    [switch] $Nominate,

    [string[]] $NominatePaths,

    [string] $Since,

    [string] $RunLogPath,

    [string] $EscapeLogPath,

    [string] $CoverageCobertura,

    [string] $StrykerBaselinesPath,

    [string] $AtUtc,

    [string] $RepoRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$escalationScript = Join-Path $PSScriptRoot 'al-bug-escalation.ps1'

if (Test-Path -LiteralPath $escalationScript) {
    . $escalationScript
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
    $creditedBugs = [Math]::Max(0, $BugsFound)

    # Only a zone whose counters honour the one-hit-per-hunt invariant has demonstrated a
    # yield. Claiming more bugs than hunts makes the ratio unverifiable, and claiming none
    # demonstrates nothing, so both fall back to the prior rather than earning fast-zone rank.
    if ($Hunts -gt 0 -and $creditedBugs -gt 0 -and $creditedBugs -le $Hunts) {
        return [Math]::Max(1.0, [double]$Hunts / [double]$creditedBugs)
    }

    # Untried / dry / untrustworthy prior: 2 hunts to first bug; each extra hunt makes it slower.
    return [double]$Hunts + 2.0
}

function Get-EffectiveBugs {
    param([int] $Hunts, [int] $BugsFound)

    if ($Hunts -le 0) {
        return 0
    }

    return [Math]::Min($BugsFound, $Hunts)
}

function Test-BugsFoundInvariantViolating {
    param([int] $Hunts, [int] $BugsFound)

    return ($Hunts -gt 0) -and ($BugsFound -gt $Hunts)
}

function Get-ImpactMultiplier {
    param([string] $Impact)

    if ([string]::IsNullOrWhiteSpace($Impact)) {
        return 1.0
    }

    switch ($Impact.Trim().ToLowerInvariant()) {
        'high' { return 1.40 }
        'low' { return 0.65 }
        default { return 1.00 }
    }
}

function Get-DefaultHuntRunLogPath {
    param([string] $Root)

    return Join-Path $Root 'docs\library\AL_BUG_HUNT_RUN_LOG.jsonl'
}

function Read-AlBugHuntRunLog {
    param([string] $Path)

    if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path)) {
        return @()
    }

    $entries = @()
    $lines = Get-Content -LiteralPath $Path -Encoding UTF8

    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        try {
            $entries += ,($line | ConvertFrom-Json)
        }
        catch {
            throw "Invalid JSONL line in '$Path': $line"
        }
    }

    return $entries
}

function ConvertTo-RunLogUtcDateTime {
    param($IsoTimestamp)

    if ($IsoTimestamp -is [datetime]) {
        $parsed = [datetime]$IsoTimestamp

        if ($parsed.Kind -eq [System.DateTimeKind]::Unspecified) {
            return [datetime]::SpecifyKind($parsed, [System.DateTimeKind]::Utc)
        }

        return $parsed.ToUniversalTime()
    }

    if ($null -eq $IsoTimestamp) {
        throw 'Timestamp is required.'
    }

    return [datetime]::SpecifyKind(
        [datetime]::Parse(
            [string]$IsoTimestamp,
            $null,
            [System.Globalization.DateTimeStyles]::AdjustToUniversal -bor [System.Globalization.DateTimeStyles]::AssumeUniversal
        ),
        [System.DateTimeKind]::Utc
    )
}

function Get-ZoneRunLogHitStats {
    param(
        [string] $ZoneId,
        [object[]] $RunLogEntries,
        [datetime] $NowUtc
    )

    $sevenDayCutoff = $NowUtc.AddDays(-7)
    $twentyFourHourCutoff = $NowUtc.AddHours(-24)
    $hits7d = 0
    $hits24h = 0
    $hunts24h = 0

    foreach ($entry in @($RunLogEntries)) {
        if ($null -eq $entry) {
            continue
        }

        if ([string]$entry.zoneId -ne $ZoneId) {
            continue
        }

        $at = ConvertTo-RunLogUtcDateTime -IsoTimestamp $entry.at
        $outcome = [string]$entry.outcome

        if ($at -ge $twentyFourHourCutoff -and $outcome -ne 'seed-only') {
            $hunts24h++

            if ($outcome -eq 'hit') {
                $hits24h++
            }
        }

        if ($at -ge $sevenDayCutoff -and $outcome -eq 'hit') {
            $hits7d++
        }
    }

    $hitRate24h = 0.0

    if ($hunts24h -gt 0) {
        $hitRate24h = [double]$hits24h / [double]$hunts24h
    }

    return [pscustomobject]@{
        hits7d       = $hits7d
        hits24h      = $hits24h
        hunts24h     = $hunts24h
        hitRate24h   = $hitRate24h
        cooledByRate = ($hits7d -ge 8) -or ($hunts24h -ge 5 -and $hitRate24h -ge 0.7)
    }
}

function Get-DefaultEscapeLogPath {
    param([string] $Root)

    return Join-Path $Root 'docs\library\AL_BUG_ESCAPE_LOG.jsonl'
}

function Get-DefectClassFromHypothesis {
    param([string] $Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $null
    }

    if ($Text -match '\[class:([a-z0-9-]+)\]') {
        $raw = $Matches[1].ToLowerInvariant()
        $allowed = @(
            'fail-open-validation',
            'boolean-coercion',
            'strictmode-script',
            'state-machine-gap',
            'null-deref',
            'off-by-one',
            'authz-scope',
            'other'
        )

        if ($allowed -contains $raw) {
            return $raw
        }

        return 'other'
    }

    return $null
}

function Get-SaturatedDefectClasses {
    param(
        [object[]] $RunLogEntries,
        [datetime] $NowUtc
    )

    $cutoff = $NowUtc.AddDays(-14)
    $byClass = @{}

    foreach ($entry in @($RunLogEntries)) {
        if ($null -eq $entry) {
            continue
        }

        if ([string]$entry.outcome -ne 'hit') {
            continue
        }

        if (-not $entry.PSObject.Properties.Name.Contains('defectClass')) {
            continue
        }

        $classId = [string]$entry.defectClass

        if ([string]::IsNullOrWhiteSpace($classId)) {
            continue
        }

        $at = ConvertTo-RunLogUtcDateTime -IsoTimestamp $entry.at

        if ($at -lt $cutoff) {
            continue
        }

        if (-not $byClass.ContainsKey($classId)) {
            $byClass[$classId] = @{
                hits  = 0
                zones = New-Object 'System.Collections.Generic.HashSet[string]'
                files = New-Object 'System.Collections.Generic.HashSet[string]'
            }
        }

        $byClass[$classId].hits++

        if ($entry.PSObject.Properties.Name.Contains('zoneId')) {
            [void]$byClass[$classId].zones.Add([string]$entry.zoneId)
        }

        if ($entry.PSObject.Properties.Name.Contains('paths')) {
            foreach ($path in @($entry.paths)) {
                if (-not [string]::IsNullOrWhiteSpace($path)) {
                    [void]$byClass[$classId].files.Add($path.Replace('\', '/'))
                }
            }
        }
    }

    $saturated = New-Object System.Collections.ArrayList

    foreach ($classId in $byClass.Keys) {
        $stats = $byClass[$classId]

        if ($stats.hits -lt 4) {
            continue
        }

        $zoneCount = @($stats.zones).Count
        $fileCount = @($stats.files).Count

        if ($zoneCount -ge 2 -or $fileCount -ge 3) {
            [void]$saturated.Add($classId)
        }
    }

    return ,([string[]]@($saturated | Sort-Object))
}

function Test-ZoneCooledByClassSaturation {
    param(
        $Zone,
        [string[]] $SaturatedClasses
    )

    if ($null -eq $Zone -or @($SaturatedClasses).Count -eq 0) {
        return $false
    }

    $huntReady = @($Zone.HuntReadyHypotheses)

    if ($huntReady.Count -eq 0) {
        return $false
    }

    $classes = New-Object System.Collections.ArrayList

    foreach ($line in $huntReady) {
        $classId = Get-DefectClassFromHypothesis -Text ([string]$line)

        if ([string]::IsNullOrWhiteSpace($classId)) {
            return $false
        }

        [void]$classes.Add($classId)
    }

    $unique = @($classes | Select-Object -Unique)

    if ($unique.Count -ne 1) {
        return $false
    }

    return $SaturatedClasses -contains $unique[0]
}

function Read-EscapeLogEntries {
    param([string] $Path)

    if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path)) {
        return @()
    }

    $entries = @()
    $lines = Get-Content -LiteralPath $Path -Encoding UTF8

    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        try {
            $entries += ,($line | ConvertFrom-Json)
        }
        catch {
            throw "Invalid JSONL line in escape log '$Path': $line"
        }
    }

    if ($entries.Count -eq 0) {
        return @()
    }

    return ,([object[]]@($entries))
}

function Test-JsonEntryHasProperty {
    param(
        $InputObject,
        [string] $PropertyName
    )

    if ($null -eq $InputObject) {
        return $false
    }

    foreach ($property in @($InputObject.PSObject.Properties)) {
        if ($property.Name -eq $PropertyName) {
            return $true
        }
    }

    return $false
}

function Get-ZoneEscapeStats {
    param(
        [string] $ZoneId,
        [object[]] $EscapeEntries,
        [object[]] $RunLogEntries,
        [datetime] $NowUtc
    )

    $cutoff = $NowUtc.AddDays(-90)
    $escapeCount = 0

    if ($EscapeEntries -is [System.Management.Automation.PSCustomObject]) {
        $normalizedEscapes = @($EscapeEntries)
    }
    else {
        $normalizedEscapes = ConvertTo-ObjectArray -Value $EscapeEntries
    }

    foreach ($entry in $normalizedEscapes) {
        if (-not (Test-JsonEntryHasProperty -InputObject $entry -PropertyName 'zoneId')) {
            continue
        }

        if ([string]$entry.zoneId -ne $ZoneId) {
            continue
        }

        if (-not (Test-JsonEntryHasProperty -InputObject $entry -PropertyName 'at')) {
            continue
        }

        $at = ConvertTo-RunLogUtcDateTime -IsoTimestamp $entry.at

        if ($at -lt $cutoff) {
            continue
        }

        $escapeCount++
    }

    $huntCount = 0

    foreach ($entry in @($RunLogEntries)) {
        if (-not (Test-JsonEntryHasProperty -InputObject $entry -PropertyName 'zoneId')) {
            continue
        }

        if ([string]$entry.zoneId -ne $ZoneId) {
            continue
        }

        if (-not (Test-JsonEntryHasProperty -InputObject $entry -PropertyName 'at')) {
            continue
        }

        $at = ConvertTo-RunLogUtcDateTime -IsoTimestamp $entry.at

        if ($at -lt $cutoff) {
            continue
        }

        $outcome = [string]$entry.outcome

        if ($outcome -eq 'hit' -or $outcome -eq 'dry') {
            $huntCount++
        }
    }

    $denominator = [Math]::Max(1, $huntCount)
    $escapeRate = [double]$escapeCount / [double]$denominator

    return [pscustomobject]@{
        escapeCount90d = $escapeCount
        escapeRate90d  = [Math]::Round($escapeRate, 4)
    }
}

function Read-StrykerZoneMap {
    param([string] $MapPath)

    if ([string]::IsNullOrWhiteSpace($MapPath) -or -not (Test-Path -LiteralPath $MapPath)) {
        return @()
    }

    $raw = Get-Content -LiteralPath $MapPath -Raw -Encoding UTF8 | ConvertFrom-Json
    return @($raw.labels)
}

function Read-StrykerBaselines {
    param([string] $BaselinesPath)

    if ([string]::IsNullOrWhiteSpace($BaselinesPath) -or -not (Test-Path -LiteralPath $BaselinesPath)) {
        return @{}
    }

    $raw = Get-Content -LiteralPath $BaselinesPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $map = @{}

    foreach ($prop in $raw.PSObject.Properties) {
        $score = $null

        if ($null -ne $prop.Value.mutationScore) {
            $score = [double]$prop.Value.mutationScore
        }

        $map[$prop.Name] = $score
    }

    return $map
}

function Get-ZoneStrykerMutationScore {
    param(
        [string[]] $ZonePaths,
        [object[]] $StrykerLabels,
        [hashtable] $Baselines
    )

    if ($null -eq $ZonePaths -or $ZonePaths.Count -eq 0) {
        return [pscustomobject]@{
            strykerLabel          = $null
            mutationScore         = $null
            mutationScoreMissing  = $true
        }
    }

    $bestLabel = $null
    $bestPrefixLength = -1

    foreach ($labelEntry in @($StrykerLabels)) {
        $labelName = [string]$labelEntry.label

        foreach ($prefix in @($labelEntry.pathPrefixes)) {
            $prefixNorm = ([string]$prefix).Replace('\', '/')

            foreach ($zonePath in $ZonePaths) {
                $zoneNorm = $zonePath.Replace('\', '/')

                if ($zoneNorm -eq $prefixNorm -or $zoneNorm.StartsWith($prefixNorm, [StringComparison]::OrdinalIgnoreCase)) {
                    if ($prefixNorm.Length -gt $bestPrefixLength) {
                        $bestPrefixLength = $prefixNorm.Length
                        $bestLabel = $labelName
                    }
                }
            }
        }
    }

    if ([string]::IsNullOrWhiteSpace($bestLabel)) {
        return [pscustomobject]@{
            strykerLabel          = $null
            mutationScore         = $null
            mutationScoreMissing  = $true
        }
    }

    $score = $null

    if ($Baselines.ContainsKey($bestLabel)) {
        $score = $Baselines[$bestLabel]
    }

    return [pscustomobject]@{
        strykerLabel          = $bestLabel
        mutationScore         = $score
        mutationScoreMissing  = $false
    }
}

function Read-CoverageRatios {
    param([string] $CoveragePath)

    if ([string]::IsNullOrWhiteSpace($CoveragePath) -or -not (Test-Path -LiteralPath $CoveragePath)) {
        return $null
    }

    $ratios = @{}
    $raw = Get-Content -LiteralPath $CoveragePath -Raw -Encoding UTF8

    if ($CoveragePath -match '\.json$') {
        $doc = $raw | ConvertFrom-Json

        foreach ($assembly in @($doc.assemblies)) {
            foreach ($class in @($assembly.classes)) {
                $file = [string]$class.filename

                if ([string]::IsNullOrWhiteSpace($file)) {
                    continue
                }

                $lineRate = 0.0

                if ($null -ne $class.summary -and $null -ne $class.summary.linecoverage) {
                    $lineRate = [double]$class.summary.linecoverage
                }
                elseif ($null -ne $class['line-rate']) {
                    $lineRate = [double]$class['line-rate'] * 100.0
                }

                $norm = $file.Replace('\', '/')
                $ratios[$norm] = [Math]::Max(0.0, [Math]::Min(1.0, $lineRate / 100.0))
            }
        }

        return $ratios
    }

    return $ratios
}

function Get-FileLineCount {
    param(
        [string] $GitRepoRoot,
        [string] $RelativePath
    )

    $full = Join-Path $GitRepoRoot ($RelativePath -replace '/', [IO.Path]::DirectorySeparatorChar)

    if (-not (Test-Path -LiteralPath $full)) {
        return 0
    }

    return @(Get-Content -LiteralPath $full -ErrorAction SilentlyContinue).Count
}

function Test-ZoneIsRetiredMegaZone {
    param($Zone)

    if ($null -eq $Zone) {
        return $false
    }

    if ($Zone.Status -ne 'exhausted') {
        return $false
    }

    foreach ($path in @($Zone.Paths)) {
        if ($path -match '(?i)AL_BUG_HUNT_LEDGER\.md$') {
            return $true
        }
    }

    return $false
}

function Get-ExploreBonus {
    param([int] $Hunts)

    # 1/sqrt(n+1) samples untried catalog so a high-hypothesis zone cannot lock the picker.
    return 1.0 / [Math]::Sqrt([double]$Hunts + 1.0)
}

function Get-ThoroughHuntCount {
    param(
        [string] $ZoneId,
        [object[]] $RunLogEntries
    )

    $count = 0

    foreach ($entry in @($RunLogEntries)) {
        if ($null -eq $entry) {
            continue
        }

        if ([string]$entry.zoneId -ne $ZoneId) {
            continue
        }

        $outcome = [string]$entry.outcome

        if ($outcome -eq 'hit' -or $outcome -eq 'dry') {
            $count++
        }
    }

    return $count
}

function Get-SeedOnlyHuntCount24h {
    param(
        [string] $ZoneId,
        [object[]] $RunLogEntries,
        [datetime] $NowUtc
    )

    $cutoff = $NowUtc.AddHours(-24)
    $count = 0

    foreach ($entry in @($RunLogEntries)) {
        if ($null -eq $entry) {
            continue
        }

        if ([string]$entry.zoneId -ne $ZoneId) {
            continue
        }

        if ([string]$entry.outcome -ne 'seed-only') {
            continue
        }

        $at = ConvertTo-RunLogUtcDateTime -IsoTimestamp $entry.at

        if ($at -ge $cutoff) {
            $count++
        }
    }

    return $count
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
            Impact                 = $(if ($fields.ContainsKey('impact')) { $fields['impact'] } else { 'medium' })
            SplitFrom              = $(if ($fields.ContainsKey('split-from')) { $fields['split-from'] } else { '' })
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
            ImpactMultiplier       = 1.0
            Why                    = @()
            Reopened               = $false
            CooledByHitRate        = $false
            CooledByClass          = $false
            EscapeCount90d         = 0
            EscapeRate90d          = 0.0
            StrykerLabel           = $null
            MutationScore          = $null
            MutationScoreMissing   = $true
            Hits7d                 = 0
            HitRate24h             = 0.0
            ThoroughHunts          = 0
            SeedOnly24h            = 0
            EscalatedFiles         = @()
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
    $speed = [Math]::Min(1.0, 1.0 / $mean)
    $thoroughHunts = 0

    if ($Zone.PSObject.Properties.Name -contains 'ThoroughHunts') {
        $thoroughHunts = [Math]::Max(0, [int]$Zone.ThoroughHunts)
    }

    $explore = Get-ExploreBonus -Hunts $thoroughHunts
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

    $baseScore = (6.0 * $speed) + (3.0 * $explore) + (2.0 * $churn) + (1.0 * $relatedCount) + $hyp + $precisionBonus - (2.0 * $dry)

    if ($Zone.EscapeCount90d -ge 1) {
        $baseScore -= 1.0
    }

    $impactMultiplier = Get-ImpactMultiplier -Impact $Zone.Impact
    $score = $baseScore * $impactMultiplier
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

    if ($Zone.CooledByHitRate) {
        [void]$why.Add('hit-rate cooldown')
    }

    if ($Zone.CooledByClass) {
        [void]$why.Add('defect-class saturation cooldown')
    }

    if ($Zone.EscapeCount90d -ge 1) {
        [void]$why.Add(("escape penalty ({0} escapes / 90d)" -f $Zone.EscapeCount90d))
    }

    if (-not $Zone.MutationScoreMissing -and $null -ne $Zone.MutationScore) {
        [void]$why.Add(("mutation score {0:N1} ({1})" -f $Zone.MutationScore, $Zone.StrykerLabel))
    }

    if ($impactMultiplier -ne 1.0) {
        [void]$why.Add(('impact x{0:N2}' -f $impactMultiplier))
    }

    if ($Zone.Reopened) {
        [void]$why.Add('reopened after git churn')
    }

    return [pscustomobject]@{
        Score            = [Math]::Round($score, 2)
        MeanHuntsPerBug  = [Math]::Round($mean, 2)
        ExploreBonus     = [Math]::Round($explore, 2)
        ImpactMultiplier = $impactMultiplier
        Why              = ConvertTo-ObjectArray -Value $why
    }
}

function Set-ZoneComputedFields {
    param(
        $Zones,
        [string] $GitRepoRoot,
        [switch] $SkipGitCalls,
        [object[]] $RunLogEntries,
        [object[]] $EscapeLogEntries,
        [string[]] $SaturatedClasses,
        [object[]] $StrykerLabels,
        [hashtable] $StrykerBaselineScores,
        [datetime] $NowUtc,
        [string[]] $EscalatedFiles
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

        $runStats = Get-ZoneRunLogHitStats -ZoneId $zone.Id -RunLogEntries $RunLogEntries -NowUtc $NowUtc
        $zone.ThoroughHunts = Get-ThoroughHuntCount -ZoneId $zone.Id -RunLogEntries $RunLogEntries
        $zone.SeedOnly24h = Get-SeedOnlyHuntCount24h -ZoneId $zone.Id -RunLogEntries $RunLogEntries -NowUtc $NowUtc
        $zone.Hits7d = $runStats.hits7d
        $zone.HitRate24h = $runStats.hitRate24h
        $zone.CooledByHitRate = [bool]$runStats.cooledByRate
        $zone.CooledByClass = Test-ZoneCooledByClassSaturation -Zone $zone -SaturatedClasses $SaturatedClasses

        $escapeStats = Get-ZoneEscapeStats `
            -ZoneId $zone.Id `
            -EscapeEntries $EscapeLogEntries `
            -RunLogEntries $RunLogEntries `
            -NowUtc $NowUtc
        $zone.EscapeCount90d = $escapeStats.escapeCount90d
        $zone.EscapeRate90d = $escapeStats.escapeRate90d

        $stryker = Get-ZoneStrykerMutationScore `
            -ZonePaths @($zone.Paths) `
            -StrykerLabels $StrykerLabels `
            -Baselines $StrykerBaselineScores
        $zone.StrykerLabel = $stryker.strykerLabel
        $zone.MutationScore = $stryker.mutationScore
        $zone.MutationScoreMissing = [bool]$stryker.mutationScoreMissing

        $zoneEscalated = @()

        foreach ($path in @($zone.Paths)) {
            foreach ($escalated in @($EscalatedFiles)) {
                if ($path -eq $escalated -or $path.StartsWith($escalated, [StringComparison]::OrdinalIgnoreCase) -or $escalated.StartsWith($path, [StringComparison]::OrdinalIgnoreCase)) {
                    $zoneEscalated += $escalated
                }
            }
        }

        $zone.EscalatedFiles = @($zoneEscalated | Select-Object -Unique)

        $breakdown = Get-ZoneScoreBreakdown -Zone $zone
        $zone.Score = $breakdown.Score
        $zone.MeanHuntsPerBug = $breakdown.MeanHuntsPerBug
        $zone.ExploreBonus = $breakdown.ExploreBonus
        $zone.ImpactMultiplier = $breakdown.ImpactMultiplier
        $zone.Why = $breakdown.Why
    }
}

function Get-EligibleZones {
    param($Zones)

    $hasOpen = @($Zones | Where-Object { $_.Status -eq 'open' -or $_.Status -eq 'unseeded' }).Count -gt 0
    $eligible = New-Object System.Collections.ArrayList

    foreach ($zone in $Zones) {
        $effectiveStatus = $zone.Status

        if ($zone.CooledByHitRate -and $zone.Status -ne 'exhausted') {
            $effectiveStatus = 'cooling'
        }

        if ($zone.CooledByClass -and $zone.Status -ne 'exhausted') {
            $effectiveStatus = 'cooling'
        }

        if (@($zone.EscalatedFiles).Count -gt 0 -and $zone.Status -ne 'exhausted') {
            $effectiveStatus = 'cooling'
        }

        switch ($effectiveStatus) {
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

function Resolve-HintZone {
    param(
        $Zones,
        $MatchedZone
    )

    if (-not (Test-ZoneIsRetiredMegaZone -Zone $MatchedZone)) {
        return $MatchedZone
    }

    $children = @(
        $Zones |
            Where-Object {
                -not [string]::IsNullOrWhiteSpace($_.SplitFrom) -and
                $_.SplitFrom -eq $MatchedZone.Id -and
                -not (Test-ZoneIsRetiredMegaZone -Zone $_)
            }
    )

    if ($children.Count -eq 0) {
        return $MatchedZone
    }

    $eligibleChildren = @(Get-EligibleZones -Zones $children)

    if ($eligibleChildren.Count -eq 0) {
        return $MatchedZone
    }

    return @(
        $eligibleChildren | Sort-Object @{ Expression = { $_.Score }; Descending = $true }, @{ Expression = { $_.FileIndex }; Descending = $false }
    )[0]
}

function Test-NominateExcludedPath {
    param([string] $Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return $true
    }

    $normalized = $Path.Replace('\', '/')

    if ($normalized -match '(?i)Tests|__tests__|\.md$|\.generated\.ts$|package-lock\.json$|Directory\.Packages\.props$') {
        return $true
    }

    return $false
}

function Test-PathCoveredByZone {
    param(
        [string] $Path,
        $Zones
    )

    $normalized = $Path.Replace('\', '/')

    foreach ($zone in $Zones) {
        if (Test-ZoneIsRetiredMegaZone -Zone $zone) {
            continue
        }

        foreach ($zonePath in @($zone.Paths)) {
            if ([string]::IsNullOrWhiteSpace($zonePath)) {
                continue
            }

            $prefix = $zonePath.Replace('\', '/')

            if ($normalized -eq $prefix -or $normalized.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
                return $true
            }
        }
    }

    return $false
}

function Get-NominateGitPaths {
    param(
        [string] $GitRepoRoot,
        [string] $Since,
        [switch] $SkipGitCalls,
        [string[]] $InjectedPaths
    )

    if ($InjectedPaths -and $InjectedPaths.Count -gt 0) {
        return @($InjectedPaths | ForEach-Object { $_.Replace('\', '/') })
    }

    if ($SkipGitCalls) {
        return @()
    }

    $sinceArg = $Since

    if ([string]::IsNullOrWhiteSpace($sinceArg)) {
        $sinceArg = (Get-Date).AddDays(-30).ToString('yyyy-MM-dd')
    }

    $gitArgs = @('-C', $GitRepoRoot, 'log', "--since=$sinceArg", '--name-only', '--pretty=format:')

    $output = & git @gitArgs 2>$null

    if ($LASTEXITCODE -ne 0) {
        return @()
    }

    $paths = New-Object System.Collections.Generic.HashSet[string]

    foreach ($line in @($output)) {
        $trimmed = $line.Trim()

        if ([string]::IsNullOrWhiteSpace($trimmed)) {
            continue
        }

        if (Test-NominateExcludedPath -Path $trimmed) {
            continue
        }

        [void]$paths.Add($trimmed.Replace('\', '/'))
    }

    return @($paths)
}

function Get-NominateGapReport {
    param(
        $Zones,
        [string] $GitRepoRoot,
        [string] $Since,
        [switch] $SkipGitCalls,
        [string[]] $InjectedPaths,
        [hashtable] $CoverageRatios
    )

    $paths = Get-NominateGitPaths -GitRepoRoot $GitRepoRoot -Since $Since -SkipGitCalls:$SkipGitCalls -InjectedPaths $InjectedPaths
    $gapCounts = @{}

    foreach ($path in $paths) {
        if (Test-PathCoveredByZone -Path $path -Zones $Zones) {
            continue
        }

        $directory = $path

        if ($path -match '/') {
            $directory = ($path -split '/')[0..($path.Split('/').Count - 2)] -join '/'
        }

        if ([string]::IsNullOrWhiteSpace($directory)) {
            $directory = $path
        }

        if (-not $gapCounts.ContainsKey($directory)) {
            $gapCounts[$directory] = 0
        }

        $gapCounts[$directory]++
    }

    $gaps = @(
        $gapCounts.GetEnumerator() |
            ForEach-Object {
                $path = $_.Key
                $commitCount = $_.Value
                $coverageRatio = $null
                $lineCount = Get-FileLineCount -GitRepoRoot $GitRepoRoot -RelativePath $path

                if ($lineCount -le 0) {
                    $lineCount = 1
                }

                if ($null -ne $CoverageRatios) {
                    $norm = $path.Replace('\', '/')

                    if ($CoverageRatios.ContainsKey($norm)) {
                        $coverageRatio = [double]$CoverageRatios[$norm]
                    }
                    else {
                        $matchingKeys = @(
                            $CoverageRatios.Keys |
                                Where-Object {
                                    $_ -eq $norm -or
                                    $_.StartsWith($norm + '/', [StringComparison]::OrdinalIgnoreCase)
                                }
                        )

                        if ($matchingKeys.Count -gt 0) {
                            $coverageSum = 0.0

                            foreach ($key in $matchingKeys) {
                                $coverageSum += [double]$CoverageRatios[$key]
                            }

                            $coverageRatio = $coverageSum / [double]$matchingKeys.Count
                        }
                        else {
                            $coverageRatio = 0.0
                        }
                    }
                }

                $coverageMultiplier = 1.0

                if ($null -ne $coverageRatio) {
                    $coverageMultiplier = 1.0 - $coverageRatio
                }

                $rank = [double]$commitCount * $coverageMultiplier * [Math]::Log(1.0 + [Math]::Max(0, $lineCount))

                [pscustomobject]@{
                    path           = $path
                    commitCount    = $commitCount
                    coverageRatio  = $coverageRatio
                    lineCount      = $lineCount
                    rank           = [Math]::Round($rank, 4)
                }
            } |
            Sort-Object -Property rank -Descending |
            Select-Object -First 15
    )

    $proposedZones = @(
        $gaps | ForEach-Object {
            $slug = ($_.path -replace '[^A-Za-z0-9]+', '-').Trim('-').ToLowerInvariant()

            if ($slug.Length -gt 48) {
                $slug = $slug.Substring(0, 48).Trim('-')
            }

            [pscustomobject]@{
                id              = $slug
                paths           = @($_.path)
                impact          = 'medium'
                testFilterGuess = ('FullyQualifiedName~{0}' -f (($_.path -split '/')[-1] -replace '\.[^.]+$', ''))
            }
        }
    )

    return [pscustomobject]@{
        nominate         = $true
        coverageOmitted  = ($null -eq $CoverageRatios)
        gaps             = $gaps
        proposedZones    = $proposedZones
    }
}

function Write-NominatePreview {
    param($Report)

    Write-Host ''
    Write-Host '## /al-bug nominate'
    Write-Host ''
    Write-Host '| Field | Value |'
    Write-Host '| --- | --- |'
    Write-Host ("| Gaps found | {0} |" -f @($Report.gaps).Count)

    if ($Report.PSObject.Properties.Name.Contains('coverageOmitted') -and $Report.coverageOmitted) {
        Write-Host '| Coverage | omitted |'
    }

    Write-Host ''

    foreach ($gap in @($Report.gaps)) {
        $coverageText = 'n/a'

        if ($null -ne $gap.coverageRatio) {
            $coverageText = ('{0:P0}' -f $gap.coverageRatio)
        }

        Write-Host ("- `{0}` commits={1} rank={2} coverage={3}" -f $gap.path, $gap.commitCount, $gap.rank, $coverageText)
    }

    Write-Host ''
    Write-Host 'Proposed zone stanzas (paste into ledger):'
    Write-Host ''

    foreach ($zone in @($Report.proposedZones)) {
        Write-Host ("## Zone: {0}" -f $zone.id)
        Write-Host ''
        Write-Host ("- **id:** {0}" -f $zone.id)
        Write-Host '- **status:** unseeded'
        Write-Host ("- **impact:** {0}" -f $zone.impact)
        Write-Host ("- **paths:** {0}" -f ($zone.paths -join '; '))
        Write-Host ("- **test-filter:** {0}" -f $zone.testFilterGuess)
        Write-Host '- **hunts:** 0'
        Write-Host '- **bugs-found:** 0'
        Write-Host ''
    }
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
            effectiveBugs          = 0
            bugsFoundInvariantViolating = $false
            meanHuntsPerBug        = 0.0
            exploreBonus           = 0.0
            thoroughHunts          = 0
        seedOnly24h            = 0
        openCandidateCount     = 0
        candidateSpam          = $false
        consecutiveDryHunts    = 0
            lastHunt               = 'never'
            exhausted              = $true
            reopened               = $false
            exhaustedAll           = $true
            eligibleCount          = 0
            hintOverride           = $false
            codeChangedSince       = 0
            refreshRequested       = $RefreshRequested
            impact                 = $null
            impactMultiplier       = 0.0
            cooledByHitRate        = $false
            cooledByClass          = $false
            saturatedClasses       = @()
            escapeCount90d         = 0
            escapeRate90d          = 0.0
            strykerLabel           = $null
            mutationScore          = $null
            mutationScoreMissing   = $true
            escalatedFiles         = @()
        }
    }

    $why = ConvertTo-ObjectArray -Value $Zone.Why

    if ($HintOverride) {
        $why = @('hint override') + @($why)
    }

    $huntReadyCount = @($Zone.HuntReadyHypotheses).Count
    $openCandidateCount = @($Zone.CandidateHypotheses).Count
    $candidateSpam = ($openCandidateCount -gt 30 -and $huntReadyCount -eq 0)

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
        effectiveBugs          = Get-EffectiveBugs -Hunts $Zone.Hunts -BugsFound $Zone.BugsFound
        bugsFoundInvariantViolating = Test-BugsFoundInvariantViolating -Hunts $Zone.Hunts -BugsFound $Zone.BugsFound
        meanHuntsPerBug        = $Zone.MeanHuntsPerBug
        exploreBonus           = $Zone.ExploreBonus
        thoroughHunts          = if ($Zone.PSObject.Properties.Name -contains 'ThoroughHunts') { [int]$Zone.ThoroughHunts } else { 0 }
        seedOnly24h            = if ($Zone.PSObject.Properties.Name -contains 'SeedOnly24h') { [int]$Zone.SeedOnly24h } else { 0 }
        openCandidateCount     = $openCandidateCount
        candidateSpam          = [bool]$candidateSpam
        consecutiveDryHunts    = $Zone.ConsecutiveDryHunts
        lastHunt               = $Zone.LastHunt
        exhausted              = ($Zone.Status -eq 'exhausted' -and -not $Zone.Reopened)
        reopened               = [bool]$Zone.Reopened
        exhaustedAll           = $ExhaustedAll
        eligibleCount          = $EligibleCount
        hintOverride           = $HintOverride
        codeChangedSince       = $Zone.CommitCount
        refreshRequested       = $RefreshRequested
        impact                 = $Zone.Impact
        impactMultiplier       = $Zone.ImpactMultiplier
        cooledByHitRate        = [bool]$Zone.CooledByHitRate
        cooledByClass          = [bool]$Zone.CooledByClass
        escapeCount90d         = [int]$Zone.EscapeCount90d
        escapeRate90d          = [double]$Zone.EscapeRate90d
        strykerLabel           = $Zone.StrykerLabel
        mutationScore          = $Zone.MutationScore
        mutationScoreMissing   = [bool]$Zone.MutationScoreMissing
        escalatedFiles         = ConvertTo-ObjectArray -Value $Zone.EscalatedFiles
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
    Write-Host ("| Impact | {0} |" -f $(if ($null -eq $Result.impact) { 'n/a' } else { $Result.impact }))
    Write-Host ("| Cooled | {0} |" -f $Result.cooledByHitRate)
    Write-Host ("| Hunts | {0} |" -f $Result.hunts)
    Write-Host ("| Bugs found (raw) | {0} |" -f $Result.bugsFound)
    Write-Host ("| Bugs found (effective) | {0} |" -f $Result.effectiveBugs)
    Write-Host ("| Counter invariant | {0} |" -f $(if ($Result.bugsFoundInvariantViolating) { 'violating (bugs > hunts)' } else { 'ok' }))
    Write-Host ("| Mean hunts/bug | {0} |" -f $Result.meanHuntsPerBug)
    Write-Host ("| Explore bonus | {0} |" -f $Result.exploreBonus)
    Write-Host ("| Why | {0} |" -f ($Result.why -join '; '))
    Write-Host ("| Hunt-ready | {0} |" -f @($Result.huntReadyHypotheses).Count)
    Write-Host ("| Candidates | {0} |" -f @($Result.candidateHypotheses).Count)
    Write-Host ("| Precision | {0} |" -f $(if ($null -eq $Result.hypothesisPrecision) { 'n/a' } else { $Result.hypothesisPrecision }))
    Write-Host ("| Test filter | `{0}` |" -f $Result.testFilter)
    Write-Host ("| Reopened | {0} |" -f $Result.reopened)
    Write-Host ''

    if ($Result.seedHunt) {
        Write-Host ('**Kind: seed hunt** for zone `{0}`.' -f $Result.zoneId)
        Write-Host 'This /al-bug run is a seed hunt. It reseeds hypotheses from the source files. It is not a thorough defect hunt unless a newly promoted hunt-ready row is proven in this same run.'
    }
    else {
        Write-Host ('**Kind: thorough hunt** for zone `{0}`.' -f $Result.zoneId)
        Write-Host 'This /al-bug run is a thorough defect hunt. Cheap-disproof and failing-repro attempts run to completion even if other /al-bug messages are queued.'
    }

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

$resolvedRunLog = $RunLogPath

if ([string]::IsNullOrWhiteSpace($resolvedRunLog)) {
    $resolvedRunLog = Get-DefaultHuntRunLogPath -Root $resolvedRoot
}
elseif (-not [IO.Path]::IsPathRooted($resolvedRunLog)) {
    $resolvedRunLog = Join-Path $resolvedRoot ($resolvedRunLog -replace '/', [IO.Path]::DirectorySeparatorChar)
}

# -AtUtc pins the clock so hit-rate cooldown and escalation windows are deterministic in tests.
$nowUtc = $(if ([string]::IsNullOrWhiteSpace($AtUtc)) { [datetime]::UtcNow } else { ConvertTo-RunLogUtcDateTime -IsoTimestamp $AtUtc })
$runLogEntries = Read-AlBugHuntRunLog -Path $resolvedRunLog
$saturatedClasses = Get-SaturatedDefectClasses -RunLogEntries $runLogEntries -NowUtc $nowUtc

$resolvedEscapeLog = $EscapeLogPath

if ([string]::IsNullOrWhiteSpace($resolvedEscapeLog)) {
    $resolvedEscapeLog = Get-DefaultEscapeLogPath -Root $resolvedRoot
}
elseif (-not [IO.Path]::IsPathRooted($resolvedEscapeLog)) {
    $resolvedEscapeLog = Join-Path $resolvedRoot ($resolvedEscapeLog -replace '/', [IO.Path]::DirectorySeparatorChar)
}

$escapeLogEntries = Read-EscapeLogEntries -Path $resolvedEscapeLog

$strykerMapPath = Join-Path $PSScriptRoot 'al-bug-stryker-zone-map.json'
$resolvedStrykerBaselinesPath = $StrykerBaselinesPath

if ([string]::IsNullOrWhiteSpace($resolvedStrykerBaselinesPath)) {
    $resolvedStrykerBaselinesPath = Join-Path $resolvedRoot 'scripts\ci\stryker-baselines.json'
}
elseif (-not [IO.Path]::IsPathRooted($resolvedStrykerBaselinesPath)) {
    $resolvedStrykerBaselinesPath = Join-Path $resolvedRoot ($resolvedStrykerBaselinesPath -replace '/', [IO.Path]::DirectorySeparatorChar)
}

$strykerLabels = Read-StrykerZoneMap -MapPath $strykerMapPath
$strykerBaselineScores = Read-StrykerBaselines -BaselinesPath $resolvedStrykerBaselinesPath
$coverageRatios = Read-CoverageRatios -CoveragePath $CoverageCobertura

$escalatedFiles = @()
$gitLogText = ''

if (-not $SkipGit -and (Get-Command Get-GitBugsmashProductionPaths -ErrorAction SilentlyContinue)) {
    $gitLogText = (Get-GitBugsmashProductionPaths -GitRepoRoot $resolvedRoot) -join "`n"
}

if (Get-Command Get-EscalatedProductionFiles -ErrorAction SilentlyContinue) {
    $escalatedFiles = Get-EscalatedProductionFiles -RunLogEntries $runLogEntries -GitLogText $gitLogText -NowUtc $nowUtc
}

Set-ZoneComputedFields `
    -Zones $zones `
    -GitRepoRoot $resolvedRoot `
    -SkipGitCalls:$SkipGit `
    -RunLogEntries $runLogEntries `
    -EscapeLogEntries $escapeLogEntries `
    -SaturatedClasses $saturatedClasses `
    -StrykerLabels $strykerLabels `
    -StrykerBaselineScores $strykerBaselineScores `
    -NowUtc $nowUtc `
    -EscalatedFiles $escalatedFiles

if ($Nominate) {
    $nominateReport = Get-NominateGapReport `
        -Zones $zones `
        -GitRepoRoot $resolvedRoot `
        -Since $Since `
        -SkipGitCalls:$SkipGit `
        -InjectedPaths $NominatePaths `
        -CoverageRatios $coverageRatios

    if ($Status -or $Preview) {
        Write-NominatePreview -Report $nominateReport
    }

    $nominateReport | ConvertTo-Json -Depth 6
    exit 0
}

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
    $picked = Resolve-HintZone -Zones $zones -MatchedZone $picked
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

$result | Add-Member -NotePropertyName saturatedClasses -NotePropertyValue (ConvertTo-ObjectArray -Value $saturatedClasses) -Force

if ($Status -or $Preview) {
    Write-ZonePreview -Result $result

    if (@($saturatedClasses).Count -gt 0) {
        Write-Host ''
        Write-Host ('**Saturated defect classes (14d):** {0}' -f (($saturatedClasses | ForEach-Object { "`[$_`]" }) -join ', '))
        Write-Host 'Do not ship sibling synonym copies for these classes — consolidate to a shared helper or close invalid/dry.'
    }
}

ConvertTo-Json -InputObject $result -Depth 6
