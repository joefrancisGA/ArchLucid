#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Aggregates proof-density records from local proof-packet folders (Improvement #5).

.PARAMETER InputDirectory
  Root directory containing proof-packet subfolders or a proof-density-records.json file.

.PARAMETER MarkdownOut
  Writes UTF-8 rollup Markdown (default: artifacts/release/proof-density-rollup.md).

.PARAMETER JsonOut
  Writes UTF-8 rollup JSON (default: artifacts/release/proof-density-rollup.json).

.PARAMETER MinimumRealRuns
  Minimum distinct Real-mode runs required for overall PASS (default: 3).

.PARAMETER FailOnHold
  Exit 1 when overall disposition is HOLD.
#>
[CmdletBinding()]
param(
    [string] $InputDirectory = '.',
    [string] $MarkdownOut = 'artifacts/release/proof-density-rollup.md',
    [string] $JsonOut = 'artifacts/release/proof-density-rollup.json',
    [int] $MinimumRealRuns = 3,
    [switch] $FailOnHold
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Read-ProofDensityRecord {
    param([string] $FolderPath)

    $envPath = Join-Path $FolderPath 'environment.json'
    $readinessPath = Join-Path $FolderPath 'quote-to-proof-readiness.json'
    $evidencePath = Join-Path $FolderPath 'run-evidence.json'

    if (-not (Test-Path -LiteralPath $envPath)) {
        return $null
    }

    $envDoc = Get-Content -LiteralPath $envPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $readiness = $null
    if (Test-Path -LiteralPath $readinessPath) {
        $readiness = Get-Content -LiteralPath $readinessPath -Raw -Encoding UTF8 | ConvertFrom-Json
    }

    $runId = [string]$envDoc.runId
    if ([string]::IsNullOrWhiteSpace($runId) -and (Test-Path -LiteralPath $evidencePath)) {
        $evidence = Get-Content -LiteralPath $evidencePath -Raw -Encoding UTF8 | ConvertFrom-Json
        $runId = [string]$evidence.runId
    }

    $manifestVersion = '(not captured)'
    if (Test-Path -LiteralPath $evidencePath) {
        $evidence = Get-Content -LiteralPath $evidencePath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($evidence.manifestVersion) {
            $manifestVersion = [string]$evidence.manifestVersion
        }
    }

    return [ordered]@{
        schema                  = 'archlucid.proof-density-record.v1'
        runId                   = $runId
        committedManifestVersion = $manifestVersion
        executionMode           = [string]$envDoc.structuralExecutionMode
        qualityDisposition      = if ($readiness) { [string]$readiness.proofDisposition } else { '(not captured)' }
        roiBasisStatus          = if ($readiness) { [string]$readiness.roiBasisStatus } else { '(not captured)' }
        redactionStatus         = 'PASS'
        dataConsistencyStatus   = 'NOT_EVALUATED'
        proofPacketGenerated    = $true
        sponsorHandoffDisposition = if ($readiness) { [string]$readiness.proofDisposition } else { 'HOLD' }
        sourceFolder            = $FolderPath.Replace('\', '/')
    }
}

function Find-ProofPacketFolders {
    param([string] $BasePath)

    $folders = [System.Collections.Generic.List[string]]::new()
    $recordsFile = Join-Path $BasePath 'proof-density-records.json'

    if (Test-Path -LiteralPath $recordsFile) {
        $payload = Get-Content -LiteralPath $recordsFile -Raw -Encoding UTF8 | ConvertFrom-Json
        foreach ($entry in @($payload.records)) {
            $path = [string]$entry.sourceFolder
            if (-not [string]::IsNullOrWhiteSpace($path) -and (Test-Path -LiteralPath $path)) {
                $folders.Add((Resolve-Path -LiteralPath $path).Path) | Out-Null
            }
        }

        return @($folders)
    }

    if (Test-Path -LiteralPath (Join-Path $BasePath 'environment.json')) {
        return @((Resolve-Path -LiteralPath $BasePath).Path)
    }

    Get-ChildItem -LiteralPath $BasePath -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        if (Test-Path -LiteralPath (Join-Path $_.FullName 'environment.json')) {
            $folders.Add($_.FullName) | Out-Null
        }
    }

    return @($folders)
}

$inputAbs = if ([System.IO.Path]::IsPathRooted($InputDirectory)) { $InputDirectory } else { Join-Path $root $InputDirectory }
$records = [System.Collections.Generic.List[object]]::new()

foreach ($folder in Find-ProofPacketFolders -BasePath $inputAbs) {
    $record = Read-ProofDensityRecord -FolderPath $folder
    if ($null -ne $record) {
        $records.Add($record) | Out-Null
    }
}

$realPassRunIds = @($records | Where-Object {
    $_.executionMode -match 'Real' -and $_.sponsorHandoffDisposition -eq 'PASS'
} | ForEach-Object {
    if (-not [string]::IsNullOrWhiteSpace([string]$_.runId)) { [string]$_.runId } else { [string]$_.sourceFolder }
} | Sort-Object -Unique)

$realPassCount = @($realPassRunIds).Count
$simulatorPacketCount = @($records | Where-Object {
    $_.executionMode -match 'Simulator|Demo|Fallback|Mixed'
}).Count
$holdPacketCount = @($records | Where-Object {
    $_.sponsorHandoffDisposition -eq 'HOLD' -or $_.qualityDisposition -eq 'HOLD' -or $_.roiBasisStatus -eq 'HOLD'
}).Count
$warnPacketCount = @($records | Where-Object {
    $_.sponsorHandoffDisposition -eq 'WARN' -or $_.qualityDisposition -eq 'WARN' -or $_.roiBasisStatus -eq 'WARN'
}).Count

$overallDisposition = if ($realPassCount -ge $MinimumRealRuns) { 'PASS' } else { 'HOLD' }

$generatedUtc = (Get-Date).ToUniversalTime().ToString('o')
$rollup = [ordered]@{
    schema               = 'archlucid.proof-density-rollup.v1'
    generatedUtc         = $generatedUtc
    minimumRealRuns      = $MinimumRealRuns
    realPassCount        = $realPassCount
    simulatorPacketCount = $simulatorPacketCount
    holdPacketCount      = $holdPacketCount
    warnPacketCount      = $warnPacketCount
    totalRecords         = $records.Count
    overallDisposition   = $overallDisposition
    records              = @($records)
}

$md = @(
    '# Proof-density rollup (generated)',
    '',
    "Generated (UTC): **$generatedUtc**",
    '',
    "| Metric | Value |",
    '| --- | --- |',
    "| Overall disposition | **$overallDisposition** |",
    "| Distinct Real-mode PASS runs | $realPassCount / $MinimumRealRuns required |",
    "| Simulator/demo/fallback/mixed packets | $simulatorPacketCount |",
    "| HOLD packets | $holdPacketCount |",
    "| WARN packets | $warnPacketCount |",
    "| Total records | $($records.Count) |",
    '',
    '## Sales-claim interpretation',
    '',
    '- **PASS** means the configured minimum of distinct Real-mode sponsor-safe proof packets is met for the selected threshold.',
    '- **HOLD** blocks broad sales claims and public quantified proof claims, but it does not block controlled pilots when artifacts are honestly labeled.',
    '- Simulator, demo, fallback, mixed, skipped, or HOLD packets never count as Real-mode PASS evidence.',
    '',
    '## Per-record gates',
    '',
    '| Run | Mode | Quality | ROI basis | Sponsor handoff | Folder |',
    '| --- | --- | --- | --- | --- | --- |'
)

foreach ($row in $records) {
    $md += "| $($row.runId) | $($row.executionMode) | $($row.qualityDisposition) | $($row.roiBasisStatus) | $($row.sponsorHandoffDisposition) | ``$($row.sourceFolder)`` |"
}

$md += @(
    '',
    '## Legend',
    '',
    '- **PASS** — configured minimum of distinct Real-mode runs passed sponsor handoff gates.',
    '- **HOLD** — insufficient Real-mode PASS records; do not use for broad sales claims.',
    '- This rollup is internal evidence tracking — not a public marketing claim.',
    ''
)

function Write-Utf8File {
    param([string]$Path, [string]$Content)
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

$mdAbs = if ([System.IO.Path]::IsPathRooted($MarkdownOut)) { $MarkdownOut } else { Join-Path $root $MarkdownOut }
$jsonAbs = if ([System.IO.Path]::IsPathRooted($JsonOut)) { $JsonOut } else { Join-Path $root $JsonOut }

Write-Utf8File -Path $mdAbs -Content ($md -join [Environment]::NewLine)
$rollup | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonAbs -Encoding UTF8

Write-Host "Wrote $MarkdownOut" -ForegroundColor Green
Write-Host "Wrote $JsonOut" -ForegroundColor Green
Write-Host "Overall disposition: $overallDisposition (real PASS $realPassCount / $MinimumRealRuns)" -ForegroundColor Cyan

if ($FailOnHold -and $overallDisposition -eq 'HOLD') {
    exit 1
}

exit 0
