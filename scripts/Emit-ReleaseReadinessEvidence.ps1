#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Emit release-readiness evidence artifacts (observability export + production preflight index).

.DESCRIPTION
  Offline repo-local bundle for Batch D improvement #14. Does not print secrets.

.PARAMETER Environment
  Appsettings layer for observability report (Production default; also emits Staging when set to Production).

.PARAMETER OutDir
  Output directory (default: artifacts/release-readiness).
#>
[CmdletBinding()]
param(
    [string] $Environment = "Production",
    [string] $OutDir = "artifacts/release-readiness"
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

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

[int] $prodExit = Invoke-PythonReport -EnvName $Environment -OutFile (Join-Path $OutDir "observability-export-readiness-$Environment.md")
[int] $stagingExit = Invoke-PythonReport -EnvName "Staging" -OutFile (Join-Path $OutDir "observability-export-readiness-Staging.md")

# Strict gate simulates release when ProductionValidation:RequireTelemetryExport is enabled in merged JSON.
[int] $strictExit = Invoke-PythonReport `
    -EnvName $Environment `
    -OutFile (Join-Path $OutDir "observability-export-readiness-$Environment-strict.md") `
    -Strict `
    -HonorRequireTelemetryExport

[string] $preflightPath = Join-Path $OutDir "production-profile-preflight.md"
& pwsh -NoProfile -File (Join-Path $root "scripts/Emit-ProductionProfilePreflightMarkdown.ps1") -MarkdownOut $preflightPath
[int] $preflightExit = $LASTEXITCODE

[string] $generatedUtc = [DateTime]::UtcNow.ToString("o")
[string] $indexPath = Join-Path $OutDir "release-readiness-index.md"

[string] $index = @"
# Release readiness evidence (repo-local)

Generated (UTC): **$generatedUtc**

| Artifact | Path | Exit |
| --- | --- | --- |
| Observability export ($Environment) | ``observability-export-readiness-$Environment.md`` | $prodExit |
| Observability export (Staging) | ``observability-export-readiness-Staging.md`` | $stagingExit |
| Observability strict + RequireTelemetryExport gate | ``observability-export-readiness-$Environment-strict.md`` | $strictExit |
| Production profile preflight | ``production-profile-preflight.md`` | $preflightExit |

**Generate:** ``pwsh ./scripts/Emit-ReleaseReadinessEvidence.ps1``

Observability reports evaluate Application Insights, OTLP, and Prometheus separately for **ArchLucid.Api** and **ArchLucid.Worker**. Values are never printed.

When ``ProductionValidation:RequireTelemetryExport=true`` in merged Production appsettings, the strict report exits non-zero unless a durable export path is configured (or process environment overlay supplies one when not using ``--no-process-environment``).

See ``docs/library/OBSERVABILITY.md`` and ``docs/library/DEPLOYMENT_RUNBOOK.md``.
"@

Set-Content -LiteralPath $indexPath -Value $index -Encoding utf8

Write-Host "Wrote release readiness bundle to $OutDir"

if ($strictExit -ne 0) {
    Write-Warning "Strict observability export gate failed (exit $strictExit). See $OutDir."
    exit $strictExit
}

exit 0
