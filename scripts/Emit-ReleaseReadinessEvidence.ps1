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
#>
[CmdletBinding()]
param(
    [string] $Environment = "Production",
    [string] $OutDir = "artifacts/release-readiness",
    [string] $ApiBaseUrl = ""
)

$ErrorActionPreference = "Stop"
[string] $root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Invoke-PythonReport {
    param(
        [string] $EnvName,
        [string] $OutFile,
        [switch] $Strict,
        [switch] $HonorRequireTelemetryExport
    )

    [string[]] $args = @(
        "scripts/report_observability_export_readiness.py",
        "--environment", $EnvName,
        "--out", $OutFile
    )

    if ($Strict) {
        $args += "--strict-exit-code"
    }

    if ($HonorRequireTelemetryExport) {
        $args += "--honor-require-telemetry-export-config"
    }

    & python @args
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

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

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

[string] $generatedUtc = [DateTime]::UtcNow.ToString("o")
[int] $failCount = @($checks | Where-Object { $_.verdict -eq "FAIL" }).Count
[int] $warnCount = @($checks | Where-Object { $_.verdict -eq "WARN" }).Count
[string] $rollup = if ($failCount -gt 0) { "FAIL" } elseif ($warnCount -gt 0) { "WARN" } else { "PASS" }

[ordered] $jsonDoc = [ordered]@{
    schema = "archlucid.release-readiness-index.v1"
    generatedUtc = $generatedUtc
    environment = $Environment
    gitCommitSha = $gitCommitSha
    archLucidCliVersion = $cliVersion
    rollup = $rollup
    failCount = $failCount
    warnCount = $warnCount
    checks = @($checks)
}

[string] $jsonPath = Join-Path $OutDir "release-readiness-index.json"
$jsonDoc | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding utf8

[string] $summaryPath = Join-Path $OutDir "release-readiness-summary.md"
[System.Text.StringBuilder] $md = [System.Text.StringBuilder]::new()
[void] $md.AppendLine("# Release readiness evidence (unified)")
[void] $md.AppendLine("")
[void] $md.AppendLine("Generated (UTC): **$generatedUtc**")
[void] $md.AppendLine("Environment label: **$Environment**")
[void] $md.AppendLine("Commit/version: **$gitCommitSha** / ArchLucid CLI **$cliVersion**")
[void] $md.AppendLine("")
[void] $md.AppendLine("Rollup: **$rollup** (FAIL=$failCount, WARN=$warnCount)")
[void] $md.AppendLine("")
[void] $md.AppendLine("Missing optional evidence is labeled **SKIPPED** instead of inferred. This bundle does not claim production SLA compliance unless live probe, migration, and smoke artifacts are attached.")
[void] $md.AppendLine("")
[void] $md.AppendLine("| Check | Verdict | Owner | Artifact | Detail |")
[void] $md.AppendLine("| --- | --- | --- | --- | --- |")

foreach ($c in $checks) {
    [string] $detail = [string]$c.detail -replace '\|', '/'
    [void] $md.AppendLine("| $($c.name) | $($c.verdict) | $($c.owner) | ``$($c.artifact)`` | $detail |")
}

[void] $md.AppendLine("")
[void] $md.AppendLine("**Generate:** ``pwsh ./scripts/Emit-ReleaseReadinessEvidence.ps1 [-ApiBaseUrl https://staging.example]``")
[void] $md.AppendLine("")
[void] $md.AppendLine("Machine-readable index: ``release-readiness-index.json``. Redaction policy: ``redaction-note.md``.")
[void] $md.AppendLine("")
[void] $md.AppendLine("See ``docs/library/DEPLOYMENT_RUNBOOK.md`` and ``docs/library/OBSERVABILITY.md``.")

Set-Content -LiteralPath $summaryPath -Value $md.ToString() -Encoding utf8

# Legacy markdown index retained for backward-compatible links.
[string] $legacyIndexPath = Join-Path $OutDir "release-readiness-index.md"
Copy-Item -LiteralPath $summaryPath -Destination $legacyIndexPath -Force

Write-Host "Wrote release readiness bundle to $OutDir (rollup=$rollup)"

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
