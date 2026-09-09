# Starts ArchLucid.Api locally, waits until healthy, starts two archlucid-ui Next.js
# shells against that one API (Architecture :3000, Security :3001), verifies
# browser -> Next.js -> /api/proxy -> API on each UI, then opens both in the browser.
#
# The API window shuts down leftover MSBuild/Roslyn servers, compiles with -tl:off -m:1
# (avoids silent MSB4166 dumps from the SDK terminal logger + parallel nodes), then
# `dotnet run --no-build --launch-profile http`. Pass -RunAnalyzers / -UseTerminalLogger
# / -SkipExplicitBuild to opt out of those defaults.
#
# Port reference:
#   Native dev (default): API 5128, Architecture UI 3000, Security UI 3001 —
#   archlucid-ui/.env.local ARCHLUCID_API_BASE_URL=http://localhost:5128
#   UI spawn sets NEXT_PUBLIC_ARCHLUCID_PRODUCT, NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV=true
#   and NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator so Internal nav is visible for local engineer shells.
#   Docker demo stack:    API 5000, UI 3000 — use docker-compose.demo.yml / demo-start-local.ps1
#
# Prerequisites:
#   - .NET SDK (see global.json), Node.js 22+, `npm ci` in archlucid-ui
#   - SQL reachable (e.g. dotnet run --project ArchLucid.Cli -- dev up)
#
# Usage:
#   .\scripts\start-local-api-and-ui.ps1
#   .\scripts\start-local-api-and-ui.ps1 -SkipPreflight -NoBrowser
#   .\scripts\start-local-api-and-ui.ps1 -ApiPort 5128 -UiPort 3000 -SecurityUiPort 3001
#   .\scripts\start-local-api-and-ui.ps1 -SkipSecurityUi
#   .\scripts\start-local-api-and-ui.ps1 -LaunchProfile http -MsBuildMaxCpuCount 1
#   .\scripts\start-local-api-and-ui.ps1 -RunAnalyzers -UseTerminalLogger
#   .\scripts\start-local-api-and-ui.ps1 -SkipExplicitBuild -SkipBuildServerShutdown

[CmdletBinding()]
param(
    [string] $OpenPath = "/",
    [int] $ApiPort = 5128,
    [int] $UiPort = 3000,
    [int] $SecurityUiPort = 3001,
    [int] $ApiReadyTimeoutSec = 900,
    [int] $UiReadyTimeoutSec = 360,
    [switch] $SkipPreflight,
    [switch] $EnsureSql,
    [switch] $NoBrowser,
    [switch] $SkipSecurityUi,
    [ValidateNotNullOrEmpty()]
    [string] $LaunchProfile = "http",
    [ValidateRange(1, 64)]
    [int] $MsBuildMaxCpuCount = 1,
    [switch] $UseTerminalLogger,
    [switch] $RunAnalyzers,
    [switch] $SkipBuildServerShutdown,
    [switch] $SkipExplicitBuild
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "start-local-api-and-ui.helpers.ps1")

$script:SkipApiSpawn = $false
$script:SkipUiSpawnByProductLine = @{}

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ApiProject = Join-Path $RepoRoot "ArchLucid.Api\ArchLucid.Api.csproj"
$UiRoot = Join-Path $RepoRoot "archlucid-ui"
$UiNodeModules = Join-Path $UiRoot "node_modules"
$EnvLocalPath = Join-Path $UiRoot ".env.local"
$EnvExamplePath = Join-Path $UiRoot ".env.example"

$script:LocalUiSites = Get-LocalUiSiteSpecs `
    -ArchitecturePort $UiPort `
    -SecurityPort $SecurityUiPort `
    -IncludeSecurity (-not $SkipSecurityUi.IsPresent)

foreach ($site in $script:LocalUiSites) {
    $script:SkipUiSpawnByProductLine[$site.ProductLine] = $false
}

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

function Write-UiProxyChainFailureAndExit {
    param(
        [Parameter(Mandatory = $true)][string] $SiteName,
        [Parameter(Mandatory = $true)][int] $SitePort,
        [Parameter(Mandatory = $true)][string] $ProxyLiveUrl,
        [Parameter(Mandatory = $true)][string] $ApiLiveUrl
    )

    $directApiOk = Test-HttpStatus -Uri $ApiLiveUrl
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
    Write-Host ("Proxy chain check failed (stage: proxy-chain, site: {0})." -f $SiteName) -ForegroundColor Red
    Write-Host "  Direct API $ApiLiveUrl : $directApiLabel"
    Write-Host "  UI proxy $ProxyLiveUrl : FAILED"
    Write-Host "  ARCHLUCID_API_BASE_URL : $configuredBaseLabel"
    Write-Host "  Next steps:"
    Write-Host "    - Confirm ArchLucid.Api is running on port $ApiPort"
    Write-Host "    - Match archlucid-ui/.env.local to http://localhost:$ApiPort"
    Write-Host "    - See docs/runbooks/TROUBLESHOOTING.md and docs/library/customer-facing/OPERATOR_QUICKSTART.md"
    Write-Host "    - Optional: dotnet run --project ArchLucid.Cli -- doctor"
    Write-Host ("    - Confirm the {0} Next.js window is serving http://127.0.0.1:{1}/" -f $SiteName, $SitePort)
    Write-Host ("    - Restart the {0} UI window if it started before the API was ready." -f $SiteName)
    exit 1
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

    foreach ($site in $script:LocalUiSites) {
        $uiAlreadyUp = Test-PortServingUiRoot -Port $site.Port

        if ($uiAlreadyUp) {
            Write-Host ("{0} UI already listening on port {1} - skipping spawn." -f $site.Name, $site.Port) -ForegroundColor Yellow
            $script:SkipUiSpawnByProductLine[$site.ProductLine] = $true
            continue
        }

        $uiListeners = Get-NetTCPConnection -LocalPort $site.Port -State Listen -ErrorAction SilentlyContinue

        if ($null -ne $uiListeners -and $uiListeners.Count -gt 0) {
            Write-StageError -Stage "preflight" -Message ("Port {0} is in use but {1} UI root did not return 200." -f $site.Port, $site.Name)
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

if (-not $script:SkipApiSpawn) {
    Write-Host "Starting API in a new window (build then dotnet run --no-build)..." -ForegroundColor Cyan
    $apiCmd = Get-LocalApiWindowCommand `
        -RepoRoot $RepoRoot `
        -LaunchProfile $LaunchProfile `
        -MsBuildMaxCpuCount $MsBuildMaxCpuCount `
        -UseTerminalLogger $UseTerminalLogger.IsPresent `
        -RunAnalyzers $RunAnalyzers.IsPresent `
        -SkipBuildServerShutdown $SkipBuildServerShutdown.IsPresent `
        -SkipExplicitBuild $SkipExplicitBuild.IsPresent
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

foreach ($site in $script:LocalUiSites) {
    if ($script:SkipUiSpawnByProductLine[$site.ProductLine]) {
        continue
    }

    Write-Host ("Starting {0} UI in a new window (port {1}, Internal nav enabled)..." -f $site.Name, $site.Port) -ForegroundColor Cyan
    $uiCmd = Get-LocalUiWindowCommand -UiRoot $UiRoot -ProductLine $site.ProductLine -Port $site.Port
    Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $uiCmd) | Out-Null
}

foreach ($site in $script:LocalUiSites) {
    Write-Host ("Waiting for {0} UI root: {1} (timeout ${UiReadyTimeoutSec}s)..." -f $site.Name, $site.RootUrl) -ForegroundColor Cyan

    if (-not (Wait-HttpStatus -Uri $site.RootUrl -TimeoutSec $UiReadyTimeoutSec)) {
        Write-StageError -Stage "ui-root" -Message ("{0} UI did not respond. Check npm errors and port {1}." -f $site.Name, $site.Port)
    }
}

foreach ($site in $script:LocalUiSites) {
    Write-Host ("Verifying {0} proxy chain: {1} ..." -f $site.Name, $site.ProxyHealthUrl) -ForegroundColor Cyan

    if (-not (Wait-HttpStatus -Uri $site.ProxyHealthUrl -TimeoutSec 90)) {
        Write-UiProxyChainFailureAndExit `
            -SiteName $site.Name `
            -SitePort $site.Port `
            -ProxyLiveUrl $site.ProxyHealthUrl `
            -ApiLiveUrl $apiLiveUrl
    }

    Write-Host ("{0} proxy chain OK." -f $site.Name) -ForegroundColor Green
}

$architectureSite = $script:LocalUiSites | Where-Object { $_.ProductLine -eq 'architecture' } | Select-Object -First 1
$securitySite = $script:LocalUiSites | Where-Object { $_.ProductLine -eq 'security' } | Select-Object -First 1

if ($null -eq $architectureSite) {
    Write-StageError -Stage "ui-root" -Message "Architecture UI site spec is missing."
}

$open = $OpenPath.Trim()

if (-not $open.StartsWith("/")) {
    $open = "/$open"
}

$architectureUrl = "http://localhost:$($architectureSite.Port)$open"
$securityUrl = $null

if ($null -ne $securitySite) {
    $securityUrl = "http://localhost:$($securitySite.Port)/"
}

Write-Host ""
Write-Host "Ready:"
Write-Host "  API           $apiLiveUrl"
Write-Host ("  Architecture  {0}" -f $architectureUrl)

if ($null -ne $securityUrl) {
    Write-Host ("  Security      {0}" -f $securityUrl)
}

if ($NoBrowser) {
    Write-Host ("Skipping browser. Open Architecture: {0}" -f $architectureUrl) -ForegroundColor Yellow

    if ($null -ne $securityUrl) {
        Write-Host ("Skipping browser. Open Security: {0}" -f $securityUrl) -ForegroundColor Yellow
    }

    exit 0
}

Write-Host "Opening browser: $architectureUrl" -ForegroundColor Green

try {
    Start-Process $architectureUrl
} catch {
    Write-Warning "Could not start default browser. Open manually: $architectureUrl"
}

if ($null -ne $securityUrl) {
    Write-Host "Opening browser: $securityUrl" -ForegroundColor Green

    try {
        Start-Process $securityUrl
    } catch {
        Write-Warning "Could not start default browser. Open manually: $securityUrl"
    }
}
