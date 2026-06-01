#!/usr/bin/env pwsh
<#
.SYNOPSIS
  TB-165 — Assessment score consistency guard.
  Parses docs/assessments/LATEST_GPT55.md and verifies that the weighted table rows
  and per-quality detail sections agree on score, weight, weighted impact, and
  weighted deficiency signal. Reports mismatches without altering the assessment.

.DESCRIPTION
  Run this after manual rescoring and before committing an assessment update.
  Exit code 0 = consistent; Exit code 1 = at least one mismatch found.
  Does not require external services or network access.

.PARAMETER AssessmentPath
  Path to the assessment markdown file.
  Default: docs/assessments/LATEST_GPT55.md (relative to repo root).

.PARAMETER Verbose
  Print each quality check as it runs.

.EXAMPLE
  .\scripts\Assert-AssessmentScoreConsistency.ps1
  .\scripts\Assert-AssessmentScoreConsistency.ps1 -AssessmentPath docs/assessments/LATEST_GPT55.md -Verbose
#>
[CmdletBinding()]
param(
    [string] $AssessmentPath = 'docs/assessments/LATEST_GPT55.md'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$fullPath = Join-Path $root $AssessmentPath

if (-not (Test-Path $fullPath)) {
    Write-Error "Assessment file not found: $fullPath"
    exit 1
}

$lines = Get-Content $fullPath -Encoding UTF8

# ── 1. Parse weighted table rows ─────────────────────────────────────────────
# Row format: | Quality | Score | Weight | Weighted impact | Weighted deficiency signal |
# Skip header row (contains "Score" as text in weight column position).
# Example:   | AI/Agent Readiness | 72 | 8 | 4.97% | 224 |

$tableRows = [System.Collections.Generic.Dictionary[string, hashtable]]::new([System.StringComparer]::OrdinalIgnoreCase)

foreach ($line in $lines) {
    if ($line -notmatch '^\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([\d.]+)%\s*\|\s*(\d+)\s*\|') {
        continue
    }

    $name            = $Matches[1].Trim()
    $score           = [int]$Matches[2]
    $weight          = [int]$Matches[3]
    $weightedImpact  = [double]$Matches[4]
    $deficiency      = [int]$Matches[5]

    $tableRows[$name] = @{
        Score          = $score
        Weight         = $weight
        WeightedImpact = $weightedImpact
        Deficiency     = $deficiency
    }
}

if ($tableRows.Count -eq 0) {
    Write-Error "No weighted table rows found. Check that the assessment file format matches expected pipe-table syntax."
    exit 1
}

Write-Verbose "Parsed $($tableRows.Count) table rows."

# ── 2. Parse per-quality detail sections ─────────────────────────────────────
# Each section starts with a ### heading matching a table row name, then has:
# "Score: N. Weight: N. Weighted impact: N%. Weighted deficiency signal: N."
# The values may span a single sentence or appear in any order on the same line.

$detailRows = [System.Collections.Generic.Dictionary[string, hashtable]]::new([System.StringComparer]::OrdinalIgnoreCase)
$currentSection = $null

foreach ($line in $lines) {
    # Detect a quality section heading.
    if ($line -match '^###\s+(.+)$') {
        $currentSection = $Matches[1].Trim()
        continue
    }

    if ($null -eq $currentSection) {
        continue
    }

    # Look for the detail score line. Format from the model:
    # "Score: 72. Weight: 8. Weighted impact: 4.97%. Weighted deficiency signal: 224."
    if ($line -match 'Score:\s*(\d+).*Weight:\s*(\d+).*Weighted impact:\s*([\d.]+)%.*Weighted deficiency signal:\s*(\d+)') {
        $detailRows[$currentSection] = @{
            Score          = [int]$Matches[1]
            Weight         = [int]$Matches[2]
            WeightedImpact = [double]$Matches[3]
            Deficiency     = [int]$Matches[4]
        }

        $currentSection = $null
        continue
    }
}

Write-Verbose "Parsed $($detailRows.Count) detail sections."

# ── 3. Compare table rows to detail sections ─────────────────────────────────

$mismatches = [System.Collections.Generic.List[string]]::new()

foreach ($name in $tableRows.Keys) {
    $table = $tableRows[$name]

    if (-not $detailRows.ContainsKey($name)) {
        $mismatches.Add("[$name] Table row present but no matching detail section found.")
        continue
    }

    $detail = $detailRows[$name]

    if ($table.Score -ne $detail.Score) {
        $mismatches.Add("[$name] Score mismatch: table=$($table.Score), detail=$($detail.Score)")
    }

    if ($table.Weight -ne $detail.Weight) {
        $mismatches.Add("[$name] Weight mismatch: table=$($table.Weight), detail=$($detail.Weight)")
    }

    # Allow a tolerance of 0.02 percentage points for floating-point formatting differences.
    if ([Math]::Abs($table.WeightedImpact - $detail.WeightedImpact) -gt 0.02) {
        $mismatches.Add("[$name] Weighted impact mismatch: table=$($table.WeightedImpact)%, detail=$($detail.WeightedImpact)%")
    }

    if ($table.Deficiency -ne $detail.Deficiency) {
        $mismatches.Add("[$name] Weighted deficiency signal mismatch: table=$($table.Deficiency), detail=$($detail.Deficiency)")
    }

    Write-Verbose "OK: $name — Score=$($table.Score), Weight=$($table.Weight), Impact=$($table.WeightedImpact)%, Deficiency=$($table.Deficiency)"
}

# Check for detail sections that have no table row (orphaned detail).
foreach ($name in $detailRows.Keys) {
    if (-not $tableRows.ContainsKey($name)) {
        $mismatches.Add("[$name] Detail section present but no matching table row found.")
    }
}

# ── 4. Report results ─────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Assessment consistency check: $AssessmentPath"
Write-Host "  Table rows parsed  : $($tableRows.Count)"
Write-Host "  Detail rows parsed : $($detailRows.Count)"
Write-Host ""

if ($mismatches.Count -eq 0) {
    Write-Host "PASS — all $($tableRows.Count) quality entries are consistent between table and detail sections." -ForegroundColor Green
    exit 0
}

Write-Host "FAIL — $($mismatches.Count) mismatch(es) found:" -ForegroundColor Red
Write-Host ""

foreach ($msg in $mismatches) {
    Write-Host "  $msg" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Fix the assessment file so the weighted table and each quality detail line agree, then re-run this check."
exit 1
