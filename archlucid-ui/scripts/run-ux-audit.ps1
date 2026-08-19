#Requires -Version 7.0
<#
.SYNOPSIS
  One-command UX audit screenshot capture for archlucid-ui (buyer + operator builds + marketing).

.DESCRIPTION
  Buyer-polished and full-operator-shell modes require separate Next builds (`NEXT_PUBLIC_*` is inlined).
  Marketing `/welcome` and `/why` reuse the buyer-polished build when `-SkipBuyerBuild` is set after buyer capture.
#>
[CmdletBinding()]
param(
  [switch]$ScreenshotsOnly,
  [switch]$BuyerOnly,
  [switch]$OperatorOnly,
  [switch]$MarketingOnly,
  [switch]$SkipReport
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$uiRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $uiRoot

$expectedBuyer = 14
$expectedOperator = 14
$expectedMarketing = 2
# PNG counts must match e2e/ux-audit-route-registry.ts — guarded by scripts/ux-audit-harness-drift-guard.test.ts (TB-653).
$screenshotRoot = Join-Path $uiRoot 'public/screenshots/ux-audit'

function Test-UxAuditPngCount {
  param(
    [Parameter(Mandatory = $true)][string]$Subdir,
    [Parameter(Mandatory = $true)][int]$Expected
  )

  $dir = Join-Path $screenshotRoot $Subdir

  if (-not (Test-Path -LiteralPath $dir)) {
    throw "Missing UX audit screenshot directory: $dir"
  }

  $count = @(Get-ChildItem -LiteralPath $dir -Filter '*.png' -File).Count

  if ($count -ne $Expected) {
    throw "Expected $Expected PNGs in ux-audit/$Subdir, found $count"
  }

  Write-Host "Validated $count PNG(s) in ux-audit/$Subdir"
}

function Invoke-UxAuditNpmScript {
  param([Parameter(Mandatory = $true)][string]$ScriptName)

  Write-Host "Running npm run $ScriptName ..."
  npm run $ScriptName

  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

$runBuyer = -not $OperatorOnly -and -not $MarketingOnly
$runOperator = -not $BuyerOnly -and -not $MarketingOnly
$runMarketing = -not $BuyerOnly -and -not $OperatorOnly

if ($runBuyer) {
  Remove-Item Env:MOCK_E2E_SKIP_NEXT_BUILD -ErrorAction SilentlyContinue
  $env:MOCK_E2E_PORT = '3003'
  $env:PORT = '3003'
  Invoke-UxAuditNpmScript -ScriptName 'ux-audit:screenshots:buyer'
  Test-UxAuditPngCount -Subdir 'buyer' -Expected $expectedBuyer
}

if ($runOperator) {
  Remove-Item Env:MOCK_E2E_SKIP_NEXT_BUILD -ErrorAction SilentlyContinue
  $env:MOCK_E2E_OPERATOR_PORT = '3002'
  $env:PORT = '3002'
  Invoke-UxAuditNpmScript -ScriptName 'ux-audit:screenshots:operator'
  Test-UxAuditPngCount -Subdir 'operator' -Expected $expectedOperator
}

if ($runMarketing) {
  if ($runBuyer) {
    $env:MOCK_E2E_SKIP_NEXT_BUILD = '1'
    $env:MOCK_E2E_PORT = '3003'
    $env:PORT = '3003'
  } else {
    Remove-Item Env:MOCK_E2E_SKIP_NEXT_BUILD -ErrorAction SilentlyContinue
    $env:MOCK_E2E_PORT = '3003'
    $env:PORT = '3003'
  }

  Invoke-UxAuditNpmScript -ScriptName 'ux-audit:screenshots:marketing'
  Test-UxAuditPngCount -Subdir 'marketing' -Expected $expectedMarketing
}

Write-Host "UX audit screenshot capture complete (expected total PNGs when all modes run: $($expectedBuyer + $expectedOperator + $expectedMarketing))."

if (-not $ScreenshotsOnly -and -not $SkipReport) {
  Write-Host 'Report authoring is agent-driven — ask Cursor to run lucid-ui-audit and write docs/architecture/UX_AUDIT_YYYY_MM_DD.md from the PNG pairs.'
}
