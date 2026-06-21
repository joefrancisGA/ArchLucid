# Starts ArchLucid.Api locally, waits until healthy, starts archlucid-ui (npm run dev),
# verifies browser -> Next.js -> /api/proxy -> API, then opens the default browser.
#
# Port reference:
#   Native dev (default): API 5128, UI 3000 — archlucid-ui/.env.local ARCHLUCID_API_BASE_URL=http://localhost:5128
#   Docker demo stack:    API 5000, UI 3000 — use docker-compose.demo.yml / demo-start-local.ps1
#
# Prerequisites:
#   - .NET SDK (see global.json), Node.js 22+, `npm ci` in archlucid-ui
#   - SQL reachable (e.g. dotnet run --project ArchLucid.Cli -- dev up)
#
# Usage:
#   .\scripts\start-local-api-and-ui.ps1
#   .\scripts\start-local-api-and-ui.ps1 -SkipPreflight -NoBrowser
#   .\scripts\start-local-api-and-ui.ps1 -ApiPort 5128 -UiPort 3000

[CmdletBinding()]
param(
    [string] $OpenPath = "/",
    [int] $ApiPort = 5128,
    [int] $UiPort = 3000,
    [int] $ApiReadyTimeoutSec = 720,
    [int] $UiReadyTimeoutSec = 360,
    [switch] $SkipPreflight,
    [switch] $EnsureSql,
    [switch] $NoBrowser
)

$ErrorActionPreference = "Stop"

$script:SkipApiSpawn = $false
$script:SkipUiSpawn = $false

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ApiProject = Join-Path $RepoRoot "ArchLucid.Api\ArchLucid.Api.csproj"
$UiRoot = Join-Path $RepoRoot "archlucid-ui"
$UiNodeModules = Join-Path $UiRoot "node_modules"
$EnvLocalPath = Join-Path $UiRoot ".env.local"
$EnvExamplePath = Join-Path $UiRoot ".env.example"

function Write-StageError {
    param(
        [Parameter(Mandatory = $true)][string] $Stage,
        [Parameter(Mandatory = $true)][string] $Message
    )

    Write-Error "[$Stage] $Message"
}

function Test-HttpStatus {
    param(
        [Parameter(Mandatory = $true)][string] $Uri,
        [int[]] $ExpectedStatus = @(200)
    )

    try {
        $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 8

        return $ExpectedStatus -contains $response.StatusCode
    } catch {
        return $false
    }
}

function Wait-HttpStatus {
    param(
        [Parameter(Mandatory = $true)][string] $Uri,
        [int] $TimeoutSec = 120,
        [int] $IntervalSec = 2,
        [int[]] $ExpectedStatus = @(200)
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSec)

    while ((Get-Date) -lt $deadline) {
        if (Test-HttpStatus -Uri $Uri -ExpectedStatus $ExpectedStatus) {
            return $true
        }

        Start-Sleep -Seconds $IntervalSec
    }

    return $false
}

function Get-EnvLocalApiBaseUrl {
    if (-not (Test-Path $EnvLocalPath)) {
        return $null
    }

    $line = Get-Content -LiteralPath $EnvLocalPath |
        Where-Object { $_ -match '^\s*ARCHLUCID_API_BASE_URL\s*=' } |
        Select-Object -First 1

    if ($null -eq $line) {
        return $null
    }

    return ($line -split '=', 2)[1].Trim().Trim('"').Trim("'")
}

function Assert-EnvLocalApiPortAlignment {
    $configured = Get-EnvLocalApiBaseUrl

    if ([string]::IsNullOrWhiteSpace($configured)) {
        if (Test-Path $EnvExamplePath) {
            Write-Warning "archlucid-ui/.env.local missing ARCHLUCID_API_BASE_URL. Copy from .env.example (expected http://localhost:$ApiPort)."
        }

        Write-StageError -Stage "config" -Message "Create archlucid-ui/.env.local with ARCHLUCID_API_BASE_URL=http://localhost:$ApiPort"
    }

    $uri = $null

    if (-not [System.Uri]::TryCreate($configured, [System.UriKind]::Absolute, [ref]$uri)) {
        Write-StageError -Stage "config" -Message "ARCHLUCID_API_BASE_URL is not a valid absolute URL: $configured"
    }

    if ($uri.Port -ne $ApiPort) {
        $portMismatchMessage = (
            'ARCHLUCID_API_BASE_URL port {0} does not match -ApiPort {1}. ' +
            'Expected http://localhost:{1} (native) or adjust -ApiPort for Docker demo (5000).'
        ) -f $uri.Port, $ApiPort

        Write-StageError -Stage 'config' -Message $portMismatchMessage
    }
}

function Test-PortServingApiHealth {
    param([int] $Port)

    return Test-HttpStatus -Uri "http://127.0.0.1:$Port/health/live"
}

function Test-PortServingUiRoot {
    param([int] $Port)

    return Test-HttpStatus -Uri "http://127.0.0.1:$Port/"
}

if (-not (Test-Path $ApiProject)) {
    Write-StageError -Stage "preflight" -Message "API project not found: $ApiProject"
}

if (-not (Test-Path (Join-Path $UiRoot "package.json"))) {
    Write-StageError -Stage "preflight" -Message "UI folder missing package.json: $UiRoot"
}

if (-not $SkipPreflight) {
    if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
        Write-StageError -Stage "preflight" -Message "dotnet SDK not found on PATH."
    }

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-StageError -Stage "preflight" -Message "node not found on PATH."
    }

    if (-not (Test-Path $UiNodeModules)) {
        Write-StageError -Stage "preflight" -Message "archlucid-ui/node_modules missing. Run: npm ci (in archlucid-ui)."
    }

    Assert-EnvLocalApiPortAlignment

    $apiAlreadyHealthy = Test-PortServingApiHealth -Port $ApiPort

    if (-not $apiAlreadyHealthy) {
        $apiListeners = Get-NetTCPConnection -LocalPort $ApiPort -State Listen -ErrorAction SilentlyContinue

        if ($null -ne $apiListeners -and $apiListeners.Count -gt 0) {
            Write-StageError -Stage "preflight" -Message "Port $ApiPort is in use but /health/live did not return 200."
        }
    }

    if ($apiAlreadyHealthy) {
        Write-Host "API already listening on port $ApiPort - skipping API spawn." -ForegroundColor Yellow
        $script:SkipApiSpawn = $true
    }

    $uiAlreadyUp = Test-PortServingUiRoot -Port $UiPort

    if ($uiAlreadyUp) {
        Write-Host "UI already listening on port $UiPort - skipping UI spawn." -ForegroundColor Yellow
        $script:SkipUiSpawn = $true
    }

    if (-not $uiAlreadyUp) {
        $uiListeners = Get-NetTCPConnection -LocalPort $UiPort -State Listen -ErrorAction SilentlyContinue

        if ($null -ne $uiListeners -and $uiListeners.Count -gt 0) {
            Write-StageError -Stage "preflight" -Message "Port $UiPort is in use but UI root did not return 200."
        }
    }
}

if ($EnsureSql) {
    Write-Host "Ensuring local SQL (dev up --sql-only)..." -ForegroundColor Cyan
    Push-Location $RepoRoot

    try {
        dotnet run --project .\ArchLucid.Cli\ArchLucid.Cli.csproj -- dev up --sql-only

        if ($LASTEXITCODE -ne 0) {
            Write-StageError -Stage "sql" -Message "dev up --sql-only failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
}

$apiLiveUrl = "http://127.0.0.1:$ApiPort/health/live"
$apiReadyUrl = "http://127.0.0.1:$ApiPort/health/ready"
$uiRootUrl = "http://127.0.0.1:$UiPort/"
$proxyLiveUrl = "http://127.0.0.1:$UiPort/api/proxy/health/live"

if (-not $script:SkipApiSpawn) {
    Write-Host "Starting API in a new window (dotnet run)..." -ForegroundColor Cyan
    $apiCmd = "Set-Location -LiteralPath '$RepoRoot'; dotnet run --project .\ArchLucid.Api\ArchLucid.Api.csproj"
    Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $apiCmd) | Out-Null
}

Write-Host "Waiting for API live: $apiLiveUrl (timeout ${ApiReadyTimeoutSec}s)..." -ForegroundColor Cyan

if (-not (Wait-HttpStatus -Uri $apiLiveUrl -TimeoutSec $ApiReadyTimeoutSec)) {
    Write-StageError -Stage "api-live" -Message "API /health/live did not respond. Check SQL, user-secrets ConnectionStrings:ArchLucid, and the API window."
}

Write-Host "Waiting for API ready: $apiReadyUrl ..." -ForegroundColor Cyan

if (-not (Wait-HttpStatus -Uri $apiReadyUrl -TimeoutSec 120)) {
    Write-StageError -Stage "api-ready" -Message "API /health/ready did not return 200 within 120s."
}

Write-Host "API is ready." -ForegroundColor Green

if (-not $script:SkipUiSpawn) {
    Write-Host "Starting UI in a new window (npm run dev)..." -ForegroundColor Cyan
    $uiCmd = "Set-Location -LiteralPath '$UiRoot'; npm run dev"
    Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $uiCmd) | Out-Null
}

Write-Host "Waiting for UI root: $uiRootUrl (timeout ${UiReadyTimeoutSec}s)..." -ForegroundColor Cyan

if (-not (Wait-HttpStatus -Uri $uiRootUrl -TimeoutSec $UiReadyTimeoutSec)) {
    Write-StageError -Stage "ui-root" -Message "UI did not respond. Check npm errors and port $UiPort."
}

Write-Host "Verifying proxy chain: $proxyLiveUrl ..." -ForegroundColor Cyan

if (-not (Wait-HttpStatus -Uri $proxyLiveUrl -TimeoutSec 90)) {
    $directApiOk = Test-HttpStatus -Uri $apiLiveUrl
    $configuredBase = Get-EnvLocalApiBaseUrl

    $directApiLabel = 'FAILED'

    if ($directApiOk) {
        $directApiLabel = 'OK'
    }

    $configuredBaseLabel = '(not set in .env.local)'

    if ($configuredBase) {
        $configuredBaseLabel = $configuredBase
    }

    Write-Host ""
    Write-Host "Proxy chain check failed (stage: proxy-chain)." -ForegroundColor Red
    Write-Host "  Direct API $apiLiveUrl : $directApiLabel"
    Write-Host "  UI proxy $proxyLiveUrl : FAILED"
    Write-Host "  ARCHLUCID_API_BASE_URL : $configuredBaseLabel"
    Write-Host "  Next steps:"
    Write-Host "    - Confirm ArchLucid.Api is running on port $ApiPort"
    Write-Host "    - Match archlucid-ui/.env.local to http://localhost:$ApiPort"
    Write-Host "    - See docs/runbooks/TROUBLESHOOTING.md and docs/library/customer-facing/OPERATOR_QUICKSTART.md"
    Write-Host "    - Optional: dotnet run --project ArchLucid.Cli -- doctor"
    exit 1
}

Write-Host "Proxy chain OK." -ForegroundColor Green

if ($NoBrowser) {
    Write-Host "Skipping browser. Open: http://localhost:$UiPort$OpenPath" -ForegroundColor Yellow

    exit 0
}

$open = $OpenPath.Trim()

if (-not $open.StartsWith("/")) {
    $open = "/$open"
}

$browserUrl = "http://localhost:$UiPort$open"
Write-Host "Opening browser: $browserUrl" -ForegroundColor Green

try {
    Start-Process $browserUrl
} catch {
    Write-Warning "Could not start default browser. Open manually: $browserUrl"
}
