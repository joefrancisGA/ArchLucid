#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Repo-local production profile preflight — no Azure login, no terraform apply.

.PARAMETER MarkdownOut
  Output path (default: artifacts/deployment/production-profile-preflight.md).
#>
[CmdletBinding()]
param(
    [string] $MarkdownOut = "artifacts/deployment/production-profile-preflight.md"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Add-Row {
    param([string]$Check, [string]$Result, [string]$Detail)
    return [pscustomobject]@{ Check = $Check; Result = $Result; Detail = $Detail }
}

$rows = [System.Collections.Generic.List[object]]::new()

function DirOk([string]$Rel) {
    return (Test-Path -LiteralPath (Join-Path $root $Rel) -PathType Container)
}

function FileOk([string]$Rel) {
    return (Test-Path -LiteralPath (Join-Path $root $Rel) -PathType Leaf)
}

$tfRoots = @(
    "infra/terraform-pilot",
    "infra/terraform-private",
    "infra/terraform-keyvault",
    "infra/terraform-sql-failover",
    "infra/terraform-storage",
    "infra/terraform-container-apps",
    "infra/terraform-edge",
    "infra/terraform-monitoring"
)

foreach ($p in $tfRoots) {
    if (DirOk $p) { $rows.Add((Add-Row "Terraform root present: $p" "Passed" "directory exists")) | Out-Null }
    else { $rows.Add((Add-Row "Terraform root present: $p" "Failed" "missing")) | Out-Null }
}

if (FileOk "ArchLucid.Api/appsettings.Production.json") {
    $rows.Add((Add-Row "Production appsettings template" "Passed" "ArchLucid.Api/appsettings.Production.json present")) | Out-Null
    $cfg = Get-Content (Join-Path $root "ArchLucid.Api/appsettings.Production.json") -Raw
    if ($cfg -match '"Mode"\s*:\s*"JwtBearer"') {
        $rows.Add((Add-Row "Auth mode (sample production file)" "Passed" "JwtBearer")) | Out-Null
    }
    else {
        $rows.Add((Add-Row "Auth mode (sample production file)" "Not captured" "JwtBearer not matched by quick scan")) | Out-Null
    }

    if ($cfg -match '"Otlp"\s*:\s*\{[\s\S]*?"Endpoint"\s*:\s*""') {
        $rows.Add((Add-Row "OTLP export endpoint configured" "Not captured" "Otlp:Endpoint is empty in template — set per environment")) | Out-Null
    }
    else {
        $rows.Add((Add-Row "OTLP export endpoint configured" "Skipped" "Template does not show empty Endpoint (verify manually)")) | Out-Null
    }

    if ($cfg -notmatch "445") {
        $rows.Add((Add-Row "No public SMB (port 445) assumptions in sample config" "Passed" "no 445 literal in appsettings.Production.json")) | Out-Null
    }
    else {
        $rows.Add((Add-Row "No public SMB (port 445) assumptions in sample config" "Failed" "unexpected 445 reference")) | Out-Null
    }
}
else {
    $rows.Add((Add-Row "Production appsettings template" "Failed" "ArchLucid.Api/appsettings.Production.json missing")) | Out-Null
}

$rows.Add((Add-Row "terraform apply executed" "Skipped" "Intentionally not run from this script")) | Out-Null
$rows.Add((Add-Row "Azure subscription verification" "Skipped" "Requires az login / cloud context")) | Out-Null

$md = @"
# Production profile preflight (repo-local)

Generated (UTC): **$([DateTime]::UtcNow.ToString('o'))**

**Scope:** This file checks **repository** layout and **sample** production configuration — not a substitute for a deployed-environment audit. See [docs/library/AZURE_PRODUCTION_PROFILE.md](../docs/library/AZURE_PRODUCTION_PROFILE.md) and [docs/library/REFERENCE_SAAS_STACK_ORDER.md](../docs/library/REFERENCE_SAAS_STACK_ORDER.md).

| Check | Result | Detail |
| --- | --- | --- |
"@

foreach ($r in $rows) {
    $md += "| $($r.Check) | **$($r.Result)** | $($r.Detail) |`n"
}

$md += @"

## Legend

- **Passed** — artefact or directory present / heuristic satisfied.
- **Failed** — expected repo artefact missing.
- **Skipped** — intentionally not attempted.
- **Not captured** — needs human or environment-specific confirmation.

Do not commit if this file is generated only for a local drill — attach to release notes when useful.
"@

$outAbs = Join-Path $root $MarkdownOut
$dir = Split-Path -Parent $outAbs
if (!(Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
[System.IO.File]::WriteAllText($outAbs, $md, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $outAbs" -ForegroundColor Green
