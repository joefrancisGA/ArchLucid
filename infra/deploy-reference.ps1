<#
.SYNOPSIS
    Thin wrapper to run the SaaS Terraform roots in reference order (see infra/apply-saas.ps1).

.DESCRIPTION
    Delegates to `infra/apply-saas.ps1 -MultiRoot` so operators keep one entry point for
    docs/REFERENCE_SAAS_STACK_ORDER.md-style deployments.

.PARAMETER Apply
    When set, runs terraform apply -auto-approve per root.

.PARAMETER TerraformRoots
    Optional ordered override passed through to apply-saas.ps1.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [switch] $Apply,
    [string[]] $TerraformRoots = $null
)

$ErrorActionPreference = "Stop"
$inner = Join-Path $PSScriptRoot "apply-saas.ps1"

if (-not (Test-Path $inner)) {
    throw "Missing $inner"
}

Write-Host "Delegating to: $inner (-MultiRoot)" -ForegroundColor Cyan

if ($null -ne $TerraformRoots -and $TerraformRoots.Length -gt 0) {
    if ($Apply) {
        & $inner -MultiRoot -Apply -TerraformRoots $TerraformRoots
    }
    else {
        & $inner -MultiRoot -TerraformRoots $TerraformRoots
    }

    return
}

if ($Apply) {
    & $inner -MultiRoot -Apply
}
else {
    & $inner -MultiRoot
}
