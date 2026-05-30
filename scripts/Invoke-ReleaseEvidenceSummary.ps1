#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Non-blocking release evidence collector — pass / fail / skipped / not captured; optional Markdown output.

.PARAMETER MarkdownOut
  Writes UTF-8 summary to this path.

.PARAMETER FailOnError
  Exit 1 when any check is Failed.

.PARAMETER ProofPacketDirectory
  Optional proof-packet folder root. When present, release evidence includes proof-density status.
#>
[CmdletBinding()]
param(
    [string] $MarkdownOut,
    [string] $ProofPacketDirectory,
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

Write-Host "[Faithfulness golden cohort (offline)]" -ForegroundColor Yellow
python scripts/ci/eval_agent_faithfulness.py 2>&1 | Out-Null
$code = $LASTEXITCODE
if ($code -eq 0) { Add-Row "Faithfulness golden cohort (offline, 25+ cases)" "Passed" "exit 0" $code }
else { Add-Row "Faithfulness golden cohort (offline, 25+ cases)" "Failed" "exit $code" $code }

Write-Host "[Retrieval IR golden cohort (offline)]" -ForegroundColor Yellow
python scripts/ci/eval_retrieval_ir.py 2>&1 | Out-Null
$code = $LASTEXITCODE
if ($code -eq 0) { Add-Row "Retrieval IR golden cohort (offline)" "Passed" "exit 0" $code }
else { Add-Row "Retrieval IR golden cohort (offline)" "Failed" "exit $code" $code }

Write-Host "[Real-LLM evidence gate (skip-graceful)]" -ForegroundColor Yellow
pwsh -NoProfile -File .\scripts\ci\Invoke-RealLlmGoldenCohort.ps1 2>&1 | Out-Null
$code = $LASTEXITCODE
$realLlmGateJson = Join-Path $root 'artifacts/release/real-llm-evidence-gate.json'
$realLlmDisposition = $null
if (Test-Path -LiteralPath $realLlmGateJson) {
    try {
        $realLlmDisposition = (Get-Content -LiteralPath $realLlmGateJson -Raw -Encoding UTF8 | ConvertFrom-Json).disposition
    }
    catch {
        $realLlmDisposition = $null
    }
}

if ($realLlmDisposition -eq 'SKIPPED_NO_CREDENTIALS') {
    Add-Row "Real-LLM golden cohort shell" "Skipped" "SKIPPED_NO_CREDENTIALS — no misleading pass" $code
}
elseif ($code -eq 0) {
    Add-Row "Real-LLM golden cohort shell" "Passed" "skip-graceful or live gate exit 0 (disposition=$realLlmDisposition)" $code
}
else {
    Add-Row "Real-LLM golden cohort shell" "Failed" "exit $code when credentials configured (disposition=$realLlmDisposition)" $code
}

Write-Host "[First-pilot performance budget smoke]" -ForegroundColor Yellow
pwsh -NoProfile -File .\scripts\ci\Invoke-FirstPilotPerformanceBudgetSmoke.ps1 2>&1 | Out-Null
$code = $LASTEXITCODE
if ($code -eq 0) { Add-Row "First-pilot performance budget smoke" "Passed" "exit 0" $code }
else { Add-Row "First-pilot performance budget smoke" "Failed" "exit $code" $code }

Write-Host "[Proof-density rollup (empty input)]" -ForegroundColor Yellow
$emptyPerf = Join-Path $env:TEMP "archlucid-release-evidence-empty"
New-Item -ItemType Directory -Path $emptyPerf -Force | Out-Null
pwsh -NoProfile -File .\scripts\proof-density-rollup.ps1 -InputDirectory $emptyPerf 2>&1 | Out-Null
$code = $LASTEXITCODE
Remove-Item -LiteralPath $emptyPerf -Recurse -Force -ErrorAction SilentlyContinue
if ($code -eq 0) { Add-Row "Proof-density rollup script" "Passed" "exit 0 on empty input (HOLD expected)" $code }
else { Add-Row "Proof-density rollup script" "Failed" "exit $code" $code }

$proofDensitySummary = $null
if (-not [string]::IsNullOrWhiteSpace($ProofPacketDirectory) -and (Test-Path -LiteralPath $ProofPacketDirectory)) {
    Write-Host "[Proof-density rollup (release packets)]" -ForegroundColor Yellow
    $proofDensityJson = Join-Path $env:TEMP "archlucid-proof-density-rollup.json"
    $proofDensityMd = Join-Path $env:TEMP "archlucid-proof-density-rollup.md"
    pwsh -NoProfile -File .\scripts\proof-density-rollup.ps1 -InputDirectory $ProofPacketDirectory -MarkdownOut $proofDensityMd -JsonOut $proofDensityJson 2>&1 | Out-Null
    $code = $LASTEXITCODE

    if ($code -eq 0 -and (Test-Path -LiteralPath $proofDensityJson)) {
        $proofDensitySummary = Get-Content -LiteralPath $proofDensityJson -Raw -Encoding UTF8 | ConvertFrom-Json
        Add-Row "Proof-density status (release packets)" "Passed" "$($proofDensitySummary.overallDisposition): real PASS $($proofDensitySummary.realPassCount) / $($proofDensitySummary.minimumRealRuns), simulator/demo/fallback/mixed $($proofDensitySummary.simulatorPacketCount), HOLD $($proofDensitySummary.holdPacketCount)" $code
    }
    else {
        Add-Row "Proof-density status (release packets)" "Failed" "exit $code" $code
    }
}

Write-Host "[Claim-language lint (buyer-facing docs sample)]" -ForegroundColor Yellow
python scripts/ci/check_proof_summary_promise_language.py docs/go-to-market/WHAT_NOT_TO_PROMISE.md docs/go-to-market/TRUST_CENTER.md 2>&1 | Out-Null
$code = $LASTEXITCODE
if ($code -eq 0) { Add-Row "Claim-language lint (sample buyer docs)" "Passed" "exit 0" $code }
else { Add-Row "Claim-language lint (sample buyer docs)" "Failed" "exit $code" $code }

$rows | Format-Table -AutoSize

$md = "# Release evidence summary (generated)`n`nGenerated (UTC): **$([DateTime]::UtcNow.ToString('o'))**`nRepo: ``$root```n`n| Check | Result | Detail |`n| --- | --- | --- |`n"
foreach ($r in $rows) {
    $md += "| $($r.Check) | **$($r.Result)** | $($r.Detail) |`n"
}

if ($null -ne $proofDensitySummary) {
    $md += @"

## Proof-density status

| Metric | Value |
| --- | --- |
| Overall disposition | **$($proofDensitySummary.overallDisposition)** |
| Distinct Real-mode PASS packets | $($proofDensitySummary.realPassCount) / $($proofDensitySummary.minimumRealRuns) required |
| Simulator/demo/fallback/mixed packets | $($proofDensitySummary.simulatorPacketCount) |
| HOLD packets | $($proofDensitySummary.holdPacketCount) |
| Total proof packets | $($proofDensitySummary.totalRecords) |

**Interpretation:** proof-density HOLD blocks broad sales claims and public quantified proof claims, but it does not block controlled pilots when evidence is honestly labeled. Simulator, demo, fallback, mixed, skipped, or HOLD packets do not count as Real-mode PASS evidence.

"@
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
