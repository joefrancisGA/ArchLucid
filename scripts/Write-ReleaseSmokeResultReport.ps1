#requires -Version 5.1
<#
.SYNOPSIS
  Writes a machine-readable release smoke result report (JSON + optional Markdown).

.PARAMETER ResultJsonOut
  Path for UTF-8 JSON report.

.PARAMETER ResultMarkdownOut
  Optional Markdown companion path.

.PARAMETER Verdict
  Overall pass/fail verdict.

.PARAMETER BaseUrl
  API base URL exercised (if any).

.PARAMETER Profile
  Release smoke profile name (blank or LiveUiSql).

.PARAMETER Checks
  Hashtable or ordered list of check rows: Name, Result, Detail.
#>
param(
    [Parameter(Mandatory = $true)][string] $ResultJsonOut,
    [string] $ResultMarkdownOut = '',
    [Parameter(Mandatory = $true)][ValidateSet('Pass', 'Fail', 'Partial')][string] $Verdict,
    [string] $BaseUrl = '',
    [string] $Profile = '',
    [Parameter(Mandatory = $true)][object[]] $Checks
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$timestamp = (Get-Date).ToUniversalTime().ToString('o')
$normalizedChecks = @()

foreach ($row in $Checks) {
    if ($row -is [hashtable]) {
        $normalizedChecks += [ordered]@{
            name   = [string]$row.Name
            result = [string]$row.Result
            detail = [string]$row.Detail
        }
    }
    else {
        $normalizedChecks += [ordered]@{
            name   = [string]$row.Check
            result = [string]$row.Result
            detail = [string]$row.Detail
        }
    }
}

$payload = [ordered]@{
    formatVersion = '1.1'
    generatedUtc  = $timestamp
    verdict       = $Verdict
    baseUrl       = $BaseUrl
    profile       = $Profile
    evidenceKind  = if ($Profile -eq 'LiveUiSql') { 'live-ui-sql-parity' } else { 'release-smoke' }
    checks        = $normalizedChecks
    notProven     = @(
        'Full merge-blocking SQL regression (run in CI)',
        'Third-party pen test or CPA SOC 2 attestation',
        'Production customer tenant isolation at scale'
    )
    notMockPlaywright = ($Profile -eq 'LiveUiSql')
}

$jsonDir = Split-Path -Parent $ResultJsonOut

if ($jsonDir -and -not (Test-Path -LiteralPath $jsonDir)) {
    New-Item -ItemType Directory -Force -Path $jsonDir | Out-Null
}

$payload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ResultJsonOut -Encoding UTF8
Write-Host "Wrote release smoke result JSON: $ResultJsonOut"

if (-not [string]::IsNullOrWhiteSpace($ResultMarkdownOut)) {
    $mdDir = Split-Path -Parent $ResultMarkdownOut

    if ($mdDir -and -not (Test-Path -LiteralPath $mdDir)) {
        New-Item -ItemType Directory -Force -Path $mdDir | Out-Null
    }

    $md = @"
# Release smoke result (generated)

Generated (UTC): **$timestamp**

| Field | Value |
| --- | --- |
| Verdict | **$Verdict** |
| Base URL | $BaseUrl |
| Profile | $(if ([string]::IsNullOrWhiteSpace($Profile)) { '(default)' } else { $Profile }) |
| Evidence kind | $(if ($Profile -eq 'LiveUiSql') { 'live-ui-sql-parity' } else { 'release-smoke' }) |
"@

    if ($Profile -eq 'LiveUiSql') {
        $md += @"

> **Not mock Playwright:** This profile exercises live-api browser specs against the smoke-started API and SQL — distinct from mock Playwright lanes.

"@
    }

    $md += @"

| Check | Result | Detail |
| --- | --- | --- |
"@

    foreach ($check in $normalizedChecks) {
        $md += "| $($check.name) | **$($check.result)** | $($check.detail) |`n"
    }

    $md += @"

## What this does not prove

- Full merge-blocking SQL regression (confirm in CI).
- Third-party pen test or CPA SOC 2 attestation.
- Production customer tenant isolation at scale.

Attach to release notes or pilot handoff; do not commit by default.
"@

    [System.IO.File]::WriteAllText($ResultMarkdownOut, $md, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Wrote release smoke result Markdown: $ResultMarkdownOut"
}

exit 0
