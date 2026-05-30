# Production readiness drill — orchestrates config lint, RC drill, and summary artifacts.
# See docs/runbooks/PRODUCTION_READINESS_DRILL.md
param(
    [string] $ApiBaseUrl = 'http://localhost:5128',
    [switch] $SkipApiSteps,
    [switch] $SkipSupportBundle,
    [string] $OutputDirectory
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$outDir = if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    Join-Path $repoRoot "_drill-evidence/production-readiness-$timestamp"
} else {
    $OutputDirectory
}

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$steps = [System.Collections.Generic.List[object]]::new()

function Add-DrillStep {
    param(
        [string] $Name,
        [string] $Disposition,
        [string] $Detail,
        [string] $NextAction = ''
    )

    $steps.Add([pscustomobject]@{
            name       = $Name
            disposition = $Disposition
            detail     = $Detail
            nextAction = $NextAction
        }) | Out-Null
}

function Test-ApiReachable {
    param([string] $BaseUrl)

    try {
        $uri = ($BaseUrl.Trim().TrimEnd('/') + '/health/live')
        $null = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 8
        return $true
    }
    catch {
        return $false
    }
}

# Step: repository present
Add-DrillStep -Name 'repository-root' -Disposition 'PASS' -Detail "Drill running from $repoRoot"

# Step: config lint (CLI)
$configLintDir = Join-Path $outDir 'config-lint'
New-Item -ItemType Directory -Force -Path $configLintDir | Out-Null

try {
    $lintScript = Join-Path $repoRoot 'scripts/ci/Invoke-ConfigLintProofStep.ps1'
    if (Test-Path -LiteralPath $lintScript) {
        & $lintScript -OutputDir $configLintDir 2>&1 | Out-File (Join-Path $configLintDir 'config-lint.log')
        Add-DrillStep -Name 'config-lint' -Disposition 'PASS' -Detail 'Config lint proof step completed — review config-lint/ output.'
    }
    else {
        Add-DrillStep -Name 'config-lint' -Disposition 'WARN' -Detail 'scripts/ci/Invoke-ConfigLintProofStep.ps1 not found.' -NextAction 'Run archlucid config lint manually.'
    }
}
catch {
    Add-DrillStep -Name 'config-lint' -Disposition 'WARN' -Detail $_.Exception.Message -NextAction 'Fix config lint failures before production handoff.'
}

$apiUp = $false
if (-not $SkipApiSteps) {
    $apiUp = Test-ApiReachable -BaseUrl $ApiBaseUrl
}

if ($SkipApiSteps) {
    Add-DrillStep -Name 'api-health' -Disposition 'SKIP' -Detail 'Api steps skipped via -SkipApiSteps.'
}
elseif (-not $apiUp) {
    Add-DrillStep -Name 'api-health' -Disposition 'SKIP' -Detail "API not reachable at $ApiBaseUrl" -NextAction 'Start API or pass reachable -ApiBaseUrl for full drill.'
}
else {
    Add-DrillStep -Name 'api-health' -Disposition 'PASS' -Detail "GET /health/live succeeded at $ApiBaseUrl"

    $rcDir = Join-Path $outDir 'v1-rc-drill'
    New-Item -ItemType Directory -Force -Path $rcDir | Out-Null

    try {
        $rcArgs = @('-ApiBaseUrl', $ApiBaseUrl)
        if ($SkipSupportBundle) { $rcArgs += '-SkipSupportBundle' }

        & (Join-Path $repoRoot 'scripts/v1-rc-drill.ps1') @rcArgs 2>&1 | Out-File (Join-Path $rcDir 'v1-rc-drill.log')
        Add-DrillStep -Name 'v1-rc-drill' -Disposition 'PASS' -Detail 'RC drill script completed — review v1-rc-drill/v1-rc-drill.log.'
    }
    catch {
        Add-DrillStep -Name 'v1-rc-drill' -Disposition 'HOLD' -Detail $_.Exception.Message -NextAction 'Resolve RC drill failures before production handoff.'
    }
}

# Step: hosted availability rollup (tooling only — INCONCLUSIVE without probe artifacts)
try {
    $rollupScript = Join-Path $repoRoot 'scripts/ops/summarize_hosted_probe_artifacts.py'
    if (Test-Path -LiteralPath $rollupScript) {
        Add-DrillStep -Name 'availability-rollup-tooling' -Disposition 'INCONCLUSIVE' -Detail 'Rollup script present; run with production probe artifacts for meaningful output.' -NextAction 'See docs/runbooks/HOSTED_AVAILABILITY_ROLLUP.md'
    }
    else {
        Add-DrillStep -Name 'availability-rollup-tooling' -Disposition 'WARN' -Detail 'summarize_hosted_probe_artifacts.py not found.'
    }
}
catch {
    Add-DrillStep -Name 'availability-rollup-tooling' -Disposition 'WARN' -Detail $_.Exception.Message
}

# Rollup disposition
$holdCount = @($steps | Where-Object { $_.disposition -eq 'HOLD' }).Count
$warnCount = @($steps | Where-Object { $_.disposition -eq 'WARN' }).Count
$overall = if ($holdCount -gt 0) { 'HOLD' } elseif ($warnCount -gt 0) { 'WARN' } else { 'PASS' }

$summary = [ordered]@{
    schema       = 'archlucid.production-readiness-drill.v1'
    generatedUtc = (Get-Date).ToUniversalTime().ToString('o')
    apiBaseUrl   = $ApiBaseUrl
    overallDisposition = $overall
    steps        = $steps
}

$jsonPath = Join-Path $outDir 'drill-summary.json'
$summary | ConvertTo-Json -Depth 6 | Set-Content -Path $jsonPath -Encoding UTF8

$mdPath = Join-Path $outDir 'drill-summary.md'
$md = @(
    '# Production readiness drill summary'
    ''
    "**Overall disposition:** **$overall**"
    ''
    "| Step | Disposition | Detail |"
    "|------|-------------|--------|"
)

foreach ($step in $steps) {
    $md += "| $($step.name) | $($step.disposition) | $($step.detail) |"
}

$md += ''
$md += 'See [PRODUCTION_READINESS_DRILL.md](../docs/runbooks/PRODUCTION_READINESS_DRILL.md) for interpretation.'
$md -join "`n" | Set-Content -Path $mdPath -Encoding UTF8

Write-Host "Wrote production readiness drill evidence: $outDir"
Write-Host "Overall disposition: $overall"

if ($overall -eq 'HOLD') { exit 2 }
if ($overall -eq 'WARN') { exit 1 }
exit 0
