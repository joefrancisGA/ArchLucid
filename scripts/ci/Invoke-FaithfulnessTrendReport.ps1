# Emits combined faithfulness + retrieval trend artifacts for CI and release notes.
param(
    [string] $OutputDirectory = 'artifacts/ai-eval-trends',
    [switch] $EnforceFaithfulness
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location -LiteralPath $repoRoot

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$faithfulnessArgs = @(
    '--report', (Join-Path $OutputDirectory 'faithfulness-report.md')
)
if ($EnforceFaithfulness) {
    $faithfulnessArgs += '--enforce'
}

python scripts/ci/eval_agent_faithfulness.py @faithfulnessArgs
if ($EnforceFaithfulness -and $LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

python scripts/ci/eval_retrieval_ir.py `
    --report (Join-Path $OutputDirectory 'retrieval-ir-report.md') `
    --json-summary (Join-Path $OutputDirectory 'retrieval-ir-summary.json')

$summary = @"
# AI eval trend rollup

Generated: $(Get-Date -Format o)

| Artifact | Path |
| --- | --- |
| Faithfulness | ``$OutputDirectory/faithfulness-report.md`` |
| Retrieval IR | ``$OutputDirectory/retrieval-ir-report.md`` |

Re-run locally before release candidates; warn-only unless `--enforce` flags are enabled on individual scripts.
"@

$summaryPath = Join-Path $OutputDirectory 'ai-eval-trend-summary.md'
Set-Content -LiteralPath $summaryPath -Value $summary -Encoding utf8NoBOM

Write-Host "Wrote AI eval trend artifacts under $OutputDirectory"
