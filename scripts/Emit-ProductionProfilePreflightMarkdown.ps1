#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Repo-local production profile preflight for Azure SaaS — no Azure login, no terraform apply, no secret values printed.

.DESCRIPTION
  Validates repository layout, sample IaC/filesystem posture (per docs/library/AZURE_PRODUCTION_PROFILE.md and
  REFERENCE_SAAS_STACK_ORDER.md). Does not verify resources in a live subscription.

.PARAMETER MarkdownOut
  Output path (default: artifacts/deployment/production-profile-preflight.md).
#>
[CmdletBinding()]
param(
    [string] $MarkdownOut = "artifacts/deployment/production-profile-preflight.md"
)

$ErrorActionPreference = "Stop"
[string] $root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Add-Row {
    param([string]$Check, [string]$Result, [string]$Detail)
    return [pscustomobject]@{ Check = $Check; Result = $Result; Detail = $Detail }
}

[System.Collections.Generic.List[object]] $rowsRepo = [System.Collections.Generic.List[object]]::new()
[System.Collections.Generic.List[object]] $rowsDeployedNote = [System.Collections.Generic.List[object]]::new()

function Test-DirOk {
    param([string]$Rel)
    return Test-Path -LiteralPath (Join-Path $root $Rel) -PathType Container
}

function Test-FileOk {
    param([string]$Rel)
    return Test-Path -LiteralPath (Join-Path $root $Rel) -PathType Leaf
}

function Read-RepoText {
    param([string]$Rel)
    $abs = Join-Path $root $Rel
    if (!(Test-Path -LiteralPath $abs -PathType Leaf)) {
        return $null
    }

    return Get-Content -LiteralPath $abs -Raw
}

# --- Section: repo / IaC readiness ---

[string[]] $tfRootsMandatory = @(
    "infra/terraform-pilot",
    "infra/terraform-private",
    "infra/terraform-keyvault",
    "infra/terraform-sql-failover",
    "infra/terraform-storage",
    "infra/terraform-container-apps",
    "infra/terraform-edge",
    "infra/terraform-monitoring"
)

foreach ($p in $tfRootsMandatory) {
    if (Test-DirOk $p) {
        $rowsRepo.Add((Add-Row "Terraform root present: $p" "Passed" "directory exists")) | Out-Null
    }
    else {
        $rowsRepo.Add((Add-Row "Terraform root present: $p" "Failed" "missing")) | Out-Null
    }
}

[string[]] $tfRootsOptional = @(
    "infra/terraform-servicebus",
    "infra/terraform-entra",
    "infra/terraform-otel-collector"
)

foreach ($p in $tfRootsOptional) {
    if (Test-DirOk $p) {
        $rowsRepo.Add((Add-Row "Optional Terraform root present: $p" "Passed" "directory exists")) | Out-Null
    }
    else {
        $rowsRepo.Add((Add-Row "Optional Terraform root present: $p" "Skipped" "not required for minimal profile")) | Out-Null
    }
}

$tfExe = Get-Command terraform -ErrorAction SilentlyContinue

if ($null -ne $tfExe) {
    Push-Location $root
    try {
        & terraform fmt -check -recursive infra 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $rowsRepo.Add((Add-Row "terraform fmt -check -recursive infra" "Passed" "format OK")) | Out-Null
        }
        else {
            $rowsRepo.Add((Add-Row "terraform fmt -check -recursive infra" "Failed" "run: terraform fmt -recursive infra")) | Out-Null
        }
    }
    finally {
        Pop-Location
    }
}
else {
    $rowsRepo.Add((Add-Row "terraform fmt -check -recursive infra" "Skipped" "terraform not on PATH - run locally after install")) | Out-Null
}

$rowsRepo.Add((Add-Row 'terraform validate (per root)' 'Skipped' 'Requires terraform init per directory (network for providers); do not run apply. Example: cd infra/terraform-private; terraform init -backend=false; terraform validate')) | Out-Null

# Private endpoint posture (variables + operator example only — no subscription inspection)
[string] $privateVars = Read-RepoText "infra/terraform-private/variables.tf"

if ($null -ne $privateVars) {
    if ($privateVars -match 'variable\s+"enable_private_data_plane"' -and $privateVars -match "private_endpoints_subnet") {
        $rowsRepo.Add((Add-Row "terraform-private: private endpoint / data-plane toggle variables" "Passed" "enable_private_data_plane and subnet variables declared")) | Out-Null
    }
    else {
        $rowsRepo.Add((Add-Row "terraform-private: private endpoint / data-plane toggle variables" "Failed" "expected variables not found in variables.tf")) | Out-Null
    }
}
else {
    $rowsRepo.Add((Add-Row "terraform-private: private endpoint / data-plane toggle variables" "Failed" "infra/terraform-private/variables.tf missing")) | Out-Null
}

[string] $privateTfvarsExample = Read-RepoText "infra/terraform-private/terraform.tfvars.example"

if ($null -ne $privateTfvarsExample -and $privateTfvarsExample -match '(?m)^\s*enable_private_data_plane\s*=\s*true\s*$') {
    $rowsRepo.Add((Add-Row "terraform-private: example tfvars recommends private data plane" "Passed" "terraform.tfvars.example sets enable_private_data_plane = true")) | Out-Null
}
elseif ($null -ne $privateTfvarsExample) {
    $rowsRepo.Add((Add-Row "terraform-private: example tfvars recommends private data plane" "Not captured" "terraform.tfvars.example does not set enable_private_data_plane = true")) | Out-Null
}
else {
    $rowsRepo.Add((Add-Row "terraform-private: example tfvars recommends private data plane" "Failed" "terraform.tfvars.example missing")) | Out-Null
}

[string] $kvProviders = Read-RepoText "infra/terraform-keyvault/providers.tf"

if ($null -ne $kvProviders -and $kvProviders -match 'provider\s+"azurerm"' -and $kvProviders -match 'key_vault\s*\{') {
    [bool] $hasPurge = $kvProviders -match "purge_soft_delete"
    [bool] $hasRecover = $kvProviders -match "recover_soft_deleted"

    if ($hasPurge -and $hasRecover) {
        $rowsRepo.Add((Add-Row "terraform-keyvault: azurerm key_vault feature block" "Passed" "purge_soft_delete / recover_soft_deleted present (values not printed)")) | Out-Null
    }
    else {
        $rowsRepo.Add((Add-Row "terraform-keyvault: azurerm key_vault feature block" "Not captured" "key_vault block present but expected flags not matched")) | Out-Null
    }
}
else {
    $rowsRepo.Add((Add-Row "terraform-keyvault: azurerm key_vault feature block" "Failed" "providers.tf missing or no key_vault block")) | Out-Null
}

[string] $caVars = Read-RepoText "infra/terraform-container-apps/variables.tf"

if ($null -ne $caVars -and $caVars -match "container_apps_subnet_id" -and $caVars -match "container_apps_internal_load_balancer") {
    $rowsRepo.Add((Add-Row "terraform-container-apps: VNet integration / internal LB variables" "Passed" "subnet + internal_load_balancer variables declared for private posture")) | Out-Null
}
elseif ($null -ne $caVars) {
    $rowsRepo.Add((Add-Row "terraform-container-apps: VNet integration / internal LB variables" "Not captured" "expected variable names not found")) | Out-Null
}
else {
    $rowsRepo.Add((Add-Row "terraform-container-apps: VNet integration / internal LB variables" "Failed" "variables.tf missing")) | Out-Null
}

# Storage: blob public_network_access is configurable (no SMB / file share authority path in IaC sample)
[string] $storageMain = Read-RepoText "infra/terraform-storage/main.tf"

if ($null -ne $storageMain -and $storageMain -match "public_network_access_enabled") {
    $rowsRepo.Add((Add-Row "terraform-storage: network access knob present (blob/queue account)" "Passed" "public_network_access_enabled wired - tune via tfvars for deny-by-default posture")) | Out-Null
}
elseif ($null -ne $storageMain) {
    $rowsRepo.Add((Add-Row "terraform-storage: network access knob present (blob/queue account)" "Not captured" "public_network_access_enabled not found in main.tf")) | Out-Null
}
else {
    $rowsRepo.Add((Add-Row "terraform-storage: network access knob present (blob/queue account)" "Failed" "infra/terraform-storage/main.tf missing")) | Out-Null
}

# --- appsettings.Production.json ---

[string] $prodAppsettingsPath = "ArchLucid.Api/appsettings.Production.json"

if (Test-FileOk $prodAppsettingsPath) {
    $rowsRepo.Add((Add-Row "Production appsettings file present" "Passed" $prodAppsettingsPath)) | Out-Null
    [string] $cfg = Read-RepoText $prodAppsettingsPath
    [object] $json = $null

    try {
        $json = $cfg | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        $rowsRepo.Add((Add-Row "appsettings.Production.json is valid JSON" "Failed" "parse error - fix before deploy overlay")) | Out-Null
        $json = $null
    }

    if ($null -ne $json) {
        $rowsRepo.Add((Add-Row "appsettings.Production.json is valid JSON" "Passed" "parsed")) | Out-Null
    }

    if ($null -ne $json) {
        [string[]] $requiredPaths = @(
            "ArchLucidAuth.Mode",
            "Observability",
            "Observability.Otlp",
            "Observability.AzureMonitor"
        )

        foreach ($path in $requiredPaths) {
            [object] $cur = $json
            foreach ($seg in $path.Split(".")) {
                if ($null -eq $cur -or -not ($cur.PSObject.Properties.Name -contains $seg)) {
                    $cur = $null
                    break
                }

                $cur = $cur.$seg
            }

            if ($null -ne $cur) {
                $rowsRepo.Add((Add-Row "Required key path: $path" "Passed" "present")) | Out-Null
            }
            else {
                $rowsRepo.Add((Add-Row "Required key path: $path" "Failed" "missing")) | Out-Null
            }
        }

        if ($cfg -match '"Mode"\s*:\s*"JwtBearer"') {
            $rowsRepo.Add((Add-Row "Auth mode (production sample)" "Passed" "JwtBearer")) | Out-Null
        }
        else {
            $rowsRepo.Add((Add-Row "Auth mode (production sample)" "Not captured" "JwtBearer not matched by quick scan")) | Out-Null
        }

        [bool] $otlpEmpty = $false
        [bool] $aiEmpty = $false

        try {
            $otlpEmpty = [string]::IsNullOrWhiteSpace([string]$json.Observability.Otlp.Endpoint)
            $aiEmpty = [string]::IsNullOrWhiteSpace([string]$json.Observability.AzureMonitor.ApplicationInsightsConnectionString)
        }
        catch {
            $otlpEmpty = $true
            $aiEmpty = $true
        }

        if ($otlpEmpty -and $aiEmpty) {
            $rowsRepo.Add((Add-Row 'Production observability export (OTLP and Application Insights)' 'Failed' 'Both Otlp:Endpoint and ApplicationInsightsConnectionString are empty - configure at least one before production export')) | Out-Null
        }
        elseif ($otlpEmpty) {
            $rowsRepo.Add((Add-Row 'Production observability export (OTLP and Application Insights)' 'Not captured' 'OTLP endpoint empty; set Application Insights or another sink per environment')) | Out-Null
        }
        elseif ($aiEmpty) {
            $rowsRepo.Add((Add-Row 'Production observability export (OTLP and Application Insights)' 'Not captured' 'Application Insights connection string empty; set OTLP or other export as intended')) | Out-Null
        }
        else {
            $rowsRepo.Add((Add-Row 'Production observability export (OTLP and Application Insights)' 'Passed' 'Non-empty OTLP endpoint and Application Insights connection string present (values not printed)')) | Out-Null
        }

        [bool] $otlpEnabled = $false

        try {
            $otlpEnabled = [bool]$json.Observability.Otlp.Enabled
        }
        catch {
            $otlpEnabled = $false
        }

        if ($otlpEnabled -and $otlpEmpty) {
            $rowsRepo.Add((Add-Row "Observability: OTLP enabled implies endpoint" "Failed" "Otlp.Enabled is true but Endpoint is empty")) | Out-Null
        }
        elseif ($otlpEnabled) {
            $rowsRepo.Add((Add-Row "Observability: OTLP enabled implies endpoint" "Passed" "endpoint non-empty or disabled")) | Out-Null
        }
        else {
            $rowsRepo.Add((Add-Row "Observability: OTLP enabled implies endpoint" "Skipped" "OTLP disabled in sample")) | Out-Null
        }
    }
    elseif ($null -ne $cfg) {
        if ($cfg -match '"Mode"\s*:\s*"JwtBearer"') {
            $rowsRepo.Add((Add-Row "Auth mode (production sample)" "Passed" "JwtBearer")) | Out-Null
        }

        if ($cfg -match '"Otlp"\s*:\s*\{[\s\S]*?"Endpoint"\s*:\s*""') {
            $rowsRepo.Add((Add-Row 'Production observability export (OTLP and Application Insights)' 'Failed' 'Template leaves OTLP endpoint empty (fix JSON first)')) | Out-Null
        }
    }

    if ($null -ne $cfg -and $cfg -notmatch "445") {
        $rowsRepo.Add((Add-Row "No SMB port 445 assumptions in appsettings.Production.json" "Passed" "no 445 literal")) | Out-Null
    }
    elseif ($null -ne $cfg) {
        $rowsRepo.Add((Add-Row "No SMB port 445 assumptions in appsettings.Production.json" "Failed" "unexpected 445 reference")) | Out-Null
    }
}
else {
    $rowsRepo.Add((Add-Row "Production appsettings file present" "Failed" "$prodAppsettingsPath missing")) | Out-Null
}

# Optional SaaS chain file (keys only — no secrets expected in repo)
if (Test-FileOk "ArchLucid.Api/appsettings.SaaS.json") {
    $rowsRepo.Add((Add-Row "appsettings.SaaS.json present (optional SaaS chain)" "Passed" "see docs/library/REFERENCE_SAAS_STACK_ORDER.md")) | Out-Null
}
else {
    $rowsRepo.Add((Add-Row "appsettings.SaaS.json present (optional SaaS chain)" "Skipped" "optional")) | Out-Null
}

# Broader repo scan: infra + ArchLucid.Api for public SMB / 445 documentation mistakes (heuristic)
[string[]] $smbScanPaths = @("infra", "ArchLucid.Api")
[int] $smbHits = 0

foreach ($sp in $smbScanPaths) {
    [string] $base = Join-Path $root $sp
    if (!(Test-Path -LiteralPath $base -PathType Container)) {
        continue
    }

    foreach ($f in Get-ChildItem -LiteralPath $base -Recurse -File -Include *.tf, *.tfvars -ErrorAction SilentlyContinue) {
        [string] $rel = $f.FullName.Substring($root.Length).TrimStart('\', '/')
        if ($rel -match '(\\|/)(bin|obj|\\.git|node_modules)(\\|/)') {
            continue
        }

        [string] $txt = Get-Content -LiteralPath $f.FullName -Raw -ErrorAction SilentlyContinue
        if ([string]::IsNullOrEmpty($txt)) {
            continue
        }

        if ($txt -match '(?i)(public[^\r\n]{0,80}445|445[^\r\n]{0,40}smb|\\\\[^:\s]+:445)') {
            $smbHits++
        }
    }
}

if ($smbHits -eq 0) {
    $rowsRepo.Add((Add-Row "Heuristic: no risky :445 / SMB exposure hints in infra *.tf/*.tfvars" "Passed" "no .tf or .tfvars files matched risky pattern")) | Out-Null
}
else {
    $rowsRepo.Add((Add-Row "Heuristic: no risky :445 / SMB exposure hints in infra *.tf/*.tfvars" "Not captured" "matches=$smbHits - review matched files")) | Out-Null
}

# --- Explicit "not verified in Azure" rows ---

$rowsDeployedNote.Add((Add-Row "Live subscription: private endpoints attached" "Skipped" "Requires Azure Resource Graph / Portal - not evaluated here")) | Out-Null
$rowsDeployedNote.Add((Add-Row "Live subscription: Key Vault network ACLs / secrets" "Skipped" "Requires cloud context")) | Out-Null
$rowsDeployedNote.Add((Add-Row "Live subscription: Application Insights / Log Analytics ingestion" "Skipped" "Requires cloud context")) | Out-Null
$rowsDeployedNote.Add((Add-Row "terraform apply" "Skipped" "Never run from this script")) | Out-Null

[string] $generatedUtc = [DateTime]::UtcNow.ToString('o')

[string] $md = @"
# Production profile preflight (repo-local)

Generated (UTC): **$generatedUtc**

**Sources:** Narrative alignment with [docs/library/AZURE_PRODUCTION_PROFILE.md](../docs/library/AZURE_PRODUCTION_PROFILE.md) and [docs/library/REFERENCE_SAAS_STACK_ORDER.md](../docs/library/REFERENCE_SAAS_STACK_ORDER.md).

**Generate:** ``pwsh ./scripts/Emit-ProductionProfilePreflightMarkdown.ps1`` (from repo root).

---

## A) Repository and IaC readiness (no cloud credentials)

This section validates **files in the clone** and **Terraform layout** only.

| Check | Result | Detail |
| --- | --- | --- |
"@

foreach ($r in $rowsRepo) {
    $md += "`n| $($r.Check) | **$($r.Result)** | $($r.Detail) |"
}

$md += @"

---

## B) Deployed Azure resource verification (not captured here)

These checks require **az login**, subscription access, or portal inspection. They are listed explicitly so readers do not confuse Part A with a **live** production audit.

| Check | Result | Detail |
| --- | --- | --- |
"@

foreach ($r in $rowsDeployedNote) {
    $md += "`n| $($r.Check) | **$($r.Result)** | $($r.Detail) |"
}

$md += @"

---

## Legend

- **Passed** - artefact present or heuristic satisfied.
- **Failed** - fix before treating the repo as production-ready for that dimension (or fix malformed JSON).
- **Skipped** - intentionally not attempted from this script.
- **Not captured** - needs human review or environment-specific values (not a literal cloud API failure from this tool).

**Security:** This script does not print secret values. Connection strings and headers in JSON are checked only for empty vs non-empty.

Do not commit generated reports unless your process attaches them to release evidence; default output path is under ``artifacts/``.
"@

[string] $outAbs = Join-Path $root $MarkdownOut
[string] $dir = Split-Path -Parent $outAbs

if (!(Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
}

[System.IO.File]::WriteAllText($outAbs, $md, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $outAbs" -ForegroundColor Green
