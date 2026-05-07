#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Optional live Azure OpenAI gate: runs RealAzureOpenAIEndToEndTests when AOAI env vars are set; always writes Markdown evidence.

.PARAMETER MarkdownOut
  Destination for UTF-8 summary (default: artifacts/release/real-llm-evidence-gate.md).

.NOTES
  Live runs write metrics JSON when this script sets ARCHLUCID_REAL_LLM_RUN_METRICS_JSON for the test process.
  See docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md and docs/library/RELEASE_EVIDENCE_SUMMARY.md.
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

$metricsRelative = "artifacts/release/real-llm-last-run-metrics.json"
$metricsAbs = Join-Path $root $metricsRelative

function Add-EvidenceRow {
    param(
        [System.Collections.Generic.List[object]]$List,
        [string]$Name,
        [string]$Result,
        [string]$Detail
    )
    $List.Add([pscustomobject]@{ Check = $Name; Result = $Result; Detail = $Detail }) | Out-Null
}

function Read-MetricsJsonSafely {
    param([string]$Path)
    if (!(Test-Path -LiteralPath $Path)) {
        return $null
    }
    try {
        $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
        return $raw | ConvertFrom-Json
    }
    catch {
        return $null
    }
}

$credsPresent = (-not [string]::IsNullOrWhiteSpace($endpoint)) -and (-not [string]::IsNullOrWhiteSpace($key))

$rows = [System.Collections.Generic.List[object]]::new()
$exitCode = 0

if ($credsPresent) {
    if (Test-Path -LiteralPath $metricsAbs) {
        Remove-Item -LiteralPath $metricsAbs -Force
    }
    $env:ARCHLUCID_REAL_LLM_RUN_METRICS_JSON = $metricsAbs

    Write-Host "Running RealAzureOpenAIEndToEndTests..." -ForegroundColor Cyan
    dotnet test .\ArchLucid.AgentRuntime.Tests\ArchLucid.AgentRuntime.Tests.csproj `
        --filter "FullyQualifiedName~RealAzureOpenAIEndToEndTests" `
        --no-build:$false

    $exitCode = $LASTEXITCODE

    Remove-Item Env:ARCHLUCID_REAL_LLM_RUN_METRICS_JSON -ErrorAction SilentlyContinue

    $metrics = Read-MetricsJsonSafely -Path $metricsAbs
    $runPassed = ($exitCode -eq 0)

    Add-EvidenceRow $rows "Credentials present" "Passed" "ARCHLUCID_REAL_AOAI_TEST_ENDPOINT and ARCHLUCID_REAL_AOAI_TEST_KEY are set (values not logged)"

    if ($runPassed) {
        Add-EvidenceRow $rows "Run executed" "Passed" "dotnet test exit 0"
    }
    else {
        Add-EvidenceRow $rows "Run executed" "Failed" "dotnet test exit $exitCode"
    }

    if ($runPassed -and ($null -ne $metrics)) {
        $mergeOk = [bool]$metrics.mergeSuccess
        if ($mergeOk) {
            Add-EvidenceRow $rows "Schema validation" "Passed" "Decision merge succeeded (schema-validated manifest)"
        }
        else {
            Add-EvidenceRow $rows "Schema validation" "Failed" "mergeSuccess=false in metrics JSON"
        }

        $svc = [int]$metrics.manifestServiceCount
        $dec = [int]$metrics.decisionsCount
        $claims = [int]$metrics.totalClaims

        if (($svc -gt 0) -and ($dec -gt 0) -and ($claims -gt 0)) {
            Add-EvidenceRow $rows "Structural completeness" "Passed" "services=$svc decisions=$dec claims=$claims"
        }
        else {
            Add-EvidenceRow $rows "Structural completeness" "Failed" "services=$svc decisions=$dec claims=$claims"
        }

        if ([bool]$metrics.semanticScoreCaptured) {
            Add-EvidenceRow $rows "Semantic score" "Passed" "Captured via gate metrics"
        }
        else {
            Add-EvidenceRow $rows "Semantic score" "Not captured" "Reference evaluation / golden cohort scoring not wired for this gate"
        }

        $pf = [int]$metrics.parseFailures

        if ($pf -eq 0) {
            Add-EvidenceRow $rows "Parse failures" "Passed" "parseFailures=0 (attempts=$([int]$metrics.parseAttempts))"
        }
        else {
            Add-EvidenceRow $rows "Parse failures" "Failed" "parseFailures=$pf"
        }

        $inTok = [int]$metrics.inputTokensTotal
        $outTok = [int]$metrics.outputTokensTotal

        if (($inTok + $outTok) -gt 0) {
            $costNote = "estimatedCostUsd not computed here; host AgentExecution:LlmCostEstimation surfaces USD when enabled"

            if ($null -ne $metrics.estimatedCostUsd) {
                Add-EvidenceRow $rows "Token/cost estimate" "Passed" "input=$inTok output=$outTok estimatedUsd=$($metrics.estimatedCostUsd)"
            }
            else {
                Add-EvidenceRow $rows "Token/cost estimate" "Passed" "input=$inTok output=$outTok — $costNote"
            }
        }
        else {
            Add-EvidenceRow $rows "Token/cost estimate" "Not captured" "Provider returned zero token usage on completion records"
        }

        if ([bool]$metrics.durableSqlPersistenceExercised) {
            Add-EvidenceRow $rows "Trace persistence" "Passed" "dbo.AgentExecutionTraces path exercised (metrics flag)"
        }
        else {
            Add-EvidenceRow $rows "Trace persistence" "Not captured" "Gate uses in-memory trace recorder only (invocations=$([int]$metrics.traceRecorderInvocations)); SQL persistence not exercised"
        }

        if ([bool]$metrics.evidenceRefsObserved) {
            Add-EvidenceRow $rows "Evidence-chain availability" "Passed" "Raw responses include evidenceRefs"
        }
        else {
            Add-EvidenceRow $rows "Evidence-chain availability" "Failed" "evidenceRefsObserved=false"
        }
    }
    else {
        $reason = if (!$runPassed) { "tests failed before metrics export" } else { "metrics JSON missing after successful run" }

        Add-EvidenceRow $rows "Schema validation" "Not captured" $reason
        Add-EvidenceRow $rows "Structural completeness" "Not captured" $reason
        Add-EvidenceRow $rows "Semantic score" "Not captured" $reason
        Add-EvidenceRow $rows "Parse failures" "Not captured" $reason
        Add-EvidenceRow $rows "Token/cost estimate" "Not captured" $reason
        Add-EvidenceRow $rows "Trace persistence" "Not captured" $reason
        Add-EvidenceRow $rows "Evidence-chain availability" "Not captured" $reason
    }
}
else {
    Remove-Item Env:ARCHLUCID_REAL_LLM_RUN_METRICS_JSON -ErrorAction SilentlyContinue

    if (Test-Path -LiteralPath $metricsAbs) {
        Remove-Item -LiteralPath $metricsAbs -Force
    }

    Add-EvidenceRow $rows "Credentials present" "Skipped" "ARCHLUCID_REAL_AOAI_TEST_ENDPOINT / ARCHLUCID_REAL_AOAI_TEST_KEY not set"

    Add-EvidenceRow $rows "Run executed" "Not captured" "Credentials absent — no live LLM calls attempted"

    Add-EvidenceRow $rows "Schema validation" "Skipped" "Requires live run"

    Add-EvidenceRow $rows "Structural completeness" "Skipped" "Requires live run"

    Add-EvidenceRow $rows "Semantic score" "Skipped" "Requires live run"

    Add-EvidenceRow $rows "Parse failures" "Skipped" "Requires live run"

    Add-EvidenceRow $rows "Token/cost estimate" "Skipped" "Requires live run"

    Add-EvidenceRow $rows "Trace persistence" "Skipped" "Requires live run"

    Add-EvidenceRow $rows "Evidence-chain availability" "Skipped" "Requires live run"

    $exitCode = 0
}

$relMetrics = $metricsRelative.Replace("\", "/")

$md = @"
# Real LLM evidence gate (generated)

Generated (UTC): **$([DateTime]::UtcNow.ToString('o'))**

Template: [docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md](../docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md)

Optional metrics JSON (live runs only): ``$relMetrics``

| Check | Result | Detail |
| --- | --- | --- |
"@

foreach ($r in $rows) {
    $md += "| $($r.Check) | **$($r.Result)** | $($r.Detail) |`n"
}

$md += @"

## Legend

- **Passed** — positive signal for the row.
- **Failed** — failing assertion, merge/schema failure, or non-zero test exit when a live run was attempted.
- **Skipped** — prerequisite missing (typically credentials); not an execution failure.
- **Not captured** — no data for this dimension on this machine, or durable/host-only evidence.

This report does **not** claim real LLM validation ran unless **Run executed** is **Passed** with **Credentials present** **Passed**.
"@

$outAbs =
    if ([System.IO.Path]::IsPathRooted($MarkdownOut)) {
        $MarkdownOut
    }
    else {
        Join-Path $root $MarkdownOut
    }

$dir = Split-Path -Parent $outAbs

if (!(Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
}

[System.IO.File]::WriteAllText($outAbs, $md, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $outAbs" -ForegroundColor Green

exit $exitCode
