#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Static Terraform/CD deployment drift preflight — no terraform apply, no Azure login required.

.DESCRIPTION
  Cross-checks CD workflow image-tag traceability, Container Apps secret names, telemetry key names,
  and expected infra/terraform-* roots. Optional -LiveAzure performs read-only az checks when logged in.

.PARAMETER MarkdownOut
  Human-readable report path (default: artifacts/deployment/terraform-drift-preflight.md).

.PARAMETER JsonOut
  Machine-readable report path (default: artifacts/deployment/terraform-drift-preflight.json).
#>
[CmdletBinding()]
param(
    [string] $MarkdownOut = "artifacts/deployment/terraform-drift-preflight.md",
    [string] $JsonOut = "artifacts/deployment/terraform-drift-preflight.json",
    [switch] $LiveAzure
)

$ErrorActionPreference = "Stop"
[string] $root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Add-Check {
    param([string]$Name, [string]$Verdict, [string]$Detail)
    return [ordered]@{ name = $Name; verdict = $Verdict; detail = $Detail }
}

function Read-RepoText {
    param([string]$Rel)
    [string] $abs = Join-Path $root $Rel

    if (!(Test-Path -LiteralPath $abs -PathType Leaf)) {
        return $null
    }

    return Get-Content -LiteralPath $abs -Raw
}

function Map-VerdictToExitWeight {
    param([string]$Verdict)

    switch ($Verdict) {
        "FAIL" { return 2 }
        "WARN" { return 1 }
        "SKIPPED" { return 0 }
        default { return 0 }
    }
}

[System.Collections.Generic.List[object]] $checks = [System.Collections.Generic.List[object]]::new()

[string] $cdYaml = Read-RepoText ".github/workflows/cd.yml"

if ($null -eq $cdYaml) {
    $checks.Add((Add-Check "CD workflow present" "FAIL" ".github/workflows/cd.yml missing")) | Out-Null
}
else {
    $checks.Add((Add-Check "CD workflow present" "PASS" "cd.yml found")) | Out-Null

    if ($cdYaml -match 'IMAGE_TAG') {
        $checks.Add((Add-Check "CD: IMAGE_TAG traceability documented" "PASS" "workflow references git SHA / IMAGE_TAG")) | Out-Null
    }
    else {
        $checks.Add((Add-Check "CD: IMAGE_TAG traceability documented" "WARN" "IMAGE_TAG not found in cd.yml")) | Out-Null
    }

    foreach ($secretName in @("CONTAINER_APP_API_NAME", "CONTAINER_APP_WORKER_NAME", "CONTAINER_APP_UI_NAME")) {
        if ($cdYaml -match [regex]::Escape($secretName)) {
            $checks.Add((Add-Check "CD: $secretName referenced" "PASS" "secret/env name present in workflow")) | Out-Null
        }
        else {
            $checks.Add((Add-Check "CD: $secretName referenced" "WARN" "not referenced — optional for partial deploy")) | Out-Null
        }
    }
}

[string[]] $expectedRoots = @(
    "infra/terraform-pilot",
    "infra/terraform-private",
    "infra/terraform-keyvault",
    "infra/terraform-sql-failover",
    "infra/terraform-storage",
    "infra/terraform-container-apps",
    "infra/terraform-edge",
    "infra/terraform-monitoring"
)

[int] $missingRoots = 0

foreach ($rel in $expectedRoots) {
    [string] $abs = Join-Path $root $rel

    if (Test-Path -LiteralPath $abs -PathType Container) {
        $checks.Add((Add-Check "Terraform root: $rel" "PASS" "directory exists")) | Out-Null
    }
    else {
        $missingRoots++
        $checks.Add((Add-Check "Terraform root: $rel" "WARN" "directory missing in this checkout")) | Out-Null
    }
}

[string] $caVars = Read-RepoText "infra/terraform-container-apps/variables.tf"

if ($null -ne $caVars) {
    if ($caVars -match "container_app_api_name" -and $caVars -match "container_app_worker_name") {
        $checks.Add((Add-Check "terraform-container-apps: app name variables" "PASS" "container_app_api_name / container_app_worker_name declared")) | Out-Null
    }
    else {
        $checks.Add((Add-Check "terraform-container-apps: app name variables" "WARN" "expected container app name variables not matched")) | Out-Null
    }

    if ($caVars -match "image_tag" -or $caVars -match "container_image") {
        $checks.Add((Add-Check "terraform-container-apps: image tag variable" "PASS" "image reference variable present")) | Out-Null
    }
    else {
        $checks.Add((Add-Check "terraform-container-apps: image tag variable" "WARN" "image tag variable name not matched")) | Out-Null
    }
}
else {
    $checks.Add((Add-Check "terraform-container-apps: variables.tf" "WARN" "file missing or unreadable")) | Out-Null
}

[string] $appsettingsProd = Read-RepoText "ArchLucid.Api/appsettings.Production.json"
[string[]] $telemetryKeys = @(
    "Observability:Otlp:Endpoint",
    "Observability:AzureMonitor:ConnectionString",
    "Observability:Prometheus:Enabled"
)

foreach ($key in $telemetryKeys) {
    [string] $segment = ($key -split ":")[-1]

    if ($null -ne $appsettingsProd -and $appsettingsProd -match [regex]::Escape($segment)) {
        $checks.Add((Add-Check "Appsettings Production overlay key segment: $segment" "PASS" "present in appsettings.Production.json (values not printed)")) | Out-Null
    }
    else {
        $checks.Add((Add-Check "Appsettings Production overlay key segment: $segment" "WARN" "segment not found — verify deploy overlay")) | Out-Null
    }
}

[string] $sqlFailoverVars = Read-RepoText "infra/terraform-sql-failover/variables.tf"

if ($null -ne $sqlFailoverVars) {
    if ($sqlFailoverVars -match "failover" -or $sqlFailoverVars -match "secondary") {
        $checks.Add((Add-Check "terraform-sql-failover: failover variables" "PASS" "failover/secondary variables declared")) | Out-Null
    }
    else {
        $checks.Add((Add-Check "terraform-sql-failover: failover variables" "WARN" "expected failover naming not matched")) | Out-Null
    }
}
else {
    $checks.Add((Add-Check "terraform-sql-failover: variables.tf" "WARN" "missing — DR root not in checkout")) | Out-Null
}

if ($LiveAzure) {
    [object] $az = Get-Command az -ErrorAction SilentlyContinue

    if ($null -eq $az) {
        $checks.Add((Add-Check "Live Azure: az CLI" "SKIPPED" "az not on PATH")) | Out-Null
    }
    else {
        try {
            & az account show 2>$null | Out-Null

            if ($LASTEXITCODE -ne 0) {
                $checks.Add((Add-Check "Live Azure: subscription context" "SKIPPED" "run az login before -LiveAzure")) | Out-Null
            }
            else {
                $checks.Add((Add-Check "Live Azure: subscription context" "PASS" "az account show succeeded (resource checks not automated in V1 preflight)")) | Out-Null
            }
        }
        catch {
            $checks.Add((Add-Check "Live Azure: subscription context" "SKIPPED" "az account show failed")) | Out-Null
        }
    }
}
else {
    $checks.Add((Add-Check "Live Azure checks" "SKIPPED" "pass -LiveAzure after az login for optional read-only context")) | Out-Null
}

$checks.Add((Add-Check "terraform apply" "SKIPPED" "never run from this script")) | Out-Null

[int] $failCount = @($checks | Where-Object { $_.verdict -eq "FAIL" }).Count
[int] $warnCount = @($checks | Where-Object { $_.verdict -eq "WARN" }).Count
[string] $rollup = if ($failCount -gt 0) { "FAIL" } elseif ($warnCount -gt 0) { "WARN" } else { "PASS" }

[string] $generatedUtc = [DateTime]::UtcNow.ToString("o")

[ordered] $jsonDoc = [ordered]@{
    schema = "archlucid.terraform-drift-preflight.v1"
    generatedUtc = $generatedUtc
    rollup = $rollup
    failCount = $failCount
    warnCount = $warnCount
    checks = @($checks)
}

[string] $jsonDir = Split-Path -Parent $JsonOut

if (-not [string]::IsNullOrWhiteSpace($jsonDir)) {
    New-Item -ItemType Directory -Force -Path $jsonDir | Out-Null
}

$jsonDoc | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $JsonOut -Encoding utf8

[System.Text.StringBuilder] $md = [System.Text.StringBuilder]::new()
[void] $md.AppendLine("# Terraform / CD deployment drift preflight")
[void] $md.AppendLine("")
[void] $md.AppendLine("Generated (UTC): **$generatedUtc**")
[void] $md.AppendLine("")
[void] $md.AppendLine("Rollup: **$rollup** (FAIL=$failCount, WARN=$warnCount)")
[void] $md.AppendLine("")
[void] $md.AppendLine("| Check | Verdict | Detail |")
[void] $md.AppendLine("| --- | --- | --- |")

foreach ($c in $checks) {
    [string] $detail = [string]$c.detail -replace '\|', '/'
    [void] $md.AppendLine("| $($c.name) | $($c.verdict) | $detail |")
}

[void] $md.AppendLine("")
[void] $md.AppendLine("**Generate:** ``pwsh ./scripts/Assert-TerraformDeploymentDriftPreflight.ps1``")
[void] $md.AppendLine("")
[void] $md.AppendLine("See ``docs/library/DEPLOYMENT_RUNBOOK.md`` and ``docs/library/DEPLOYMENT_CD_PIPELINE.md``.")

[string] $mdDir = Split-Path -Parent $MarkdownOut

if (-not [string]::IsNullOrWhiteSpace($mdDir)) {
    New-Item -ItemType Directory -Force -Path $mdDir | Out-Null
}

Set-Content -LiteralPath $MarkdownOut -Value $md.ToString() -Encoding utf8

Write-Host "Wrote terraform drift preflight to $MarkdownOut and $JsonOut (rollup=$rollup)"

[int] $exitWeight = 0

foreach ($c in $checks) {
    $exitWeight = [Math]::Max($exitWeight, (Map-VerdictToExitWeight -Verdict $c.verdict))
}

exit $exitWeight
