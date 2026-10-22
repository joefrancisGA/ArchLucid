<#!
.SYNOPSIS
  Thin wrapper around infra/apply-saas.ps1 hosted 3-wave path.

.DESCRIPTION
  Landing-zone entry for operators who still call provision-landing-zone.ps1.
  Always delegates to apply-saas.ps1 -MultiRoot. Default is validate-only
  (composition roots + hosted leaves). Each leaf keeps its own Terraform state.

.PARAMETER DryRun
  Print intended commands without executing Terraform.

.PARAMETER Plan
  Plan hosted leaves (Azure auth required for provider refresh). Wins over default validate.

.PARAMETER Apply
  Apply hosted leaves. Wins over -Plan. Cannot combine with -ValidateOnly.

.PARAMETER ValidateOnly
  Explicit validate-only (same as the default when neither -Plan nor -Apply is set).

.PARAMETER VarFile
  Optional -var-file passed through to plan/apply.

.EXAMPLE
  ./scripts/provision-landing-zone.ps1
  ./scripts/provision-landing-zone.ps1 -DryRun
  ./scripts/provision-landing-zone.ps1 -Plan
  ./scripts/provision-landing-zone.ps1 -Apply
#>
param(
    [switch] $DryRun,
    [switch] $Plan,
    [switch] $Apply,
    [switch] $ValidateOnly,
    [string] $VarFile = ""
)

$ErrorActionPreference = "Stop"

if ($Apply -and $ValidateOnly) {
    throw "Cannot combine -Apply with -ValidateOnly."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$applySaas = Join-Path $repoRoot "infra\apply-saas.ps1"

if (-not (Test-Path -LiteralPath $applySaas)) {
    throw "Missing apply-saas.ps1 at $applySaas"
}

$forward = @("-MultiRoot")

if ($DryRun) {
    $forward += "-DryRun"
}

if ($Apply) {
    $forward += "-Apply"
}
elseif ($Plan) {
    # Plan: neither -Apply nor -ValidateOnly.
}
else {
    $forward += "-ValidateOnly"
}

if (-not [string]::IsNullOrWhiteSpace($VarFile)) {
    $forward += "-VarFile"
    $forward += $VarFile
}

& $applySaas @forward
exit $LASTEXITCODE
