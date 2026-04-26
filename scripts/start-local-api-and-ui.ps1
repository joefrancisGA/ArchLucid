# Starts ArchLucid.Api locally, waits until it answers /health/ready, starts archlucid-ui (npm run dev),
# waits for the UI HTTP port, then opens the default browser.
#
# Prerequisites (you still run these yourself when needed):
#   - .NET SDK (see repo global.json)
#   - Node.js 22+ and `npm ci` in archlucid-ui (first time)
#   - SQL reachable: e.g. `dotnet run --project ArchLucid.Cli -- dev up` from repo root, plus user-secrets
#     ConnectionStrings:ArchLucid (see docs/library/OPERATOR_QUICKSTART.md)
#
# Usage (from anywhere):
#   .\scripts\start-local-api-and-ui.ps1
# Optional:
#   .\scripts\start-local-api-and-ui.ps1 -OpenPath "/" -ApiReadyTimeoutSec 180 -UiReadyTimeoutSec 240 -NoBrowser

[CmdletBinding()]
param(
    [string] $OpenPath = "/",
    [int] $ApiPort = 5128,
    [int] $UiPort = 3000,
    [int] $ApiReadyTimeoutSec = 120,
    [int] $UiReadyTimeoutSec = 180,
    [switch] $NoBrowser
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ApiProject = Join-Path $RepoRoot "ArchLucid.Api\ArchLucid.Api.csproj"
$UiRoot = Join-Path $RepoRoot "archlucid-ui"

if (-not (Test-Path $ApiProject)) {
    Write-Error "API project not found: $ApiProject"
}

if (-not (Test-Path (Join-Path $UiRoot "package.json"))) {
    Write-Error "UI folder missing package.json: $UiRoot"
}

function Test-HttpOk {
    param(
        [Parameter(Mandatory = $true)][string] $Uri
    )

    try {
        $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 5

        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Wait-HttpOk {
    param(
        [Parameter(Mandatory = $true)][string] $Uri,
        [int] $TimeoutSec = 120,
        [int] $IntervalSec = 2
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSec)

    while ((Get-Date) -lt $deadline) {
        if (Test-HttpOk -Uri $Uri) {
            return $true
        }

        Start-Sleep -Seconds $IntervalSec
    }

    return $false
}

$apiReadyUrl = "http://127.0.0.1:$ApiPort/health/ready"
$uiProbeUrl = "http://127.0.0.1:$UiPort/"

Write-Host "Starting API in a new window (dotnet run)..." -ForegroundColor Cyan
$apiCmd = "Set-Location -LiteralPath '$RepoRoot'; dotnet run --project .\ArchLucid.Api\ArchLucid.Api.csproj"
Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $apiCmd) | Out-Null

Write-Host "Waiting for API: $apiReadyUrl (timeout ${ApiReadyTimeoutSec}s)..." -ForegroundColor Cyan
if (-not (Wait-HttpOk -Uri $apiReadyUrl -TimeoutSec $ApiReadyTimeoutSec)) {
    Write-Error "API did not become ready. Check the API window, SQL, and user-secrets ConnectionStrings:ArchLucid."
}

Write-Host "API is ready." -ForegroundColor Green

Write-Host "Starting UI in a new window (npm run dev)..." -ForegroundColor Cyan
$uiCmd = "Set-Location -LiteralPath '$UiRoot'; npm run dev"
Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $uiCmd) | Out-Null

Write-Host "Waiting for UI: $uiProbeUrl (timeout ${UiReadyTimeoutSec}s)..." -ForegroundColor Cyan
if (-not (Wait-HttpOk -Uri $uiProbeUrl -TimeoutSec $UiReadyTimeoutSec)) {
    Write-Error "UI did not respond. Check the UI window (npm errors, port $UiPort in use)."
}

Write-Host "UI is up." -ForegroundColor Green

if ($NoBrowser) {
    Write-Host "Skipping browser. Open: ${uiProbeUrl.TrimEnd('/')}$OpenPath" -ForegroundColor Yellow

    return
}

$open = $OpenPath.Trim()
if (-not $open.StartsWith("/")) {
    $open = "/$open"
}

$browserUrl = "http://localhost:$UiPort$open"
Write-Host "Opening browser: $browserUrl" -ForegroundColor Green

try {
    Start-Process $browserUrl
}
catch {
    Write-Warning "Could not start default browser. Open manually: $browserUrl"
}
