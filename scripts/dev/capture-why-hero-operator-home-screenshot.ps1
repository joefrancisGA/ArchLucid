# TB-2301 — Capture `/why` hero operator Home PNG from buyer-polished mock E2E.
param(
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$uiRoot = Join-Path $repoRoot "archlucid-ui"

Push-Location -LiteralPath $uiRoot
try {
    if ($SkipBuild) {
        $env:MOCK_E2E_SKIP_NEXT_BUILD = "1"
    } else {
        Remove-Item Env:MOCK_E2E_SKIP_NEXT_BUILD -ErrorAction SilentlyContinue
    }

    npm run capture:why-hero-operator-home

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    Write-Host "Why hero screenshot written under archlucid-ui/public/marketing/why/."
}
finally {
    Pop-Location
}
