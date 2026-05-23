# ArchLucid local demo — resilient startup for Windows.
# Workarounds: pre-pull images, COMPOSE_BAKE=false, sequential api/ui builds.
# Prerequisites: Docker Desktop running. No .NET or Node required.
#
# Usage (from anywhere):
#   .\scripts\demo-start-local.ps1
# Optional:
#   .\scripts\demo-start-local.ps1 -SkipBuild    # containers only (images already built)
#   .\scripts\demo-start-local.ps1 -NoOpenBrowser

param(
    [switch] $SkipBuild,
    [switch] $NoOpenBrowser
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ComposeBase = Join-Path $RepoRoot "docker-compose.yml"
$ComposeDemo = Join-Path $RepoRoot "docker-compose.demo.yml"
$ComposeArgs = @("-f", $ComposeBase, "-f", $ComposeDemo, "--profile", "full-stack")

function Invoke-Docker {
    param([string[]] $Args)
    & docker @Args
    if ($LASTEXITCODE -ne 0) {
        throw "docker $($Args -join ' ') failed with exit code $LASTEXITCODE"
    }
}

if (-not (Test-Path $ComposeBase)) {
    Write-Error "Expected docker-compose.yml at $ComposeBase"
}

if (-not (Test-Path $ComposeDemo)) {
    Write-Error "Expected docker-compose.demo.yml at $ComposeDemo"
}

Write-Host "Checking Docker..." -ForegroundColor Cyan
Invoke-Docker @("info")

Set-Location $RepoRoot
$env:COMPOSE_BAKE = "false"

$images = @(
    "node:22-alpine",
    "mcr.microsoft.com/dotnet/sdk:10.0.201-alpine3.23",
    "mcr.microsoft.com/dotnet/aspnet:10.0-alpine3.23",
    "mcr.microsoft.com/mssql/server:2022-latest",
    "redis:7-alpine",
    "mcr.microsoft.com/azure-storage/azurite:latest"
)

Write-Host "Pulling base images (may take a few minutes on first run)..." -ForegroundColor Cyan
foreach ($image in $images) {
    Write-Host "  pull $image"
    Invoke-Docker @("pull", $image)
}

if (-not $SkipBuild) {
    Write-Host "Building API image (COMPOSE_BAKE=false)..." -ForegroundColor Cyan
    Invoke-Docker @("compose") + $ComposeArgs + @("build", "api")

    Write-Host "Building UI image..." -ForegroundColor Cyan
    Invoke-Docker @("compose") + $ComposeArgs + @("build", "ui")
}

Write-Host "Starting stack..." -ForegroundColor Cyan
Invoke-Docker @("compose") + $ComposeArgs + @("up", "-d")

$apiReadyUrl = "http://127.0.0.1:5000/health/ready"
$deadline = (Get-Date).AddSeconds(180)
$ok = $false

Write-Host "Waiting for API readiness (up to 180s)..." -ForegroundColor Cyan
while ((Get-Date) -lt $deadline) {
    try {
        $r = Invoke-WebRequest -Uri $apiReadyUrl -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) {
            $ok = $true
            break
        }
    }
    catch {
        # API still starting (SQL migrations on first boot can take a while)
    }

    Start-Sleep -Seconds 5
}

if (-not $ok) {
    Write-Host ""
    Write-Host "Timed out waiting for $apiReadyUrl" -ForegroundColor Yellow
    Write-Host "Logs: docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile full-stack logs api"
    Write-Host "Ports in use? 1433, 3000, 5000, 6379, 10000-10002"
    exit 1
}

Write-Host ""
Write-Host "API is ready." -ForegroundColor Green
Write-Host "Operator UI: http://localhost:3000/runs/new" -ForegroundColor Green
Write-Host "Health:      $apiReadyUrl" -ForegroundColor Green
Write-Host ""
Write-Host "Teardown: docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile full-stack down -v" -ForegroundColor DarkGray

$uiUrl = "http://localhost:3000/runs/new"
if (-not $NoOpenBrowser) {
    try {
        Start-Process $uiUrl
    }
    catch {
        Write-Host "Open manually: $uiUrl"
    }
}
