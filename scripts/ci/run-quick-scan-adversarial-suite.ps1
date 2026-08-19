param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $RepoRoot

$reportDir = Join-Path $RepoRoot '.local\owner'
$reportPath = Join-Path $reportDir 'quick_scan_adversarial_test_report.md'
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$filter = 'Suite=QuickScanAdversarial'
$applicationProject = Join-Path $RepoRoot 'ArchLucid.Application.Tests\ArchLucid.Application.Tests.csproj'
$apiProject = Join-Path $RepoRoot 'ArchLucid.Api.Tests\ArchLucid.Api.Tests.csproj'

Write-Host "Running Quick Scan adversarial suite (filter: $filter)..."

$applicationOutput = & dotnet test $applicationProject -c Release --filter $filter --no-restore 2>&1 | Out-String
$applicationExit = $LASTEXITCODE

$apiOutput = & dotnet test $apiProject -c Release --filter $filter --no-restore 2>&1 | Out-String
$apiExit = $LASTEXITCODE

$overallPass = ($applicationExit -eq 0) -and ($apiExit -eq 0)
$generatedUtc = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss')

$report = @"
# Quick Scan adversarial cost/abuse test report (TB-901)

Generated: $generatedUtc UTC

## Sponsor report

**Verdict:** $(if ($overallPass) { 'PASS — no unbounded spend path demonstrated in adversarial suite.' } else { 'FAIL — one or more adversarial scenarios failed; do not award GREEN release gate.' })

## Suite scope

| Layer | Project | Filter |
|-------|---------|--------|
| Guard, budget, concurrency, orchestrator gates | `ArchLucid.Application.Tests` | `Suite=QuickScanAdversarial` |
| Marketing HTTP kill-switch / sample-only / identity | `ArchLucid.Api.Tests` | `Suite=QuickScanAdversarial` |

## Scenario matrix

| Scenario | Control exercised | Expected outcome | Status |
|----------|-------------------|------------------|--------|
| IP request flood | Global hourly request limit | Reject after ceiling | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Duplicate payload replay | Duplicate fingerprint window | Reject without new admission | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Session rotation on same IP | Per-IP hourly limit | Reject after IP ceiling | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Global daily spend ceiling | In-process spend tracker | Reject new unique payloads | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Concurrent budget reservations | Atomic hourly ceiling | At most N reservations | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Concurrent concurrency admission | Distributed lease ceiling | At most N direct leases | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Oversized description | Pre-exec token bound | Validation failure, no provider | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Client model escalation | Reject client model override | Validation failure, no provider | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Budget store outage | Fail-closed global budget | Capacity reached, no provider | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Hourly budget cap | Global budget reservation | Capacity reached, no provider | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Emergency disabled at entry | Kill switch | Emergency disabled, no provider | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Emergency flip before provider | Pre-provider re-check | Emergency disabled, no provider | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Concurrency queue full | Bounded queue | Concurrency rejected, no provider | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Unknown model pricing | Pre-exec cost gate | Reject before execution | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Retry amplification reserve | Pre-exec cost includes retries | Reserved total includes retry exposure | $(if ($applicationExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Marketing POST emergency disabled | Controller + operational snapshot | HTTP 503, orchestrator never called | $(if ($apiExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Marketing POST sample-only | Sample-only operational mode | HTTP 503, orchestrator never called | $(if ($apiExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Marketing GET sample | Static sample provider | Sample payload, orchestrator never called | $(if ($apiExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |
| Forged session header | Session binding for guard context | Header honored; still server-gated | $(if ($apiExit -eq 0) { 'PROVEN' } else { 'FAILED' }) |

## Residual risk

- ASP.NET rate limiting and production Redis/SQL store behavior are not fully load-tested in this suite; concurrency/budget proofs use in-memory stores with parallel workers.
- CAPTCHA/sign-in friction (**TB-897**) is not part of this adversarial pass.
- Live provider spend reconciliation is covered by **TB-899** (operability), not this suite.

## Reproduction

```powershell
.\scripts\ci\run-quick-scan-adversarial-suite.ps1
```

Or directly:

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj -c Release --filter "Suite=QuickScanAdversarial"
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj -c Release --filter "Suite=QuickScanAdversarial"
```

## Raw output

### Application.Tests

```
$applicationOutput
```

### Api.Tests

```
$apiOutput
```
"@

Set-Content -LiteralPath $reportPath -Value $report -Encoding utf8
Write-Host "Wrote report: $reportPath"

if (-not $overallPass) {
    exit 1
}

exit 0
