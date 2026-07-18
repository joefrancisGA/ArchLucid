<#
.SYNOPSIS
  Runs Evidence E1 Email OTP flood (+ optional registration farm) drill harness.

.DESCRIPTION
  Prefer staging. Default BASE_URL is local API. Executes:
    1) Application unit flood proof (always, unless -SkipUnitProof)
    2) k6 email-otp-challenge-flood.js (when k6 is on PATH, unless -SkipK6)
    3) Optional k6 self-service-trial-farm-stub.js (-IncludeFarmStub)

  Writes a markdown execution stub under .local/owner/ when -WriteEvidenceStub is set.

.PARAMETER BaseUrl
  API base URL for k6 (default http://127.0.0.1:8080).

.PARAMETER ExpectBotChallenge
  Pass EXPECT_BOT_CHALLENGE=true to k6 (staging with RequireBotChallenge=true).

.PARAMETER IncludeFarmStub
  Also run registration farm k6 stub (requires PublicSelfService mode).

.PARAMETER SkipUnitProof
  Skip dotnet unit flood proof.

.PARAMETER SkipK6
  Skip k6 scenarios.

.PARAMETER WriteEvidenceStub
  Write .local/owner/e1_abuse_drill_execution.md template with timestamp.
#>
[CmdletBinding()]
param(
    [string] $BaseUrl = "http://127.0.0.1:8080",
    [switch] $ExpectBotChallenge,
    [switch] $IncludeFarmStub,
    [switch] $SkipUnitProof,
    [switch] $SkipK6,
    [switch] $WriteEvidenceStub,
    [string] $Vus = "5",
    [string] $Duration = "30s"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $repoRoot

$failed = $false

Write-Host "=== E1 Email OTP abuse drill harness ==="
Write-Host "Repo: $repoRoot"
Write-Host "BASE_URL: $BaseUrl"

if (-not $SkipUnitProof) {
    Write-Host "`n--- Unit flood proof (EmailOtpAuthServiceTests IP/email flood) ---"
    $testProject = Join-Path $repoRoot "ArchLucid.Application.Tests\ArchLucid.Application.Tests.csproj"
    $filter = "FullyQualifiedName~EmailOtpAuthServiceTests.RequestCodeAsync_flood"

    & dotnet test $testProject --filter $filter --no-restore 2>&1 | ForEach-Object { Write-Host $_ }

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Unit flood proof failed (exit $LASTEXITCODE). Retrying with restore..."
        & dotnet test $testProject --filter $filter 2>&1 | ForEach-Object { Write-Host $_ }

        if ($LASTEXITCODE -ne 0) {
            $failed = $true
        }
    }
}

$k6 = Get-Command k6 -ErrorAction SilentlyContinue

if (-not $SkipK6) {
    if ($null -eq $k6) {
        Write-Host "`n--- k6 not on PATH; skipping load scripts (install k6 for staging flood) ---"
    }
    else {
        Write-Host "`n--- k6 email-otp-challenge-flood.js ---"
        $floodScript = Join-Path $repoRoot "scripts\load\email-otp-challenge-flood.js"
        $env:BASE_URL = $BaseUrl
        $env:VUS = $Vus
        $env:DURATION = $Duration
        $env:EXPECT_BOT_CHALLENGE = if ($ExpectBotChallenge) { "true" } else { "false" }

        & k6 run $floodScript 2>&1 | ForEach-Object { Write-Host $_ }

        if ($LASTEXITCODE -ne 0) {
            $failed = $true
        }

        if ($IncludeFarmStub) {
            Write-Host "`n--- k6 self-service-trial-farm-stub.js ---"
            $farmScript = Join-Path $repoRoot "scripts\load\self-service-trial-farm-stub.js"
            & k6 run $farmScript 2>&1 | ForEach-Object { Write-Host $_ }

            if ($LASTEXITCODE -ne 0) {
                $failed = $true
            }
        }
    }
}

if ($WriteEvidenceStub) {
    $ownerDir = Join-Path $repoRoot ".local\owner"
    if (-not (Test-Path -LiteralPath $ownerDir)) {
        New-Item -ItemType Directory -Path $ownerDir | Out-Null
    }

    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
    $evidencePath = Join-Path $ownerDir "e1_abuse_drill_execution.md"
    $botLine = if ($ExpectBotChallenge) { "true" } else { "false (unit proof only unless staging secrets set)" }
    $resultLine = if ($failed) { "fail / partial" } else { "pass (harness)" }

    @"
# E1 abuse drill execution record

| Field | Value |
|-------|--------|
| Date | $stamp |
| Environment | $BaseUrl |
| Operator | agent / local harness |
| ExpectBotChallenge | $botLine |
| IncludeFarmStub | $IncludeFarmStub |
| Result | $resultLine |
| Notes | Unit flood proof exercises rate limits in-process. Staging k6 + Turnstile + Prometheus alert fire still required for gate GREEN. |

"@ | Set-Content -LiteralPath $evidencePath -Encoding utf8

    Write-Host "`nWrote evidence stub: $evidencePath"
}

Write-Host "`n=== Drill harness finished ==="

if ($failed) {
    exit 1
}

exit 0
