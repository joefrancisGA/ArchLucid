#requires -Version 5.1
Set-StrictMode -Version Latest

function Get-FirstPilotRemediationDocLink {
    param([Parameter(Mandatory = $true)][string] $FindingName)

    $links = @{
        'committed-run-evidence'              = 'docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md#phase-c--review-lifecycle'
        'pilot-preflight'                     = 'docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md#phase-a--platform-ready'
        'pilot-preflight-exit'                = 'docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md#phase-a--platform-ready'
        'pilot-preflight-json'                = 'docs/library/CLI_USAGE.md'
        'data-consistency-readiness'          = 'docs/runbooks/DATA_CONSISTENCY_READINESS.md'
        'real-llm-sponsor-evidence'           = 'docs/library/AGENT_OUTPUT_EVALUATION.md'
        'ai-quality-proof'                    = 'docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md#ai-quality-proof'
        'ai-readiness-gate'                   = 'docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md#consolidated-ai-readiness-gate'
        'roi-basis-labels'                    = 'docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md#minimum-viable-roi-baseline-before-sponsor-readout'
        'procurement-deal-ready'              = 'docs/runbooks/PROCUREMENT_DEAL_READY.md'
        'route-tier-policy-nav-parity'        = 'docs/library/ROUTE_TIER_POLICY_NAV_DRIFT_GATE.md'
        'production-like-config-lint'         = 'docs/library/CONFIGURATION_REFERENCE.md'
        'demo-workspace-validation'           = 'docs/go-to-market/DEMO_WORKSPACES.md'
        'telemetry-export-readiness'          = 'docs/runbooks/OBSERVABILITY_EXPORT_READINESS.md'
        'retrieval-ir-evidence'               = 'docs/quality/retrieval-ir-report.md'
        'environment-reliability-rollup'      = 'docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md'
        'committed-review-trace-chain-summary' = 'docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md'
        'scale-envelope-evidence'             = 'docs/library/PERFORMANCE.md'
        'first-pilot-timing-budget'           = 'docs/runbooks/FIRST_CREDIBLE_REVIEW_ONE_SITTING.md'
        'compliance-posture-clarity'          = 'docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md'
        'v1-integration-correctness-drill'    = 'docs/runbooks/V1_INTEGRATION_CORRECTNESS_DRILL.md'
        'mutating-route-audit-matrix'         = 'docs/library/AUDIT_MATRIX.md'
    }

    if ($links.ContainsKey($FindingName)) {
        return [string]$links[$FindingName]
    }

    return 'docs/runbooks/FIRST_PILOT_TRIAGE_CARDS.md'
}

function Get-FirstPilotRemediationInAppLink {
    param(
        [Parameter(Mandatory = $true)][string] $FindingName,
        [string] $RunId = ''
    )

    $runIdTrimmed = $RunId.Trim()
    $reviewHref = if ([string]::IsNullOrWhiteSpace($runIdTrimmed)) { '/reviews' } else { "/reviews/$runIdTrimmed" }

    if ($FindingName -like 'pilot-preflight*') {
        return '/health'
    }

    switch ($FindingName) {
        'data-consistency-readiness' { return '/health' }
        'environment-reliability-rollup' { return '/health' }
        'telemetry-export-readiness' { return '/health' }
        'committed-run-evidence' { return $reviewHref }
        'real-llm-sponsor-evidence' { return $reviewHref }
        'ai-quality-proof' { return $reviewHref }
        'ai-readiness-gate' { return $reviewHref }
        'committed-review-trace-chain-summary' { return $reviewHref }
        'roi-basis-labels' { return '/scorecard#roi-baselines' }
        'demo-workspace-validation' { return '/see-it' }
        default { return '' }
    }
}

function Get-FirstPilotSupportNextStepForFinding {
    param(
        [Parameter(Mandatory = $true)][string] $Name,
        [string] $RunId = '',
        [string] $CorrelationId = ''
    )

    $runSuffix = if ([string]::IsNullOrWhiteSpace($RunId)) { '' } else { " -RunId $($RunId.Trim())" }

    $steps = @{
        'pilot-preflight'                       = 'dotnet run --project ArchLucid.Cli -- --json pilot preflight; attach preflight.json to the ticket.'
        'pilot-preflight-exit'                  = 'dotnet run --project ArchLucid.Cli -- --json pilot preflight; attach preflight-output.txt.'
        'data-consistency-readiness'            = '.\scripts\collect-data-consistency-readiness.ps1; attach data-consistency-readiness/ folder.'
        'committed-run-evidence'                = ".\scripts\collect-first-pilot-evidence.ps1$runSuffix; attach first-pilot-evidence/ artifact manifest."
        'real-llm-sponsor-evidence'             = 'Re-run evidence collection; attach pilot-observability-summary.json (no prompt text).'
        'ai-readiness-gate'                     = 'Attach ai-readiness-gate.md and pilot-observability-summary.json from the proof folder.'
        'ai-quality-proof'                      = 'Attach pilot-observability-summary.json; resolve PilotStrict quality signals on review detail.'
        'roi-basis-labels'                      = 'Capture ROI baselines on /scorecard#roi-baselines or regenerate first-value-report.md; attach go-no-go-summary.json.'
        'procurement-deal-ready'                = 'python scripts/build_procurement_pack.py --dry-run --deal-ready; attach procurement-deal-ready-classification.md.'
        'route-tier-policy-nav-parity'          = 'python scripts/ci/assert_route_tier_policy_nav.py --sync; attach route-tier-policy-nav-parity.md.'
        'production-like-config-lint'           = 'dotnet run --project ArchLucid.Cli -- config lint --profile production-like-hosted-pilot; attach config lint JSON.'
        'telemetry-export-readiness'            = 'python scripts/ci/report_observability_export_readiness.py; attach observability-export-readiness.md.'
        'demo-workspace-validation'             = '.\scripts\verify-demo-workspace.ps1; attach demo-workspace-validation.txt.'
        'mutating-route-audit-matrix'           = 'python scripts/ci/check_audit_matrix.py; attach mutating-route-audit-matrix.md.'
        'environment-reliability-rollup'        = 'Open environment-reliability-rollup.md; resolve HOLD rows before sponsor handoff.'
        'committed-review-trace-chain-summary'  = 'Verify manifest and audit rows in first-value-report.md after committed-run evidence collection.'
        'scale-envelope-evidence'               = 'Run ./scripts/staging-smoke.ps1 and rerun proof with -StagingSmokeResultsPath.'
        'first-pilot-timing-budget'             = 'Follow docs/runbooks/FIRST_CREDIBLE_REVIEW_ONE_SITTING.md; attach staging-smoke timings when available.'
        'compliance-posture-clarity'            = 'python scripts/ci/check_compliance_posture_clarity.py; fix prohibited certification phrasing in docs.'
        'v1-integration-correctness-drill'      = '.\scripts\v1-integration-correctness-drill.ps1 against staging API; attach drill markdown.'
        'retrieval-ir-evidence'                 = 'python scripts/ci/eval_retrieval_ir.py; attach retrieval-ir-report.md.'
    }

    if ($steps.ContainsKey($Name)) {
        return [string]$steps[$Name]
    }

    if ($Name -like 'pilot-preflight*') {
        return [string]$steps['pilot-preflight']
    }

    $generic = 'dotnet run --project ArchLucid.Cli -- support-bundle --zip; attach README.txt and manifest.json (review before external share).'

    if (-not [string]::IsNullOrWhiteSpace($CorrelationId)) {
        return "$generic Include correlationId $CorrelationId in the ticket."
    }

    return $generic
}

function Add-SupportNextStepToFindingRow {
    param(
        [Parameter(Mandatory = $true)][hashtable] $Finding,
        [string] $RunId = ''
    )

    $name = [string]$Finding['name']
    $Finding['supportNextStep'] = Get-FirstPilotSupportNextStepForFinding -Name $name -RunId $RunId
    $Finding['remediationDocLink'] = Get-FirstPilotRemediationDocLink -FindingName $name
    $Finding['remediationInAppLink'] = Get-FirstPilotRemediationInAppLink -FindingName $name -RunId $RunId
    return $Finding
}
