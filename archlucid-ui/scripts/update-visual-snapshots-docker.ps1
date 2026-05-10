# Regenerates Playwright chromium-visual goldens targeting Linux runners (Ubuntu CI).
# Requires Docker Desktop (daemon running). Use when switching `ui-playwright-mock-visual` to ubuntu-latest. Output path:
# tests/e2e/visual-regression.spec.ts-snapshots/*-chromium-visual-linux.png
#
# Bash equivalent (from archlucid-ui/):
#
# UiRoot="$(pwd)"
# docker run --rm -v "${UiRoot}:/ui" -w /ui mcr.microsoft.com/playwright:v1.58.2-jammy \
#   bash -lc 'npm ci && npm run build && npx playwright test tests/e2e/visual-regression.spec.ts --project=chromium-visual --update-snapshots -c playwright.mock.config.ts'
param(
    [ValidateNotNullOrEmpty()]
    [string] $UiRoot = $(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Get-Command docker -ErrorAction SilentlyContinue))
{
    Write-Error 'Docker CLI not found.'
}

docker info *> $null

# Pin to @playwright/test from package-lock.json (see node_modules\@playwright\test package version).
docker run --rm `
    --volume "${UiRoot}:/ui" `
    --workdir /ui `
    mcr.microsoft.com/playwright:v1.58.2-jammy `
    bash -lc "npm ci && npm run build && npx playwright test tests/e2e/visual-regression.spec.ts --project=chromium-visual --update-snapshots -c playwright.mock.config.ts"
