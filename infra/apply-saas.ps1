<#
.SYNOPSIS
    Opinionated Terraform plan/apply for the ArchLucid SaaS profile (see docs/library/REFERENCE_SAAS_STACK_ORDER.md).

.DESCRIPTION
    **Default:** runs only `infra/terraform-pilot` — the canonical pilot profile (cost knobs + nested stack metadata; no Azure resources in that root).

    **Opt-in (-MultiRoot):** applies hosted SaaS leaf roots as three operator waves (foundation / platform / app). Each leaf keeps its own state file so resource addresses do not change. Composition roots (`infra/terraform-foundation`, `infra/terraform-platform`, `infra/terraform-app`) are metadata contracts — they are validated, not Azure-applied.

    **-LegacyLeafRoots:** plans/applies the full `$multiRootSequence` including `terraform-orchestrator` (isolation path).

    **TB-656:** When `terraform-keyvault` creates user-assigned API/Worker identities (default), Key Vault RBAC is granted on the first keyvault apply — no TB-092 second pass.

    **TB-092 (legacy):** After Container Apps exist, a second apply on `terraform-keyvault` (and optionally `terraform-private` when `key_vault_id` is set) grants Key Vault Secrets User to API/Worker system-assigned principal IDs from `terraform output`.

.PARAMETER Apply
    When set, runs apply instead of plan.

.PARAMETER MultiRoot
    When set, plans/applies hosted leaf roots in the three composition waves (separate state per directory).

.PARAMETER LegacyLeafRoots
    When set, plans/applies the full `$multiRootSequence` including `terraform-orchestrator`.

.PARAMETER ValidateOnly
    When set, runs `terraform init -backend=false`, `validate`, and `fmt -check` per selected root (no Azure plan/apply). Landing-zone wrappers default to this mode.

.PARAMETER DryRun
    When set, prints intended terraform commands without executing them.

.PARAMETER VarFile
    Optional `-var-file` passed through to plan/apply (not used for ValidateOnly).

.PARAMETER TerraformRoots
    Optional override list of directory paths relative to repo root (supersedes -MultiRoot / -LegacyLeafRoots lists).
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [switch] $Apply,
    [switch] $MultiRoot,
    [switch] $LegacyLeafRoots,
    [switch] $ValidateOnly,
    [switch] $DryRun,
    [string] $VarFile = "",
    [string[]] $TerraformRoots = $null
)

$ErrorActionPreference = "Stop"

if ($Apply -and $ValidateOnly) {
    throw "Specify only one of -Apply or -ValidateOnly."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

[string[]] $pilotProfileOnly = @(
    "infra/terraform-pilot"
)

# Full leaf list including orchestrator. Keep as an explicit string array so
# scripts/ci/assert_terraform_root_ordering_sync.py can parse it.
[string[]] $multiRootSequence = @(
    "infra/terraform-private",
    "infra/terraform-keyvault",
    "infra/terraform-sql-failover",
    "infra/terraform-storage",
    "infra/terraform-redis",
    "infra/terraform-cosmos",
    "infra/terraform-servicebus",
    "infra/terraform-logicapps",
    "infra/terraform-openai",
    "infra/terraform-acr",
    "infra/terraform-entra",
    "infra/terraform-container-apps",
    "infra/terraform-edge",
    "infra/terraform",
    "infra/terraform-monitoring",
    "infra/terraform-orchestrator"
)

# Quoted so validate-saas-config-consistency.ps1 sees composition roots exist.
[string[]] $hostedCompositionRoots = @(
    "infra/terraform-foundation",
    "infra/terraform-platform",
    "infra/terraform-app"
)

[string[]] $foundationWaveLeaves = @(
    "infra/terraform-private",
    "infra/terraform-keyvault"
)

[string[]] $platformWaveLeaves = @(
    "infra/terraform-sql-failover",
    "infra/terraform-storage",
    "infra/terraform-redis",
    "infra/terraform-cosmos",
    "infra/terraform-servicebus",
    "infra/terraform-logicapps",
    "infra/terraform-openai",
    "infra/terraform-acr"
)

[string[]] $appWaveLeaves = @(
    "infra/terraform-entra",
    "infra/terraform-container-apps",
    "infra/terraform-edge",
    "infra/terraform",
    "infra/terraform-monitoring"
)

[string[]] $hostedWaveLeaves = $foundationWaveLeaves + $platformWaveLeaves + $appWaveLeaves

[bool] $operatorSuppliedRoots = ($null -ne $TerraformRoots -and $TerraformRoots.Length -gt 0)
[bool] $legacyIsolationPath = $LegacyLeafRoots -and -not $operatorSuppliedRoots
[bool] $hostedWavePath = $MultiRoot -and -not $legacyIsolationPath -and -not $operatorSuppliedRoots
[bool] $multiRootPath = $hostedWavePath -or $legacyIsolationPath -or $operatorSuppliedRoots

[string[]] $roots = if ($operatorSuppliedRoots) {
    $TerraformRoots
}
elseif ($legacyIsolationPath) {
    $multiRootSequence
}
elseif ($hostedWavePath) {
    $hostedWaveLeaves
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

function Get-TerraformKeyVaultUserAssignedWorkloadOutputs {
    $enabled = Get-TerraformRootOutputValue -RelativeRoot "infra/terraform-keyvault" -OutputName "user_assigned_keyvault_workload_identities_enabled"
    if ($enabled -ne "true") {
        return $null
    }

    return [ordered]@{
        ApiIdentityId     = Get-TerraformRootOutputValue -RelativeRoot "infra/terraform-keyvault" -OutputName "api_keyvault_user_assigned_identity_id"
        ApiClientId       = Get-TerraformRootOutputValue -RelativeRoot "infra/terraform-keyvault" -OutputName "api_keyvault_user_assigned_client_id"
        WorkerIdentityId  = Get-TerraformRootOutputValue -RelativeRoot "infra/terraform-keyvault" -OutputName "worker_keyvault_user_assigned_identity_id"
        WorkerClientId    = Get-TerraformRootOutputValue -RelativeRoot "infra/terraform-keyvault" -OutputName "worker_keyvault_user_assigned_client_id"
        ApiPrincipalId    = Get-TerraformRootOutputValue -RelativeRoot "infra/terraform-keyvault" -OutputName "api_keyvault_user_assigned_principal_id"
        WorkerPrincipalId = Get-TerraformRootOutputValue -RelativeRoot "infra/terraform-keyvault" -OutputName "worker_keyvault_user_assigned_principal_id"
    }
}

function Get-ContainerAppsKeyVaultIdentityVars {
    $uami = Get-TerraformKeyVaultUserAssignedWorkloadOutputs
    if ($null -eq $uami) {
        return @()
    }

    $extraTerraformArgs = @()
    if (-not [string]::IsNullOrWhiteSpace($uami.ApiIdentityId)) {
        $extraTerraformArgs += "-var=api_keyvault_user_assigned_identity_id=$($uami.ApiIdentityId.Trim())"
    }

    if (-not [string]::IsNullOrWhiteSpace($uami.ApiClientId)) {
        $extraTerraformArgs += "-var=api_keyvault_user_assigned_identity_client_id=$($uami.ApiClientId.Trim())"
    }

    if (-not [string]::IsNullOrWhiteSpace($uami.WorkerIdentityId)) {
        $extraTerraformArgs += "-var=worker_keyvault_user_assigned_identity_id=$($uami.WorkerIdentityId.Trim())"
    }

    if (-not [string]::IsNullOrWhiteSpace($uami.WorkerClientId)) {
        $extraTerraformArgs += "-var=worker_keyvault_user_assigned_identity_client_id=$($uami.WorkerClientId.Trim())"
    }

    return $extraTerraformArgs
}

function Invoke-TerraformCommand {
    param(
        [string] $Message,
        [string[]] $TerraformArgs
    )

    Write-Host $Message -ForegroundColor Yellow
    if ($DryRun) {
        Write-Host ("DryRun: terraform " + ($TerraformArgs -join " ")) -ForegroundColor DarkGray
        return
    }

    & terraform @TerraformArgs | Write-Host
    if ($LASTEXITCODE -ne 0) {
        throw "terraform failed ($LASTEXITCODE): $($TerraformArgs -join ' ')"
    }
}

function Invoke-TerraformValidateRoot {
    param([string] $RelativeRoot)

    $dir = Join-Path $repoRoot $RelativeRoot
    if (-not (Test-Path -LiteralPath $dir)) {
        Write-Warning "Skipping missing directory: $RelativeRoot"
        return
    }

    Write-Host "==> $RelativeRoot : terraform validate" -ForegroundColor Cyan
    Push-Location -LiteralPath $dir
    try {
        Invoke-TerraformCommand -Message "==> $RelativeRoot : terraform init -backend=false" -TerraformArgs @("init", "-backend=false", "-input=false")
        Invoke-TerraformCommand -Message "==> $RelativeRoot : terraform validate" -TerraformArgs @("validate")
        Invoke-TerraformCommand -Message "==> $RelativeRoot : terraform fmt -check" -TerraformArgs @("fmt", "-check", "-recursive")
    }
    finally {
        Pop-Location
    }
}

function Invoke-TerraformPlanOrApplyRoot {
    param([string] $RelativeRoot)

    $dir = Join-Path $repoRoot $RelativeRoot
    if (-not (Test-Path -LiteralPath $dir)) {
        Write-Warning "Skipping missing directory: $RelativeRoot"
        return
    }

    Write-Host "==> $RelativeRoot : terraform init" -ForegroundColor Cyan
    Push-Location -LiteralPath $dir
    try {
        Invoke-TerraformCommand -Message "==> $RelativeRoot : terraform init" -TerraformArgs @("init", "-input=false")

        $extraTerraformArgs = @()
        if ($RelativeRoot -eq "infra/terraform-container-apps") {
            $extraTerraformArgs = @(Get-ContainerAppsKeyVaultIdentityVars)
        }

        if (-not [string]::IsNullOrWhiteSpace($VarFile)) {
            $extraTerraformArgs += "-var-file=$VarFile"
        }

        if ($Apply) {
            Invoke-TerraformCommand -Message "==> $RelativeRoot : terraform apply" -TerraformArgs (@("apply", "-input=false", "-auto-approve") + $extraTerraformArgs)
        }
        else {
            Invoke-TerraformCommand -Message "==> $RelativeRoot : terraform plan" -TerraformArgs (@("plan", "-input=false") + $extraTerraformArgs)
        }
    }
    finally {
        Pop-Location
    }
}

function Invoke-TerraformPrivateWorkloadPrincipalIds {
    param(
        [string] $Banner,
        [string[]] $PrincipalIds
    )

    $privateDir = Join-Path $repoRoot "infra/terraform-private"
    if (-not (Test-Path -LiteralPath $privateDir)) {
        return
    }

    $hclList = ($PrincipalIds | ForEach-Object { '"' + $_ + '"' }) -join ","
    Write-Host $Banner -ForegroundColor Cyan
    if ($DryRun) {
        Write-Host "DryRun: terraform apply -var=key_vault_workload_principal_ids=[$hclList]" -ForegroundColor DarkGray
        return
    }

    Push-Location -LiteralPath $privateDir
    try {
        terraform init -input=false | Write-Host
        terraform apply -input=false -auto-approve -var="key_vault_workload_principal_ids=[$hclList]" | Write-Host
        if ($LASTEXITCODE -ne 0) {
            throw "terraform apply failed for infra/terraform-private workload principal IDs."
        }
    }
    finally {
        Pop-Location
    }
}

function Invoke-TerraformKeyVaultWorkloadRbacPass {
    if (-not $Apply) {
        return
    }

    $uami = Get-TerraformKeyVaultUserAssignedWorkloadOutputs
    if ($null -ne $uami -and -not [string]::IsNullOrWhiteSpace($uami.ApiPrincipalId)) {
        Write-Host "TB-656: Skipping TB-092 Key Vault workload RBAC second pass (user-assigned identities already granted in terraform-keyvault)." -ForegroundColor Green

        $principalIds = @()
        if (-not [string]::IsNullOrWhiteSpace($uami.ApiPrincipalId)) { $principalIds += $uami.ApiPrincipalId.Trim() }
        if (-not [string]::IsNullOrWhiteSpace($uami.WorkerPrincipalId)) { $principalIds += $uami.WorkerPrincipalId.Trim() }
        $principalIds = @($principalIds | Select-Object -Unique)

        if ($principalIds.Count -eq 0) {
            return
        }

        Invoke-TerraformPrivateWorkloadPrincipalIds -Banner "==> TB-656: infra/terraform-private (key_vault_workload_principal_ids for external key_vault_id)" -PrincipalIds $principalIds
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
        if ($DryRun) {
            Write-Host "DryRun: terraform apply api/worker managed identity principal IDs" -ForegroundColor DarkGray
        }
        else {
            Push-Location -LiteralPath $keyVaultDir
            try {
                terraform init -input=false | Write-Host
                terraform apply -input=false -auto-approve `
                    -var="api_managed_identity_principal_id=$apiArg" `
                    -var="worker_managed_identity_principal_id=$workerArg" | Write-Host
                if ($LASTEXITCODE -ne 0) {
                    throw "terraform apply failed for infra/terraform-keyvault TB-092 pass."
                }
            }
            finally {
                Pop-Location
            }
        }
    }

    $principalIds = @()
    if (-not [string]::IsNullOrWhiteSpace($apiArg)) { $principalIds += $apiArg }
    if (-not [string]::IsNullOrWhiteSpace($workerArg)) { $principalIds += $workerArg }
    $principalIds = @($principalIds | Select-Object -Unique)

    if ($principalIds.Count -eq 0) {
        return
    }

    Invoke-TerraformPrivateWorkloadPrincipalIds -Banner "==> TB-092: infra/terraform-private (key_vault_workload_principal_ids when key_vault_id set)" -PrincipalIds $principalIds
}

if ($hostedWavePath -or ($ValidateOnly -and $MultiRoot -and -not $operatorSuppliedRoots)) {
    foreach ($compositionRoot in $hostedCompositionRoots) {
        Invoke-TerraformValidateRoot -RelativeRoot $compositionRoot
    }
}

foreach ($relative in $roots) {
    if ($ValidateOnly) {
        Invoke-TerraformValidateRoot -RelativeRoot $relative
        continue
    }

    Invoke-TerraformPlanOrApplyRoot -RelativeRoot $relative
}

if ($multiRootPath) {
    if ($Apply) {
        Invoke-TerraformKeyVaultWorkloadRbacPass
    }
    else {
        Write-Host "TB-656/TB-092: When user-assigned Key Vault identities are disabled, after Container Apps apply, re-run Key Vault (and private when key_vault_id is set) with API/Worker principal_id outputs, or use -Apply to run the automated pass." -ForegroundColor DarkYellow
    }

    if ($hostedWavePath) {
        Write-Host "Done (hosted 3-wave path: foundation / platform / app leaves). Review plans before passing -Apply. Composition roots are metadata-only." -ForegroundColor Green
    }
    elseif ($legacyIsolationPath) {
        Write-Host "Done (legacy leaf-root isolation path including orchestrator). Review plans before passing -Apply." -ForegroundColor Green
    }
    else {
        Write-Host "Done (operator-supplied TerraformRoots). Review plans before passing -Apply." -ForegroundColor Green
    }
}
else {
    Write-Host "Done (pilot profile only). For hosted 3-wave leaf applies, use: ./infra/apply-saas.ps1 -MultiRoot" -ForegroundColor Green
}
