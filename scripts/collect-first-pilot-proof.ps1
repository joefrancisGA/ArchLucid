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
    [switch] $SkipDemoWorkspaceValidation,
    [switch] $ProductionLikeHostedPilot,
    [switch] $SponsorHandoff,
    [string[]] $DeferredBuyerRequirement = @(),
    [string] $K6SummaryPath = '',
    [string] $LiveUiSqlResultPath = '',
    [string] $StagingSmokeResultsPath = '',
    [string] $HostedProbeArtifactsPath = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot 'FirstPilotProofDisposition.ps1')
. (Join-Path $PSScriptRoot 'FirstPilotAiQualityProof.ps1')

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
$script:roiBasisStatus = 'not-collected'
$script:roiSponsorSafe = $false
$script:dataConsistencyStatus = 'NOT_RUN'
$script:procurementReportText = ''
$script:aiQualityProof = $null
$script:demoWorkspaceValidationDisposition = 'NOT_RUN'

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
        $gateMode = [string]$observability.qualityGateMode
        $holdDetail = Get-QualityGateHoldDetail -QualityGateDisposition $qualityGateDisposition -QualityGateMode $gateMode -UnresolvedQualitySignalsPresent ($observability.unresolvedQualitySignalsPresent -eq $true)
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail $holdDetail -Remediation 'Pause sponsor handoff and resolve agent quality gate evidence before sending the packet.' -TriageCard 'FP-T005'
        return
    }

    if ($observability.unresolvedQualitySignalsPresent -eq $true -and $SponsorHandoff) {
        $gateMode = [string]$observability.qualityGateMode
        $holdDetail = Get-QualityGateHoldDetail -QualityGateDisposition $qualityGateDisposition -QualityGateMode $gateMode -UnresolvedQualitySignalsPresent $true
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail $holdDetail -Remediation 'Resolve PilotStrict quality signals before sponsor send.' -TriageCard 'FP-T005'
        return
    }

    if ($realModeEvidenceDetected) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'real-llm-sponsor-evidence' -Detail "Real-mode LLM usage signals were detected, but PilotStrict sponsor-evidence disposition was not passing: $qualityGateDisposition." -Remediation 'Attach passing real-LLM evidence or regenerate the evidence bundle after quality signals resolve.' -TriageCard 'FP-T004'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'real-llm-sponsor-evidence' -Detail "No real-mode LLM sponsor-evidence signal was detected. Quality gate disposition: $qualityGateDisposition." -Remediation 'For buyer sponsor proof, use a PilotStrict real-mode host or explicitly label the packet as simulator/demo evidence.' -TriageCard 'FP-T004'
}

function Add-AiQualityProofFinding {
    param([Parameter(Mandatory = $true)][string] $EvidenceRoot)

    $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

    if ($null -eq $latestBundle) {
        $script:aiQualityProof = Build-AiQualityProofSnapshot -Observability $null -RetrievalGroundingSummary $null
        $finding = Resolve-AiQualityProofFinding -AiQualityProof $script:aiQualityProof -SponsorHandoff:$SponsorHandoff
        Add-ProofFinding -Disposition ([string]$finding.disposition) -Name 'ai-quality-proof' -Detail ([string]$finding.detail) -Remediation 'Re-run committed-run evidence collection with a RunId.' -TriageCard 'FP-T005'
        return
    }

    $observabilityPath = Join-Path $latestBundle.FullName 'pilot-observability-summary.json'
    $groundingPath = Join-Path $latestBundle.FullName 'retrieval-grounding.json'
    $observability = $null

    if (Test-Path -LiteralPath $observabilityPath) {
        try {
            $observability = Get-Content -LiteralPath $observabilityPath -Raw | ConvertFrom-Json -ErrorAction Stop
        }
        catch {
            $script:aiQualityProof = Build-AiQualityProofSnapshot -Observability $null -RetrievalGroundingSummary $null
            $finding = Resolve-AiQualityProofFinding -AiQualityProof $script:aiQualityProof -SponsorHandoff:$SponsorHandoff
            Add-ProofFinding -Disposition 'BLOCK' -Name 'ai-quality-proof' -Detail "Could not parse pilot-observability-summary.json: $($_.Exception.Message)" -Remediation 'Regenerate the evidence bundle.' -TriageCard 'FP-T005'
            return
        }
    }

    $groundingSummary = Get-RetrievalGroundingSummaryFromFile -Path $groundingPath
    $script:aiQualityProof = Build-AiQualityProofSnapshot -Observability $observability -RetrievalGroundingSummary $groundingSummary
    $finding = Resolve-AiQualityProofFinding -AiQualityProof $script:aiQualityProof -SponsorHandoff:$SponsorHandoff
    Add-ProofFinding -Disposition ([string]$finding.disposition) -Name 'ai-quality-proof' -Detail ([string]$finding.detail) -Remediation 'Resolve PilotStrict quality signals and attach retrieval grounding before sponsor send.' -TriageCard 'FP-T005'
}

function Add-RetrievalIrEvidenceFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $reportSource = Join-Path $root 'docs/quality/retrieval-ir-report.md'
    $jsonSource = Join-Path $root 'docs/quality/retrieval-ir-summary.json'

    if (-not (Test-Path -LiteralPath $reportSource)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'retrieval-ir-evidence' -Detail 'retrieval-ir-report.md is missing; run scripts/ci/eval_retrieval_ir.py after retrieval or corpus changes.' -Remediation 'Generate offline retrieval IR evidence before sponsor handoff when RAG quality is part of the claim.' -TriageCard 'FP-T004'
        return
    }

    $reportDest = Join-Path $ProofDirectory 'retrieval-ir-report.md'
    Copy-Item -LiteralPath $reportSource -Destination $reportDest -Force
    Add-ProofArtifact -Name 'retrieval-ir-report.md' -Path 'retrieval-ir-report.md' -Purpose 'Offline golden-fixture retrieval IR benchmark (recall@5, MRR); not live customer corpus data.'

    if (Test-Path -LiteralPath $jsonSource) {
        $jsonDest = Join-Path $ProofDirectory 'retrieval-ir-summary.json'
        Copy-Item -LiteralPath $jsonSource -Destination $jsonDest -Force
        Add-ProofArtifact -Name 'retrieval-ir-summary.json' -Path 'retrieval-ir-summary.json' -Purpose 'Machine-readable retrieval IR summary for proof automation.'
    }

    $reportText = Get-Content -LiteralPath $reportSource -Raw
    $meanRecall = $null
    $meanMrr = $null

    if ($reportText -match 'Mean recall@5:\*\*\s+([0-9.]+)') {
        $meanRecall = [double]$Matches[1]
    }

    if ($reportText -match 'Mean MRR:\*\*\s+([0-9.]+)') {
        $meanMrr = [double]$Matches[1]
    }

    $detail = if ($null -ne $meanRecall -and $null -ne $meanMrr) {
        "Retrieval IR evidence attached (mean recall@5=$meanRecall, mean MRR=$meanMrr)."
    }
    else {
        'Retrieval IR report attached; parse metrics manually if floors are required.'
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'retrieval-ir-evidence' -Detail $detail -Remediation ''
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
    $jsonPath = Join-Path $ProofDirectory 'route-tier-policy-nav-parity.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\assert_route_tier_policy_nav.py'
    & python $scriptPath --markdown-report $reportPath --json-summary-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'route-tier-policy-nav-parity.md' -Path 'route-tier-policy-nav-parity.md' -Purpose 'Buyer-safe route/tier/policy/nav parity summary for commercial handoff.'
    Add-ProofArtifact -Name 'route-tier-policy-nav-parity.json' -Path 'route-tier-policy-nav-parity.json' -Purpose 'Machine-readable route/tier/policy/nav parity summary.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'route-tier-policy-nav-parity' -Detail 'Route/tier/policy/nav registry parity passed.' -Remediation ''
        return
    }

    $detail = "Route/tier/policy/nav parity check failed with exit code $exitCode."

    if ($SponsorHandoff -or $ProductionLikeHostedPilot) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'route-tier-policy-nav-parity' -Detail $detail -Remediation 'Run python scripts/ci/assert_route_tier_policy_nav.py --sync and resolve parity failures before sponsor send.' -TriageCard 'FP-T014'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'route-tier-policy-nav-parity' -Detail $detail -Remediation 'Resolve route/tier/policy/nav drift before enterprise commercial handoff.' -TriageCard 'FP-T014'
}

function Add-ProductionLikeConfigLintFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    if (-not $ProductionLikeHostedPilot -and -not $SponsorHandoff) {
        Add-ProofFinding -Disposition 'WARN' -Name 'production-like-config-lint' -Detail 'Skipped; rerun with -ProductionLikeHostedPilot or -SponsorHandoff for profile lint artifacts.' -Remediation 'Run archlucid config lint --profile production-like-hosted-pilot before hosted sponsor handoff.' -TriageCard 'FP-T022'
        return
    }

    $jsonPath = Join-Path $ProofDirectory 'config-lint-production-like-hosted-pilot.json'
    $markdownPath = Join-Path $ProofDirectory 'config-lint-production-like-hosted-pilot.md'
    $cliProject = Join-Path $root 'ArchLucid.Cli\ArchLucid.Cli.csproj'
    $lintArgs = @(
        'run',
        '--project', $cliProject,
        '--',
        'config',
        'lint',
        '--profile', 'production-like-hosted-pilot',
        '--json-out', $jsonPath,
        '--markdown-out', $markdownPath
    )

    Push-Location -LiteralPath $root
    try {
        & dotnet @lintArgs 2>&1 | Out-Null
        $lintExit = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    Add-ProofArtifact -Name 'config-lint-production-like-hosted-pilot.json' -Path 'config-lint-production-like-hosted-pilot.json' -Purpose 'Production-like hosted pilot config lint JSON for auth, telemetry, LLM redaction, and hosting advisor checks.'
    Add-ProofArtifact -Name 'config-lint-production-like-hosted-pilot.md' -Path 'config-lint-production-like-hosted-pilot.md' -Purpose 'Human-readable config lint disposition for production-like hosted pilot handoff.'

    if ($lintExit -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'production-like-config-lint' -Detail 'Production-like hosted pilot config lint passed with no blocking findings.' -Remediation ''
        return
    }

    $detail = "Production-like hosted pilot config lint failed with exit code $lintExit."

    Add-ProofFinding -Disposition 'BLOCK' -Name 'production-like-config-lint' -Detail $detail -Remediation 'Fix blocking config lint findings and rerun with --profile production-like-hosted-pilot.' -TriageCard 'FP-T022'
}

function Add-DemoWorkspaceValidationFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    if ($SkipDemoWorkspaceValidation) {
        $script:demoWorkspaceValidationDisposition = 'SKIPPED'
        Add-ProofFinding -Disposition 'WARN' -Name 'demo-workspace-validation' -Detail 'Skipped by -SkipDemoWorkspaceValidation.' -Remediation 'Run ./scripts/verify-demo-workspace.ps1 before a demo-led sponsor send.' -TriageCard 'FP-T023'
        return
    }

    $reportPath = Join-Path $ProofDirectory 'demo-workspace-validation.txt'
    $jsonPath = Join-Path $ProofDirectory 'demo-workspace-validation.json'
    $scriptPath = Join-Path $PSScriptRoot 'verify-demo-workspace.ps1'
    $output = & $scriptPath -BaseUrl $normalizedBase -BearerToken $BearerToken -ApiKey $ApiKey -JsonSummaryOut $jsonPath 2>&1
    $exitCode = $LASTEXITCODE
    $reportText = ($output | Out-String)
    [System.IO.File]::WriteAllText($reportPath, $reportText, [System.Text.UTF8Encoding]::new($false))
    Add-ProofArtifact -Name 'demo-workspace-validation.txt' -Path 'demo-workspace-validation.txt' -Purpose 'Golden demo workspace and preview essentials PASS/HOLD disposition.'
    Add-ProofArtifact -Name 'demo-workspace-validation.json' -Path 'demo-workspace-validation.json' -Purpose 'Machine-readable demo workspace validation summary.'

    if ($exitCode -eq 0) {
        $script:demoWorkspaceValidationDisposition = 'PASS'
        Add-ProofFinding -Disposition 'PASS' -Name 'demo-workspace-validation' -Detail 'Demo workspace and preview essentials passed.' -Remediation ''
        return
    }

    $script:demoWorkspaceValidationDisposition = 'HOLD'
    $detail = "Demo workspace validation returned HOLD (exit code $exitCode)."

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'demo-workspace-validation' -Detail $detail -Remediation 'Run ./scripts/verify-demo-workspace.ps1 and re-seed demo data before demo-led sponsor send.' -TriageCard 'FP-T023'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'demo-workspace-validation' -Detail $detail -Remediation 'Repair demo workspace anchors before using demo as commercial proof.' -TriageCard 'FP-T023'
}

function Add-LiveUiSqlParityFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $candidatePath = $LiveUiSqlResultPath

    if ([string]::IsNullOrWhiteSpace($candidatePath)) {
        $defaultPath = Join-Path $root 'artifacts/release-smoke-live-ui-sql-result.json'

        if (Test-Path -LiteralPath $defaultPath) {
            $candidatePath = $defaultPath
        }
    }

    if ([string]::IsNullOrWhiteSpace($candidatePath) -or -not (Test-Path -LiteralPath $candidatePath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'live-ui-sql-parity' -Detail 'Live UI-SQL parity result was not supplied; attach release-smoke-live-ui-sql output for release-candidate claims.' -Remediation 'Run ./scripts/release-smoke-live-ui-sql.ps1 -ResultOut artifacts/release-smoke-live-ui-sql-result.json and rerun proof with -LiveUiSqlResultPath.' -TriageCard 'FP-T011'
        return
    }

    $jsonDest = Join-Path $ProofDirectory 'live-ui-sql-parity-result.json'
    Copy-Item -LiteralPath $candidatePath -Destination $jsonDest -Force
    Add-ProofArtifact -Name 'live-ui-sql-parity-result.json' -Path 'live-ui-sql-parity-result.json' -Purpose 'Live browser live-api-* parity vs smoke-started API+SQL — not mock Playwright.'

    $mdSource = [System.IO.Path]::ChangeExtension($candidatePath, '.md')

    if (Test-Path -LiteralPath $mdSource) {
        $mdDest = Join-Path $ProofDirectory 'live-ui-sql-parity-result.md'
        Copy-Item -LiteralPath $mdSource -Destination $mdDest -Force
        Add-ProofArtifact -Name 'live-ui-sql-parity-result.md' -Path 'live-ui-sql-parity-result.md' -Purpose 'Human-readable live UI-SQL parity summary.'
    }

    try {
        $payload = Get-Content -LiteralPath $candidatePath -Raw | ConvertFrom-Json -ErrorAction Stop
        $profile = [string]$payload.profile
        $verdict = [string]$payload.verdict
        $liveCheck = @($payload.checks | Where-Object { [string]$_.name -like '*Live Playwright*' })

        if ($profile -ne 'LiveUiSql' -and $liveCheck.Count -eq 0) {
            Add-ProofFinding -Disposition 'WARN' -Name 'live-ui-sql-parity' -Detail "Attached result profile='$profile' is not LiveUiSql; do not cite as live UI-SQL parity evidence." -Remediation 'Re-run release-smoke-live-ui-sql.ps1 with -Profile LiveUiSql.' -TriageCard 'FP-T011'
            return
        }

        Add-ProofFinding -Disposition 'PASS' -Name 'live-ui-sql-parity' -Detail "Live UI-SQL parity artifact attached (profile=$profile, verdict=$verdict)." -Remediation ''
    }
    catch {
        Add-ProofFinding -Disposition 'WARN' -Name 'live-ui-sql-parity' -Detail "Could not parse live UI-SQL parity JSON: $($_.Exception.Message)" -Remediation 'Regenerate release smoke result JSON.' -TriageCard 'FP-T011'
    }
}

function Write-QuoteToProofPacketMarkdown {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [Parameter(Mandatory = $true)][string] $SponsorPacketDisposition,
        [Parameter(Mandatory = $true)][string] $RoiBasisStatus,
        [Parameter(Mandatory = $true)][bool] $RoiSponsorSafe,
        [Parameter(Mandatory = $true)][int] $BlockCount,
        [Parameter(Mandatory = $true)][string[]] $DeferredScopeReasons,
        [Parameter(Mandatory = $true)][object[]] $Findings,
        [string] $RunId = '',
        [string] $DataConsistencyStatus = 'NOT_RUN',
        [object] $AiQualityProof = $null
    )

    function Resolve-FindingDisposition {
        param([string] $Name)

        $match = @($Findings | Where-Object { [string]$_.name -eq $Name })

        if ($match.Count -eq 0) {
            return 'NOT_RUN'
        }

        return [string]$match[0].disposition
    }

    $procurementStatus = Resolve-FindingDisposition -Name 'procurement-deal-ready'
    $routeTierStatus = Resolve-FindingDisposition -Name 'route-tier-policy-nav-parity'
    $evidenceStatus = Resolve-FindingDisposition -Name 'committed-run-evidence'
    $annualReady = ($SponsorPacketDisposition -eq 'SEND' -and $RoiSponsorSafe -and $BlockCount -eq 0)
    $commercialDisposition = if ($BlockCount -gt 0) { 'HOLD' } elseif ($SponsorPacketDisposition -eq 'DEFERRED_SCOPE') { 'DEFERRED_SCOPE' } elseif ($SponsorPacketDisposition -eq 'SEND') { 'PASS' } else { 'HOLD' }

    $recommendedNextAsk = switch ($SponsorPacketDisposition) {
        'SEND' { 'Send sponsor packet internally for ARB/executive review; attach quote-to-proof index and first-value report.' }
        'DEFERRED_SCOPE' { 'Document deferred buyer requirements separately; do not present V1.1/V2 items as product blockers.' }
        'HOLD' { 'Resolve blocking proof rows, rerun collect-first-pilot-proof.ps1 -SponsorHandoff, then re-evaluate annual order readiness.' }
        default { 'Complete first committed review and rerun proof with -RunId before commercial follow-up.' }
    }

    $aiQualityStatus = if ($null -eq $AiQualityProof -or $AiQualityProof.collected -ne $true) { 'NOT_COLLECTED' } elseif ($AiQualityProof.sponsorSafe -eq $true) { 'PASS' } else { 'WARN' }
    $runIdLabel = if ([string]::IsNullOrWhiteSpace($RunId)) { 'not supplied' } else { $RunId.Trim() }

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add('# Quote-to-proof packet index (generated)')
    $lines.Add('')
    $lines.Add('> Canonical checklist: [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](../../docs/go-to-market/QUOTE_TO_PROOF_PACKET.md). Pricing and order terms live only in [`PRICING_PHILOSOPHY.md`](../../docs/go-to-market/PRICING_PHILOSOPHY.md) and [`ORDER_FORM_TEMPLATE.md`](../../docs/go-to-market/ORDER_FORM_TEMPLATE.md).')
    $lines.Add('')
    $lines.Add("| Field | Value |")
    $lines.Add("| --- | --- |")
    $lines.Add("| Commercial disposition | **$commercialDisposition** |")
    $lines.Add("| Sponsor packet disposition | **$SponsorPacketDisposition** |")
    $lines.Add("| Run id | $runIdLabel |")
    $lines.Add("| Evidence source (ROI basis) | **$RoiBasisStatus** |")
    $lines.Add("| ROI sponsor-safe | **$RoiSponsorSafe** |")
    $lines.Add("| Data consistency status | **$DataConsistencyStatus** |")
    $lines.Add("| AI quality proof | **$aiQualityStatus** |")
    $lines.Add("| Annual order readiness | **$(if ($annualReady) { 'READY' } else { 'HOLD' })** |")
    $lines.Add('')
    $lines.Add('## Recommended next ask')
    $lines.Add('')
    $lines.Add("- $recommendedNextAsk")
    $lines.Add('')
    $lines.Add('## Packet rows')
    $lines.Add('')
    $lines.Add('| Artifact | Proof status | Path / command |')
    $lines.Add('| --- | --- | --- |')
    $lines.Add("| Sponsor proof ZIP / evidence bundle | $evidenceStatus | ``first-pilot-evidence/`` (when ``-RunId`` supplied) |")
    $lines.Add("| First-value report | $evidenceStatus | ``first-pilot-evidence/first-value-report.md`` |")
    $lines.Add("| Pilot success scorecard | MANUAL | [`PILOT_SUCCESS_SCORECARD.md`](../../docs/go-to-market/PILOT_SUCCESS_SCORECARD.md) |")
    $lines.Add("| ROI basis labels | $RoiBasisStatus | ``go-no-go-summary.json`` · ``roiBasisStatus`` |")
    $lines.Add("| Procurement deal-ready | $procurementStatus | ``procurement-deal-ready-check.txt`` |")
    $lines.Add("| Route/tier/policy/nav parity | $routeTierStatus | ``route-tier-policy-nav-parity.md`` |")
    $lines.Add("| Production-like config lint | $(Resolve-FindingDisposition -Name 'production-like-config-lint') | ``config-lint-production-like-hosted-pilot.md`` |")
    $lines.Add("| Data consistency readiness | $DataConsistencyStatus | ``data-consistency-readiness/`` |")
    $lines.Add("| AI quality proof | $aiQualityStatus | ``go-no-go-summary.json`` · ``aiQualityProof`` |")
    $lines.Add("| Live UI-SQL parity | $(Resolve-FindingDisposition -Name 'live-ui-sql-parity') | ``live-ui-sql-parity-result.json`` (when supplied) |")
    $lines.Add("| Selected tier + order form | MANUAL | [`ORDER_FORM_TEMPLATE.md`](../../docs/go-to-market/ORDER_FORM_TEMPLATE.md) after tier is agreed |")
    $lines.Add("| Demo workspace validation | $(Resolve-FindingDisposition -Name 'demo-workspace-validation') | ``demo-workspace-validation.txt`` |")
    $lines.Add("| Trial-to-paid test-mode evidence | $(Resolve-FindingDisposition -Name 'trial-to-paid-test-mode-evidence') | ``trial-to-paid-test-mode-evidence.md`` |")
    $lines.Add("| Accelerator handoff acceptance | $(Resolve-FindingDisposition -Name 'accelerator-handoff-acceptance') | ``accelerator-handoff-acceptance.md`` |")

    if ($DeferredScopeReasons.Count -gt 0) {
        $lines.Add('')
        $lines.Add('## Deferred buyer requirements (not V1 blockers)')
        $lines.Add('')

        foreach ($reason in $DeferredScopeReasons) {
            $lines.Add("- $reason")
        }
    }

    $lines.Add('')
    $target = Join-Path $ProofDirectory 'quote-to-proof-packet.md'
    $lines | Set-Content -LiteralPath $target -Encoding UTF8
    Add-ProofArtifact -Name 'quote-to-proof-packet.md' -Path 'quote-to-proof-packet.md' -Purpose 'Sales-led quote-to-proof packet index mapped from this proof run.'
}

function Add-ProcurementDealReadyFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $reportPath = Join-Path $ProofDirectory 'procurement-deal-ready-check.txt'
    $jsonPath = Join-Path $ProofDirectory 'procurement-deal-ready-summary.json'
    $scriptPath = Join-Path $PSScriptRoot 'build_procurement_pack.py'
    $output = & python $scriptPath --dry-run --deal-ready --json-summary-out $jsonPath 2>&1
    $exitCode = $LASTEXITCODE
    $script:procurementReportText = ($output | Out-String)
    [System.IO.File]::WriteAllText($reportPath, $script:procurementReportText, [System.Text.UTF8Encoding]::new($false))
    Add-ProofArtifact -Name 'procurement-deal-ready-check.txt' -Path 'procurement-deal-ready-check.txt' -Purpose 'Deal-ready procurement pack dry-run output with deferred-scope labels.'
    Add-ProofArtifact -Name 'procurement-deal-ready-summary.json' -Path 'procurement-deal-ready-summary.json' -Purpose 'Machine-readable procurement deal-ready disposition with deferred realism notes.'

    $disposition = 'HOLD'
    $blockingCount = 0

    if (Test-Path -LiteralPath $jsonPath) {
        try {
            $summary = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
            $disposition = [string]$summary.disposition
            $blockingCount = @($summary.blocking_violations).Count
        }
        catch {
            $disposition = 'HOLD'
        }
    }

    if ($disposition -eq 'PASS' -or ($blockingCount -eq 0 -and $exitCode -eq 0)) {
        Add-ProofFinding -Disposition 'PASS' -Name 'procurement-deal-ready' -Detail 'Procurement pack deal-ready dry-run passed (deferred procurement realism notes may still apply).' -Remediation ''
        return
    }

    $detail = "Procurement pack deal-ready dry-run failed with exit code $exitCode."

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'procurement-deal-ready' -Detail $detail -Remediation 'Run python scripts/build_procurement_pack.py --deal-ready and fix stale or buyer-unsafe procurement artifacts.' -TriageCard 'FP-T015'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'procurement-deal-ready' -Detail $detail -Remediation 'Refresh procurement pack evidence before sponsor send.' -TriageCard 'FP-T015'
}

function Add-TrialToPaidTestModeEvidenceFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'trial-to-paid-test-mode-evidence.md'
    $jsonPath = Join-Path $ProofDirectory 'trial-to-paid-test-mode-evidence.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_trial_to_paid_test_mode_evidence.py'
    & python $scriptPath --markdown-out $markdownPath --json-summary-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'trial-to-paid-test-mode-evidence.md' -Path 'trial-to-paid-test-mode-evidence.md' -Purpose 'Buyer-safe trial-to-paid TEST-mode evidence; live commerce remains deferred.'
    Add-ProofArtifact -Name 'trial-to-paid-test-mode-evidence.json' -Path 'trial-to-paid-test-mode-evidence.json' -Purpose 'Machine-readable trial-to-paid test-mode evidence summary.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'trial-to-paid-test-mode-evidence' -Detail 'Trial-to-paid test-mode evidence artifacts generated; live checkout remains owner-only deferred.' -Remediation ''
        return
    }

    $detail = "Trial-to-paid test-mode evidence check returned HOLD (exit code $exitCode)."

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'WARN' -Name 'trial-to-paid-test-mode-evidence' -Detail $detail -Remediation 'Repair trial funnel docs/pricing guards before citing test-mode commerce readiness.' -TriageCard 'FP-T017'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'trial-to-paid-test-mode-evidence' -Detail $detail -Remediation 'Review trial funnel docs and pricing.json checkout guards.' -TriageCard 'FP-T017'
}

function Add-AcceleratorHandoffFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'accelerator-handoff-acceptance.md'
    $jsonPath = Join-Path $ProofDirectory 'accelerator-handoff-acceptance.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\check_accelerator_handoff_docs.py'
    & python $scriptPath --markdown-out $markdownPath --json-summary-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'accelerator-handoff-acceptance.md' -Path 'accelerator-handoff-acceptance.md' -Purpose 'Specialty accelerator walkthrough/buyer-job V1-safe acceptance summary.'
    Add-ProofArtifact -Name 'accelerator-handoff-acceptance.json' -Path 'accelerator-handoff-acceptance.json' -Purpose 'Machine-readable accelerator handoff acceptance summary.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'accelerator-handoff-acceptance' -Detail 'Accelerator handoff docs passed V1-only link and connector acceptance checks.' -Remediation ''
        return
    }

    $detail = "Accelerator handoff acceptance failed with exit code $exitCode."

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'accelerator-handoff-acceptance' -Detail $detail -Remediation 'Fix broken accelerator links or accidental V1.1-required wording in walkthrough docs.' -TriageCard 'FP-T014'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'accelerator-handoff-acceptance' -Detail $detail -Remediation 'Run python scripts/ci/check_accelerator_handoff_docs.py and repair accelerator doc drift.' -TriageCard 'FP-T014'
}

function Add-DemoDerivedRoiCommercialGate {
    if ($script:roiBasisStatus -ne 'demo-derived') {
        return
    }

    $detail = "ROI basis is demo-derived; demo workspace validation disposition is $($script:demoWorkspaceValidationDisposition)."

    if ($script:demoWorkspaceValidationDisposition -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'demo-derived-roi-validation' -Detail "$detail Demo evidence is labeled and validated — not current customer proof." -Remediation ''
        return
    }

    if ($SponsorHandoff) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'demo-derived-roi-validation' -Detail $detail -Remediation 'Pass demo workspace validation before citing demo-derived ROI in sponsor handoff.' -TriageCard 'FP-T023'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'demo-derived-roi-validation' -Detail $detail -Remediation 'Run ./scripts/verify-demo-workspace.ps1 before using demo-derived ROI in commercial proof.' -TriageCard 'FP-T023'
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
    param(
        [Parameter(Mandatory = $true)][string] $EvidenceRoot,
        [switch] $AllowCaveatedUnsafeBasis
    )

    $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

    if ($null -eq $latestBundle) {
        $script:roiBasisStatus = 'not-collected'
        $script:roiSponsorSafe = $false
        Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail 'Evidence bundle missing; cannot validate ROI basis labels.' -Remediation 'Re-run committed-run evidence collection.' -TriageCard 'FP-T016'
        return
    }

    $reportPath = Join-Path $latestBundle.FullName 'first-value-report.md'
    $deltasPath = Join-Path $latestBundle.FullName 'pilot-run-deltas.json'

    if (-not (Test-Path -LiteralPath $reportPath)) {
        $script:roiBasisStatus = 'not-collected'
        $script:roiSponsorSafe = $false
        Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail 'first-value-report.md is missing from the evidence bundle.' -Remediation 'Regenerate the first-value report for the committed review.' -TriageCard 'FP-T016'
        return
    }

    $reportText = Get-Content -LiteralPath $reportPath -Raw
    $requiredPhrases = @(
        '## Sponsor send readiness (buyer-safe gate)',
        '## ROI evidence completeness',
        '## Sponsor artifact evidence badges',
        'ROI evidence confidence'
    )
    $missingPhrases = @($requiredPhrases | Where-Object { $reportText -notlike "*$_*" })

    if ($missingPhrases.Count -gt 0) {
        $script:roiBasisStatus = 'not-collected'
        $script:roiSponsorSafe = $false
        Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail "Missing ROI basis sections: $($missingPhrases -join ', ')." -Remediation 'Regenerate sponsor output and confirm ROI basis labels are present before external send.' -TriageCard 'FP-T016'
        return
    }

    $roiLabel = ''
    $roiEvidenceConfidence = ''
    $sponsorProofReadiness = ''
    $isDemoTenant = $false

    if (Test-Path -LiteralPath $deltasPath) {
        try {
            $deltas = Get-Content -LiteralPath $deltasPath -Raw | ConvertFrom-Json -ErrorAction Stop
            $proof = $deltas.proofPackageCompleteness
            $roiLabel = [string]$proof.roiConfidenceLabel
            $roiEvidenceConfidence = [string]$proof.roiEvidenceConfidence
            $sponsorProofReadiness = [string]$proof.sponsorProofReadiness
            $isDemoTenant = ($deltas.isDemoTenant -eq $true)

            if ([string]::IsNullOrWhiteSpace($roiLabel)) {
                $script:roiBasisStatus = 'not-collected'
                $script:roiSponsorSafe = $false
                Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail 'proofPackageCompleteness.roiConfidenceLabel is missing from pilot-run-deltas.' -Remediation 'Capture tenant ROI baseline posture before sponsor export.' -TriageCard 'FP-T016'
                return
            }
        }
        catch {
            Add-ProofFinding -Disposition 'WARN' -Name 'roi-basis-labels' -Detail "Could not parse pilot-run-deltas.json for ROI basis metadata: $($_.Exception.Message)" -Remediation 'Inspect pilot-run-deltas JSON manually.' -TriageCard 'FP-T016'
            return
        }
    }

    $script:roiBasisStatus = Resolve-RoiBasisStatus `
        -RoiConfidenceLabel $roiLabel `
        -IsDemoTenant $isDemoTenant `
        -RoiEvidenceConfidence $roiEvidenceConfidence `
        -SponsorProofReadiness $sponsorProofReadiness
    $script:roiSponsorSafe = Test-RoiBasisSponsorSafe -RoiBasisStatus $script:roiBasisStatus -AllowCaveatedUnsafeBasis:$AllowCaveatedUnsafeBasis

    if ($SponsorHandoff -and -not $script:roiSponsorSafe) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'roi-basis-labels' -Detail "ROI basis status '$($script:roiBasisStatus)' is not sponsor-safe for projected dollar claims without an explicit caveat." -Remediation 'Capture buyer-provided baselines or label the packet with conservative ROI caveats before sponsor send.' -TriageCard 'FP-T018'
        return
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'roi-basis-labels' -Detail "First-value report includes sponsor-safe ROI basis sections; basis status=$($script:roiBasisStatus)." -Remediation ''
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

function Resolve-StagingSmokeResultsPath {
    param([string] $ExplicitPath)

    if (-not [string]::IsNullOrWhiteSpace($ExplicitPath) -and (Test-Path -LiteralPath $ExplicitPath)) {
        return (Resolve-Path -LiteralPath $ExplicitPath).Path
    }

    $candidates = @(
        (Join-Path $root 'artifacts/staging-smoke-results.json'),
        (Join-Path $root 'staging-smoke-results.json')
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    return $null
}

function Resolve-HostedProbeArtifactsPath {
    param([string] $ExplicitPath)

    if (-not [string]::IsNullOrWhiteSpace($ExplicitPath) -and (Test-Path -LiteralPath $ExplicitPath)) {
        return (Resolve-Path -LiteralPath $ExplicitPath).Path
    }

    if (-not [string]::IsNullOrWhiteSpace($env:HOSTED_PROBE_ARTIFACTS_PATH) -and (Test-Path -LiteralPath $env:HOSTED_PROBE_ARTIFACTS_PATH)) {
        return (Resolve-Path -LiteralPath $env:HOSTED_PROBE_ARTIFACTS_PATH).Path
    }

    $candidate = Join-Path $root 'artifacts/hosted-probes'

    if (Test-Path -LiteralPath $candidate) {
        return (Resolve-Path -LiteralPath $candidate).Path
    }

    return $null
}

function Add-FirstPilotPerformanceBaselineFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [string] $TimingsJsonPath
    )

    $markdownPath = Join-Path $ProofDirectory 'first-pilot-performance-baseline.md'
    $jsonPath = Join-Path $ProofDirectory 'first-pilot-performance-baseline.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_first_pilot_performance_baseline.py'
    $args = @(
        $scriptPath,
        '--markdown-out', $markdownPath,
        '--json-summary-out', $jsonPath
    )

    if (-not [string]::IsNullOrWhiteSpace($TimingsJsonPath)) {
        $args += @('--timings-json', $TimingsJsonPath)
    }

    & python @args 2>&1 | Out-Null
    Add-ProofArtifact -Name 'first-pilot-performance-baseline.md' -Path 'first-pilot-performance-baseline.md' -Purpose 'Observed first-pilot step latencies — not a load test or SLA proof.'
    Add-ProofArtifact -Name 'first-pilot-performance-baseline.json' -Path 'first-pilot-performance-baseline.json' -Purpose 'Machine-readable first-pilot performance baseline summary.'

    if ([string]::IsNullOrWhiteSpace($TimingsJsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'first-pilot-performance-baseline' -Detail 'No staging-smoke timings JSON attached; baseline records NOT_COLLECTED.' -Remediation 'Run ./scripts/staging-smoke.ps1 and rerun proof with -StagingSmokeResultsPath.'
        return
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'first-pilot-performance-baseline' -Detail 'First-pilot step latency baseline attached with explicit not-a-load-test labeling.' -Remediation ''
}

function Add-LlmBudgetStatusFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [string] $EvidenceRoot = '',
        [string] $LlmExecutionMode = 'unknown'
    )

    $statusJsonPath = $null

    if (-not [string]::IsNullOrWhiteSpace($EvidenceRoot)) {
        $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $EvidenceRoot

        if ($null -ne $latestBundle) {
            $candidate = Join-Path $latestBundle.FullName 'llm-budget-status.json'

            if (Test-Path -LiteralPath $candidate) {
                $statusJsonPath = $candidate
            }
            else {
                $observabilityPath = Join-Path $latestBundle.FullName 'pilot-observability-summary.json'

                if (Test-Path -LiteralPath $observabilityPath) {
                    $statusJsonPath = $observabilityPath
                }
            }
        }
    }

    $markdownPath = Join-Path $ProofDirectory 'llm-budget-proof-status.md'
    $jsonPath = Join-Path $ProofDirectory 'llm-budget-proof-status.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_llm_budget_proof_status.py'
    $args = @(
        $scriptPath,
        '--markdown-out', $markdownPath,
        '--json-summary-out', $jsonPath,
        '--llm-mode', $LlmExecutionMode
    )

    if (-not [string]::IsNullOrWhiteSpace($statusJsonPath)) {
        $args += @('--status-json', $statusJsonPath)
    }

    & python @args 2>&1 | Out-Null
    Add-ProofArtifact -Name 'llm-budget-proof-status.md' -Path 'llm-budget-proof-status.md' -Purpose 'Buyer-safe UTC-month LLM budget posture for hosted pilot economics.'
    Add-ProofArtifact -Name 'llm-budget-proof-status.json' -Path 'llm-budget-proof-status.json' -Purpose 'Machine-readable LLM budget proof summary.'

    if ([string]::IsNullOrWhiteSpace($statusJsonPath)) {
        Add-ProofFinding -Disposition 'WARN' -Name 'llm-budget-proof-status' -Detail 'LLM budget status was not collected (ExecuteAuthority or budget tables may be unavailable).' -Remediation 'Re-run evidence collection with ExecuteAuthority or review LlmMonthlyTenantDollarBudget configuration.'
        return
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'llm-budget-proof-status' -Detail "LLM budget posture collected for execution mode '$LlmExecutionMode'." -Remediation ''
}

function Add-HostedAvailabilityRollupFinding {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [string] $ProbeArtifactsPath
    )

    $markdownPath = Join-Path $ProofDirectory 'hosted-availability-rollup.md'
    $jsonPath = Join-Path $ProofDirectory 'hosted-availability-rollup.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_hosted_availability_proof.py'
    $args = @(
        $scriptPath,
        '--markdown-out', $markdownPath,
        '--json-summary-out', $jsonPath
    )

    if (-not [string]::IsNullOrWhiteSpace($ProbeArtifactsPath)) {
        if ((Get-Item -LiteralPath $ProbeArtifactsPath).PSIsContainer) {
            $jsonFiles = Get-ChildItem -LiteralPath $ProbeArtifactsPath -Filter '*.json' -Recurse -File -ErrorAction SilentlyContinue

            foreach ($file in $jsonFiles) {
                $args += $file.FullName
            }
        }
        else {
            $args += $ProbeArtifactsPath
        }
    }

    & python @args 2>&1 | Out-Null
    Add-ProofArtifact -Name 'hosted-availability-rollup.md' -Path 'hosted-availability-rollup.md' -Purpose 'Hosted HTTP probe rollup when artifacts exist — not contractual SLA evidence.'
    Add-ProofArtifact -Name 'hosted-availability-rollup.json' -Path 'hosted-availability-rollup.json' -Purpose 'Machine-readable hosted availability rollup disposition.'

    if ([string]::IsNullOrWhiteSpace($ProbeArtifactsPath)) {
        $detail = 'Hosted probe artifacts were not supplied; availability rollup is NOT_COLLECTED.'

        if ($ProductionLikeHostedPilot -and $SponsorHandoff) {
            $detail = "$detail Production-like sponsor handoff lacks hosted probe history — do not imply production SLA evidence."
        }

        Add-ProofFinding -Disposition 'WARN' -Name 'hosted-availability-rollup' -Detail $detail -Remediation 'Collect probe artifacts per docs/runbooks/HOSTED_AVAILABILITY_ROLLUP.md or set -HostedProbeArtifactsPath.'
        return
    }

    Add-ProofFinding -Disposition 'PASS' -Name 'hosted-availability-rollup' -Detail 'Hosted availability rollup attached with staging/probe caveats.' -Remediation ''
}

function Add-AzureExtractorUploadUxFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'azure-extractor-upload-failure-ux.md'
    $scriptPath = Join-Path $PSScriptRoot 'ci\check_azure_extractor_upload_failure_ux.py'
    & python $scriptPath --markdown-out $markdownPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'azure-extractor-upload-failure-ux.md' -Path 'azure-extractor-upload-failure-ux.md' -Purpose 'Stable Azure extractor upload failure codes mapped to docs and tests.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'azure-extractor-upload-failure-ux' -Detail 'Azure extractor upload failure UX acceptance checks passed.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'azure-extractor-upload-failure-ux' -Detail "Azure extractor upload UX acceptance returned exit code $exitCode." -Remediation 'Repair resolver codes, docs, or extractor failure tests.'
}

function Add-IdentityPreflightScenarioFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'identity-preflight-scenarios.md'
    $jsonPath = Join-Path $ProofDirectory 'identity-preflight-scenarios.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_identity_preflight_scenarios.py'
    & python $scriptPath --markdown-out $markdownPath --json-summary-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'identity-preflight-scenarios.md' -Path 'identity-preflight-scenarios.md' -Purpose 'Redacted OIDC/SAML preflight scenario examples for enterprise identity setup.'
    Add-ProofArtifact -Name 'identity-preflight-scenarios.json' -Path 'identity-preflight-scenarios.json' -Purpose 'Machine-readable identity preflight scenario fixture index.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'identity-preflight-scenarios' -Detail 'Identity preflight scenario fixtures rendered for operator interpretation.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'identity-preflight-scenarios' -Detail "Identity preflight scenario report failed with exit code $exitCode." -Remediation 'Repair scripts/ci/fixtures/identity-preflight-scenarios.json.'
}

function Add-MutatingRouteAuditMatrixFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'mutating-route-audit-matrix.md'
    $jsonPath = Join-Path $ProofDirectory 'mutating-route-audit-matrix.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\check_audit_matrix.py'
    & python $scriptPath --markdown-out $markdownPath --json-summary-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'mutating-route-audit-matrix.md' -Path 'mutating-route-audit-matrix.md' -Purpose 'Controller mutating route coverage against AUDIT_COVERAGE_MATRIX.md.'
    Add-ProofArtifact -Name 'mutating-route-audit-matrix.json' -Path 'mutating-route-audit-matrix.json' -Purpose 'Machine-readable mutating route audit matrix disposition.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'mutating-route-audit-matrix' -Detail 'All mutating controller routes are documented in the audit coverage matrix or allowlist.' -Remediation ''
        return
    }

    if ($SponsorHandoff -or $ProductionLikeHostedPilot) {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'mutating-route-audit-matrix' -Detail "Mutating route audit matrix check failed with exit code $exitCode." -Remediation 'Add missing routes to docs/library/AUDIT_COVERAGE_MATRIX.md or scripts/ci/openapi_audit_matrix_allowlist.txt.'
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'mutating-route-audit-matrix' -Detail "Mutating route audit matrix check failed with exit code $exitCode." -Remediation 'Add missing routes to docs/library/AUDIT_COVERAGE_MATRIX.md or scripts/ci/openapi_audit_matrix_allowlist.txt.'
}

function Add-GovernancePolicyPackProofFinding {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $markdownPath = Join-Path $ProofDirectory 'governance-policy-pack-dry-run-proof.md'
    $jsonPath = Join-Path $ProofDirectory 'governance-policy-pack-dry-run-proof.json'
    $scriptPath = Join-Path $PSScriptRoot 'ci\report_governance_policy_pack_proof.py'
    & python $scriptPath --markdown-out $markdownPath --json-summary-out $jsonPath 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE

    Add-ProofArtifact -Name 'governance-policy-pack-dry-run-proof.md' -Path 'governance-policy-pack-dry-run-proof.md' -Purpose 'Sample policy-pack governance dry-run proof — architecture-review evidence, not certification.'
    Add-ProofArtifact -Name 'governance-policy-pack-dry-run-proof.json' -Path 'governance-policy-pack-dry-run-proof.json' -Purpose 'Machine-readable governance policy-pack proof disposition.'

    if ($exitCode -eq 0) {
        Add-ProofFinding -Disposition 'PASS' -Name 'governance-policy-pack-dry-run-proof' -Detail 'Governance policy-pack dry-run proof fixture and walkthrough boundaries validated.' -Remediation ''
        return
    }

    Add-ProofFinding -Disposition 'WARN' -Name 'governance-policy-pack-dry-run-proof' -Detail "Governance policy-pack proof fixture check failed with exit code $exitCode." -Remediation 'Repair scripts/ci/fixtures/governance-policy-pack-dry-run-proof.json and accelerator walkthrough non-certification language.'
}

Write-Host "Collecting first-pilot proof @ $normalizedBase"
Write-Host "Output: $proofDir"

$resolvedK6SummaryPath = Resolve-K6SummaryPath -ExplicitPath $K6SummaryPath
$resolvedStagingSmokePath = Resolve-StagingSmokeResultsPath -ExplicitPath $StagingSmokeResultsPath
$resolvedHostedProbePath = Resolve-HostedProbeArtifactsPath -ExplicitPath $HostedProbeArtifactsPath
$performanceEnvironmentLabel = if ($ProductionLikeHostedPilot) { 'production-like-hosted' } else { 'local-or-readiness' }
$performanceEvidenceClass = if ($ProductionLikeHostedPilot) { 'production-like-k6-not-sla' } else { 'ci-smoke-or-attached-not-sla' }
Add-ApiHotPathPerformanceFinding -SummaryPath $resolvedK6SummaryPath -EnvironmentLabel $performanceEnvironmentLabel -EvidenceClass $performanceEvidenceClass
Add-FirstPilotPerformanceBaselineFinding -ProofDirectory $proofDir -TimingsJsonPath $resolvedStagingSmokePath
Add-HostedAvailabilityRollupFinding -ProofDirectory $proofDir -ProbeArtifactsPath $resolvedHostedProbePath
Add-AzureExtractorUploadUxFinding -ProofDirectory $proofDir
Add-IdentityPreflightScenarioFinding -ProofDirectory $proofDir
Add-MutatingRouteAuditMatrixFinding -ProofDirectory $proofDir
Add-GovernancePolicyPackProofFinding -ProofDirectory $proofDir

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
            Add-ProofFinding -Disposition 'BLOCK' -Name 'pilot-preflight-exit' -Detail "archlucid pilot preflight exited $preflightExit." -Remediation 'Fix BLOCK preflight rows before first value.' -TriageCard 'FP-T021'
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
    $script:dataConsistencyStatus = 'NOT_RUN'
    Add-ProofFinding -Disposition 'WARN' -Name 'data-consistency-readiness' -Detail 'Skipped by -SkipDataConsistency.' -Remediation 'Run data consistency readiness before customer handoff.' -TriageCard 'FP-T019'
}
else {
    $dataOut = Join-Path $proofDir 'data-consistency-readiness'
    $dataScript = Join-Path $PSScriptRoot 'collect-data-consistency-readiness.ps1'
    & $dataScript -BaseUrl $normalizedBase -BearerToken $BearerToken -ApiKey $ApiKey -OutputDirectory $dataOut
    $dataExit = $LASTEXITCODE
    $script:dataConsistencyStatus = Resolve-DataConsistencyStatusFromCollector -CollectorExitCode $dataExit -Skipped:$false

    Add-ProofArtifact -Name 'data-consistency-readiness' -Path 'data-consistency-readiness/' -Purpose 'Read-only data consistency readiness summary.'

    if ($script:dataConsistencyStatus -eq 'PASS') {
        Add-ProofFinding -Disposition 'PASS' -Name 'data-consistency-readiness' -Detail 'Data-consistency readiness collector passed.' -Remediation ''
    }
    elseif ($script:dataConsistencyStatus -eq 'WARN') {
        Add-ProofFinding -Disposition 'WARN' -Name 'data-consistency-readiness' -Detail 'Data-consistency readiness completed with warnings; review orphan/diagnostics probes.' -Remediation 'Inspect data-consistency-summary.json and /health/diagnostics before sponsor send.' -TriageCard 'FP-T019'
    }
    else {
        Add-ProofFinding -Disposition 'BLOCK' -Name 'data-consistency-readiness' -Detail "Data-consistency readiness status is $($script:dataConsistencyStatus); collector exited $dataExit." -Remediation 'Inspect data-consistency-readiness output and /health/diagnostics.' -TriageCard 'FP-T019'
    }
}

if ($SkipCommercialHandoff) {
    Add-ProofFinding -Disposition 'WARN' -Name 'commercial-handoff-checks' -Detail 'Skipped by -SkipCommercialHandoff.' -Remediation 'Run commercial handoff checks before sponsor send.'
}
else {
    Add-RetrievalIrEvidenceFinding -ProofDirectory $proofDir
    Add-LiveUiSqlParityFinding -ProofDirectory $proofDir
    Add-DemoWorkspaceValidationFinding -ProofDirectory $proofDir
    Add-ProductionLikeConfigLintFinding -ProofDirectory $proofDir
    Add-RouteTierPolicyNavFinding -ProofDirectory $proofDir
    Add-ProcurementDealReadyFinding -ProofDirectory $proofDir
    Add-TrialToPaidTestModeEvidenceFinding -ProofDirectory $proofDir
    Add-AcceleratorHandoffFinding -ProofDirectory $proofDir
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
        Add-AiQualityProofFinding -EvidenceRoot $evidenceOut

        $llmMode = 'unknown'

        try {
            $latestBundle = Get-LatestEvidenceBundleDirectory -EvidenceRoot $evidenceOut

            if ($null -ne $latestBundle) {
                $observabilityPath = Join-Path $latestBundle.FullName 'pilot-observability-summary.json'

                if (Test-Path -LiteralPath $observabilityPath) {
                    $obsPayload = Get-Content -LiteralPath $observabilityPath -Raw | ConvertFrom-Json -ErrorAction Stop
                    $llmMode = [string]$obsPayload.llmExecutionMode
                }
            }
        }
        catch {
            $llmMode = 'unknown'
        }

        Add-LlmBudgetStatusFinding -ProofDirectory $proofDir -EvidenceRoot $evidenceOut -LlmExecutionMode $llmMode

        if (-not $SkipCommercialHandoff) {
            Add-RoiBasisLabelFinding -EvidenceRoot $evidenceOut
            Add-DemoDerivedRoiCommercialGate
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
$blockingReasons = Get-BlockingReasonsFromFindings -Findings @($findings)
$deferredScopeReasons = Resolve-DeferredScopeReasons `
    -ExplicitRequirements @($DeferredBuyerRequirement) `
    -ProcurementReportText $script:procurementReportText
$sponsorPacketDisposition = Resolve-SponsorPacketDisposition `
    -SponsorHandoff:$SponsorHandoff `
    -BlockCount $blockCount `
    -DeferredScopeReasons $deferredScopeReasons

$triageCardPath = Join-Path $root 'docs/runbooks/FIRST_PILOT_TRIAGE_CARDS.md'
$registeredTriageCards = Get-RegisteredTriageCardIdsFromMarkdown -MarkdownPath $triageCardPath
$usedTriageCards = @($findings | ForEach-Object { [string]$_.triageCard } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
$triageValidation = Test-TriageCardIdsResolve -UsedTriageCardIds $usedTriageCards -RegisteredTriageCardIds $registeredTriageCards

if (-not $triageValidation.valid) {
    throw "Proof pipeline emitted unresolved triage card ids: $($triageValidation.missing -join ', ')"
}

Write-QuoteToProofPacketMarkdown `
    -ProofDirectory $proofDir `
    -SponsorPacketDisposition $sponsorPacketDisposition `
    -RoiBasisStatus $script:roiBasisStatus `
    -RoiSponsorSafe $script:roiSponsorSafe `
    -BlockCount $blockCount `
    -DeferredScopeReasons @($deferredScopeReasons) `
    -Findings @($findings) `
    -RunId $RunId `
    -DataConsistencyStatus $script:dataConsistencyStatus `
    -AiQualityProof $script:aiQualityProof

$summary = [ordered]@{
    formatVersion             = '1.2'
    generatedUtc              = $timestamp
    baseUrl                   = $normalizedBase
    runId                     = if ([string]::IsNullOrWhiteSpace($RunId)) { $null } else { $RunId.Trim() }
    sponsorHandoffMode        = [bool]$SponsorHandoff
    productionLikeHostedPilot = [bool]$ProductionLikeHostedPilot
    verdict                   = $verdict
    sponsorPacketDisposition  = $sponsorPacketDisposition
    blockingReasons           = $blockingReasons
    deferredScopeReasons      = $deferredScopeReasons
    dataConsistencyStatus     = $script:dataConsistencyStatus
    roiBasisStatus            = $script:roiBasisStatus
    roiSponsorSafe            = $script:roiSponsorSafe
    aiQualityProof            = $script:aiQualityProof
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
$lines.Add("| Data consistency status | **$($script:dataConsistencyStatus)** |")
$lines.Add("| ROI basis status | **$($script:roiBasisStatus)** |")
$lines.Add("| ROI sponsor-safe | **$($script:roiSponsorSafe)** |")
$lines.Add("| Blocking findings | $blockCount |")
$lines.Add("| Warnings | $warnCount |")
$lines.Add('')

foreach ($aiLine in (Format-AiQualityProofMarkdownSection -AiQualityProof $script:aiQualityProof)) {
    $lines.Add($aiLine)
}

$dataConsistencySummaryPath = Join-Path $proofDir 'data-consistency-readiness/data-consistency-summary.json'

if (Test-Path -LiteralPath $dataConsistencySummaryPath) {
    try {
        $dataSummary = Get-Content -LiteralPath $dataConsistencySummaryPath -Raw | ConvertFrom-Json -ErrorAction Stop
        $holdProbes = @($dataSummary.probes | Where-Object { [string]$_.status -eq 'HOLD' -or [string]$_.status -eq 'WARN' })

        if ($holdProbes.Count -gt 0) {
            $lines.Add('')
            $lines.Add('## Data consistency actions')
            $lines.Add('')

            foreach ($probe in $holdProbes) {
                $stopLabel = if ($probe.sponsorHandoffMustStop -eq $true) { 'STOP sponsor handoff' } else { 'Review before send' }
                $lines.Add("- **$($probe.probe)** ($($probe.status)) — $($probe.riskMeaning) Remediation: $($probe.remediation) ($stopLabel)")
            }
        }
    }
    catch {
        $lines.Add('')
        $lines.Add("## Data consistency actions")
        $lines.Add('')
        $lines.Add("- Could not parse data-consistency-summary.json: $($_.Exception.Message)")
    }
}

$lines.Add('')
$lines.Add('## Sponsor Handoff Disposition')
$lines.Add('')
$lines.Add("| Field | Value |")
$lines.Add("| --- | --- |")
$lines.Add("| Disposition | **$sponsorPacketDisposition** |")
$lines.Add("| Sponsor handoff mode | $([bool]$SponsorHandoff) |")
$lines.Add("| Blocking reasons | $($blockingReasons.Count) |")
$lines.Add("| Deferred scope reasons | $($deferredScopeReasons.Count) |")

if ($blockingReasons.Count -gt 0) {
    $lines.Add('')
    $lines.Add('### Blocking reasons')
    $lines.Add('')

    foreach ($reason in $blockingReasons) {
        $triageSuffix = if ([string]::IsNullOrWhiteSpace([string]$reason.triageCard)) { '' } else { " ($($reason.triageCard))" }
        $lines.Add("- **$($reason.name)**$triageSuffix — $($reason.detail)")
    }
}

if ($deferredScopeReasons.Count -gt 0) {
    $lines.Add('')
    $lines.Add('### Deferred buyer requirements (V1.1/V2/(B) — not V1 blockers)')
    $lines.Add('')

    foreach ($reason in $deferredScopeReasons) {
        $lines.Add("- $reason")
    }
}

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
$lines.Add('## Workflow handoff (optional)')
$lines.Add('')
$lines.Add('Attach proof artifacts to GitHub or Azure DevOps using [`docs/runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md`](../../docs/runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md). Minimum attach: `go-no-go-summary.md`, `first-pilot-evidence/first-value-report.md`, `pilot-observability-summary.md`, `first-pilot-evidence/artifact-manifest.json`.')
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
