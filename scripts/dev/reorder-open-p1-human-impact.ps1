#Requires -Version 5.1
<#
.SYNOPSIS
  Reorders open P1 summary-table rows in docs/library/TECH_BACKLOG.md by human/buyer impact.
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$path = Join-Path $repoRoot 'docs\library\TECH_BACKLOG.md'
$rawLines = Get-Content -LiteralPath $path -Encoding UTF8
$lines = [System.Collections.Generic.List[string]]::new()
$lines.AddRange([string[]]$rawLines)

$tableHeaderIdx = -1
$v2Idx = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($tableHeaderIdx -lt 0 -and $lines[$i] -match '^\| ID \| Title \| Priority driver \| Size \|') {
        $tableHeaderIdx = $i
    }

    if ($lines[$i] -match '^### V2 window') {
        $v2Idx = $i
        break
    }
}

if ($tableHeaderIdx -lt 0 -or $v2Idx -lt 0) {
    throw "Could not locate summary table header or V2 window (header=$tableHeaderIdx v2=$v2Idx)."
}

$sepIdx = $tableHeaderIdx + 1
if ($sepIdx -ge $lines.Count -or $lines[$sepIdx] -notmatch '^\|[-| ]+\|$') {
    throw "Expected markdown separator under summary table header at line $($sepIdx + 1)."
}

function Get-OpenP1Band {
    param(
        [string]$Id,
        [string]$Text
    )

    $driver = ''
    if ($Text -match '\| ([^|]*P1[^|]*) \|') {
        $driver = $Matches[1].Trim()
    }

    $title = ''
    if ($Text -match '^\| TB-\d+ \| ([^|]+) \|') {
        $title = $Matches[1].Trim()
    }

    $blob = "$driver $title"

    # Help / specialty-doc polish is human-visible but lower than product trust/correctness.
    if ($title -match '/help/|Help Center|specialty (Admin )?guide|help drawer|HelpTopic|(?i)\bhelp\b\s*[\u2014\-]|AWS help|GCP help|Azure help' -or
        $blob -match 'traffic \*\*H[A-Z]{2}\*\*|traffic \*\*HE[A-Z]\*\*|internal-runbook|contributor leak purge') {
        return 140
    }

    if ($blob -match 'Execute \+ record|execution pending|owner execution|FAILOVER_RESULTS|LAUNCH_LOAD_DRILL') {
        return 115
    }

    # Product-surface trust/abuse only - do not keyword-match every INV-001/webhook mention in PA/UX copy.
    if ($driver -match 'Trustworthiness|Abuse prevention') {
        return 10
    }

    if ($blob -match 'prompt-injection|AllowedTools fail-closed|inbound webhook|webhook body intake|webhook contract|AuditEventTypes|single-derivation') {
        return 10
    }

    if ($driver -match 'Correctness') {
        return 20
    }

    if ($driver -match 'Reliability') {
        return 30
    }

    if ($blob -match 'Buyer/operator UX|model-failed vs quality|execution-mode honesty|never conflate|Mixed aggregation|quality-rejected') {
        return 35
    }

    if ($driver -match 'Explainability') {
        return 40
    }

    if ($driver -match 'Data consistency') {
        return 50
    }

    if ($driver -match 'Cost-effectiveness') {
        return 60
    }

    if ($driver -match 'Adoption friction|Accessibility|Commercial|Marketability|Proof-of-ROI|Sponsor') {
        if ($blob -match 'honesty CI|PA one-pager|claim honesty|claim map') {
            return 85
        }

        return 70
    }

    if ($driver -match 'Traceability|Compliance') {
        return 80
    }

    if ($driver -match 'Interoperability') {
        return 100
    }

    if ($Id -eq 'TB-946' -or $blob -match 'scale micro-drill|G-SCALE-01') {
        return 111
    }

    if ($driver -match 'Performance|Scalability|Deployability|Operability') {
        return 110
    }

    if ($driver -match 'AI/Agent readiness|Cutting-edge') {
        return 120
    }

    if ($driver -match 'Testability|Maintainability|Supportability|Code hygiene|Architectural integrity') {
        return 130
    }

    return 150
}

function Get-DependsOnIds {
    param([string]$Text)

    $deps = New-Object System.Collections.Generic.List[string]
    # Only hard sequencing edges - ignore "after Done **TB-xxx**".
    $matches = [regex]::Matches($Text, '(?<!Done\s)(?:after|depends on|requires)\s+\*\*(TB-\d+)\*\*', 'IgnoreCase')
    foreach ($m in $matches) {
        $deps.Add($m.Groups[1].Value)
    }

    return @($deps)
}

function Sort-OpenP1Band {
    param(
        [System.Collections.Generic.List[object]]$Rows
    )

    $byId = @{}
    foreach ($row in $Rows) {
        $byId[$row.Id] = $row
    }

    $remaining = [System.Collections.Generic.List[object]]::new()
    foreach ($row in ($Rows | Sort-Object HonestyBias, Num)) {
        $remaining.Add($row)
    }

    $ordered = [System.Collections.Generic.List[object]]::new()
    $placed = New-Object 'System.Collections.Generic.HashSet[string]'
    $guard = 0
    $maxGuard = ($remaining.Count * $remaining.Count) + 10

    while ($remaining.Count -gt 0) {
        $guard++
        if ($guard -gt $maxGuard) {
            throw "Dependency cycle while ordering band $($Rows[0].Band) (remaining=$($remaining.Count))."
        }

        $progress = $false
        for ($r = 0; $r -lt $remaining.Count; $r++) {
            $row = $remaining[$r]
            $blocked = $false
            foreach ($dep in $row.Deps) {
                if ($byId.ContainsKey($dep) -and -not $placed.Contains($dep)) {
                    $blocked = $true
                    break
                }
            }

            if ($blocked) {
                continue
            }

            $ordered.Add($row)
            [void]$placed.Add($row.Id)
            $remaining.RemoveAt($r)
            $progress = $true
            break
        }

        if (-not $progress) {
            $force = $remaining | Sort-Object HonestyBias, Num | Select-Object -First 1
            $ordered.Add($force)
            [void]$placed.Add($force.Id)
            [void]$remaining.Remove($force)
        }
    }

    return $ordered
}

$openP1 = [System.Collections.Generic.List[object]]::new()
$removeIdx = New-Object 'System.Collections.Generic.HashSet[int]'

for ($i = $sepIdx + 1; $i -lt $v2Idx; $i++) {
    $line = $lines[$i]
    if ($line -notmatch '^\| (TB-\d+) \|') {
        continue
    }

    $id = $Matches[1]
    if ($line -notmatch '\bP1\b') {
        continue
    }

    if ($line -match '\*\*Done\*\*|Done \(20|~~') {
        continue
    }

    if ($line -match '\bV2\b') {
        continue
    }

    $band = Get-OpenP1Band -Id $id -Text $line
    $deps = @(Get-DependsOnIds -Text $line)
    $honestyBias = 0
    if ($line -match 'honesty CI') { $honestyBias = 1 }
    if ($line -match 'contract \+|contract —|contract -|contract \+') { $honestyBias = -1 }

    $openP1.Add([pscustomobject]@{
            Idx         = $i
            Id          = $id
            Text        = $line
            Band        = [int]$band
            Deps        = $deps
            HonestyBias = [int]$honestyBias
            Num         = [int]($id -replace 'TB-', '')
        }) | Out-Null
    [void]$removeIdx.Add($i)
}

if ($openP1.Count -eq 0) {
    throw 'No open P1 summary rows found to reorder.'
}

$ordered = [System.Collections.Generic.List[object]]::new()
$bandGroups = $openP1 | Group-Object Band | Sort-Object { [int]$_.Name }
foreach ($g in $bandGroups) {
    $bandRows = [System.Collections.Generic.List[object]]::new()
    foreach ($row in $g.Group) {
        $bandRows.Add($row)
    }

    $sortedBand = Sort-OpenP1Band -Rows $bandRows
    foreach ($row in $sortedBand) {
        $ordered.Add($row)
    }
}

$sectionHeader = @(
    ''
    '### P1 - human-impact ship order (2026-07-31)'
    ''
    '> Open **P1** rows only, ranked for buyer/operator humans: trust and abuse resistance, then correctness, reliability, outcome honesty/explainability, cost honesty, product adoption UX, traceability/compliance, commercial/ROI, interoperability, ops/scale/perf, AI capability, engineering hygiene, then help-page polish. Within a band, after/depends-on edges are honored (help-page Trustworthiness copy stays in the help band). `/ship-next-improvement` Step 2 picks the first open row in this block. Re-run `scripts/dev/reorder-open-p1-human-impact.ps1` after large P1 intakes.'
    ''
    '| ID | Title | Priority driver | Size |'
    '|----|-------|----------------|------|'
)

$newLines = [System.Collections.Generic.List[string]]::new()
for ($i = 0; $i -le $sepIdx; $i++) {
    $newLines.Add($lines[$i])
}

foreach ($h in $sectionHeader) {
    $newLines.Add($h)
}

foreach ($row in $ordered) {
    $newLines.Add($row.Text)
}

$newLines.Add('')
$newLines.Add('### Remaining summary rows (cluster order; open P1s moved above)')
$newLines.Add('')

$skipGeneratedChrome = $false
for ($i = $sepIdx + 1; $i -lt $lines.Count; $i++) {
    if ($removeIdx.Contains($i)) {
        continue
    }

    if ($lines[$i] -match '^### P1 - human-impact ship order') {
        $skipGeneratedChrome = $true
        continue
    }

    if ($lines[$i] -match '^### Remaining summary rows \(cluster order') {
        $skipGeneratedChrome = $true
        continue
    }

    if ($skipGeneratedChrome) {
        if ($lines[$i] -match '^> Open \*\*P1\*\* rows only, ranked for buyer') {
            continue
        }

        if ($lines[$i] -match '^\| ID \| Title \| Priority driver \| Size \|$') {
            continue
        }

        if ($lines[$i] -match '^\|----\|') {
            continue
        }

        if ($lines[$i].Trim() -eq '') {
            continue
        }

        # First real content after generated chrome ends the skip window.
        $skipGeneratedChrome = $false
    }

    $newLines.Add($lines[$i])
}

$stamp = "**Updated:** 2026-07-31 (Open **P1** summary rows reordered - human-impact ship order for `/ship-next-improvement`; $($ordered.Count) open P1s; see ``### P1 - human-impact ship order``)."
for ($i = 0; $i -lt [Math]::Min(40, $newLines.Count); $i++) {
    if ($newLines[$i] -match '^\*\*Updated:\*\*') {
        $newLines[$i] = $stamp
        break
    }
}

for ($i = 0; $i -lt $newLines.Count; $i++) {
    if ($newLines[$i] -match '^\*\*Priority order:\*\*') {
        $newLines[$i] = '**Priority order:** Items are listed highest to lowest priority. When picking up work, start at the top. Open **P1** rows are ranked in `### P1 - human-impact ship order` (buyer/operator impact). Re-sort when new items are added: customer-visible trust/correctness above ops/observability, which rank above developer-experience polish.'
        break
    }
}

for ($i = 0; $i -lt $newLines.Count; $i++) {
    if ($newLines[$i] -match '^\> \*\*Summary-table order:\*\*') {
        $newLines[$i] = '> **Summary-table order:** Open **P1** rows live in `### P1 - human-impact ship order` (buyer/operator impact) directly under the summary header so `/ship-next-improvement` Step 2 file-order matches that ranking. Remaining V1 / V1.1 / Done rows stay in cluster order below. All rows tagged **V2** (open or Done) are listed in the **V2 window** subsection at the **bottom** of this table. **Do not renumber** TB IDs when changing window - stable IDs preserve assessment/grep history.'
        break
    }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllLines($path, $newLines.ToArray(), $utf8NoBom)

Write-Host "Reordered $($ordered.Count) open P1 rows."
Write-Host 'Top 30 ship order:'
$ordered | Select-Object -First 30 | ForEach-Object {
    Write-Host ("  band={0:D3} {1}" -f $_.Band, $_.Id)
}

Write-Host 'Band counts:'
$ordered | Group-Object Band | Sort-Object { [int]$_.Name } | ForEach-Object {
    Write-Host ("  band={0}: {1}" -f $_.Name, $_.Count)
}
