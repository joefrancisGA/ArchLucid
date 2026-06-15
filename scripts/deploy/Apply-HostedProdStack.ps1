# Applies deploy/hosted-prod-terraform in one shot after Container App identities exist.
# Pass API/Worker principal_id values so OpenAI + Key Vault RBAC land in the same apply.
param(
    [string]$TerraformDirectory = (Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) 'deploy/hosted-prod-terraform'),
    [string]$VarFile = 'terraform.tfvars',
    [string[]]$WorkloadPrincipalIds = @(),
    [switch]$PlanOnly,
    [switch]$AutoApprove
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $TerraformDirectory)) {
    throw "Terraform root not found: $TerraformDirectory"
}

$varFilePath = Join-Path $TerraformDirectory $VarFile

if (-not (Test-Path -LiteralPath $varFilePath)) {
    throw "Var file not found: $varFilePath (copy terraform.tfvars.example first)."
}

Push-Location -LiteralPath $TerraformDirectory
try {
    terraform init -input=false

    $terraformArgs = @(
        if ($PlanOnly) { 'plan' } else { 'apply' }
        "-var-file=$VarFile"
        '-input=false'
    )

    if ($WorkloadPrincipalIds.Count -gt 0) {
        $hclList = ($WorkloadPrincipalIds | ForEach-Object { """$($_)""" }) -join ','
        $terraformArgs += "-var=openai_workload_principal_ids=[$hclList]"
    }

    if (-not $PlanOnly -and $AutoApprove) {
        $terraformArgs += '-auto-approve'
    }

    & terraform @terraformArgs
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}
