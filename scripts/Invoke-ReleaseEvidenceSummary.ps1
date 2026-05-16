#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Non-blocking release evidence collector — pass / fail / skipped / not captured; optional Markdown output.

.PARAMETER MarkdownOut
  Writes UTF-8 summary to this path.

.PARAMETER FailOnError
  Exit 1 when any check is Failed.
#>
[CmdletBinding()]
param(
    [string] $MarkdownOut,
    [switch] $FailOnError
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$rows = [System.Collections.Generic.List[object]]::new()

function Add-Row {
    param([string]$Name, [string]$Result, [string]$Detail, [Nullable[int]]$ExitCode)
    $rows.Add([pscustomobject]@{ Check = $Name; Result = $Result; Detail = $Detail; ExitCode = $ExitCode }) | Out-Null
}

Write-Host "== ArchLucid release evidence summary ==" -ForegroundColor Cyan

Write-Host "[dotnet build Release]" -ForegroundColor Yellow
dotnet build .\ArchLucid.sln -c Release 2>&1 | Out-Null
$code = $LASTEXITCODE
if ($code -eq 0) { Add-Row "dotnet build Release" "Passed" "exit 0" $code }
else { Add-Row "dotnet build Release" "Failed" "exit $code" $code }

Write-Host "[OpenAPI contract snapshot]" -ForegroundColor Yellow
dotnet test .\ArchLucid.Api.Tests\ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~OpenApiContractSnapshot" --no-build 2>&1 | Out-Null
$code = $LASTEXITCODE
if ($code -eq 0) { Add-Row "OpenAPI contract snapshot" "Passed" "exit 0" $code }
else { Add-Row "OpenAPI contract snapshot" "Failed" "exit $code — rebuild with --no-build:`$false if needed" $code }

Write-Host "[Health sample tests]" -ForegroundColor Yellow
dotnet test .\ArchLucid.Api.Tests\ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~Health" --no-build 2>&1 | Out-Null
$code = $LASTEXITCODE
if ($code -eq 0) { Add-Row "Health sample tests" "Passed" "exit 0" $code }
else { Add-Row "Health sample tests" "Failed" "exit $code" $code }

Add-Row "Merge-blocking full regression (SQL)" "Not captured" "Confirm in CI — `dotnet-full-regression` job" $null
Add-Row "Merged Cobertura coverage gates" "Not captured" "See docs/COVERAGE_GAP_ANALYSIS.md + CI artifacts" $null
Add-Row "Playwright live UI smoke" "Skipped" "Optional — needs SQL-backed API (LIVE_E2E_HAPPY_PATH.md)" $null

Write-Host "[Procurement pack index (buyer materials readiness)]" -ForegroundColor Yellow
python scripts/ci/check_procurement_pack_index.py 2>&1 | Out-Null
$code = $LASTEXITCODE
if ($code -eq 0) { Add-Row "Procurement pack index (PROCUREMENT_PACK_INDEX.md)" "Passed" "paths + freshness + placeholder + assurance wording" $code }
else { Add-Row "Procurement pack index (PROCUREMENT_PACK_INDEX.md)" "Failed" "exit $code — see scripts/ci/check_procurement_pack_index.py" $code }

Write-Host "[Procurement pack validator (canonical + claims)]" -ForegroundColor Yellow
python scripts/validate_procurement_pack.py 2>&1 | Out-Null
$code = $LASTEXITCODE
if ($code -eq 0) { Add-Row "Procurement pack validator" "Passed" "exit 0" $code }
else { Add-Row "Procurement pack validator" "Failed" "exit $code" $code }

$rows | Format-Table -AutoSize

$md = "# Release evidence summary (generated)`n`nGenerated (UTC): **$([DateTime]::UtcNow.ToString('o'))**`nRepo: ``$root```n`n| Check | Result | Detail |`n| --- | --- | --- |`n"
foreach ($r in $rows) {
    $md += "| $($r.Check) | **$($r.Result)** | $($r.Detail) |`n"
}
$md += @"

## Legend

- **Passed** — command exited zero on this workstation.
- **Failed** — non-zero exit (triage logs; may be stale `--no-build` binaries).
- **Skipped** — not attempted by this script.
- **Not captured** — requires CI run links or another machine.

Do not commit this file by default — attach to release artifacts only.

"@

if ($MarkdownOut) {
    $dir = Split-Path -Parent $MarkdownOut
    if ($dir -and !(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
    [System.IO.File]::WriteAllText($MarkdownOut, $md, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Wrote $MarkdownOut" -ForegroundColor Green
}

$failed = @($rows | Where-Object { $_.Result -eq "Failed" }).Count
if ($FailOnError -and $failed -gt 0) { exit 1 }
exit 0
