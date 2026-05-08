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

[System.Collections.Generic.List[object]] $rowsIaC = [System.Collections.Generic.List[object]]::new()
[System.Collections.Generic.List[object]] $rowsApiProfile = [System.Collections.Generic.List[object]]::new()
[System.Collections.Generic.List[object]] $rowsWorkerProfile = [System.Collections.Generic.List[object]]::new()
[System.Collections.Generic.List[object]] $rowsReference = [System.Collections.Generic.List[object]]::new()
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

function Merge-PsObjectDeep {
    param(
        [System.Object] $Base,
        [System.Object] $Override
    )

    if ($null -eq $Override) {
        return $Base
    }

    if ($null -eq $Base) {
        return $Override
    }

    $map = [ordered]@{}

    foreach ($p in $Base.PSObject.Properties) {
        $map[$p.Name] = $p.Value
    }

    foreach ($p in $Override.PSObject.Properties) {
        [string] $name = $p.Name
        [object] $ov = $p.Value

        if ($map.Contains($name) -and $map[$name] -is [psobject] -and $ov -is [psobject]) {
            $map[$name] = (Merge-PsObjectDeep -Base $map[$name] -Override $ov)
        }
        else {
            $map[$name] = $ov
        }
    }

    return [pscustomobject]$map
}

function Read-AppsettingsJsonObject {
    param([string]$Rel)

    [string] $raw = Read-RepoText $Rel

    if ([string]::IsNullOrWhiteSpace($raw)) {
        return $null
    }

    try {
        return $raw | ConvertFrom-Json -ErrorAction Stop -AsHashtable:$false
    }
    catch {
        return $null
    }
}

function Get-ResolvedString {
    param([object] $Root, [string[]] $Segments)

    [object] $cur = $Root

    foreach ($s in $Segments) {
        if ($null -eq $cur) {
            return $null
        }

        $cur = $cur.$s
    }

    if ($null -eq $cur) {
        return $null
    }

    return [string]$cur
}

function Get-BoolFromConfig {
    param([object] $Root, [string[]] $Segments, [bool] $Default)

    [string] $s = Get-ResolvedString -Root $Root -Segments $Segments

    if ([string]::IsNullOrWhiteSpace($s)) {
        return $Default
    }

    [bool] $b = $false

    if ([bool]::TryParse($s, [ref]$b)) {
        return $b
    }

    return $Default
}

function Test-ConnectionStringLooksLocalDev {
    param([string]$Cs)

    if ([string]::IsNullOrWhiteSpace($Cs)) {
        return $false
    }

    [string] $t = $Cs.Trim()

    if ($t -match '(?i)localhost|127\.0\.0\.1|\(local\)|\(localdb\)|trusted_connection\s*=\s*true') {
        return $true
    }

    return $false
}

function Add-ApiProductionProfileChecks {
    param(
        [System.Collections.Generic.List[object]] $Rows,
        [string] $MergeLabel
    )

    [object] $base = Read-AppsettingsJsonObject "ArchLucid.Api/appsettings.json"
    [object] $prodOverlay = Read-AppsettingsJsonObject "ArchLucid.Api/appsettings.Production.json"

    if ($null -eq $base) {
        $Rows.Add((Add-Row "ArchLucid.Api/appsettings.json parses as JSON" "Failed" "missing or invalid")) | Out-Null

        return
    }

    $Rows.Add((Add-Row "ArchLucid.Api/appsettings.json parses as JSON" "Passed" "parsed")) | Out-Null

    if ($null -eq $prodOverlay) {
        $Rows.Add((Add-Row "ArchLucid.Api/appsettings.Production.json present" "Failed" "required production overlay missing")) | Out-Null

        return
    }

    $Rows.Add((Add-Row "ArchLucid.Api/appsettings.Production.json present" "Passed" "file exists")) | Out-Null

    [object] $merged = Merge-PsObjectDeep -Base $base -Override $prodOverlay
    $Rows.Add((Add-Row "API merged production view ($MergeLabel)" "Passed" "ArchLucid.Api/appsettings.json + appsettings.Production.json (values not printed)")) | Out-Null

    [string[]] $requiredPaths = @(
        "ArchLucidAuth.Mode",
        "Observability",
        "Observability.Otlp",
        "Observability.AzureMonitor"
    )

    foreach ($path in $requiredPaths) {
        [object] $cur = $prodOverlay

        foreach ($seg in $path.Split(".")) {
            if ($null -eq $cur -or -not ($cur.PSObject.Properties.Name -contains $seg)) {
                $cur = $null
                break
            }

            $cur = $cur.$seg
        }

        if ($null -ne $cur) {
            $Rows.Add((Add-Row "appsettings.Production.json requires key path: $path (overlay)" "Passed" "present")) | Out-Null
        }
        else {
            $Rows.Add((Add-Row "appsettings.Production.json requires key path: $path (overlay)" "Failed" "missing")) | Out-Null
        }
    }

    [string] $authModeRaw = Get-ResolvedString -Root $merged -Segments @("ArchLucidAuth", "Mode")
    [string] $authMode = if ($null -eq $authModeRaw) { "" } else { $authModeRaw.Trim() }

    [bool] $apiKeyEnabled = Get-BoolFromConfig -Root $merged -Segments @("Authentication", "ApiKey", "Enabled") -Default $false
    [bool] $devBypassAll = Get-BoolFromConfig -Root $merged -Segments @("Authentication", "ApiKey", "DevelopmentBypassAll") -Default $false
    [bool] $requireJwtProd = Get-BoolFromConfig -Root $merged -Segments @("ArchLucidAuth", "RequireJwtBearerInProduction") -Default $false

    if ($devBypassAll) {
        $Rows.Add((Add-Row "Production safety: Authentication:ApiKey:DevelopmentBypassAll" "Failed" "must be false (keys: Authentication:ApiKey:DevelopmentBypassAll)")) | Out-Null
    }
    else {
        $Rows.Add((Add-Row "Production safety: Authentication:ApiKey:DevelopmentBypassAll" "Passed" "false or absent")) | Out-Null
    }

    if ([string]::Equals($authMode, "DevelopmentBypass", [System.StringComparison]::OrdinalIgnoreCase)) {
        $Rows.Add((Add-Row "ArchLucidAuth:Mode (merged production sample)" "Failed" "DevelopmentBypass is not permitted for production profile")) | Out-Null
    }
    elseif ([string]::Equals($authMode, "ApiKey", [System.StringComparison]::OrdinalIgnoreCase)) {
        $Rows.Add((Add-Row "ArchLucidAuth:Mode (merged production sample)" "Failed" "ApiKey is rejected for this readiness report; use JwtBearer (see docs/library/SECURITY.md)")) | Out-Null
    }
    elseif ([string]::Equals($authMode, "JwtBearer", [System.StringComparison]::OrdinalIgnoreCase)) {
        $Rows.Add((Add-Row "ArchLucidAuth:Mode (merged production sample)" "Passed" "JwtBearer")) | Out-Null
    }
    else {
        $Rows.Add((Add-Row "ArchLucidAuth:Mode (merged production sample)" "Warning" "unexpected or empty; set ArchLucidAuth:Mode")) | Out-Null
    }

    if ($requireJwtProd -and ![string]::Equals($authMode, "JwtBearer", [System.StringComparison]::OrdinalIgnoreCase)) {
        $Rows.Add((Add-Row "ArchLucidAuth:RequireJwtBearerInProduction vs ArchLucidAuth:Mode" "Failed" "RequireJwtBearerInProduction=true requires ArchLucidAuth:Mode=JwtBearer")) | Out-Null
    }
    elseif ($requireJwtProd) {
        $Rows.Add((Add-Row "ArchLucidAuth:RequireJwtBearerInProduction vs ArchLucidAuth:Mode" "Passed" "JWT required flag consistent with JwtBearer")) | Out-Null
    }
    else {
        $Rows.Add((Add-Row "ArchLucidAuth:RequireJwtBearerInProduction" "Warning" "optional (default false); set true for regulated Entra-only SaaS (keys: ArchLucidAuth:RequireJwtBearerInProduction)")) | Out-Null
    }

    if ([string]::Equals($authMode, "JwtBearer", [System.StringComparison]::OrdinalIgnoreCase)) {
        [string] $authorityRaw = Get-ResolvedString -Root $merged -Segments @("ArchLucidAuth", "Authority")
        [string] $pemRaw = Get-ResolvedString -Root $merged -Segments @("ArchLucidAuth", "JwtSigningPublicKeyPemPath")
        [string] $authority = if ($null -eq $authorityRaw) { "" } else { $authorityRaw.Trim() }
        [string] $pemPath = if ($null -eq $pemRaw) { "" } else { $pemRaw.Trim() }

        if ($authority -match '<tenant-id>' -or $authority -match 'your-tenant') {
            $Rows.Add((Add-Row "JWT: ArchLucidAuth:Authority placeholder" "Warning" "replace template tenant segment before production (key: ArchLucidAuth:Authority)")) | Out-Null
        }
        elseif ([string]::IsNullOrWhiteSpace($authority) -and [string]::IsNullOrWhiteSpace($pemPath)) {
            $Rows.Add((Add-Row "JWT: ArchLucidAuth:Authority or JwtSigningPublicKeyPemPath" "Failed" "JwtBearer requires ArchLucidAuth:Authority (Entra/OIDC) or PEM path for local validation (non-prod)")) | Out-Null
        }
        elseif (![string]::IsNullOrWhiteSpace($pemPath)) {
            $Rows.Add((Add-Row "JWT: local PEM path in production-named profile" "Failed" "ArchLucidAuth:JwtSigningPublicKeyPemPath is for non-production; use Entra Authority in production")) | Out-Null
        }
        else {
            $Rows.Add((Add-Row "JWT: ArchLucidAuth:Authority present" "Passed" "values not printed")) | Out-Null
        }
    }

    if ($apiKeyEnabled) {
        $Rows.Add((Add-Row "Authentication:ApiKey:Enabled (merged production sample)" "Failed" "API key authentication must be disabled for this report's production bar; use JwtBearer")) | Out-Null
    }
    else {
        $Rows.Add((Add-Row "Authentication:ApiKey:Enabled (merged production sample)" "Passed" "false or absent")) | Out-Null
    }

    [string] $sqlCsRaw = Get-ResolvedString -Root $merged -Segments @("ConnectionStrings", "ArchLucid")
    [string] $sqlCs = if ($null -eq $sqlCsRaw) { "" } else { $sqlCsRaw }

    if ([string]::IsNullOrWhiteSpace($sqlCs)) {
        $Rows.Add((Add-Row "SQL: ConnectionStrings:ArchLucid (merged JSON)" "Warning" "empty in repo JSON — inject @Microsoft.KeyVault reference or env at deploy (key: ConnectionStrings:ArchLucid)")) | Out-Null
    }
    elseif (Test-ConnectionStringLooksLocalDev -Cs $sqlCs) {
        $Rows.Add((Add-Row "SQL: ConnectionStrings:ArchLucid (merged JSON)" "Failed" "localhost/Trusted_Connection-style connection string must not ship to production")) | Out-Null
    }
    elseif ($sqlCs.TrimStart().StartsWith("@Microsoft.KeyVault", [System.StringComparison]::OrdinalIgnoreCase)) {
        $Rows.Add((Add-Row "SQL: ConnectionStrings:ArchLucid (merged JSON)" "Passed" "Key Vault reference shape (value not printed)")) | Out-Null
    }
    else {
        $Rows.Add((Add-Row "SQL: ConnectionStrings:ArchLucid (merged JSON)" "Warning" "non-empty literal in JSON — prefer Key Vault reference for production")) | Out-Null
    }

    [string] $storageProviderRaw = Get-ResolvedString -Root $merged -Segments @("ArchLucid", "StorageProvider")
    [string] $storageProvider = if ($null -eq $storageProviderRaw) { "" } else { $storageProviderRaw.Trim() }

    if ([string]::Equals($storageProvider, "InMemory", [System.StringComparison]::OrdinalIgnoreCase)) {
        $Rows.Add((Add-Row "ArchLucid:StorageProvider (merged)" "Failed" "InMemory is not permitted for production-like hosts")) | Out-Null
    }
    else {
        $Rows.Add((Add-Row "ArchLucid:StorageProvider (merged)" "Passed" "Sql or non-ephemeral value")) | Out-Null
    }

    [string] $kvUriRaw = Get-ResolvedString -Root $merged -Segments @("ArchLucid", "Secrets", "KeyVaultUri")
    [string] $kvUri = if ($null -eq $kvUriRaw) { "" } else { $kvUriRaw.Trim() }

    if ([string]::IsNullOrWhiteSpace($kvUri)) {
        $Rows.Add((Add-Row "ArchLucid:Secrets:KeyVaultUri (merged JSON)" "Warning" "empty in repo — optional when using App Service/Container Apps Key Vault references directly")) | Out-Null
    }
    else {
        $Rows.Add((Add-Row "ArchLucid:Secrets:KeyVaultUri (merged JSON)" "Passed" "non-empty (value not printed)")) | Out-Null
    }

    [bool] $redactOn = Get-BoolFromConfig -Root $merged -Segments @("LlmPromptRedaction", "Enabled") -Default $true

    if (!$redactOn) {
        $Rows.Add((Add-Row "LlmPromptRedaction:Enabled (merged)" "Failed" "must be true before production LLM paths (key: LlmPromptRedaction:Enabled)")) | Out-Null
    }
    else {
        $Rows.Add((Add-Row "LlmPromptRedaction:Enabled (merged)" "Passed" "true")) | Out-Null
    }

    [bool] $demoOn = Get-BoolFromConfig -Root $merged -Segments @("Demo", "Enabled") -Default $false

    if ($demoOn) {
        $Rows.Add((Add-Row "Demo:Enabled (merged)" "Failed" "Demo mode must be false for production")) | Out-Null
    }
    else {
        $Rows.Add((Add-Row "Demo:Enabled (merged)" "Passed" "false")) | Out-Null
    }

    [string] $stripeKeyRaw = Get-ResolvedString -Root $merged -Segments @("Billing", "Stripe", "SecretKey")
    [string] $stripeWhRaw = Get-ResolvedString -Root $merged -Segments @("Billing", "Stripe", "WebhookSigningSecret")
    [string] $billingProviderRaw = Get-ResolvedString -Root $merged -Segments @("Billing", "Provider")
    [string] $stripeKey = if ($null -eq $stripeKeyRaw) { "" } else { $stripeKeyRaw }
    [string] $stripeWh = if ($null -eq $stripeWhRaw) { "" } else { $stripeWhRaw }
    [string] $billingProvider = if ($null -eq $billingProviderRaw) { "" } else { $billingProviderRaw.Trim() }


    if ([string]::Equals($billingProvider, "Stripe", [System.StringComparison]::OrdinalIgnoreCase)) {
        if ($stripeKey.TrimStart().StartsWith("sk_live_", [System.StringComparison]::Ordinal) -and
            [string]::IsNullOrWhiteSpace($stripeWh)) {
            $Rows.Add((Add-Row "Billing:Stripe live key vs WebhookSigningSecret (merged JSON)" "Failed" "sk_live_* requires Billing:Stripe:WebhookSigningSecret (values not printed)")) | Out-Null
        }
        else {
            $Rows.Add((Add-Row "Billing:Stripe live key vs WebhookSigningSecret (merged JSON)" "Passed" "no unsafe sk_live_* without webhook secret in merged JSON")) | Out-Null
        }

        if ([string]::IsNullOrWhiteSpace($stripeKey)) {
            $Rows.Add((Add-Row "Billing:Stripe:SecretKey presence (merged JSON)" "Warning" "empty in repo overlay — configure at deploy via Key Vault (key: Billing:Stripe:SecretKey)")) | Out-Null
        }
        else {
            $Rows.Add((Add-Row "Billing:Stripe:SecretKey presence (merged JSON)" "Passed" "non-empty or Key Vault ref (value not printed)")) | Out-Null
        }
    }

    if ([string]::Equals($billingProvider, "AzureMarketplace", [System.StringComparison]::OrdinalIgnoreCase)) {
        [bool] $ga = Get-BoolFromConfig -Root $merged -Segments @("Billing", "AzureMarketplace", "GaEnabled") -Default $false
        [string] $offerRaw = Get-ResolvedString -Root $merged -Segments @("Billing", "AzureMarketplace", "MarketplaceOfferId")
        [string] $offer = if ($null -eq $offerRaw) { "" } else { $offerRaw.Trim() }

        if ($ga -and [string]::IsNullOrWhiteSpace($offer)) {
            $Rows.Add((Add-Row "Billing:AzureMarketplace:GaEnabled vs MarketplaceOfferId" "Failed" "GaEnabled=true requires Billing:AzureMarketplace:MarketplaceOfferId")) | Out-Null
        }
        elseif ($ga) {
            $Rows.Add((Add-Row "Billing:AzureMarketplace:GaEnabled vs MarketplaceOfferId" "Passed" "offer id present")) | Out-Null
        }
    }

    [bool] $requireTelemetry = Get-BoolFromConfig -Root $merged -Segments @("ProductionValidation", "RequireTelemetryExport") -Default $false
    [string] $otlpEndpointRaw = Get-ResolvedString -Root $merged -Segments @("Observability", "Otlp", "Endpoint")
    [string] $otlpEndpoint = if ($null -eq $otlpEndpointRaw) { "" } else { $otlpEndpointRaw }
    [bool] $otlpEnabled = Get-BoolFromConfig -Root $merged -Segments @("Observability", "Otlp", "Enabled") -Default $false
    [string] $aiCsRaw = Get-ResolvedString -Root $merged -Segments @("Observability", "AzureMonitor", "ApplicationInsightsConnectionString")
    [string] $aiCs = if ($null -eq $aiCsRaw) { "" } else { $aiCsRaw }
    [bool] $promOn = Get-BoolFromConfig -Root $merged -Segments @("Observability", "Prometheus", "Enabled") -Default $false

    [bool] $otlpActive = $otlpEnabled -and ![string]::IsNullOrWhiteSpace($otlpEndpoint)

    [bool] $aiOk = ![string]::IsNullOrWhiteSpace($aiCs)

    [bool] $sinkConfigured = $otlpActive -or $aiOk -or $promOn

    if ($requireTelemetry -and !$sinkConfigured) {
        $Rows.Add((Add-Row "Observability export (ProductionValidation:RequireTelemetryExport)" "Failed" "set Observability:Otlp:Endpoint, Application Insights connection string, or Observability:Prometheus:Enabled")) | Out-Null
    }
    elseif (!$sinkConfigured) {
        $Rows.Add((Add-Row "Observability export (repo JSON only; env may inject APPLICATIONINSIGHTS_CONNECTION_STRING)" "Warning" "no OTLP endpoint, AI connection string, or Prometheus in merged JSON")) | Out-Null
    }
    else {
        $Rows.Add((Add-Row "Observability export path (merged JSON)" "Passed" "OTLP and/or Application Insights and/or Prometheus present (values not printed)")) | Out-Null
    }

    if ($otlpEnabled -and [string]::IsNullOrWhiteSpace($otlpEndpoint)) {
        $Rows.Add((Add-Row "Observability:Otlp:Enabled vs Endpoint" "Failed" "Observability:Otlp:Enabled=true but Endpoint empty")) | Out-Null
    }
    elseif ($otlpEnabled) {
        $Rows.Add((Add-Row "Observability:Otlp:Enabled vs Endpoint" "Passed" "consistent")) | Out-Null
    }

    if (Test-FileOk "ArchLucid.Api/appsettings.KeyVault.sample.json") {
        [string] $kvSample = Read-RepoText "ArchLucid.Api/appsettings.KeyVault.sample.json"

        if ($null -ne $kvSample -and $kvSample -match '@Microsoft\.KeyVault') {
            $Rows.Add((Add-Row "Key Vault reference sample: appsettings.KeyVault.sample.json" "Passed" "documents @Microsoft.KeyVault for ConnectionStrings:ArchLucid and secrets")) | Out-Null
        }
        else {
            $Rows.Add((Add-Row "Key Vault reference sample: appsettings.KeyVault.sample.json" "Not captured" "file present but @Microsoft.KeyVault pattern not matched")) | Out-Null
        }
    }
    else {
        $Rows.Add((Add-Row "Key Vault reference sample: appsettings.KeyVault.sample.json" "Failed" "missing")) | Out-Null
    }

    if (Test-FileOk "ArchLucid.Api/appsettings.Staging.json") {
        $Rows.Add((Add-Row "Staging-only template: appsettings.Staging.json" "Skipped" "not evaluated as production; optional cutover staging overlay")) | Out-Null
    }

    # Optional SMB / literal 445 check on production overlay text
    [string] $prodRaw = Read-RepoText "ArchLucid.Api/appsettings.Production.json"

    if ($null -ne $prodRaw -and $prodRaw -notmatch "445") {
        $Rows.Add((Add-Row "No SMB port 445 literal in appsettings.Production.json" "Passed" "no 445")) | Out-Null
    }
    elseif ($null -ne $prodRaw) {
        $Rows.Add((Add-Row "No SMB port 445 literal in appsettings.Production.json" "Failed" "unexpected 445 reference")) | Out-Null
    }
}

function Add-WorkerProfileChecks {
    param([System.Collections.Generic.List[object]] $Rows)

    if (Test-FileOk "ArchLucid.Worker/appsettings.json") {
        $Rows.Add((Add-Row "ArchLucid.Worker/appsettings.json present" "Passed" "file exists")) | Out-Null

        [object] $wj = Read-AppsettingsJsonObject "ArchLucid.Worker/appsettings.json"

        if ($null -eq $wj) {
            $Rows.Add((Add-Row "ArchLucid.Worker/appsettings.json parses as JSON" "Failed" "parse error")) | Out-Null
        }
        else {
            $Rows.Add((Add-Row "ArchLucid.Worker/appsettings.json parses as JSON" "Passed" "parsed")) | Out-Null
        }
    }
    else {
        $Rows.Add((Add-Row "ArchLucid.Worker/appsettings.json present" "Failed" "missing")) | Out-Null
    }

    if (Test-FileOk "ArchLucid.Worker/appsettings.Production.json") {
        $Rows.Add((Add-Row "ArchLucid.Worker/appsettings.Production.json" "Passed" "present (uncommon)")) | Out-Null
    }
    else {
        $Rows.Add((Add-Row "ArchLucid.Worker/appsettings.Production.json" "Warning" "absent — production Worker settings must come from Container Apps env / Key Vault (same keys as API host Core validation)")) | Out-Null
    }

    [bool] $demoWorker = Get-BoolFromConfig -Root (Read-AppsettingsJsonObject "ArchLucid.Worker/appsettings.json") -Segments @("Demo", "Enabled") -Default $false

    if ($demoWorker) {
        $Rows.Add((Add-Row "Worker Demo:Enabled" "Failed" "Demo:Enabled must be false for production")) | Out-Null
    }
    else {
        $Rows.Add((Add-Row "Worker Demo:Enabled" "Passed" "false")) | Out-Null
    }
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
        $rowsIaC.Add((Add-Row "Terraform root present: $p" "Passed" "directory exists")) | Out-Null
    }
    else {
        $rowsIaC.Add((Add-Row "Terraform root present: $p" "Failed" "missing")) | Out-Null
    }
}

[string[]] $tfRootsOptional = @(
    "infra/terraform-servicebus",
    "infra/terraform-entra",
    "infra/terraform-otel-collector"
)

foreach ($p in $tfRootsOptional) {
    if (Test-DirOk $p) {
        $rowsIaC.Add((Add-Row "Optional Terraform root present: $p" "Passed" "directory exists")) | Out-Null
    }
    else {
        $rowsIaC.Add((Add-Row "Optional Terraform root present: $p" "Skipped" "not required for minimal profile")) | Out-Null
    }
}

$tfExe = Get-Command terraform -ErrorAction SilentlyContinue

if ($null -ne $tfExe) {
    Push-Location $root
    try {
        & terraform fmt -check -recursive infra 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $rowsIaC.Add((Add-Row "terraform fmt -check -recursive infra" "Passed" "format OK")) | Out-Null
        }
        else {
            $rowsIaC.Add((Add-Row "terraform fmt -check -recursive infra" "Failed" "run: terraform fmt -recursive infra")) | Out-Null
        }
    }
    finally {
        Pop-Location
    }
}
else {
    $rowsIaC.Add((Add-Row "terraform fmt -check -recursive infra" "Skipped" "terraform not on PATH - run locally after install")) | Out-Null
}

$rowsIaC.Add((Add-Row 'terraform validate (per root)' 'Skipped' 'Requires terraform init per directory (network for providers); do not run apply. Example: cd infra/terraform-private; terraform init -backend=false; terraform validate')) | Out-Null

# Private endpoint posture (variables + operator example only — no subscription inspection)
[string] $privateVars = Read-RepoText "infra/terraform-private/variables.tf"

if ($null -ne $privateVars) {
    if ($privateVars -match 'variable\s+"enable_private_data_plane"' -and $privateVars -match "private_endpoints_subnet") {
        $rowsIaC.Add((Add-Row "terraform-private: private endpoint / data-plane toggle variables" "Passed" "enable_private_data_plane and subnet variables declared")) | Out-Null
    }
    else {
        $rowsIaC.Add((Add-Row "terraform-private: private endpoint / data-plane toggle variables" "Failed" "expected variables not found in variables.tf")) | Out-Null
    }
}
else {
    $rowsIaC.Add((Add-Row "terraform-private: private endpoint / data-plane toggle variables" "Failed" "infra/terraform-private/variables.tf missing")) | Out-Null
}

[string] $privateTfvarsExample = Read-RepoText "infra/terraform-private/terraform.tfvars.example"

if ($null -ne $privateTfvarsExample -and $privateTfvarsExample -match '(?m)^\s*enable_private_data_plane\s*=\s*true\s*$') {
    $rowsIaC.Add((Add-Row "terraform-private: example tfvars recommends private data plane" "Passed" "terraform.tfvars.example sets enable_private_data_plane = true")) | Out-Null
}
elseif ($null -ne $privateTfvarsExample) {
    $rowsIaC.Add((Add-Row "terraform-private: example tfvars recommends private data plane" "Not captured" "terraform.tfvars.example does not set enable_private_data_plane = true")) | Out-Null
}
else {
    $rowsIaC.Add((Add-Row "terraform-private: example tfvars recommends private data plane" "Failed" "terraform.tfvars.example missing")) | Out-Null
}

[string] $kvProviders = Read-RepoText "infra/terraform-keyvault/providers.tf"

if ($null -ne $kvProviders -and $kvProviders -match 'provider\s+"azurerm"' -and $kvProviders -match 'key_vault\s*\{') {
    [bool] $hasPurge = $kvProviders -match "purge_soft_delete"
    [bool] $hasRecover = $kvProviders -match "recover_soft_deleted"

    if ($hasPurge -and $hasRecover) {
        $rowsIaC.Add((Add-Row "terraform-keyvault: azurerm key_vault feature block" "Passed" "purge_soft_delete / recover_soft_deleted present (values not printed)")) | Out-Null
    }
    else {
        $rowsIaC.Add((Add-Row "terraform-keyvault: azurerm key_vault feature block" "Not captured" "key_vault block present but expected flags not matched")) | Out-Null
    }
}
else {
    $rowsIaC.Add((Add-Row "terraform-keyvault: azurerm key_vault feature block" "Failed" "providers.tf missing or no key_vault block")) | Out-Null
}

[string] $caVars = Read-RepoText "infra/terraform-container-apps/variables.tf"

if ($null -ne $caVars -and $caVars -match "container_apps_subnet_id" -and $caVars -match "container_apps_internal_load_balancer") {
    $rowsIaC.Add((Add-Row "terraform-container-apps: VNet integration / internal LB variables" "Passed" "subnet + internal_load_balancer variables declared for private posture")) | Out-Null
}
elseif ($null -ne $caVars) {
    $rowsIaC.Add((Add-Row "terraform-container-apps: VNet integration / internal LB variables" "Not captured" "expected variable names not found")) | Out-Null
}
else {
    $rowsIaC.Add((Add-Row "terraform-container-apps: VNet integration / internal LB variables" "Failed" "variables.tf missing")) | Out-Null
}

# Storage: blob public_network_access is configurable (no SMB / file share authority path in IaC sample)
[string] $storageMain = Read-RepoText "infra/terraform-storage/main.tf"

if ($null -ne $storageMain -and $storageMain -match "public_network_access_enabled") {
    $rowsIaC.Add((Add-Row "terraform-storage: network access knob present (blob/queue account)" "Passed" "public_network_access_enabled wired - tune via tfvars for deny-by-default posture")) | Out-Null
}
elseif ($null -ne $storageMain) {
    $rowsIaC.Add((Add-Row "terraform-storage: network access knob present (blob/queue account)" "Not captured" "public_network_access_enabled not found in main.tf")) | Out-Null
}
else {
    $rowsIaC.Add((Add-Row "terraform-storage: network access knob present (blob/queue account)" "Failed" "infra/terraform-storage/main.tf missing")) | Out-Null
}

[string] $caMainTf = Read-RepoText "infra/terraform-container-apps/main.tf"

if ($null -ne $caMainTf -and $caMainTf -match 'resource\s+"azurerm_container_app"\s+"api"' -and $caMainTf -match "SystemAssigned") {
    $rowsIaC.Add((Add-Row "terraform-container-apps: API managed identity block" "Passed" "SystemAssigned identity present on azurerm_container_app.api (snippet — no Azure call)")) | Out-Null
}
elseif ($null -ne $caMainTf) {
    $rowsIaC.Add((Add-Row "terraform-container-apps: API managed identity block" "Not captured" "expected SystemAssigned snippet not matched")) | Out-Null
}
else {
    $rowsIaC.Add((Add-Row "terraform-container-apps: API managed identity block" "Failed" "main.tf unreadable")) | Out-Null
}

if ($null -ne $caMainTf -and $caMainTf -match 'dynamic\s+"secret"' -and $caMainTf -match "queue-scale-connection") {
    $rowsIaC.Add((Add-Row "terraform-container-apps: optional Container App secrets (queue scaler)" "Passed" "secret block pattern for durable worker scaler present")) | Out-Null
}

Add-ApiProductionProfileChecks -Rows $rowsApiProfile -MergeLabel "appsettings.json + appsettings.Production.json"
Add-WorkerProfileChecks -Rows $rowsWorkerProfile

if (Test-FileOk "ArchLucid.Api/appsettings.SaaS.json") {
    $rowsReference.Add((Add-Row "appsettings.SaaS.json present (optional SaaS chain)" "Passed" "see docs/library/REFERENCE_SAAS_STACK_ORDER.md")) | Out-Null
}
else {
    $rowsReference.Add((Add-Row "appsettings.SaaS.json present (optional SaaS chain)" "Skipped" "optional")) | Out-Null
}

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
    $rowsReference.Add((Add-Row "Heuristic: no risky :445 / SMB exposure hints in infra *.tf/*.tfvars" "Passed" "no .tf or .tfvars files matched risky pattern")) | Out-Null
}
else {
    $rowsReference.Add((Add-Row "Heuristic: no risky :445 / SMB exposure hints in infra *.tf/*.tfvars" "Not captured" "matches=$smbHits - review matched files")) | Out-Null
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

**Alignment:** Mirrors concerns enforced in `ArchLucid.Host.Core/Startup/Validation/Rules/` (authentication, billing production safety, prompt redaction, observability hints) — this script stays **offline** (no weakening of runtime validation).

---

## A) Repository and IaC readiness (no cloud credentials)

This section validates **files in the clone** and **Terraform layout** only.

| Check | Result | Detail |
| --- | --- | --- |
"@

foreach ($r in $rowsIaC) {
    $md += "`n| $($r.Check) | **$($r.Result)** | $($r.Detail) |"
}

$md += @"

---

## B) API merged production profile (appsettings chain)

Evaluates **`ArchLucid.Api/appsettings.json` merged with `appsettings.Production.json`** the same way the host overlays configuration (JSON only — deployment may override via environment variables).

| Check | Result | Detail |
| --- | --- | --- |
"@

foreach ($r in $rowsApiProfile) {
    $md += "`n| $($r.Check) | **$($r.Result)** | $($r.Detail) |"
}

$md += @"

---

## C) Worker configuration files

`ArchLucid.Worker` carries a minimal **`appsettings.json`**; operators typically inject production settings via Container Apps env or Key Vault references (not printed here).

| Check | Result | Detail |
| --- | --- | --- |
"@

foreach ($r in $rowsWorkerProfile) {
    $md += "`n| $($r.Check) | **$($r.Result)** | $($r.Detail) |"
}

$md += @"

---

## D) Repository reference / heuristic checks

| Check | Result | Detail |
| --- | --- | --- |
"@

foreach ($r in $rowsReference) {
    $md += "`n| $($r.Check) | **$($r.Result)** | $($r.Detail) |"
}

$md += @"

---

## E) Deployed Azure resource verification (not captured here)

These checks require **az login**, subscription access, or portal inspection. They are listed explicitly so readers do not confuse Sections A-D with a **live** production audit.

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
- **Warning** - not a failing gate by itself here, but operators should reconcile before declaring production (often template/env injection gaps).
- **Failed** - production-dangerous or malformed JSON overlay; remediate before production.
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
