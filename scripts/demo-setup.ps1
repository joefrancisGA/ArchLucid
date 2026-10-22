<#
.SYNOPSIS
    Local demo readiness checks before screen capture (optional API + SQL probes).

.DESCRIPTION
    Validates common prereqs for docs/demo/DEMO_RECORDING_STORYBOARD.md:
      * `dotnet` on PATH
      * optional `ARCHLUCID_DEMO_API_BASE_URL` — performs GET /version

    **SQL** — when `ARCHLUCID_DEMO_SQL` is set to any truthy value (`1`, `true`, `yes`), runs
    `dotnet test ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj --filter "FullyQualifiedName~MigrateVerify" --no-build`
    only after a successful `dotnet build` on that project (set `$SkipSql` to skip permanently).

.PARAMETER SkipSql
    Do not run SQL migration verify tests even when ARCHLUCID_DEMO_SQL is set.

.PARAMETER ApiBaseUrl
    Overrides environment variable ARCHLUCID_DEMO_API_BASE_URL for this invocation.
#>
[CmdletBinding()]
param(
    [switch] $SkipSql,
    [string] $ApiBaseUrl = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

function Test-ExecutableOnPath([string] $Name) {
    $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

if (-not (Test-ExecutableOnPath -Name "dotnet")) {
    throw "dotnet SDK not found on PATH."
}

Write-Host "Repository root: $repoRoot" -ForegroundColor Cyan

$base = if ($ApiBaseUrl -ne "") { $ApiBaseUrl } else { $env:ARCHLUCID_DEMO_API_BASE_URL }
if ($null -ne $base -and $base.Trim().Length -gt 0) {
    $versionUrl = ($base.TrimEnd('/')) + "/version"
    Write-Host "Probing API: $versionUrl" -ForegroundColor Cyan
    try {
        $resp = Invoke-WebRequest -Uri $versionUrl -UseBasicParsing -TimeoutSec 15
        Write-Host ("API status: " + [int]$resp.StatusCode) -ForegroundColor Green
    }
    catch {
        Write-Warning "API probe failed (demo can still proceed offline): $($_.Exception.Message)"
    }
}
else {
    Write-Host "ARCHLUCID_DEMO_API_BASE_URL not set — skipping HTTP probe." -ForegroundColor Yellow
}

$sqlFlag = $env:ARCHLUCID_DEMO_SQL
$runSql = -not $SkipSql -and $null -ne $sqlFlag -and @("1", "true", "yes") -contains $sqlFlag.ToLowerInvariant()

if ($runSql) {
    Write-Host "Building + testing ArchLucid.Persistence.Tests MigrateVerify (ARCHLUCID_DEMO_SQL enabled)..." -ForegroundColor Cyan
    dotnet build (Join-Path $repoRoot "ArchLucid.Persistence.Tests\ArchLucid.Persistence.Tests.csproj") -v minimal
    dotnet test (Join-Path $repoRoot "ArchLucid.Persistence.Tests\ArchLucid.Persistence.Tests.csproj") --filter "FullyQualifiedName~MigrateVerify" --no-build -v minimal
}
else {
    Write-Host "SQL migrate-verify skipped (set ARCHLUCID_DEMO_SQL=1 to enable, or pass -SkipSql to silence)." -ForegroundColor DarkGray
}

Write-Host "Demo setup checks complete." -ForegroundColor Green
