#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Enforces real-mode AI release evidence when ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE=1.

.DESCRIPTION
  Optional release gate for reference cohorts. When the environment variable is unset or not "1",
  exits 0 without requiring live evidence. When set, requires:
  - committed real-mode fixture validation (offline)
  - real-llm-evidence-gate.md (from Invoke-RealLlmEvidenceGate.ps1) OR explicit skip note when AOAI creds absent

  Does not print secrets, raw prompts, or completions.

.PARAMETER MarkdownOut
  Gate summary path (default: artifacts/release/real-llm-release-requirement.md).
#>
[CmdletBinding()]
param(
    [string] $MarkdownOut = 'artifacts/release/real-llm-release-requirement.md'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Add-Row {
    param(
        [System.Collections.Generic.List[object]] $Rows,
        [string] $Check,
        [string] $Result,
        [string] $Detail
    )

    $Rows.Add([pscustomobject]@{ Check = $Check; Result = $Result; Detail = $Detail }) | Out-Null
}

$required = $env:ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE

if ($required -ne '1') {
    $outDir = Split-Path -Parent $MarkdownOut

    if (-not [string]::IsNullOrWhiteSpace($outDir)) {
        New-Item -ItemType Directory -Force -Path $outDir | Out-Null
    }

    @"
# Real-mode release requirement (skipped)

**ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE** is not set to `1`. Simulator-only releases remain allowed.

Set `ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE=1` for reference-cohort releases that must ship with real-mode AI evidence.
"@ | Set-Content -LiteralPath $MarkdownOut -Encoding utf8

    Write-Host 'Real-mode release requirement: SKIPPED (env not set).' -ForegroundColor DarkGray
    exit 0
}

$rows = [System.Collections.Generic.List[object]]::new()
$blocking = [System.Collections.Generic.List[string]]::new()

$fixtureScript = Join-Path $PSScriptRoot 'ci\validate_committed_real_llm_fixtures.py'
$fixtureMd = Join-Path $root 'artifacts/release/committed-real-llm-fixture-validation.md'
$fixtureDir = Split-Path -Parent $fixtureMd
New-Item -ItemType Directory -Force -Path $fixtureDir | Out-Null

& python $fixtureScript --markdown-out $fixtureMd 2>&1 | Out-Null
$fixtureExit = $LASTEXITCODE

if ($fixtureExit -eq 0) {
    Add-Row $rows 'Committed real-mode fixtures' 'Passed' 'tests/eval-corpus/agent-results/*.real.json validated offline'
}
else {
    Add-Row $rows 'Committed real-mode fixtures' 'Failed' "exit $fixtureExit — see $fixtureMd"
    $blocking.Add('Fix committed real-mode fixtures before release (validate_committed_real_llm_fixtures.py).') | Out-Null
}

$gateMd = Join-Path $root 'artifacts/release/real-llm-evidence-gate.md'

if (-not (Test-Path -LiteralPath $gateMd)) {
    $gateScript = Join-Path $PSScriptRoot 'Invoke-RealLlmEvidenceGate.ps1'
    & $gateScript -MarkdownOut $gateMd
    $gateExit = $LASTEXITCODE
}

if (Test-Path -LiteralPath $gateMd) {
    $gateText = Get-Content -LiteralPath $gateMd -Raw

    if ($gateText -match 'Credentials present.*Skipped' -or $gateText -match 'Run executed.*Not captured') {
        Add-Row $rows 'Live real-LLM gate' 'Skipped' 'AOAI test credentials absent — attach real-llm-evidence-gate.md from a credentialed run before external real-mode claim'
        $blocking.Add('Run ./scripts/Invoke-RealLlmEvidenceGate.ps1 with ARCHLUCID_REAL_AOAI_TEST_* set, or do not claim live real-mode validation on this release.') | Out-Null
    }
    elseif ($gateText -match 'Run executed.*Failed') {
        Add-Row $rows 'Live real-LLM gate' 'Failed' 'See real-llm-evidence-gate.md'
        $blocking.Add('RealAzureOpenAIEndToEndTests failed — resolve before release.') | Out-Null
    }
    else {
        Add-Row $rows 'Live real-LLM gate' 'Passed' 'real-llm-evidence-gate.md present with executed run'
    }
}
else {
    Add-Row $rows 'Live real-LLM gate' 'Failed' 'real-llm-evidence-gate.md missing after Invoke-RealLlmEvidenceGate.ps1'
    $blocking.Add('Generate artifacts/release/real-llm-evidence-gate.md before release.') | Out-Null
}

$retrievalReport = Join-Path $root 'docs/quality/retrieval-ir-report.md'

if (Test-Path -LiteralPath $retrievalReport) {
    Add-Row $rows 'Retrieval IR report' 'Passed' 'docs/quality/retrieval-ir-report.md present (offline golden fixtures)'
}
else {
    Add-Row $rows 'Retrieval IR report' 'Warn' 'Run: python scripts/ci/eval_retrieval_ir.py --enforce'
}

$faithfulnessReport = Join-Path $root 'docs/quality/agent-faithfulness-report.md'

if (Test-Path -LiteralPath $faithfulnessReport) {
    Add-Row $rows 'Agent faithfulness report' 'Passed' 'docs/quality/agent-faithfulness-report.md present'
}
else {
    Add-Row $rows 'Agent faithfulness report' 'Warn' 'Run: python scripts/ci/eval_agent_faithfulness.py when citation faithfulness is part of the release claim'
}

$outDir = Split-Path -Parent $MarkdownOut
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$disposition = if ($blocking.Count -gt 0) { 'HOLD' } else { 'PASS' }
$utc = [DateTime]::UtcNow.ToString('o')

$md = @"
# Real-mode release requirement (enforced)

Generated (UTC): **$utc**

**Environment:** ``ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE=1``

**Disposition:** **$disposition**

This gate distinguishes **simulator** posture from **real-mode** release claims. It does not emit raw prompts, API keys, or model completions.

| Check | Result | Detail |
| --- | --- | --- |
"@

foreach ($row in $rows) {
    $detail = [string]$row.Detail -replace '\|', '/'
    $md += "| $($row.Check) | $($row.Result) | $detail |`n"
}

if ($blocking.Count -gt 0) {
    $md += "`n## Remediation`n`n"

    foreach ($item in $blocking) {
        $md += "- $item`n"
    }
}

$md += @"

## Related

- [docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md](../docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md)
- [docs/library/AGENT_OUTPUT_EVALUATION.md](../docs/library/AGENT_OUTPUT_EVALUATION.md)
"@

Set-Content -LiteralPath $MarkdownOut -Value $md -Encoding utf8

if ($blocking.Count -gt 0) {
    Write-Error "Real-mode release requirement HOLD: $($blocking -join '; ')"
    exit 1
}

Write-Host 'Real-mode release requirement: PASS' -ForegroundColor Green
exit 0
