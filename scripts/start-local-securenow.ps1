# Starts ArchLucid.Api locally, waits until healthy, then starts SecureNow (Security product line)
# on archlucid-ui port 3001. Verifies browser -> Next.js -> /api/proxy -> API, then opens SecureNow.
#
# Thin wrapper around start-local-api-and-ui.ps1 with -SkipArchitectureUi (Architecture UI :3000 omitted).
#
# Port reference:
#   Native dev (default): API 5128, SecureNow UI 3001 —
#   archlucid-ui/.env.local ARCHLUCID_API_BASE_URL=http://localhost:5128
#
# Prerequisites: same as start-local-api-and-ui.ps1 (dotnet, Node 22+, npm ci, SQL).
#
# Usage:
#   .\scripts\start-local-securenow.ps1
#   .\scripts\start-local-securenow.ps1 -SkipPreflight -NoBrowser
#   .\scripts\start-local-securenow.ps1 -ApiPort 5128 -SecurityUiPort 3001
#   .\scripts\start-local-securenow.ps1 -EnsureSql

[CmdletBinding()]
param(
    [string] $OpenPath = "/",
    [int] $ApiPort = 5128,
    [int] $SecurityUiPort = 3001,
    [int] $ApiReadyTimeoutSec = 900,
    [int] $UiReadyTimeoutSec = 360,
    [switch] $SkipPreflight,
    [switch] $EnsureSql,
    [switch] $NoBrowser,
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

& (Join-Path $PSScriptRoot "start-local-api-and-ui.ps1") `
    -OpenPath $OpenPath `
    -ApiPort $ApiPort `
    -UiPort $SecurityUiPort `
    -SecurityUiPort $SecurityUiPort `
    -ApiReadyTimeoutSec $ApiReadyTimeoutSec `
    -UiReadyTimeoutSec $UiReadyTimeoutSec `
    -SkipPreflight:$SkipPreflight `
    -EnsureSql:$EnsureSql `
    -NoBrowser:$NoBrowser `
    -SkipArchitectureUi `
    -LaunchProfile $LaunchProfile `
    -MsBuildMaxCpuCount $MsBuildMaxCpuCount `
    -UseTerminalLogger:$UseTerminalLogger `
    -RunAnalyzers:$RunAnalyzers `
    -SkipBuildServerShutdown:$SkipBuildServerShutdown `
    -SkipExplicitBuild:$SkipExplicitBuild
