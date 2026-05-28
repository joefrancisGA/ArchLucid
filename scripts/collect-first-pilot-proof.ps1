#requires -Version 5.1
<#
.SYNOPSIS
  Run the first-pilot proof pipeline and emit one go/no-go evidence folder.

.DESCRIPTION
  Read-only orchestration over existing ArchLucid pilot readiness collectors:
  CLI preflight, data-consistency readiness, and committed-run evidence collection.
  A missing RunId is a warning, not a blocking failure, so operators can use this
  script before and after the first committed review.
#>
param(
    [string] $BaseUrl = '',
    [string] $RunId = '',
    [string] $OutputDirectory = 'artifacts/first-pilot-proof',
    [string] $BearerToken = '',
    [string] $ApiKey = '',
    [switch] $SkipDataConsistency,
    [switch] $SkipPreflight,
    [switch] $SkipTelemetryExport,
    [switch] $SkipCommercialHandoff,
    [switch] $ProductionLikeHostedPilot,
    [switch] $SponsorHandoff,
    [string] $K6SummaryPath = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = $env:ARCHLUCID_API_URL
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = 'http://localhost:5128'
}

$normalizedBase = $BaseUrl.Trim().TrimEnd('/')
. (Join-Path $PSScriptRoot 'ArchLucid.AuthHeaders.ps1')
$headers = Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey
$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$outRoot = Join-Path (Get-Location) $OutputDirectory
$proofDir = Join-Path $outRoot "first-pilot-proof-$timestamp"
New-Item -ItemType Directory -Force -Path $proofDir | Out-Null

$findings = [System.Collections.Generic.List[object]]::new()
$artifacts = [System.Collections.Generic.List[object]]::new()

function Add-ProofFinding {
    param(
        [Parameter(Mandatory = $true)][ValidateSet('PASS', 'WARN', 'BLOCK')][string] $Disposition,
        [Parameter(Mandatory = $true)][string] $Name,
        [Parameter(Mandatory = $true)][string] $Detail,
        [string] $Remediation = '',
        [string] $TriageCard = ''
    )

    $findings.Add([ordered]@{
        disposition = $Disposition
        name        = $Name
        detail      = $Detail
        remediation = $Remediation
        triageCard  = $TriageCard
    })
}

function Add-ProofArtifact {
    param(
        [Parameter(Mandatory = $true)][string] $Name,
        [Parameter(Mandatory = $true)][string] $Path,
        [Parameter(Mandatory = $true)][string] $Purpose
    )

    $artifacts.Add([ordered]@{
        name    = $Name
        path    = $Path
        purpose = $Purpose
    })
}

function Get-TriageCardForPreflightStep {
    param(
        [Parameter(Mandatory = $true)][string] $Name,
        [string] $Detail = ''
    )

    if ($Name -like 'config:ArchLucidAuth:*' -or $Detail -match 'auth|401|403') {
        return 'FP-T001'
    }

    if ($Name -like 'config:*ConnectionStrings*' -or $Detail -match 'SQL|DbUp|connection string') {
        return 'FP-T002'
    }

    if ($Name -eq 'health/ready') {
        return 'FP-T003'
    }

    if ($Name -eq 'openapi/v1.json') {
        return 'FP-T011'
    }

    if ($Detail -match 'network|reachability|connection refused|timed out') {
        return 'FP-T012'
    }

    return ''
}

function Convert-StepDisposition {
    param([Parameter(Mandatory = $true)][string] $Disposition)

    switch ($Disposition.ToLowerInvariant()) {
        'pass' { return 'PASS' }
        'warn' { return 'WARN' }
        default { return 'BLOCK' }
    }
}

function Get-LatestEvidenceBundleDirectory {
    param([Parameter(Mandatory = $true)][string] $EvidenceRoot)

    if (-not (Test-Path -LiteralPath $EvidenceRoot)) {
        return $null
    }

    return Get-ChildItem -LiteralPath $EvidenceRoot -Directory |
        Sort-Object LastWriteTimeUtc -Descending |
        Select-Object -First 1
}

function Add-AgentQualitySponsorGateFinding {
    param([Parameter(Mandatory = $true)][string] $EvidenceRoot)

    $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

    if ($null -eq $latestBundle) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail 'Evidence collector completed but no evidence bundle directory was found.' -Remediation 'Re-run first-pilot evidence collection for the committed review.' -TriageCard 'FP-T006'
        return
    }

    $observabilityPath = Join-Path $latestBundle.FullName 'pilot-observability-summary.json'

    if (-not (Test-Path -LiteralPath $observabilityPath)) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail 'pilot-observability-summary.json is missing from the committed-run evidence bundle.' -Remediation 'Re-run first-pilot evidence collection and confirm pilot observability summary generation.' -TriageCard 'FP-T004'
        return
    }

    try {
        $observability = Get-Content -LiteralPath $observabilityPath -Raw | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail "Could not parse pilot-observability-summary.json: $($_.Exception.Message)" -Remediation 'Regenerate the committed-run evidence bundle.' -TriageCard 'FP-T004'
        return
    }

    $qualityGateDisposition = [string]$observability.qualityGateDisposition
    $llmCallCountResolved = $observability.llmCallCountResolved
    $llmCallCount = $observability.llmCallCount
    $realModeEvidenceDetected = ($llmCallCountResolved -eq $true) -or ($null -ne $llmCallCount -and -not [string]::IsNullOrWhiteSpace([string]$llmCallCount))

    if ($qualityGateDisposition -eq 'pilot-strict-sponsor-evidence-pass') {
        Add-ProofFinding -Disposition 'PASS' -Name 'real-llm-sponsor-evidence' -Detail 'PilotStrict sponsor-evidence disposition passed.' -Remediation ''
        return
    }

    if ($qualityGateDisposition -eq 'pilot-strict-violates-sponsor-evidence' -or $qualityGateDisposition -eq 'pilot-strict-signals-unresolved') {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail "PilotStrict sponsor-evidence disposition is $qualityGateDisposition." -Remediation 'Pause sponsor handoff and resolve agent quality gate evidence before sending the packet.' -TriageCard 'FP-T005'
        return
    }

    if ($realModeEvidenceDetected) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail "Real-mode LLM usage signals were detected, but PilotStrict sponsor-evidence disposition was not passing: $qualityGateDisposition." -Remediation 'Attach passing real-LLM evidence or regenerate the evidence bundle after quality signals resolve.' -TriageCard 'FP-T004'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'real-llm-sponsor-evidence' -Detail "No real-mode LLM sponsor-evidence signal was detected. Quality gate disposition: $qualityGateDisposition." -Remediation 'For buyer sponsor proof, use a PilotStrict real-mode host or explicitly label the packet as simulator/demo evidence.' -TriageCard 'FP-T004'
}

function Add-TelemetryExportReadinessFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $telemetryReportPath = Join-Path $ProofDirectory 'observability-export-readiness.md'
    $telemetryScript = Join-Path $PSScriptRoot 'report_observability_export_readiness.py'
    $telemetryArgs = @(
        $telemetryScript,
        '--environment',
        'Production',
        '--out',
        $telemetryReportPath,
        '--honor-require-telemetry-export-config'
    )

    if ($ProductionLikeHostedPilot) {
        $telemetryArgs += '--strict-exit-code'
    }

    $output = & python @telemetryArgs 2>&1
    $telemetryExit = $LASTEXITCODE

    if (-not (Test-Path -LiteralPath $telemetryReportPath) -and -not [string]::IsNullOrWhiteSpace(($output | Out-String))) {
        [System.IO.File]::WriteAllText($telemetryReportPath, ($output | Out-String), [System.Text.UTF8Encoding]::new($false))
    }

    Add-ProofArtifact -Name 'observability-export-readiness.md' -Path 'observability-export-readiness.md' -Purpose 'Offline telemetry export readiness for hosted pilot handoff.'

    $reportText = if (Test-Path -LiteralPath $telemetryReportPath) {
        Get-Content -LiteralPath $telemetryReportPath -Raw
    }
    else {
        ''
    }

    $verdict = 'UNKNOWN'

    if ($reportText -match 'Telemetry export readiness verdict:\s+\*\*(PASS|WARN|FAIL)\*\*') {
        $verdict = $Matches[1]
    }

    if ($telemetryExit -eq 0 -and $verdict -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'telemetry-export-readiness' -Detail 'Durable telemetry export readiness passed for the merged Production view.' -Remediation ''
        return
    }

    if ($ProductionLikeHostedPilot) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'telemetry-export-readiness' -Detail "Telemetry export readiness verdict is $verdict; reporter exit code $telemetryExit." -Remediation 'Configure Application Insights, OTLP, or Prometheus export before hosted sponsor handoff, or remove -ProductionLikeHostedPilot for local readiness-only checks.' -TriageCard 'FP-T013'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'telemetry-export-readiness' -Detail "Telemetry export readiness verdict is $verdict; reporter exit code $telemetryExit." -Remediation 'For production-like hosted sponsor handoff, rerun with -ProductionLikeHostedPilot and attach passing telemetry export evidence.' -TriageCard 'FP-T013'
}

function Add-RouteTierPolicyNavFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $reportPath = Join-Path $ProofDirectory 'route-tier-policy-nav-parity.md'
    $scriptPath = Join-Path $PSScriptRoot 'ci\assert_route_tier_policy_nav.py'
    & python $scriptPath --markdown-report $reportPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'route-tier-policy-nav-parity.md' -Path 'route-tier-policy-nav-parity.md' -Purpose 'Buyer-safe route/tier/policy/nav parity summary for commercial handoff.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'route-tier-policy-nav-parity' -Detail 'Route/tier/policy/nav registry parity passed.' -Remediation ''
        return
    }

    $detail = "Route/tier/policy/nav parity check failed with exit code $exitCode."

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'route-tier-policy-nav-parity' -Detail $detail -Remediation 'Run python scripts/ci/assert_route_tier_policy_nav.py --sync and resolve parity failures before sponsor send.' -TriageCard 'FP-T014'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'route-tier-policy-nav-parity' -Detail $detail -Remediation 'Resolve route/tier/policy/nav drift before enterprise commercial handoff.' -TriageCard 'FP-T014'
}

function Add-ProcurementDealReadyFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $reportPath = Join-Path $ProofDirectory 'procurement-deal-ready-check.txt'
    $scriptPath = Join-Path $PSScriptRoot 'build_procurement_pack.py'
    $output = & python $scriptPath --dry-run --deal-ready 2>&1
    $exitCode = $LASTEXITCODE
    [System.IO.File]::WriteAllText($reportPath, ($output | Out-String), [System.Text.UTF8Encoding]::new($false))
    Add-ProofArtifact -Name 'procurement-deal-ready-check.txt' -Path 'procurement-deal-ready-check.txt' -Purpose 'Deal-ready procurement pack dry-run output with deferred-scope labels.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'procurement-deal-ready' -Detail 'Procurement pack deal-ready dry-run passed.' -Remediation ''
        return
    }

    $detail = "Procurement pack deal-ready dry-run failed with exit code $exitCode."

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'procurement-deal-ready' -Detail $detail -Remediation 'Run python scripts/build_procurement_pack.py --deal-ready and fix stale or buyer-unsafe procurement artifacts.' -TriageCard 'FP-T015'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'procurement-deal-ready' -Detail $detail -Remediation 'Refresh procurement pack evidence before sponsor send.' -TriageCard 'FP-T015'
}

function Add-PricingQuoteAgingFinding {
    $uri = "$normalizedBase/v1/admin/marketing/pricing-quote-aging"
    $req = @{
        Uri             = $uri
        Method          = 'Get'
        UseBasicParsing = $true
        TimeoutSec      = 60
    }

    if ($headers.Count -gt 0) {
        $req.Headers = $headers
    }

    try {
        $response = Invoke-WebRequest @req
        $aging = $response.Content | ConvertFrom-Json -ErrorAction Stop
        $openCount = @($aging.rows).Count
        $warnCount = [int]$aging.warnCount
        $breachCount = [int]$aging.breachCount
        $detail = "Open quote requests=$openCount; warn=$warnCount; breach=$breachCount."

        if ($breachCount -gt 0) {
            $disposition = if ($SponsorHandoff) { 'BLOCK' } else { 'WARN' }
            Add-ProofFinding -Disposition $disposition -Name 'pricing-quote-aging' -Detail $detail -Remediation 'Acknowledge or close breached pricing quote requests before sponsor send.' -TriageCard 'FP-T017'
            return
        }

        if ($warnCount -gt 0) {
            Add-ProofFinding -Disposition 'WARN' -Name 'pricing-quote-aging' -Detail $detail -Remediation 'Follow up on aging pricing quote requests before conversion.' -TriageCard 'FP-T017'
            return
        }

        Add-ProofFinding -Disposition 'PASS' -Name 'pricing-quote-aging' -Detail $detail -Remediation ''
    }
    catch {
        Add-ProofFinding -Disposition 'WARN' -Name 'pricing-quote-aging' -Detail "Could not read pricing quote aging: $($_.Exception.Message)" -Remediation 'Use an AdminAuthority token or review /admin/pricing-quote-aging before conversion.' -TriageCard 'FP-T017'
    }
}

function Add-RoiBasisLabelFinding {
    param([Parameter(Mandatory = $true)][string] $EvidenceRoot)

    $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

    if ($null -eq $latestBundle) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail 'Evidence bundle missing; cannot validate ROI basis labels.' -Remediation 'Re-run committed-run evidence collection.' -TriageCard 'FP-T016'
        return
    }

    $reportPath = Join-Path $latestBundle.FullName 'first-value-report.md'
    $deltasPath = Join-Path $latestBundle.FullName 'pilot-run-deltas.json'

    if (-not (Test-Path -LiteralPath $reportPath)) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail 'first-value-report.md is missing from the evidence bundle.' -Remediation 'Regenerate the first-value report for the committed review.' -TriageCard 'FP-T016'
        return
    }

    $reportText = Get-Content -LiteralPath $reportPath -Raw
    $requiredPhrases = @(
        '## Sponsor send readiness (buyer-safe gate)',
        '## ROI evidence completeness',
        'ROI evidence confidence'
    )
    $missingPhrases = @($requiredPhrases | Where-Object { $reportText -notlike "*$_*" })

    if ($missingPhrases.Count -gt 0) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail "Missing ROI basis sections: $($missingPhrases -join ', ')." -Remediation 'Regenerate sponsor output and confirm ROI basis labels are present before external send.' -TriageCard 'FP-T016'
        return
    }

    if (Test-Path -LiteralPath $deltasPath) {
        try {
            $deltas = Get-Content -LiteralPath $deltasPath -Raw | ConvertFrom-Json -ErrorAction Stop
            $proof = $deltas.proofPackageCompleteness
            $roiLabel = [string]$proof.roiConfidenceLabel

            if ([string]::IsNullOrWhiteSpace($roiLabel)) {
                Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail 'proofPackageCompleteness.roiConfidenceLabel is missing from pilot-run-deltas.' -Remediation 'Capture tenant ROI baseline posture before sponsor export.' -TriageCard 'FP-T016'
                return
            }
        }
        catch {
            Add-ProofFinding -Disposition 'WARN' -Name 'roi-basis-labels' -Detail "Could not parse pilot-run-deltas.json for ROI basis metadata: $($_.Exception.Message)" -Remediation 'Inspect pilot-run-deltas JSON manually.' -TriageCard 'FP-T016'
            return
        }
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'roi-basis-labels' -Detail 'First-value report includes sponsor-safe ROI basis sections and confidence labels.' -Remediation ''
}

function Add-LlmCostSummaryFinding {
    param([Parameter(Mandatory = $true)][string] $EvidenceRoot)

    $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot
    $summaryPath = if ($null -ne $latestBundle) {
        Join-Path $latestBundle.FullName 'pilot-observability-summary.json'
    }
    else {
        $null
    }

    if ($null -eq $summaryPath -or -not (Test-Path -LiteralPath $summaryPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'pilot-llm-cost-summary' -Detail 'pilot-observability-summary.json is missing; LLM cost summary was not collected.' -Remediation 'Re-run committed-run evidence collection.' -TriageCard 'FP-T004'
        return
    }

    try {
        $summary = Get-Content -LiteralPath $summaryPath -Raw | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        Add-ProofFinding -Disposition 'WARN' -Name 'pilot-llm-cost-summary' -Detail "Could not parse pilot-observability-summary.json: $($_.Exception.Message)" -Remediation 'Regenerate the evidence bundle.' -TriageCard 'FP-T004'
        return
    }

    $costBasisLabel = [string]$summary.llmCostBasisLabel

    if ($summary.llmCostEvidenceResolved -eq $true -and -not [string]::IsNullOrWhiteSpace($costBasisLabel)) {
        Add-ProofFinding -Disposition 'PASS' -Name 'pilot-llm-cost-summary' -Detail "LLM usage summary collected with cost basis label '$costBasisLabel'." -Remediation ''
        return
    }

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'WARN' -Name 'pilot-llm-cost-summary' -Detail 'LLM cost evidence is incomplete; sponsor packet should disclose estimated/simulator/unavailable cost basis.' -Remediation 'Review pilot-cost-summary.md and avoid implying invoice-grade Azure cost truth.' -TriageCard 'FP-T004'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'pilot-llm-cost-summary' -Detail 'LLM cost evidence is incomplete in the observability summary.' -Remediation 'Collect committed-run evidence after execute/commit for cost labels.' -TriageCard 'FP-T004'
}

function Resolve-K6SummaryPath {
    param([string] $ExplicitPath)

    if (-not [string]::IsNullOrWhiteSpace($ExplicitPath) -and (Test-Path -LiteralPath $ExplicitPath)) {
        return (Resolve-Path -LiteralPath $ExplicitPath).Path
    }

    if (-not [string]::IsNullOrWhiteSpace($env:ARCHLUCID_K6_SUMMARY_PATH) -and (Test-Path -LiteralPath $env:ARCHLUCID_K6_SUMMARY_PATH)) {
        return (Resolve-Path -LiteralPath $env:ARCHLUCID_K6_SUMMARY_PATH).Path
    }

    $repoCandidate = Join-Path $root 'k6-summary.json'

    if (Test-Path -LiteralPath $repoCandidate) {
        return (Resolve-Path -LiteralPath $repoCandidate).Path
    }

    return $null
}

function Add-ApiHotPathPerformanceFinding {
    param(
        [string] $SummaryPath,
        [string] $EnvironmentLabel,
        [string] $EvidenceClass
    )

    $reportPath = Join-Path $ProofDirectory 'api-hot-path-performance.md'
    $scriptPath = Join-Path $PSScriptRoot 'report_api_hot_path_performance.py'
    $args = @(
        $scriptPath,
        '--markdown-out', $reportPath,
        '--environment-label', $EnvironmentLabel,
        '--evidence-class', $EvidenceClass
    )

    if (-not [string]::IsNullOrWhiteSpace($SummaryPath)) {
        $args += @('--summary', $SummaryPath)
    }

    $output = & python @args 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        Add-ProofFinding -Disposition 'WARN' -Name 'api-hot-path-performance' -Detail (($output | Out-String).Trim()) -Remediation 'Attach a valid k6 summary JSON or rerun load smoke with summary export enabled.'
        return
    }

    Add-ProofArtifact -Name 'api-hot-path-performance.md' -Path 'api-hot-path-performance.md' -Purpose 'Buyer-safe HTTP p95 evidence from k6 summary JSON (not SLA proof).'

    if ([string]::IsNullOrWhiteSpace($SummaryPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'api-hot-path-performance' -Detail 'No k6 summary JSON was attached; performance evidence markdown records SKIPPED.' -Remediation 'Attach CI smoke or production-like k6 summary output before external performance claims.'
        return
    }

    $reportText = Get-Content -LiteralPath $reportPath -Raw

    if ($reportText -match '\| Status \| \*\*COLLECTED\*\* \|') {
        Add-ProofFinding -Disposition 'PASS' -Name 'api-hot-path-performance' -Detail 'k6 HTTP p95 evidence collected with explicit smoke/production-like labeling.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'api-hot-path-performance' -Detail 'k6 summary was attached but global HTTP p95 was incomplete; see api-hot-path-performance.md.' -Remediation 'Re-export k6 summary JSON with http_req_duration p(95) populated.'
}

Write-Host "Collecting first-pilot proof @ $normalizedBase"
Write-Host "Output: $proofDir"

$resolvedK6SummaryPath = Resolve-K6SummaryPath -ExplicitPath $K6SummaryPath
$performanceEnvironmentLabel = if ($ProductionLikeHostedPilot) { 'production-like-hosted' } else { 'local-or-readiness' }
$performanceEvidenceClass = if ($ProductionLikeHostedPilot) { 'production-like-k6-not-sla' } else { 'ci-smoke-or-attached-not-sla' }
Add-ApiHotPathPerformanceFinding -SummaryPath $resolvedK6SummaryPath -EnvironmentLabel $performanceEnvironmentLabel -EvidenceClass $performanceEvidenceClass

if ($SkipPreflight) {
    Add-ProofFinding -Disposition 'WARN' -Name 'pilot-preflight' -Detail 'Skipped by -SkipPreflight.' -Remediation 'Run without -SkipPreflight before customer handoff.'
}
else {
    $preflightJsonPath = Join-Path $proofDir 'preflight.json'
    $preflightTextPath = Join-Path $proofDir 'preflight-output.txt'
    $savedApiKey = $env:ARCHLUCID_API_KEY

    try {
        if (-not [string]::IsNullOrWhiteSpace($ApiKey)) {
            $env:ARCHLUCID_API_KEY = $ApiKey.Trim()
        }

        $cliProject = Join-Path $root 'ArchLucid.Cli\ArchLucid.Cli.csproj'
        $preflightArgs = @('--json', 'pilot', 'preflight', '--api-base-url', $normalizedBase)

        if ($ProductionLikeHostedPilot -or $SponsorHandoff) {
            $preflightArgs += '--simulate-production'
        }

        $preflightOutput = & dotnet run --project $cliProject -- @preflightArgs 2>&1
        $preflightExit = $LASTEXITCODE
        $preflightText = ($preflightOutput | Out-String).Trim()

        if (-not [string]::IsNullOrWhiteSpace($preflightText)) {
            [System.IO.File]::WriteAllText($preflightTextPath, $preflightText, [System.Text.UTF8Encoding]::new($false))
        }

        try {
            $preflight = $preflightText | ConvertFrom-Json -ErrorAction Stop
            $preflight | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $preflightJsonPath -Encoding UTF8
            Add-ProofArtifact -Name 'preflight.json' -Path 'preflight.json' -Purpose 'CLI pilot preflight checks for config, health, version, and OpenAPI.'

            foreach ($step in @($preflight.steps)) {
                $disposition = Convert-StepDisposition -Disposition ([string]$step.disposition)
                $triage = Get-TriageCardForPreflightStep -Name ([string]$step.name) -Detail ([string]$step.detail)
                Add-ProofFinding -Disposition $disposition -Name ([string]$step.name) -Detail ([string]$step.detail) -Remediation ([string]$step.remediation) -TriageCard $triage
            }
        }
        catch {
            Add-ProofArtifact -Name 'preflight-output.txt' -Path 'preflight-output.txt' -Purpose 'Raw preflight output; JSON parse failed.'
            Add-ProofFinding -Disposition 'BLOCK' -Name 'pilot-preflight-json' -Detail $_.Exception.Message -Remediation 'Run archlucid --json pilot preflight manually and inspect CLI output.' -TriageCard 'FP-T012'
        }

        if ($preflightExit -ne 0) {
            Add-ProofFinding -Disposition 'BLOCK' -Name 'pilot-preflight-exit' -Detail "archlucid pilot preflight exited $preflightExit." -Remediation 'Fix BLOCK preflight rows before first value.'
        }
    }
    finally {
        if ($null -eq $savedApiKey) {
            Remove-Item Env:\ARCHLUCID_API_KEY -ErrorAction SilentlyContinue
        }
        else {
            $env:ARCHLUCID_API_KEY = $savedApiKey
        }
    }
}

if ($SkipTelemetryExport) {
    Add-ProofFinding -Disposition 'WARN' -Name 'telemetry-export-readiness' -Detail 'Skipped by -SkipTelemetryExport.' -Remediation 'Run telemetry export readiness before hosted sponsor handoff.' -TriageCard 'FP-T013'
}
else {
    Add-TelemetryExportReadinessFinding -ProofDirectory $proofDir
}

if ($SkipDataConsistency) {
    Add-ProofFinding -Disposition 'WARN' -Name 'data-consistency-readiness' -Detail 'Skipped by -SkipDataConsistency.' -Remediation 'Run data consistency readiness before customer handoff.'
}
else {
    $dataOut = Join-Path $proofDir 'data-consistency-readiness'
    $dataScript = Join-Path $PSScriptRoot 'collect-data-consistency-readiness.ps1'
    & $dataScript -BaseUrl $normalizedBase -BearerToken $BearerToken -ApiKey $ApiKey -OutputDirectory $dataOut
    $dataExit = $LASTEXITCODE

    if ($dataExit -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'data-consistency-readiness' -Detail 'Data-consistency readiness collector completed.'
        Add-ProofArtifact -Name 'data-consistency-readiness' -Path 'data-consistency-readiness/' -Purpose 'Read-only data consistency readiness summary.'
    }
    else {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'data-consistency-readiness' -Detail "Collector exited $dataExit." -Remediation 'Inspect data-consistency-readiness output and /health/diagnostics.' -TriageCard 'FP-T003'
    }
}

if ($SkipCommercialHandoff) {
    Add-ProofFinding -Disposition 'WARN' -Name 'commercial-handoff-checks' -Detail 'Skipped by -SkipCommercialHandoff.' -Remediation 'Run commercial handoff checks before sponsor send.'
}
else {
    Add-RouteTierPolicyNavFinding -ProofDirectory $proofDir
    Add-ProcurementDealReadyFinding -ProofDirectory $proofDir
    Add-PricingQuoteAgingFinding
}

if ([string]::IsNullOrWhiteSpace($RunId)) {
    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'committed-run-evidence' -Detail 'No RunId supplied; committed-review evidence collection was skipped in sponsor handoff mode.' -Remediation 'Re-run with -RunId after the first golden manifest is committed.' -TriageCard 'FP-T006'
    }
    else {
        Add-ProofFinding -Disposition 'WARN' -Name 'committed-run-evidence' -Detail 'No RunId supplied; committed-review evidence collection was skipped.' -Remediation 'Re-run with -RunId after the first golden manifest is committed.' -TriageCard 'FP-T006'
    }
}
else {
    $evidenceOut = Join-Path $proofDir 'first-pilot-evidence'
    $evidenceScript = Join-Path $PSScriptRoot 'collect-first-pilot-evidence.ps1'
    & $evidenceScript -BaseUrl $normalizedBase -RunId $RunId -OutputDirectory $evidenceOut -BearerToken $BearerToken -ApiKey $ApiKey
    $evidenceExit = $LASTEXITCODE

    if ($evidenceExit -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'committed-run-evidence' -Detail "Evidence bundle collected for run $RunId."
        Add-ProofArtifact -Name 'first-pilot-evidence' -Path 'first-pilot-evidence/' -Purpose 'Buyer-safe committed-review evidence bundle.'
        Add-AgentQualitySponsorGateFinding -EvidenceRoot $evidenceOut

        if (-not $SkipCommercialHandoff) {
            Add-RoiBasisLabelFinding -EvidenceRoot $evidenceOut
            Add-LlmCostSummaryFinding -EvidenceRoot $evidenceOut
        }
    }
    else {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'committed-run-evidence' -Detail "Collector exited $evidenceExit." -Remediation 'Confirm the run is committed and accessible in the current tenant/workspace/project scope.' -TriageCard 'FP-T006'
    }
}

$blockCount = @($findings | Where-Object { $_.disposition -eq 'BLOCK' }).Count
$warnCount = @($findings | Where-Object { $_.disposition -eq 'WARN' }).Count
$verdict = if ($blockCount -gt 0) { 'BLOCK' } elseif ($warnCount -gt 0) { 'PASS_WITH_WARNINGS' } else { 'PASS' }
$sponsorPacketDisposition = if (-not $SponsorHandoff) {
    'READINESS_ONLY'
}
elseif ($blockCount -gt 0) {
    'HOLD'
}
else {
    'SEND'
}

$summary = [ordered]@{
    formatVersion             = '1.1'
    generatedUtc              = $timestamp
    baseUrl                   = $normalizedBase
    runId                     = if ([string]::IsNullOrWhiteSpace($RunId)) { $null } else { $RunId.Trim() }
    sponsorHandoffMode        = [bool]$SponsorHandoff
    productionLikeHostedPilot = [bool]$ProductionLikeHostedPilot
    verdict                   = $verdict
    sponsorPacketDisposition  = $sponsorPacketDisposition
    blockCount                = $blockCount
    warnCount                 = $warnCount
    findings                  = $findings
    artifacts                 = $artifacts
}

$summaryJsonPath = Join-Path $proofDir 'go-no-go-summary.json'
$summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $summaryJsonPath -Encoding UTF8

$summaryMdPath = Join-Path $proofDir 'go-no-go-summary.md'
$runIdLabel = if ([string]::IsNullOrWhiteSpace($RunId)) { 'Not supplied - readiness-only pass' } else { $RunId.Trim() }
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# First-pilot go/no-go summary')
$lines.Add('')
$lines.Add('| Field | Value |')
$lines.Add('| --- | --- |')
$lines.Add("| Generated UTC | $timestamp |")
$lines.Add("| Base URL | $normalizedBase |")
$lines.Add("| Run ID | $runIdLabel |")
$lines.Add("| Sponsor handoff mode | $([bool]$SponsorHandoff) |")
$lines.Add("| Production-like hosted pilot | $([bool]$ProductionLikeHostedPilot) |")
$lines.Add("| Verdict | **$verdict** |")
$lines.Add("| Sponsor packet disposition | **$sponsorPacketDisposition** |")
$lines.Add("| Blocking findings | $blockCount |")
$lines.Add("| Warnings | $warnCount |")
$lines.Add('')
$lines.Add('## Findings')
$lines.Add('')
$lines.Add('| Disposition | Check | Triage | Detail | Next action |')
$lines.Add('| --- | --- | --- | --- | --- |')

foreach ($finding in $findings) {
    $detail = ([string]$finding.detail).Replace('|', '\|').Replace("`r", ' ').Replace("`n", ' ')
    $next = ([string]$finding.remediation).Replace('|', '\|').Replace("`r", ' ').Replace("`n", ' ')
    $triage = if ([string]::IsNullOrWhiteSpace([string]$finding.triageCard)) { '' } else { [string]$finding.triageCard }
    $lines.Add("| $($finding.disposition) | $($finding.name) | $triage | $detail | $next |")
}

$lines.Add('')
$lines.Add('## Artifacts')
$lines.Add('')
$lines.Add('| Artifact | Path | Purpose |')
$lines.Add('| --- | --- | --- |')

foreach ($artifact in $artifacts) {
    $artifactPath = '``' + [string]$artifact.path + '``'
    $lines.Add("| $($artifact.name) | $artifactPath | $($artifact.purpose) |")
}

$lines.Add('')
$lines.Add('## Triage card index')
$lines.Add('')
$lines.Add('See `docs/runbooks/FIRST_PILOT_TRIAGE_CARDS.md`. Card ids in this report map directly to that table.')
$lines.Add('')
$lines.Add('## Safety')
$lines.Add('')
$lines.Add('This pipeline is read-only. It does not delete, quarantine, apply Terraform, mutate policy packs, or replay failed jobs.')
$lines | Set-Content -LiteralPath $summaryMdPath -Encoding UTF8

Write-Host "Wrote $summaryMdPath"
Write-Host "Verdict: $verdict ($blockCount block, $warnCount warn)"

if ($blockCount -gt 0) {
    exit 1
}

exit 0
