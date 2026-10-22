# Starts ArchLucid.Api (Simulator + DevelopmentBypass), runs the architecture lifecycle
# batch harness, then stops the API process. No git commits.
#
# Usage:
#   .\scripts\run-architecture-lifecycle-batch.ps1
#   .\scripts\run-architecture-lifecycle-batch.ps1 15
#   .\scripts\run-architecture-lifecycle-batch.ps1 -ReviewCount 15
#   .\scripts\run-architecture-lifecycle-batch.ps1 -ReviewCount 50 -StorageProvider Sql -EnsureSql
#   .\scripts\run-architecture-lifecycle-batch.ps1 -SkipApiStart -ReviewCount 10
#
# -ReviewCount: how many architecture reviews to create and push through the full lifecycle
#   (create → execute → commit → governance approval). Default 30. Counts above 30 cycle
#   through the unique scenario templates with suffixed names.
#
# Reports: archlucid-ui/e2e/reports/architecture-lifecycle-batch-<timestamp>.{md,json}

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateRange(1, 500)]
    [int] $ReviewCount = 30,

    [ValidateSet('InMemory', 'Sql')]
    [string] $StorageProvider = 'InMemory',
    [int] $ApiPort = 5130,
    [int] $ApiReadyTimeoutSec = 300,
    [switch] $EnsureSql,
    [switch] $SkipApiStart,
    [switch] $SkipApiBuild
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ApiProject = Join-Path $RepoRoot 'ArchLucid.Api\ArchLucid.Api.csproj'
$UiRoot = Join-Path $RepoRoot 'archlucid-ui'
$ApiLog = Join-Path $env:TEMP 'archlucid-architecture-lifecycle-batch-api.log'
$ApiPidFile = Join-Path $env:TEMP 'archlucid-architecture-lifecycle-batch-api.pid'
$BatchExitCodeFile = Join-Path $env:TEMP 'archlucid-architecture-lifecycle-batch.exitcode'

$script:ApiProcess = $null
$script:StartedApi = $false

function Write-Heartbeat {
    Write-Host ("STILL EXECUTING... {0}" -f (Get-Date -Format 'HH:mm:ss'))
}

function Test-ApiHealthy {
    param([int] $Port)

    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/health/ready" -UseBasicParsing -TimeoutSec 8

        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Test-SqlReachable {
    try {
        $null = sqlcmd -S 127.0.0.1,1433 -U sa -P 'LocalTesting123!' -C -Q 'SELECT 1' -h -1 2>$null

        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Stop-BatchApi {
    if (-not $script:StartedApi) {
        return
    }

    if ($null -ne $script:ApiProcess -and -not $script:ApiProcess.HasExited) {
        Write-Host "Stopping ArchLucid.Api (pid $($script:ApiProcess.Id))..." -ForegroundColor Cyan
        Stop-Process -Id $script:ApiProcess.Id -Force -ErrorAction SilentlyContinue
    }

    if (Test-Path $ApiPidFile) {
        Remove-Item -LiteralPath $ApiPidFile -Force -ErrorAction SilentlyContinue
    }

    $script:ApiProcess = $null
    $script:StartedApi = $false
}

function Wait-ApiHealthy {
    param(
        [int] $Port,
        [int] $TimeoutSec
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSec)

    while ((Get-Date) -lt $deadline) {
        if (Test-ApiHealthy -Port $Port) {
            return $true
        }

        if ($null -ne $script:ApiProcess -and $script:ApiProcess.HasExited) {
            return $false
        }

        Start-Sleep -Seconds 2
    }

    return $false
}

function Start-BatchApi {
    if ($SkipApiStart) {
        if (-not (Test-ApiHealthy -Port $ApiPort)) {
            throw "SkipApiStart set but API is not healthy on port $ApiPort."
        }

        Write-Host "Reusing existing API on port $ApiPort." -ForegroundColor Yellow

        return
    }

    if (Test-ApiHealthy -Port $ApiPort) {
        Write-Host "Port $ApiPort already has a healthy API; reusing it." -ForegroundColor Yellow

        return
    }

    if ($StorageProvider -eq 'Sql' -and $EnsureSql) {
        if (-not (Test-SqlReachable)) {
            Write-Host 'SQL not reachable; falling back to InMemory storage.' -ForegroundColor Yellow
            $script:StorageProviderResolved = 'InMemory'
        }
        else {
            $script:StorageProviderResolved = 'Sql'
        }
    }
    else {
        $script:StorageProviderResolved = $StorageProvider
    }

    if (-not $SkipApiBuild) {
        Write-Host 'Building ArchLucid.Api (Release)...' -ForegroundColor Cyan
        Push-Location $RepoRoot

        try {
            dotnet build $ApiProject -c Release

            if ($LASTEXITCODE -ne 0) {
                throw "dotnet build ArchLucid.Api failed with exit code $LASTEXITCODE."
            }
        }
        finally {
            Pop-Location
        }
    }

    if (Test-Path $ApiLog) {
        Remove-Item -LiteralPath $ApiLog -Force -ErrorAction SilentlyContinue
    }

    $resolvedStorage = if ($script:StorageProviderResolved) { $script:StorageProviderResolved } else { $StorageProvider }
    Write-Host ('Starting ArchLucid.Api (' + $resolvedStorage + ', Simulator) on port ' + $ApiPort + '...') -ForegroundColor Cyan

    $apiUrls = "http://127.0.0.1:$ApiPort"

    $apiEnv = @{
        ASPNETCORE_ENVIRONMENT                       = 'Development'
        ASPNETCORE_URLS                              = $apiUrls
        ArchLucidAuth__Mode                          = 'DevelopmentBypass'
        ArchLucidAuth__AllowTestActorHeaders         = 'true'
        Authentication__ApiKey__DevelopmentBypassAll = 'true'
        ArchLucid__E2eHarness__SharedSecret          = 'ci-live-e2e-harness-secret-min16!'
        AgentExecution__Mode                         = 'Simulator'
        Billing__Provider                            = 'Noop'
        DataConsistency__InitialDelaySeconds         = '0'
        HostLeaderElection__Enabled                  = 'false'
        Demo__Enabled                                = 'true'
        Demo__SeedOnStartup                          = 'true'
        Demo__AnonymousViewer__Enabled               = 'true'
        Observability__ConsoleExporter__Enabled      = 'false'
        RateLimiting__FixedWindow__PermitLimit       = '10000'
        RateLimiting__FixedWindow__WindowMinutes      = '1'
        ARCHLUCID_GOLDEN_COHORT_REAL_LLM             = 'false'
    }

    if ($resolvedStorage -eq 'Sql') {
        $apiEnv.ArchLucid__StorageProvider = 'Sql'
        $apiEnv.ConnectionStrings__ArchLucid = 'Server=127.0.0.1,1433;User Id=sa;Password=LocalTesting123!;TrustServerCertificate=True;Initial Catalog=ArchLucidLifecycleBatch'
    }
    else {
        $apiEnv.ArchLucid__StorageProvider = 'InMemory'
    }

    foreach ($entry in $apiEnv.GetEnumerator()) {
        Set-Item -Path "env:$($entry.Key)" -Value $entry.Value
    }

    $script:ApiProcess = Start-Process `
        -FilePath 'dotnet' `
        -ArgumentList @('run', '-c', 'Release', '--project', $ApiProject, '--urls', $apiUrls, '--no-build') `
        -WorkingDirectory $RepoRoot `
        -RedirectStandardOutput $ApiLog `
        -PassThru `
        -NoNewWindow

    $script:StartedApi = $true
    Set-Content -LiteralPath $ApiPidFile -Value $script:ApiProcess.Id -Encoding ascii

    if (-not (Wait-ApiHealthy -Port $ApiPort -TimeoutSec $ApiReadyTimeoutSec)) {
        if (Test-Path $ApiLog) {
            Write-Host '--- API log tail ---' -ForegroundColor Red
            Get-Content -LiteralPath $ApiLog -Tail 40 | ForEach-Object { Write-Host $_ }
        }

        throw "ArchLucid.Api did not become healthy within ${ApiReadyTimeoutSec}s."
    }

    Write-Host 'ArchLucid.Api is ready.' -ForegroundColor Green
}

try {
    Write-Host "==> Architecture lifecycle batch ($ReviewCount review(s))" -ForegroundColor Cyan
    Start-BatchApi | Out-Null

    if (Test-Path $BatchExitCodeFile) {
        Remove-Item -LiteralPath $BatchExitCodeFile -Force -ErrorAction SilentlyContinue
    }

    $intervalSec = 8
    $batchJob = Start-Job -ScriptBlock {
        param($Root, $Port, $ExitCodeFile, $Count)
        Set-Location -LiteralPath $Root
        $env:LIVE_API_URL = ('http://127.0.0.1:' + $Port)
        $env:LIVE_E2E_HARNESS_SECRET = 'ci-live-e2e-harness-secret-min16!'
        $env:LIVE_JWT_TOKEN = ''
        $env:LIVE_API_KEY = ''
        $env:ARCHLUCID_GOLDEN_COHORT_REAL_LLM = 'false'
        $env:ARCHITECTURE_LIFECYCLE_BATCH_EXIT_CODE_FILE = $ExitCodeFile
        $env:ARCHITECTURE_LIFECYCLE_BATCH_REVIEW_COUNT = [string]$Count
        & npx tsx e2e/run-architecture-lifecycle-batch.ts $Count
        exit $LASTEXITCODE
    } -ArgumentList $UiRoot, $ApiPort, $BatchExitCodeFile, $ReviewCount

    try {
        while ($batchJob.State -eq 'Running') {
            Write-Heartbeat
            Start-Sleep -Seconds $intervalSec
        }

        $batchOutput = Receive-Job $batchJob -Wait -AutoRemoveJob

        if ($null -ne $batchOutput) {
            $batchOutput | ForEach-Object { Write-Host $_ }
        }

        if ($batchJob.JobStateInfo.State -eq 'Failed') {
            $reason = $batchJob.ChildJobs[0].JobStateInfo.Reason

            if ($null -ne $reason) {
                Write-Error $reason
            }

            exit 1
        }
    }
    finally {
        if ($batchJob.State -eq 'Running') {
            Stop-Job $batchJob -Force
            Remove-Job $batchJob -Force
        }
    }

    if (Test-Path $BatchExitCodeFile) {
        $batchExit = [int](Get-Content -LiteralPath $BatchExitCodeFile -Raw)
        exit $batchExit
    }

    exit 1
}
finally {
    Stop-BatchApi
    Write-Host 'Agent shells remaining: 0'
}
