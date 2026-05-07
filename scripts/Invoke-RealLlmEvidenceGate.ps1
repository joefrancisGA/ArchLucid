#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Runs optional RealAzureOpenAIEndToEndTests when AOAI env vars are set; always writes a Markdown evidence table.

.PARAMETER MarkdownOut
  Destination for UTF-8 summary (default: artifacts/release/real-llm-evidence-gate.md).
#>
[CmdletBinding()]
param(
    [string] $MarkdownOut = "artifacts/release/real-llm-evidence-gate.md"
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$endpoint = $env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT
$key = $env:ARCHLUCID_REAL_AOAI_TEST_KEY

$rows = [System.Collections.Generic.List[object]]::new()

function Add-Row {
    param([string]$Name, [string]$Result, [string]$Detail)
    $rows.Add([pscustomobject]@{ Check = $Name; Result = $Result; Detail = $Detail }) | Out-Null
}

$creds = (-not [string]::IsNullOrWhiteSpace($endpoint)) -and (-not [string]::IsNullOrWhiteSpace($key))
if ($creds) {
    Add-Row "Azure OpenAI credentials present (names only)" "Passed" "ARCHLUCID_REAL_AOAI_TEST_ENDPOINT + _KEY are set"
}
else {
    Add-Row "Azure OpenAI credentials present (names only)" "Skipped" "Set ARCHLUCID_REAL_AOAI_TEST_ENDPOINT and ARCHLUCID_REAL_AOAI_TEST_KEY to run live AOAI gate"
}

$schemaValidation = if ($creds) { "Not captured" } else { "Skipped" }
Add-Row "Azure OpenAI schema validation (fixture / host)" $schemaValidation "Confirm in CI or manual QA when running live"

Add-Row "Structural completeness vs simulator baseline" $(if ($creds) { "Not captured" } else { "Skipped" }) "Compare traces when credentials present"

Add-Row "Semantic score / golden cohort parity" $(if ($creds) { "Not captured" } else { "Skipped" }) "Not run without session-specific artefacts"

Add-Row "Parse failures observed" $(if ($creds) { "Not captured" } else { "Skipped" }) ""

Add-Row "Token / cost estimate captured" $(if ($creds) { "Not captured" } else { "Skipped" }) "Use metering dashboards when live"

Add-Row "Execution trace persisted" $(if ($creds) { "Not captured" } else { "Skipped" }) ""

Add-Row "Evidence chain availability" $(if ($creds) { "Not captured" } else { "Skipped" }) ""

$exit = 0
if ($creds) {
    Write-Host "Running RealAzureOpenAIEndToEndTests..." -ForegroundColor Cyan
    dotnet test .\ArchLucid.AgentRuntime.Tests\ArchLucid.AgentRuntime.Tests.csproj `
        --filter "FullyQualifiedName~RealAzureOpenAIEndToEndTests" `
        --no-build:$false
    $exit = $LASTEXITCODE
    $runLabel = if ($exit -eq 0) { "Passed" } else { "Failed" }
    Add-Row "RealAzureOpenAIEndToEndTests executed" $runLabel "exit $exit"
}
else {
    Add-Row "RealAzureOpenAIEndToEndTests executed" "Not captured" "Credentials absent — no live LLM calls attempted"
}

$md = @"
# Real LLM evidence gate (generated)

Generated (UTC): **$([DateTime]::UtcNow.ToString('o'))**

Template: [docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md](../docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md)

| Check | Result | Detail |
| --- | --- | --- |
"@

foreach ($r in $rows) {
    $md += "| $($r.Check) | **$($r.Result)** | $($r.Detail) |`n"
}

$md += @"

## Legend

- **Passed** — positive signal for the row.
- **Failed** — non-zero test exit or explicit failure.
- **Skipped** — not applicable on this workstation.
- **Not captured** — needs another process, dashboard, or manual step.

This report does **not** claim real LLM validation ran unless **RealAzureOpenAIEndToEndTests executed** is **Passed**.
"@

$outAbs = Join-Path $root $MarkdownOut
$dir = Split-Path -Parent $outAbs
if (!(Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
[System.IO.File]::WriteAllText($outAbs, $md, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $outAbs" -ForegroundColor Green

exit $exit
