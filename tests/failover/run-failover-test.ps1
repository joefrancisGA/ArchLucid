#Requires -Version 7.0
<#
.SYNOPSIS
  Automated SQL outage resilience test for ArchLucid API (nightly CI).

.DESCRIPTION
  Brings up tests/failover/docker-compose.failover.yml, waits for API readiness, stops SQL mid-load,
  asserts /health/ready becomes unhealthy then recovers within RTO, and appends FAILOVER_RESULTS.md.

.PARAMETER RtoSeconds
  Maximum seconds to wait for /health/ready after SQL is restarted (default 60 per docs/library/RTO_RPO_TARGETS.md dev tier).

.PARAMETER SkipCompose
  Skip docker compose up/down (for local debugging when stack is already running).
#>
[CmdletBinding()]
param(
    [int] $RtoSeconds = 60,
    [switch] $SkipCompose
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path
$composeFile = Join-Path $PSScriptRoot "docker-compose.failover.yml"
$resultsPath = Join-Path $repoRoot "docs" "quality" "game-day-log" "FAILOVER_RESULTS.md"
$apiBase = "http://127.0.0.1:15000"
$runId = $null
$startedUtc = [DateTime]::UtcNow
$unhealthyObservedUtc = $null
$recoveredUtc = $null
$loadErrors = [System.Collections.Generic.List[string]]::new()

function Invoke-ReadyProbe {
    param([string] $BaseUrl)

    $url = "$($BaseUrl.TrimEnd('/'))/health/ready"

    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 10 -SkipHttpErrorCheck
        return @{
            Ok = ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300)
            StatusCode = [int]$response.StatusCode
        }
    }
    catch {
        return @{ Ok = $false; StatusCode = 0; Error = $_.Exception.Message }
    }
}

function Wait-UntilReady {
    param([string] $BaseUrl, [int] $TimeoutSeconds)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        $probe = Invoke-ReadyProbe -BaseUrl $BaseUrl

        if ($probe.Ok) {
            return $true
        }

        Start-Sleep -Seconds 2
    }

    return $false
}

try {
    if (-not $SkipCompose) {
        Write-Host "Starting failover compose stack..."
        docker compose -f $composeFile down -v 2>$null | Out-Null
        docker compose -f $composeFile up -d --build

        if (-not (Wait-UntilReady -BaseUrl $apiBase -TimeoutSeconds 180)) {
            throw "API did not become ready within 180s after compose up."
        }
    }

    Write-Host "API ready. Resolving demo run id..."
    $runsResponse = Invoke-RestMethod -Uri "$apiBase/v1/architecture/runs?take=1" -Method Get -Headers @{
        Accept = "application/json"
        "X-Tenant-Id" = "00000000-0000-0000-0000-000000000001"
        "X-Workspace-Id" = "00000000-0000-0000-0000-000000000002"
        "X-Project-Id" = "default"
    } -TimeoutSec 30

    if ($runsResponse.items -and $runsResponse.items.Count -gt 0) {
        $runId = [string]$runsResponse.items[0].runId
    }

    Write-Host "Starting background load (1 RPS) for 60s..."
    $loadJob = Start-Job -ScriptBlock {
        param($Base, $Run, $ErrBag)
        $end = (Get-Date).AddSeconds(60)

        while ((Get-Date) -lt $end) {
            try {
                Invoke-WebRequest -Uri "$Base/health/ready" -Method Get -TimeoutSec 5 -SkipHttpErrorCheck | Out-Null

                if ($Run) {
                    Invoke-WebRequest -Uri "$Base/v1/architecture/run/$Run" -Method Get -TimeoutSec 10 -SkipHttpErrorCheck `
                        -Headers @{
                            "X-Tenant-Id" = "00000000-0000-0000-0000-000000000001"
                            "X-Workspace-Id" = "00000000-0000-0000-0000-000000000002"
                            "X-Project-Id" = "default"
                        } | Out-Null
                }
            }
            catch {
                [void]$ErrBag.Add($_.Exception.Message)
            }

            Start-Sleep -Seconds 1
        }
    } -ArgumentList $apiBase, $runId, $loadErrors

    Start-Sleep -Seconds 20
    Write-Host "Stopping sql-primary container at t=20s..."
    $outageStartUtc = [DateTime]::UtcNow
    docker stop archlucid-failover-sql | Out-Null

    $unhealthyDeadline = (Get-Date).AddSeconds(5)

    while ((Get-Date) -lt $unhealthyDeadline) {
        $probe = Invoke-ReadyProbe -BaseUrl $apiBase

        if (-not $probe.Ok) {
            $unhealthyObservedUtc = [DateTime]::UtcNow
            break
        }

        Start-Sleep -Milliseconds 500
    }

    if ($null -eq $unhealthyObservedUtc) {
        throw "/health/ready did not become unhealthy within 5s after SQL stop."
    }

    Write-Host "Restarting sql-primary..."
    docker start archlucid-failover-sql | Out-Null

    $recoveryDeadline = (Get-Date).AddSeconds($RtoSeconds)

    while ((Get-Date) -lt $recoveryDeadline) {
        $probe = Invoke-ReadyProbe -BaseUrl $apiBase

        if ($probe.Ok) {
            $recoveredUtc = [DateTime]::UtcNow
            break
        }

        Start-Sleep -Seconds 2
    }

    if ($null -eq $recoveredUtc) {
        throw "API did not recover within ${RtoSeconds}s RTO after SQL restart."
    }

    if ($runId) {
        $runProbe = Invoke-WebRequest -Uri "$apiBase/v1/architecture/run/$runId" -Method Get -SkipHttpErrorCheck `
            -Headers @{
                "X-Tenant-Id" = "00000000-0000-0000-0000-000000000001"
                "X-Workspace-Id" = "00000000-0000-0000-0000-000000000002"
                "X-Project-Id" = "default"
            }

        if ($runProbe.StatusCode -ge 500) {
            throw "Seeded run returned $($runProbe.StatusCode) after recovery (expected readable run)."
        }
    }

    Wait-Job $loadJob -Timeout 70 | Out-Null
    Receive-Job $loadJob | Out-Null
    Remove-Job $loadJob -Force -ErrorAction SilentlyContinue

    $recoverySeconds = [math]::Round(($recoveredUtc - $outageStartUtc).TotalSeconds, 1)
    $unhealthyLatencySeconds = [math]::Round(($unhealthyObservedUtc - $outageStartUtc).TotalSeconds, 1)

    $entry = @"

## Nightly automated drill $(Get-Date -Format 'yyyy-MM-dd HH:mm') UTC

| Field | Value |
|-------|-------|
| **Environment** | CI docker-compose (`tests/failover/docker-compose.failover.yml`) |
| **API base** | ``$apiBase`` |
| **SQL outage started (UTC)** | $($outageStartUtc.ToString('o')) |
| **Unhealthy observed (UTC)** | $($unhealthyObservedUtc.ToString('o')) |
| **Health ready restored (UTC)** | $($recoveredUtc.ToString('o')) |
| **Unhealthy detection latency** | ${unhealthyLatencySeconds}s |
| **Recovery time (RTO)** | ${recoverySeconds}s (budget ${RtoSeconds}s) |
| **Seeded run id** | $(if ($runId) { $runId } else { '_none_' }) |
| **Load probe errors** | $($loadErrors.Count) |

"@

    if (-not (Test-Path $resultsPath)) {
        @"
> **Scope:** Failover and SQL resilience drill results (staging manual + CI automated).

# Failover drill results log

Append-only entries from ``scripts/ops/run-failover-drill.ps1`` and ``tests/failover/run-failover-test.ps1``.

"@ | Set-Content -Path $resultsPath -Encoding utf8
    }

    Add-Content -Path $resultsPath -Value $entry -Encoding utf8
    Write-Host "PASS — recovered in ${recoverySeconds}s. Appended to $resultsPath"
}
finally {
    if (-not $SkipCompose) {
        Write-Host "Tearing down failover compose stack..."
        docker compose -f $composeFile down -v 2>$null | Out-Null
    }
}
