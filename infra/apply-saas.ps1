<#
.SYNOPSIS
    Opinionated Terraform plan/apply for the ArchLucid SaaS profile (see docs/REFERENCE_SAAS_STACK_ORDER.md).

.DESCRIPTION
    **Default:** runs only `infra/terraform-pilot` — the canonical pilot profile (cost knobs + nested stack metadata; no Azure resources in that root).

    **Opt-in (-MultiRoot):** runs `terraform init` then `terraform plan` (default) or `terraform apply -auto-approve` for each infrastructure root in dependency order. Backends and tfvars are still operator-supplied.

    The pilot profile root is **not** included in the -MultiRoot list — it does not provision Azure resources.

    **TB-092:** After Container Apps exist, a second apply on `terraform-keyvault` (and optionally `terraform-private` when `key_vault_id` is set) grants Key Vault Secrets User to API/Worker system-assigned principal IDs from `terraform output`.

.PARAMETER Apply
    When set, runs apply instead of plan.

.PARAMETER MultiRoot
    When set, plans/applies each nested infrastructure root in order (separate state per directory — advanced path).

.PARAMETER TerraformRoots
    Optional override list of directory paths relative to repo root (supersedes -MultiRoot default lists).
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [switch] $Apply,
    [switch] $MultiRoot,
    [string[]] $TerraformRoots = $null
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

[string[]] $pilotProfileOnly = @(
    "infra/terraform-pilot"
)

[string[]] $multiRootSequence = @(
    "infra/terraform-private",
    "infra/terraform-keyvault",
    "infra/terraform-sql-failover",
    "infra/terraform-storage",
    "infra/terraform-servicebus",
    "infra/terraform-logicapps",
    "infra/terraform-openai",
    "infra/terraform-entra",
    "infra/terraform-container-apps",
    "infra/terraform-edge",
    "infra/terraform",
    "infra/terraform-monitoring",
    "infra/terraform-orchestrator"
)

[string[]] $roots = if ($null -ne $TerraformRoots -and $TerraformRoots.Length -gt 0) {
    $TerraformRoots
}
elseif ($MultiRoot) {
    $multiRootSequence
}
else {
    $pilotProfileOnly
}

function Get-TerraformRootOutputValue {
    param(
        [string] $RelativeRoot,
        [string] $OutputName
    )

    $dir = Join-Path $repoRoot $RelativeRoot
    if (-not (Test-Path -LiteralPath $dir)) {
        return $null
    }

    Push-Location -LiteralPath $dir
    try {
        $json = terraform output -json 2>$null
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($json)) {
            return $null
        }

        $obj = $json | ConvertFrom-Json
        if (-not ($obj.PSObject.Properties.Name -contains $OutputName)) {
            return $null
        }

        $value = $obj.$OutputName.value
        if ($null -eq $value) {
            return $null
        }

        return [string]$value
    }
    finally {
        Pop-Location
    }
}

function Invoke-TerraformKeyVaultWorkloadRbacPass {
    if (-not $Apply) {
        return
    }

    $apiPrincipal = Get-TerraformRootOutputValue -RelativeRoot "infra/terraform-container-apps" -OutputName "api_system_assigned_principal_id"
    $workerPrincipal = Get-TerraformRootOutputValue -RelativeRoot "infra/terraform-container-apps" -OutputName "worker_system_assigned_principal_id"

    if ([string]::IsNullOrWhiteSpace($apiPrincipal) -and [string]::IsNullOrWhiteSpace($workerPrincipal)) {
        Write-Host "TB-092: Skipping Key Vault workload RBAC pass (no Container App principal_id outputs)." -ForegroundColor DarkYellow
        return
    }

    $apiArg = if ([string]::IsNullOrWhiteSpace($apiPrincipal)) { "" } else { $apiPrincipal.Trim() }
    $workerArg = if ([string]::IsNullOrWhiteSpace($workerPrincipal)) { "" } else { $workerPrincipal.Trim() }

    $keyVaultDir = Join-Path $repoRoot "infra/terraform-keyvault"
    if (Test-Path -LiteralPath $keyVaultDir) {
        Write-Host "==> TB-092: infra/terraform-keyvault (workload Key Vault Secrets User)" -ForegroundColor Cyan
        Push-Location -LiteralPath $keyVaultDir
        try {
            terraform init -input=false | Write-Host
            terraform apply -input=false -auto-approve `
                -var="api_managed_identity_principal_id=$apiArg" `
                -var="worker_managed_identity_principal_id=$workerArg" | Write-Host
        }
        finally {
            Pop-Location
        }
    }

    $principalIds = @()
    if (-not [string]::IsNullOrWhiteSpace($apiArg)) { $principalIds += $apiArg }
    if (-not [string]::IsNullOrWhiteSpace($workerArg)) { $principalIds += $workerArg }
    $principalIds = $principalIds | Select-Object -Unique

    if ($principalIds.Count -eq 0) {
        return
    }

    $privateDir = Join-Path $repoRoot "infra/terraform-private"
    if (-not (Test-Path -LiteralPath $privateDir)) {
        return
    }

    $hclList = ($principalIds | ForEach-Object { '"' + $_ + '"' }) -join ","
    Write-Host "==> TB-092: infra/terraform-private (key_vault_workload_principal_ids when key_vault_id set)" -ForegroundColor Cyan
    Push-Location -LiteralPath $privateDir
    try {
        terraform init -input=false | Write-Host
        terraform apply -input=false -auto-approve -var="key_vault_workload_principal_ids=[$hclList]" | Write-Host
    }
    finally {
        Pop-Location
    }
}

foreach ($relative in $roots) {
    $dir = Join-Path $repoRoot $relative
    if (-not (Test-Path $dir)) {
        Write-Warning "Skipping missing directory: $relative"
        continue
    }

    Write-Host "==> $relative : terraform init" -ForegroundColor Cyan
    Push-Location $dir
    try {
        terraform init -input=false | Write-Host

        if ($Apply) {
            Write-Host "==> $relative : terraform apply" -ForegroundColor Yellow
            terraform apply -input=false -auto-approve | Write-Host
        }
        else {
            Write-Host "==> $relative : terraform plan" -ForegroundColor Yellow
            terraform plan -input=false | Write-Host
        }
    }
    finally {
        Pop-Location
    }
}

if ($MultiRoot) {
    if ($Apply) {
        Invoke-TerraformKeyVaultWorkloadRbacPass
    }
    else {
        Write-Host "TB-092: After Container Apps apply, re-run Key Vault (and private when key_vault_id is set) with API/Worker principal_id outputs, or use -Apply to run the automated pass." -ForegroundColor DarkYellow
    }

    Write-Host "Done (multi-root opt-in path). Review plans before passing -Apply." -ForegroundColor Green
}
else {
    Write-Host "Done (pilot profile only). For full stack order per root, use: ./infra/apply-saas.ps1 -MultiRoot" -ForegroundColor Green
}
