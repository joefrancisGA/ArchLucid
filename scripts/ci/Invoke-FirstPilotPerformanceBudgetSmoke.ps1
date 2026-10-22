#Requires -Version 7.0
<#
.SYNOPSIS
  First-pilot performance budget smoke (assessment improvement #10).

.DESCRIPTION
  Simulator mode uses a deterministic seeded timings fixture (no live LLM credentials).
  Real mode evaluates supplied or discovered staging-smoke timings JSON.
  Emits markdown + JSON with PASS / WARN / HOLD disposition and owner soft/hard p95 budgets.
#>
[CmdletBinding()]
param(
    [string]$OutputDir = (Join-Path (Get-Location) "artifacts" "performance-budget-smoke"),
    [ValidateSet("Simulator", "Real")]
    [string]$ExecutionMode = "Simulator",
    [string]$TimingsJsonPath = "",
    [switch]$IncludeHealthProbe,
    [switch]$IncludeConfigLint,
    [string]$ApiBaseUrl = "http://127.0.0.1:8080"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Get-Location).Path
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

function Get-SimulatorSeedTimingsPath {
    param([string]$Directory)

    $path = Join-Path $Directory "simulator-seeded-timings.json"
    $payload = @{
        baseUrl        = "simulator://seeded-first-pilot-path"
        runId          = "simulator-seeded-run"
        executionMode  = "Simulator"
        evidenceClass  = "deterministic-seeded-equivalent-not-sla"
        timingsMs      = @{
            health_live     = 80
            health_ready    = 120
            version         = 45
            create_run      = 900
            poll_ready      = 165000
            commit          = 1100
            get_manifest    = 220
            list_artifacts  = 180
            sponsor_export  = 350
        }
    }

    $payload | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $path -Encoding utf8
    return $path
}

function Resolve-TimingsJsonPath {
    param(
        [string]$ExplicitPath,
        [string]$Directory
    )

    if (-not [string]::IsNullOrWhiteSpace($ExplicitPath)) {
        $resolved = Resolve-Path -LiteralPath $ExplicitPath
        return $resolved.Path
    }

    $candidates = @(
        (Join-Path $Directory "staging-smoke-results.json"),
        (Join-Path $repoRoot "staging-smoke-results.json"),
        (Join-Path $repoRoot "artifacts" "staging-smoke-results.json")
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    if ($ExecutionMode -eq "Simulator") {
        return Get-SimulatorSeedTimingsPath -Directory $Directory
    }

    throw "Real mode requires -TimingsJsonPath or an existing staging-smoke-results.json artifact."
}

function Invoke-PythonReporter {
    param(
        [string]$ScriptRelativePath,
        [string[]]$Arguments
    )

    $scriptPath = Join-Path $repoRoot $ScriptRelativePath

    if (-not (Test-Path -LiteralPath $scriptPath)) {
        throw "Missing script: $scriptPath"
    }

    python $scriptPath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$ScriptRelativePath exited with code $LASTEXITCODE"
    }
}

$timingsPath = Resolve-TimingsJsonPath -ExplicitPath $TimingsJsonPath -Directory $OutputDir
$baselineJsonPath = Join-Path $OutputDir "first-pilot-performance-baseline.json"
$baselineMdPath = Join-Path $OutputDir "first-pilot-performance-baseline.md"
$timingBudgetJsonPath = Join-Path $OutputDir "first-pilot-timing-budget.json"
$timingBudgetMdPath = Join-Path $OutputDir "first-pilot-timing-budget.md"
$budgetJsonPath = Join-Path $OutputDir "performance-budget-smoke.json"
$budgetMdPath = Join-Path $OutputDir "performance-budget-smoke.md"

Invoke-PythonReporter -ScriptRelativePath "scripts/ci/report_first_pilot_performance_baseline.py" -Arguments @(
    "--timings-json", $timingsPath,
    "--markdown-out", $baselineMdPath,
    "--json-summary-out", $baselineJsonPath
)

Invoke-PythonReporter -ScriptRelativePath "scripts/ci/report_first_pilot_timing_budget.py" -Arguments @(
    "--performance-baseline-json", $baselineJsonPath,
    "--markdown-out", $timingBudgetMdPath,
    "--json-out", $timingBudgetJsonPath
)

Invoke-PythonReporter -ScriptRelativePath "scripts/ci/evaluate_first_pilot_performance_budget.py" -Arguments @(
    "--timings-json", $timingsPath,
    "--execution-mode", $ExecutionMode,
    "--markdown-out", $budgetMdPath,
    "--json-out", $budgetJsonPath
)

$budgetExitCode = $LASTEXITCODE

if ($IncludeHealthProbe) {
    try {
        $healthUri = "$ApiBaseUrl/health"
        $response = Invoke-WebRequest -Uri $healthUri -Method Get -TimeoutSec 30 -SkipHttpErrorCheck
        if ($response.StatusCode -ge 400) {
            Write-Warning "Optional health probe returned HTTP $($response.StatusCode) for $healthUri"
        }
    }
    catch {
        Write-Warning "Optional health probe failed: $($_.Exception.Message)"
    }
}

if ($IncludeConfigLint) {
    $lintScript = Join-Path $repoRoot "scripts" "ci" "Invoke-ConfigLintProofStep.ps1"
    if (Test-Path -LiteralPath $lintScript) {
        & $lintScript -OutputDir (Join-Path $OutputDir "config-lint")
    }
    else {
        Write-Warning "Optional config lint script not found: $lintScript"
    }
}

Write-Host "Performance budget smoke: disposition written to $budgetJsonPath (exit $budgetExitCode)"
exit $budgetExitCode
