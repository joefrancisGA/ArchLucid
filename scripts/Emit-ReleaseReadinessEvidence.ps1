#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Emit unified production readiness evidence (observability, preflight, terraform drift, config lint).

.DESCRIPTION
  Offline repo-local bundle for Batch 4 improvement #14. Does not print secrets.
  Optional live API checks when -ApiBaseUrl is supplied.

.PARAMETER Environment
  Appsettings layer for observability report (Production default; also emits Staging when set to Production).

.PARAMETER OutDir
  Output directory (default: artifacts/release-readiness).

.PARAMETER ApiBaseUrl
  Optional live API base URL for deployment-evidence and doctor subprocess checks.

.PARAMETER RepresentativeRunId
  Optional representative completed first-review run id for live pilot readiness-bundle evidence.
  Falls back to ARCHLUCID_REPRESENTATIVE_RUN_ID when unset.
#>
[CmdletBinding()]
param(
    [string] $Environment = "Production",
    [string] $OutDir = "artifacts/release-readiness",
    [string] $ApiBaseUrl = "",
    [string] $RepresentativeRunId = "",
    [switch] $StrictRc
)

$ErrorActionPreference = "Stop"
[string] $root = Split-Path -Parent $PSScriptRoot
Set-Location $root

[bool] $strictRcEffective = $StrictRc.IsPresent `
    -or $env:ARCHLUCID_STRICT_RC -eq '1' `
    -or $env:ARCHLUCID_RC_RELEASE_CONTEXT -eq '1'

if ($strictRcEffective) {
    Write-Host "Strict RC mode: ON (fail-closed on missing/stale strict signoff artifacts)."
}

if ([string]::IsNullOrWhiteSpace($RepresentativeRunId)) {
    $RepresentativeRunId = $env:ARCHLUCID_REPRESENTATIVE_RUN_ID
}

function Test-StrictRcEffective {
    return $strictRcEffective
}

function Invoke-PythonReport {
    param(
        [string] $EnvName,
        [string] $OutFile,
        [switch] $Strict,
        [switch] $HonorRequireTelemetryExport
    )

    [string[]] $reportArgs = @(
        "scripts/report_observability_export_readiness.py",
        "--environment", $EnvName,
        "--out", $OutFile
    )

    if ($Strict) {
        $reportArgs += "--strict-exit-code"
    }

    if ($HonorRequireTelemetryExport) {
        $reportArgs += "--honor-require-telemetry-export-config"
    }

    & python @reportArgs
    return $LASTEXITCODE
}

function Map-ExitToVerdict {
    param([int]$ExitCode, [string]$SkippedReason = "")

    if ($ExitCode -eq 999) {
        return [ordered]@{ verdict = "SKIPPED"; detail = $SkippedReason }
    }

    if ($ExitCode -ne 0) {
        return [ordered]@{ verdict = "FAIL"; detail = "exit code $ExitCode" }
    }

    return [ordered]@{ verdict = "PASS"; detail = "exit code 0" }
}

function Add-CheckRow {
    param(
        [System.Collections.Generic.List[object]] $Rows,
        [string] $Name,
        [string] $Verdict,
        [string] $Detail,
        [string] $Artifact,
        [string] $Owner = "repo-local"
    )

    $Rows.Add([ordered]@{
            name = $Name
            verdict = $Verdict
            detail = $Detail
            artifact = $Artifact
            owner = $Owner
        }) | Out-Null
}

function Get-GitCommitSha {
    try {
        [string] $sha = (& git rev-parse HEAD 2>$null)

        if ([string]::IsNullOrWhiteSpace($sha)) {
            return "unknown"
        }

        return $sha.Trim()
    }
    catch {
        return "unknown"
    }
}

function Get-ArchLucidCliVersion {
    [string] $csproj = Join-Path $root "ArchLucid.Cli/ArchLucid.Cli.csproj"

    if (-not (Test-Path -LiteralPath $csproj)) {
        return "unknown"
    }

    [string] $text = Get-Content -LiteralPath $csproj -Raw
    [regex] $versionRegex = [regex]::new("<Version>([^<]+)</Version>")
    [System.Text.RegularExpressions.Match] $match = $versionRegex.Match($text)

    if (-not $match.Success) {
        return "unknown"
    }

    return $match.Groups[1].Value.Trim()
}

function Invoke-LiveJsonProbe {
    param(
        [string] $BaseUrl,
        [string] $RelativePath,
        [string] $OutFile
    )

    if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
        [ordered]@{ status = "SKIPPED"; reason = "pass -ApiBaseUrl to probe live endpoint"; relativePath = $RelativePath } |
            ConvertTo-Json -Depth 4 |
            Set-Content -LiteralPath $OutFile -Encoding utf8

        return [ordered]@{ exitCode = 999; detail = "pass -ApiBaseUrl to probe live endpoint" }
    }

    try {
        [string] $base = $BaseUrl.TrimEnd("/")
        [string] $url = "$base$RelativePath"
        Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15 | Select-Object -ExpandProperty Content |
            Set-Content -LiteralPath $OutFile -Encoding utf8

        return [ordered]@{ exitCode = 0; detail = "GET $RelativePath succeeded" }
    }
    catch {
        [string] $message = $_.Exception.Message
        [ordered]@{ error = $message; relativePath = $RelativePath } |
            ConvertTo-Json -Depth 4 |
            Set-Content -LiteralPath $OutFile -Encoding utf8

        return [ordered]@{ exitCode = 1; detail = "GET $RelativePath failed; see artifact" }
    }
}

function Get-RealModeAiEvidenceVerdict {
    param([string] $EvidencePath)

    if (-not (Test-Path -LiteralPath $EvidencePath)) {
        return [ordered]@{
            verdict = "SKIPPED"
            detail = "No real-llm-evidence-gate.json attached; release claims stay simulator-only unless an approved override is present."
        }
    }

    try {
        [object] $evidence = Get-Content -LiteralPath $EvidencePath -Raw | ConvertFrom-Json
        [datetime] $generatedUtc = [datetime]::Parse([string]$evidence.generatedUtc).ToUniversalTime()
        [double] $ageDays = ([DateTime]::UtcNow - $generatedUtc).TotalDays
        [string] $outcome = ([string]$evidence.overallOutcome).ToUpperInvariant()
        [string] $executionMode = ([string]$evidence.executionMode).ToLowerInvariant()

        if ($ageDays -gt 30) {
            return [ordered]@{
                verdict = "WARN"
                detail = "Real-mode AI evidence artifact is stale; re-run Invoke-RealLlmEvidenceGate.ps1 before claiming current real-mode status."
            }
        }

        if ($outcome -eq "PASS" -and $executionMode -eq "real") {
            return [ordered]@{
                verdict = "PASS"
                detail = "Current full real-mode AI evidence artifact attached."
            }
        }

        if ($outcome -eq "WARN") {
            return [ordered]@{
                verdict = "WARN"
                detail = "Partial or marginal real-mode AI evidence attached; use partial-real wording."
            }
        }

        return [ordered]@{
            verdict = "WARN"
            detail = "Real-mode AI quality gate is HOLD or not full real mode; release claims stay limited."
        }
    }
    catch {
        return [ordered]@{
            verdict = "FAIL"
            detail = "real-llm-evidence-gate.json is present but unreadable: $($_.Exception.Message)"
        }
    }
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Import-ReleaseSmokeParityArtifactIfPresent {
    param(
        [string] $OutputDirectory,
        [string] $RepositoryRoot
    )

    [string] $bundleParityPath = Join-Path $OutputDirectory "release-smoke-live-ui-sql-result.json"

    if (Test-Path -LiteralPath $bundleParityPath) {
        return
    }

    [string[]] $candidates = @(
        (Join-Path $RepositoryRoot "artifacts/release-smoke-live-ui-sql-result.json"),
        (Join-Path $RepositoryRoot "artifacts/release-smoke/result.json"),
        (Join-Path $RepositoryRoot "artifacts/release-smoke/release-smoke-live-ui-sql-result.json")
    )

    foreach ($candidate in $candidates) {
        if (-not (Test-Path -LiteralPath $candidate)) {
            continue
        }

        Copy-Item -LiteralPath $candidate -Destination $bundleParityPath -Force
        Write-Host "Staged live UI-SQL parity artifact into bundle: $bundleParityPath (from $candidate)"
        return
    }
}

Import-ReleaseSmokeParityArtifactIfPresent -OutputDirectory $OutDir -RepositoryRoot $root

[System.Collections.Generic.List[object]] $checks = [System.Collections.Generic.List[object]]::new()

[string] $gitCommitSha = Get-GitCommitSha
[string] $cliVersion = Get-ArchLucidCliVersion

[int] $prodExit = Invoke-PythonReport -EnvName $Environment -OutFile (Join-Path $OutDir "observability-export-readiness-$Environment.md")
[int] $stagingExit = Invoke-PythonReport -EnvName "Staging" -OutFile (Join-Path $OutDir "observability-export-readiness-Staging.md")

[int] $strictExit = Invoke-PythonReport `
    -EnvName $Environment `
    -OutFile (Join-Path $OutDir "observability-export-readiness-$Environment-strict.md") `
    -Strict `
    -HonorRequireTelemetryExport

Add-CheckRow $checks "Observability export ($Environment)" (Map-ExitToVerdict $prodExit).verdict (Map-ExitToVerdict $prodExit).detail "observability-export-readiness-$Environment.md"
Add-CheckRow $checks "Observability export (Staging)" (Map-ExitToVerdict $stagingExit).verdict (Map-ExitToVerdict $stagingExit).detail "observability-export-readiness-Staging.md"
Add-CheckRow $checks "Observability strict + RequireTelemetryExport" (Map-ExitToVerdict $strictExit).verdict (Map-ExitToVerdict $strictExit).detail "observability-export-readiness-$Environment-strict.md"

[string] $healthReadyPath = Join-Path $OutDir "health-ready.json"
[object] $healthProbe = Invoke-LiveJsonProbe -BaseUrl $ApiBaseUrl -RelativePath "/health/ready" -OutFile $healthReadyPath
Add-CheckRow $checks "Health readiness (live API)" (Map-ExitToVerdict $healthProbe.exitCode "pass -ApiBaseUrl for /health/ready").verdict $healthProbe.detail "health-ready.json" "operator"

[string] $versionPath = Join-Path $OutDir "version.json"
[object] $versionProbe = Invoke-LiveJsonProbe -BaseUrl $ApiBaseUrl -RelativePath "/version" -OutFile $versionPath
Add-CheckRow $checks "Version endpoint (live API)" (Map-ExitToVerdict $versionProbe.exitCode "pass -ApiBaseUrl for /version").verdict $versionProbe.detail "version.json" "operator"

[string] $preflightPath = Join-Path $OutDir "production-profile-preflight.md"
& pwsh -NoProfile -File (Join-Path $root "scripts/Emit-ProductionProfilePreflightMarkdown.ps1") -MarkdownOut $preflightPath
[int] $preflightExit = $LASTEXITCODE
Add-CheckRow $checks "Production profile preflight" (Map-ExitToVerdict $preflightExit).verdict (Map-ExitToVerdict $preflightExit).detail "production-profile-preflight.md"

[string] $tfJson = Join-Path $OutDir "terraform-drift-preflight.json"
[string] $tfMd = Join-Path $OutDir "terraform-drift-preflight.md"
& pwsh -NoProfile -File (Join-Path $root "scripts/Assert-TerraformDeploymentDriftPreflight.ps1") -JsonOut $tfJson -MarkdownOut $tfMd
[int] $tfExit = $LASTEXITCODE
[string] $tfVerdict = if ($tfExit -ge 2) { "FAIL" } elseif ($tfExit -eq 1) { "WARN" } else { "PASS" }
Add-CheckRow $checks "Terraform/CD drift preflight" $tfVerdict "exit code $tfExit" "terraform-drift-preflight.json"

[string] $validateConfigPath = Join-Path $OutDir "validate-config.json"
Push-Location $root
try {
    & dotnet run --project ArchLucid.Cli --no-build -- --json validate-config 2>$null | Set-Content -LiteralPath $validateConfigPath -Encoding utf8
    [int] $validateExit = $LASTEXITCODE

    if ($validateExit -ne 0 -and !(Test-Path -LiteralPath $validateConfigPath)) {
        '{"ok":false,"note":"validate-config did not emit JSON — run dotnet build ArchLucid.Cli first"}' | Set-Content -LiteralPath $validateConfigPath -Encoding utf8
    }
}
catch {
    [int] $validateExit = 1
    '{"ok":false,"note":"validate-config subprocess failed"}' | Set-Content -LiteralPath $validateConfigPath -Encoding utf8
}
finally {
    Pop-Location
}

Add-CheckRow $checks "validate-config (repo host JSON)" (Map-ExitToVerdict $validateExit).verdict (Map-ExitToVerdict $validateExit).detail "validate-config.json"

& pwsh -NoProfile -File (Join-Path $root "scripts/ci/Invoke-ConfigLintProofStep.ps1") -OutputDir $OutDir -SkipBuild
[int] $configLintExit = $LASTEXITCODE
[string] $configLintVerdict = if ($configLintExit -eq 0) { "PASS" } else { "FAIL" }
[string] $configLintDetail = if ($configLintExit -eq 0) { "production-like-hosted-pilot; RC baseline fixture; advisory findings non-blocking" } else { "blocking findings; exit $configLintExit" }
Add-CheckRow $checks "Production-like config lint (RC baseline)" $configLintVerdict $configLintDetail "config-lint-production-like-hosted-pilot.json"

& pwsh -NoProfile -File (Join-Path $root "scripts/ci/Invoke-ClaimEvidenceConsistencyGate.ps1") -OutputDir $OutDir
[int] $claimEvidenceExit = $LASTEXITCODE
[string] $claimEvidenceVerdict = if ($claimEvidenceExit -eq 0) { "PASS" } else { "FAIL" }
[string] $claimEvidenceDetail = if ($claimEvidenceExit -eq 0) { "trust/pricing/procurement claims match evidence markers and deferred labels" } else { "unsupported or stale buyer-facing claims; exit $claimEvidenceExit" }
Add-CheckRow $checks "Claim/evidence consistency (T2-8)" $claimEvidenceVerdict $claimEvidenceDetail "claim-evidence-consistency.json"

[string] $rollbackNote = Join-Path $OutDir "rollback-readiness-note.md"
@"
# Rollback readiness (operator-owned)

This bundle does not execute rollbacks. Before production promotion, confirm:

- ``docs/runbooks/MIGRATION_ROLLBACK.md`` matches the deployed schema version
- A recent DbUp/migration verify succeeded in the target environment
- Container App revision rollback steps are documented for the release owner

Generated as part of the unified release-readiness evidence bundle.
"@ | Set-Content -LiteralPath $rollbackNote -Encoding utf8

Add-CheckRow $checks "Rollback runbook reference" "WARN" "operator must confirm rollback steps before prod" "rollback-readiness-note.md" "operator"

[string] $dbMigrationNote = Join-Path $OutDir "db-migration-status-note.md"
@"
# Database migration status

This repo-local bundle does not connect to SQL or run DbUp. Attach the target-environment migration verification output here before production promotion.

Expected operator evidence:

- DbUp / migration verify result for the target database
- Schema version or migration list when available
- Rollback note cross-check against ``docs/runbooks/MIGRATION_ROLLBACK.md``
"@ | Set-Content -LiteralPath $dbMigrationNote -Encoding utf8

Add-CheckRow $checks "DB migration status" "SKIPPED" "attach target-environment DbUp/migration verification output when available" "db-migration-status-note.md" "operator"

[string] $k6SmokeNote = Join-Path $OutDir "k6-smoke-status-note.md"
@"
# k6 smoke status

This bundle does not run k6 automatically. Attach the k6 production-like smoke output when a reachable staging or production-like API is available.

Expected operator evidence:

- Scenario name and target base URL class (staging / production-like)
- Pass/fail result and thresholds
- Link to CI run or local output, with customer identifiers redacted
"@ | Set-Content -LiteralPath $k6SmokeNote -Encoding utf8

Add-CheckRow $checks "k6 smoke status" "SKIPPED" "attach k6 production-like smoke output when available" "k6-smoke-status-note.md" "operator"

[string] $hostedRollupSource = Join-Path $root "docs/operations/HOSTED_AVAILABILITY_ROLLUP.md"
[string] $hostedRollupDest = Join-Path $OutDir "hosted-availability-rollup.md"

if (Test-Path -LiteralPath $hostedRollupSource) {
    Copy-Item -LiteralPath $hostedRollupSource -Destination $hostedRollupDest -Force
    Add-CheckRow $checks "Hosted availability rollup (doc)" "PASS" "copied from docs/operations/HOSTED_AVAILABILITY_ROLLUP.md" "hosted-availability-rollup.md" "operator"
}
else {
    Add-CheckRow $checks "Hosted availability rollup (doc)" "SKIPPED" "HOSTED_AVAILABILITY_ROLLUP.md not present in repo" "(none)" "operator"
}

[string] $realLlmReqPath = Join-Path $OutDir "real-llm-release-requirement.md"
& pwsh -NoProfile -File (Join-Path $root "scripts/Invoke-ReleaseRealLlmEvidenceRequirement.ps1") -MarkdownOut $realLlmReqPath
[int] $realLlmReqExit = $LASTEXITCODE
[string] $realLlmReqVerdict = if ($realLlmReqExit -eq 0) { "PASS" } else { "FAIL" }
Add-CheckRow $checks "Real-mode release requirement (opt-in env)" $realLlmReqVerdict "exit $realLlmReqExit when ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE=1" "real-llm-release-requirement.md"

[string] $realLlmEvidencePath = Join-Path $OutDir "real-llm-evidence-gate.json"
[object] $realLlmEvidence = Get-RealModeAiEvidenceVerdict -EvidencePath $realLlmEvidencePath
Add-CheckRow $checks "Real-mode AI evidence artifact (claim boundary)" $realLlmEvidence.verdict $realLlmEvidence.detail "real-llm-evidence-gate.json"

[string] $retrievalIrSource = Join-Path $root "docs/quality/retrieval-ir-report.md"
[string] $retrievalIrDest = Join-Path $OutDir "retrieval-ir-report.md"

if (Test-Path -LiteralPath $retrievalIrSource) {
    Copy-Item -LiteralPath $retrievalIrSource -Destination $retrievalIrDest -Force
    Add-CheckRow $checks "Retrieval IR evidence (offline)" "PASS" "golden-fixture recall@5/MRR report attached" "retrieval-ir-report.md"

    [string] $retrievalIrSummarySource = Join-Path $root "docs/quality/retrieval-ir-summary.json"

    if (Test-Path -LiteralPath $retrievalIrSummarySource) {
        Copy-Item -LiteralPath $retrievalIrSummarySource -Destination (Join-Path $OutDir "retrieval-ir-summary.json") -Force
    }
}
else {
    Add-CheckRow $checks "Retrieval IR evidence (offline)" "WARN" "run: python scripts/ci/eval_retrieval_ir.py --enforce" "(none)"
}

[string] $faithfulnessSource = Join-Path $root "docs/quality/faithfulness-report.md"

if (Test-Path -LiteralPath $faithfulnessSource) {
    Copy-Item -LiteralPath $faithfulnessSource -Destination (Join-Path $OutDir "faithfulness-report.md") -Force
}

[string] $materialFindingJson = Join-Path $OutDir "material-finding-faithfulness-summary.json"
[string] $materialFindingMd = Join-Path $OutDir "material-finding-faithfulness-summary.md"
& python (Join-Path $root "scripts/ci/build_material_finding_faithfulness_summary.py") `
    --json-out $materialFindingJson `
    --markdown-out $materialFindingMd
[int] $materialFindingExit = $LASTEXITCODE
[string] $materialFindingVerdict = if ($materialFindingExit -eq 0) { "PASS" } else { "FAIL" }
Add-CheckRow $checks "Material finding faithfulness (offline corpus)" $materialFindingVerdict "citation/evidence coverage on representative scenarios; exit $materialFindingExit" "material-finding-faithfulness-summary.json"

[string] $aiQualityJsonPath = Join-Path $OutDir "ai-quality-release-summary.json"
[string] $aiQualityMarkdownPath = Join-Path $OutDir "ai-quality-release-summary.md"
& python (Join-Path $root "scripts/ci/build_ai_quality_release_summary.py") `
    --bundle-dir $OutDir `
    --json-out $aiQualityJsonPath `
    --markdown-out $aiQualityMarkdownPath
[int] $aiQualityExit = $LASTEXITCODE
[string] $aiQualityVerdict = if ($aiQualityExit -eq 0) { "PASS" } else { "FAIL" }
[string] $aiQualityDetail = if ($aiQualityExit -eq 0) { "offline retrieval/faithfulness and optional committed-run/live evidence summarized" } else { "AI quality summary builder failed; exit $aiQualityExit" }
Add-CheckRow $checks "AI quality release summary" $aiQualityVerdict $aiQualityDetail "ai-quality-release-summary.json"

[string] $simDivJson = Join-Path $OutDir "simulator-live-divergence.json"
[string] $simDivMd = Join-Path $OutDir "simulator-live-divergence.md"
[string[]] $simDivArgs = @(
    (Join-Path $root "scripts/ci/build_simulator_live_divergence_from_bundle.py"),
    "--bundle-dir", $OutDir,
    "--json-out", $simDivJson,
    "--markdown-out", $simDivMd
)

if (Test-StrictRcEffective) {
    $simDivArgs += "--enforce-buyer-facing"
}

& python @simDivArgs
[int] $simDivExit = $LASTEXITCODE
[string] $simDivVerdict = if ($simDivExit -eq 0) { "PASS" } else { "FAIL" }
Add-CheckRow $checks "Simulator/live divergence (RC boundary)" $simDivVerdict "bundle-derived classification; exit $simDivExit" "simulator-live-divergence.json"

[string] $archInvJson = Join-Path $OutDir "architecture-invariant-rc-summary.json"
[string] $archInvMd = Join-Path $OutDir "architecture-invariant-rc-summary.md"
[string[]] $archInvArgs = @(
    (Join-Path $root "scripts/ci/report_architecture_invariant_enforcement.py"),
    "--json-out", $archInvJson,
    "--markdown-out", $archInvMd
)

if (Test-StrictRcEffective) {
    $archInvArgs += "--strict-rc"
}

& python @archInvArgs
[int] $archInvExit = $LASTEXITCODE
[string] $archInvVerdict = if ($archInvExit -eq 0) { "PASS" } elseif ($archInvExit -eq 1) { "FAIL" } else { "WARN" }
Add-CheckRow $checks "Architecture invariant RC summary" $archInvVerdict "P0/P1 attention items; exit $archInvExit" "architecture-invariant-rc-summary.json"

[string] $dataConsistencyJson = Join-Path $OutDir "data-consistency-readiness.json"
[string] $dataConsistencyMd = Join-Path $OutDir "data-consistency-readiness.md"
& python (Join-Path $root "scripts/ci/report_data_consistency_mode_readiness.py") `
    --json-out $dataConsistencyJson `
    --markdown-out $dataConsistencyMd
Add-CheckRow $checks "Data consistency readiness" (Map-ExitToVerdict $LASTEXITCODE).verdict "production appsettings posture" "data-consistency-readiness.json"

[string] $realModeFreshJson = Join-Path $OutDir "real-mode-evidence-freshness.json"
[string] $realModeFreshMd = Join-Path $OutDir "real-mode-evidence-freshness.md"
[string[]] $realModeFreshArgs = @(
    (Join-Path $root "scripts/ci/report_real_mode_evidence_freshness.py"),
    "--bundle-dir", $OutDir,
    "--json-out", $realModeFreshJson,
    "--markdown-out", $realModeFreshMd,
    "--gate-json", (Join-Path $OutDir "real-llm-evidence-gate.json")
)

if ($env:ARCHLUCID_RELEASE_SIMULATOR_ONLY -eq '1') {
    $realModeFreshArgs += "--allow-simulator-only"
}

if (Test-StrictRcEffective) {
    $realModeFreshArgs += "--strict"
}

& python @realModeFreshArgs
Add-CheckRow $checks "Real-mode evidence freshness" (Map-ExitToVerdict $LASTEXITCODE).verdict "claim boundary freshness lane" "real-mode-evidence-freshness.json"

[int] $deploymentEvidenceExit = 999

if (-not [string]::IsNullOrWhiteSpace($ApiBaseUrl)) {
    [string] $depEvidencePath = Join-Path $OutDir "deployment-evidence.md"
    & dotnet run --project ArchLucid.Cli --no-build -- deployment-evidence --api-base-url $ApiBaseUrl --out $depEvidencePath 2>$null
    $deploymentEvidenceExit = $LASTEXITCODE
    Add-CheckRow $checks "deployment-evidence (live API)" (Map-ExitToVerdict $deploymentEvidenceExit).verdict (Map-ExitToVerdict $deploymentEvidenceExit).detail "deployment-evidence.md" "operator"
}
else {
    Add-CheckRow $checks "deployment-evidence (live API)" "SKIPPED" "pass -ApiBaseUrl for staging/production URL" "(none)" "operator"
}

[string] $redactionPath = Join-Path $OutDir "redaction-note.md"
@"
# Redaction note

This bundle is repo-local and secret-safe by design:

- No connection strings, API keys, bearer tokens, or Key Vault secret values
- Observability and config reports reference **key names** and PASS/WARN/FAIL only
- ``validate-config.json`` includes category/check names — not secret values
- Review ``deployment-evidence.md`` before external sharing when ``-ApiBaseUrl`` was used

Do not attach live tfvars, customer cover letters, or procurement NDA material to this folder.
"@ | Set-Content -LiteralPath $redactionPath -Encoding utf8

function Write-ReleaseReadinessIndexArtifacts {
    param(
        [System.Collections.Generic.List[object]] $CheckRows,
        [string] $GeneratedUtc,
        [string] $OutputDirectory
    )

    [int] $localFailCount = @($CheckRows | Where-Object { $_.verdict -eq "FAIL" }).Count
    [int] $localWarnCount = @($CheckRows | Where-Object { $_.verdict -eq "WARN" }).Count
    [string] $localRollup = if ($localFailCount -gt 0) { "FAIL" } elseif ($localWarnCount -gt 0) { "WARN" } else { "PASS" }

    $indexDoc = [ordered]@{
        schema = "archlucid.release-readiness-index.v1"
        generatedUtc = $GeneratedUtc
        environment = $Environment
        gitCommitSha = $gitCommitSha
        archLucidCliVersion = $cliVersion
        rollup = $localRollup
        failCount = $localFailCount
        warnCount = $localWarnCount
        checks = @($CheckRows)
    }

    [string] $indexJsonPath = Join-Path $OutputDirectory "release-readiness-index.json"
    $indexDoc | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $indexJsonPath -Encoding utf8

    [string] $summaryFilePath = Join-Path $OutputDirectory "release-readiness-summary.md"
    [System.Text.StringBuilder] $summaryBuilder = [System.Text.StringBuilder]::new()
    [void] $summaryBuilder.AppendLine("# Release readiness evidence (unified)")
    [void] $summaryBuilder.AppendLine("")
    [void] $summaryBuilder.AppendLine("Generated (UTC): **$GeneratedUtc**")
    [void] $summaryBuilder.AppendLine("Environment label: **$Environment**")
    [void] $summaryBuilder.AppendLine("Commit/version: **$gitCommitSha** / ArchLucid CLI **$cliVersion**")
    [void] $summaryBuilder.AppendLine("")
    [void] $summaryBuilder.AppendLine("Rollup: **$localRollup** (FAIL=$localFailCount, WARN=$localWarnCount)")
    [void] $summaryBuilder.AppendLine("")
    [void] $summaryBuilder.AppendLine("Missing optional evidence is labeled **SKIPPED** instead of inferred. This bundle does not claim production SLA compliance unless live probe, migration, and smoke artifacts are attached.")
    [void] $summaryBuilder.AppendLine("")
    [void] $summaryBuilder.AppendLine("| Check | Verdict | Owner | Artifact | Detail |")
    [void] $summaryBuilder.AppendLine("| --- | --- | --- | --- | --- |")

    foreach ($row in $CheckRows) {
        [string] $rowDetail = [string]$row.detail -replace '\|', '/'
        [void] $summaryBuilder.AppendLine("| $($row.name) | $($row.verdict) | $($row.owner) | ``$($row.artifact)`` | $rowDetail |")
    }

    [void] $summaryBuilder.AppendLine("")
    [void] $summaryBuilder.AppendLine("**Generate:** ``pwsh ./scripts/Emit-ReleaseReadinessEvidence.ps1 [-ApiBaseUrl https://staging.example]``")
    [void] $summaryBuilder.AppendLine("")
    [void] $summaryBuilder.AppendLine("Machine-readable index: ``release-readiness-index.json``. RC evidence index: ``rc-evidence-index.json``. Bundle manifest: ``release-evidence-bundle-manifest.json`` (profile ``release-readiness``). Confidence rollup: ``release-confidence-rollup.json``. RC verdict: ``rc-go-no-go-verdict.json``. Deploy handoff: ``deploy-handoff.json``. Redaction policy: ``redaction-note.md``.")
    [void] $summaryBuilder.AppendLine("")
    [void] $summaryBuilder.AppendLine("See ``docs/library/DEPLOYMENT_RUNBOOK.md`` and ``docs/library/OBSERVABILITY.md``.")

    Set-Content -LiteralPath $summaryFilePath -Value $summaryBuilder.ToString() -Encoding utf8
    Copy-Item -LiteralPath $summaryFilePath -Destination (Join-Path $OutputDirectory "release-readiness-index.md") -Force

    return [ordered]@{
        rollup = $localRollup
        failCount = $localFailCount
        warnCount = $localWarnCount
    }
}

[string] $generatedUtc = [DateTime]::UtcNow.ToString("o")
[object] $indexState = Write-ReleaseReadinessIndexArtifacts -CheckRows $checks -GeneratedUtc $generatedUtc -OutputDirectory $OutDir
[string] $rollup = [string]$indexState.rollup
[int] $failCount = [int]$indexState.failCount
[int] $warnCount = [int]$indexState.warnCount

& pwsh -NoProfile -File (Join-Path $root "scripts/ci/Invoke-WriteReleaseEvidenceBundleManifest.ps1") `
    -BundleDir $OutDir `
    -Profile "release-readiness" `
    -Rollup $rollup `
    -GitCommitSha $gitCommitSha `
    -CliVersion $cliVersion `
    -Environment $Environment

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to emit release-evidence-bundle-manifest.json"
}

& pwsh -NoProfile -File (Join-Path $root "scripts/ci/Invoke-ValidateReleaseEvidenceBundle.ps1") `
    -BundleDir $OutDir `
    -Profile "release-readiness" `
    -JsonOut (Join-Path $OutDir "release-evidence-bundle-validation.json")

[int] $bundleValidateExit = $LASTEXITCODE

if ($bundleValidateExit -ne 0) {
    Write-Warning "Release evidence bundle schema validation failed (exit $bundleValidateExit). See release-evidence-bundle-validation.json."
}

[string] $confidenceJsonPath = Join-Path $OutDir "release-confidence-rollup.json"
[string] $confidenceMarkdownPath = Join-Path $OutDir "release-confidence-rollup.md"
[string] $azureExtractorStatusPath = Join-Path $OutDir "azure-extractor-terraform-emit-status.json"
& python (Join-Path $root "scripts/ci/check_azure_extractor_terraform_emit_acceptance.py") `
    --json-out $azureExtractorStatusPath
[int] $azureExtractorExit = $LASTEXITCODE
[string] $azureExtractorVerdict = if ($azureExtractorExit -eq 0) { "PASS" } else { "FAIL" }
Add-CheckRow $checks "Azure extractor + Terraform emit acceptance" $azureExtractorVerdict "exit $azureExtractorExit" "azure-extractor-terraform-emit-status.json"

[string] $claimGateJsonPath = Join-Path $OutDir "real-mode-claim-gate.json"
[string] $claimGateMarkdownPath = Join-Path $OutDir "real-mode-claim-gate.md"
[string[]] $claimGateArgs = @(
    (Join-Path $root "scripts/ci/check_release_real_mode_claim.py"),
    "--json-out", $claimGateJsonPath,
    "--markdown-out", $claimGateMarkdownPath,
    "--gate-json", (Join-Path $OutDir "real-llm-evidence-gate.json")
)

if (Test-StrictRcEffective) {
    $claimGateArgs += "--rc-strict-claims"
    $claimGateArgs += @("--expected-commit-sha", $gitCommitSha)
}

if ($env:ARCHLUCID_RELEASE_SIMULATOR_ONLY -eq '1') {
    $claimGateArgs += '--allow-simulator-only'
}

& python @claimGateArgs
[int] $claimGateExit = $LASTEXITCODE
[string] $claimGateVerdict = if ($claimGateExit -eq 0) { "PASS" } elseif ($claimGateExit -eq 1) { "FAIL" } else { "WARN" }
Add-CheckRow $checks "Real-mode claim gate (RC boundary)" $claimGateVerdict "exit $claimGateExit" "real-mode-claim-gate.json"

[string[]] $confidenceArgs = @(
    (Join-Path $root "scripts/ci/build_release_confidence_rollup.py"),
    "--bundle-dir", $OutDir,
    "--json-out", $confidenceJsonPath,
    "--markdown-out", $confidenceMarkdownPath
)

if (Test-StrictRcEffective) {
    $confidenceArgs += "--strict-rc"
}

& python @confidenceArgs
[int] $confidenceExit = $LASTEXITCODE
[string] $confidenceVerdict = if ($confidenceExit -eq 0) { "PASS" } else { "FAIL" }
Add-CheckRow $checks "Release confidence rollup" $confidenceVerdict "strict-rc exit $confidenceExit" "release-confidence-rollup.json"

[string] $rcTestManifestJson = Join-Path $OutDir "rc-test-evidence-manifest.json"
[string] $rcTestManifestMd = Join-Path $OutDir "rc-test-evidence-manifest.md"
& python (Join-Path $root "scripts/ci/build_rc_test_evidence_manifest.py") `
    --bundle-dir $OutDir `
    --json-out $rcTestManifestJson `
    --markdown-out $rcTestManifestMd
Add-CheckRow $checks "RC test evidence manifest" (Map-ExitToVerdict $LASTEXITCODE).verdict "suite statuses from confidence lanes" "rc-test-evidence-manifest.json"

[string] $azureParityJson = Join-Path $OutDir "azure-iac-parity-proof.json"
[string] $azureParityMd = Join-Path $OutDir "azure-iac-parity-proof.md"
[string[]] $azureParityArgs = @(
    (Join-Path $root "scripts/ci/build_azure_iac_parity_proof.py"),
    "--json-out", $azureParityJson,
    "--markdown-out", $azureParityMd
)

if (Test-StrictRcEffective) {
    $azureParityArgs += "--strict-rc"
}

& python @azureParityArgs
Add-CheckRow $checks "Azure IaC parity proof" (Map-ExitToVerdict $LASTEXITCODE).verdict "Terraform/config parity scan for hosted path" "azure-iac-parity-proof.json"

[string] $managedIdentityJson = Join-Path $OutDir "managed-identity-verification.json"
[string] $managedIdentityMd = Join-Path $OutDir "managed-identity-verification.md"
[string[]] $managedIdentityArgs = @(
    (Join-Path $root "scripts/ci/verify_managed_identity_release.py"),
    "--hosted-profile",
    "--json-out", $managedIdentityJson,
    "--markdown-out", $managedIdentityMd
)

if (Test-StrictRcEffective) {
    $managedIdentityArgs += "--strict-rc"
}

& python @managedIdentityArgs
Add-CheckRow $checks "Managed identity verification" (Map-ExitToVerdict $LASTEXITCODE).verdict "hosted profile MI posture" "managed-identity-verification.json"

[string] $rcVerdictJson = Join-Path $OutDir "rc-go-no-go-verdict.json"
[string] $rcVerdictMd = Join-Path $OutDir "rc-go-no-go-verdict.md"
[string[]] $rcVerdictArgs = @(
    (Join-Path $root "scripts/ci/build_rc_go_no_go_verdict.py"),
    "--bundle-dir", $OutDir,
    "--json-out", $rcVerdictJson,
    "--markdown-out", $rcVerdictMd
)

if (Test-StrictRcEffective) {
    $rcVerdictArgs += "--strict-rc"
}

[string] $pilotPerfJson = Join-Path $OutDir "pilot-critical-performance-evidence.json"
[string] $pilotPerfMd = Join-Path $OutDir "pilot-critical-performance-evidence.md"
& python (Join-Path $root "scripts/ci/build_pilot_critical_performance_evidence.py") `
    --bundle-dir $OutDir `
    --environment-label $Environment `
    --json-out $pilotPerfJson `
    --markdown-out $pilotPerfMd
Add-CheckRow $checks "Pilot-critical performance smoke" (Map-ExitToVerdict $LASTEXITCODE).verdict "pilot-critical flow timings — not a load test" "pilot-critical-performance-evidence.json"

[string] $pilotReadinessLiveJson = Join-Path $OutDir "pilot-readiness-live-release-gate.json"
[string] $pilotReadinessLiveMd = Join-Path $OutDir "pilot-readiness-live-release-gate.md"
[string[]] $pilotReadinessLiveArgs = @(
    (Join-Path $root "scripts/ci/run_pilot_readiness_live_release_gate.py"),
    "--repo-root", $root,
    "--json-out", $pilotReadinessLiveJson,
    "--markdown-out", $pilotReadinessLiveMd
)

if (-not [string]::IsNullOrWhiteSpace($RepresentativeRunId)) {
    $pilotReadinessLiveArgs += @("--run-id", $RepresentativeRunId.Trim())
}

if (-not [string]::IsNullOrWhiteSpace($ApiBaseUrl)) {
    $pilotReadinessLiveArgs += @("--api-base-url", $ApiBaseUrl.Trim(), "--include-api")
}

if (Test-StrictRcEffective) {
    $pilotReadinessLiveArgs += "--strict-rc"
}

& python @pilotReadinessLiveArgs
[int] $pilotReadinessLiveExit = $LASTEXITCODE
[string] $pilotReadinessLiveDetail = if ([string]::IsNullOrWhiteSpace($RepresentativeRunId)) {
    "SKIPPED — pass -RepresentativeRunId or ARCHLUCID_REPRESENTATIVE_RUN_ID after first-review smoke"
} else {
    "live readiness-bundle for run $($RepresentativeRunId.Trim()); exit $pilotReadinessLiveExit"
}
[string] $pilotReadinessLiveVerdict = "SKIPPED"

if (-not [string]::IsNullOrWhiteSpace($RepresentativeRunId)) {
    if (Test-Path -LiteralPath $pilotReadinessLiveJson) {
        $pilotReadinessLivePayload = Get-Content -LiteralPath $pilotReadinessLiveJson -Raw | ConvertFrom-Json
        $pilotReadinessLiveVerdict = [string]$pilotReadinessLivePayload.disposition
    }
    elseif ($pilotReadinessLiveExit -ne 0) {
        $pilotReadinessLiveVerdict = "FAIL"
    }
    else {
        $pilotReadinessLiveVerdict = "PASS"
    }
}
Add-CheckRow $checks "Pilot readiness live bundle (TB-429)" $pilotReadinessLiveVerdict $pilotReadinessLiveDetail "pilot-readiness-live-release-gate.json"

if (Test-StrictRcEffective -and $pilotReadinessLiveExit -ne 0) {
    Write-Error "Strict RC pilot readiness live gate failed (exit $pilotReadinessLiveExit). See $pilotReadinessLiveJson."
    exit $pilotReadinessLiveExit
}

& pwsh -NoProfile -File (Join-Path $root "scripts/ci/Invoke-FirstPilotPerformanceBudgetSmoke.ps1") `
    -OutputDir $OutDir `
    -ExecutionMode Simulator | Out-Null
Add-CheckRow $checks "First-value timing budget" (Map-ExitToVerdict $LASTEXITCODE).verdict "PASS/WARN/HOLD create→commit→artifact budget" "first-pilot-timing-budget.json"

[string] $rcSignoffJson = Join-Path $OutDir "rc-evidence-signoff-bundle.json"
[string] $rcSignoffMd = Join-Path $OutDir "rc-evidence-signoff-bundle.md"
[string[]] $rcSignoffArgs = @(
    (Join-Path $root "scripts/ci/build_rc_evidence_signoff_bundle.py"),
    "--bundle-dir", $OutDir,
    "--json-out", $rcSignoffJson,
    "--markdown-out", $rcSignoffMd
)

if (Test-StrictRcEffective) {
    $rcSignoffArgs += "--strict-rc"
}

& python @rcSignoffArgs
[int] $rcSignoffExit = $LASTEXITCODE
[string] $rcSignoffLabel = if ($rcSignoffExit -eq 0) { "PASS" } else { "FAIL" }
Add-CheckRow $checks "RC evidence signoff bundle (TB-317)" $rcSignoffLabel "per-gate PASS/WARN/HOLD/SKIPPED composition; exit $rcSignoffExit" "rc-evidence-signoff-bundle.json"

& python @rcVerdictArgs
[int] $rcVerdictExit = $LASTEXITCODE
[string] $rcVerdictLabel = if ($rcVerdictExit -eq 0) { "PASS" } else { "FAIL" }
Add-CheckRow $checks "RC go/no-go verdict" $rcVerdictLabel "synthesized signoff artifact; exit $rcVerdictExit" "rc-go-no-go-verdict.json"

[string] $rcNarrativeJson = Join-Path $OutDir "rc-decision-narrative.json"
[string] $rcNarrativeMd = Join-Path $OutDir "rc-decision-narrative.md"
& python (Join-Path $root "scripts/ci/build_rc_decision_narrative.py") `
    --bundle-dir $OutDir `
    --json-out $rcNarrativeJson `
    --markdown-out $rcNarrativeMd
Add-CheckRow $checks "RC decision narrative" (Map-ExitToVerdict $LASTEXITCODE).verdict "human-readable go/no-go summary" "rc-decision-narrative.md"

[string] $execBriefJson = Join-Path $OutDir "sponsor-one-screen-brief.json"
[string] $execBriefMd = Join-Path $OutDir "sponsor-one-screen-brief.md"
& python (Join-Path $root "scripts/ci/build_executive_one_screen_brief.py") `
    --bundle-dir $OutDir `
    --json-out $execBriefJson `
    --markdown-out $execBriefMd
Add-CheckRow $checks "Sponsor one-screen brief" (Map-ExitToVerdict $LASTEXITCODE).verdict "sponsor-facing rollup from RC artifacts" "sponsor-one-screen-brief.md"

[string] $deployHandoffJson = Join-Path $OutDir "deploy-handoff.json"
[string] $deployHandoffMd = Join-Path $OutDir "deploy-handoff.md"
[string[]] $deployHandoffArgs = @(
    (Join-Path $root "scripts/ci/build_deploy_handoff.py"),
    "--bundle-dir", $OutDir,
    "--json-out", $deployHandoffJson,
    "--markdown-out", $deployHandoffMd,
    "--environment", $Environment,
    "--config-profile", "production-like-hosted-pilot"
)

if (Test-StrictRcEffective) {
    $deployHandoffArgs += "--strict-rc"
}

& python @deployHandoffArgs
Add-CheckRow $checks "Deploy handoff artifact" (Map-ExitToVerdict $LASTEXITCODE).verdict "commit/profile/Azure metadata for operations" "deploy-handoff.json"

[string] $rcGoldenPathJson = Join-Path $OutDir "rc-golden-path-validation.json"
[string] $rcGoldenPathMd = Join-Path $OutDir "rc-golden-path-validation.md"
[string[]] $rcGoldenPathArgs = @(
    (Join-Path $root "scripts/ci/validate_rc_golden_path.py"),
    "--bundle-dir", $OutDir,
    "--json-out", $rcGoldenPathJson,
    "--markdown-out", $rcGoldenPathMd
)

if (Test-StrictRcEffective) {
    $rcGoldenPathArgs += "--enforce"
}

& python @rcGoldenPathArgs
[int] $rcGoldenPathExit = $LASTEXITCODE
[string] $rcGoldenPathVerdict = if ($rcGoldenPathExit -eq 1) { "FAIL" } else { "PASS" }
Add-CheckRow $checks "RC golden-path evidence validation" $rcGoldenPathVerdict "mandatory pilot-facing RC artifacts; exit $rcGoldenPathExit" "rc-golden-path-validation.json"

[string] $rcEvidenceIndexJson = Join-Path $OutDir "rc-evidence-index.json"
[string] $rcEvidenceIndexMd = Join-Path $OutDir "rc-evidence-index.md"
& python (Join-Path $root "scripts/ci/build_rc_evidence_index.py") `
    --bundle-dir $OutDir `
    --json-out $rcEvidenceIndexJson `
    --markdown-out $rcEvidenceIndexMd
[int] $rcEvidenceIndexExit = $LASTEXITCODE
[string] $rcEvidenceIndexVerdict = if ($rcEvidenceIndexExit -eq 1) { "FAIL" } else { "PASS" }
Add-CheckRow $checks "RC evidence index (unified)" $rcEvidenceIndexVerdict "PASS/WARN/HOLD/NOT_RUN rollup; exit $rcEvidenceIndexExit" "rc-evidence-index.json"

$indexState = Write-ReleaseReadinessIndexArtifacts -CheckRows $checks -GeneratedUtc $generatedUtc -OutputDirectory $OutDir
$rollup = [string]$indexState.rollup
$failCount = [int]$indexState.failCount
$warnCount = [int]$indexState.warnCount

& pwsh -NoProfile -File (Join-Path $root "scripts/ci/Invoke-WriteReleaseEvidenceBundleManifest.ps1") `
    -BundleDir $OutDir `
    -Profile "release-readiness" `
    -Rollup $rollup `
    -GitCommitSha $gitCommitSha `
    -CliVersion $cliVersion `
    -Environment $Environment | Out-Null

Write-Host "Wrote release readiness bundle to $OutDir (rollup=$rollup)"

if (Test-StrictRcEffective) {
    & python (Join-Path $root "scripts/ci/release_evidence_bundle.py") validate `
        --dir $OutDir `
        --profile "release-readiness" `
        --strict-buyer-rc `
        --json-out (Join-Path $OutDir "release-evidence-bundle-validation-strict-rc.json")

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Strict buyer RC bundle validation failed (exit $LASTEXITCODE). See release-evidence-bundle-validation-strict-rc.json."
        exit $LASTEXITCODE
    }

    & python (Join-Path $root "scripts/ci/assert_rc_strict_signoff.py") `
        --bundle-dir $OutDir `
        --require-pass `
        --require-live-parity-artifact `
        --json-out (Join-Path $OutDir "rc-strict-signoff-assertion.json")

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Strict RC signoff assertion failed (exit $LASTEXITCODE). See rc-strict-signoff-assertion.json and blockingReasons."
        exit $LASTEXITCODE
    }
}

if ($strictExit -ne 0) {
    Write-Warning "Strict observability export gate failed (exit $strictExit). See $OutDir."
    exit $strictExit
}

if ($failCount -gt 0) {
    exit 2
}

if ($warnCount -gt 0) {
    exit 1
}

exit 0
