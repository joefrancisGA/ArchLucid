# Starts ArchLucid.Api locally, waits until healthy, then starts two SecureNow shells
# against that one API:
#   generic edition on port 3001 (NEXT_PUBLIC_SECURENOW_EDITION=generic)
#   UHG edition on port 3002 (NEXT_PUBLIC_SECURENOW_EDITION=uhg)
#
# Architecture UI :3000 is omitted. One API serves both editions. Each Next.js process
# has its own port and dist directory so the dev lock does not collide.
#
# Port reference:
#   Native dev (default): API 5128, generic SecureNow 3001, UHG SecureNow 3002 —
#   archlucid-ui/.env.local ARCHLUCID_API_BASE_URL=http://localhost:5128
#
# Prerequisites: same as start-local-api-and-ui.ps1 (dotnet, Node 22+, npm ci, SQL).
#
# Usage:
#   .\scripts\start-local-securenow.ps1
#   .\scripts\start-local-securenow.ps1 -SkipPreflight -NoBrowser
#   .\scripts\start-local-securenow.ps1 -ApiPort 5128 -SecurityUiPort 3001 -UhgSecurityUiPort 3002
#   .\scripts\start-local-securenow.ps1 -EnsureSql

[CmdletBinding()]
param(
    [string] $OpenPath = "/",
    [int] $ApiPort = 5128,
    [int] $SecurityUiPort = 3001,
    [int] $UhgSecurityUiPort = 3002,
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
    -UhgSecurityUiPort $UhgSecurityUiPort `
    -ApiReadyTimeoutSec $ApiReadyTimeoutSec `
    -UiReadyTimeoutSec $UiReadyTimeoutSec `
    -SkipPreflight:$SkipPreflight `
    -EnsureSql:$EnsureSql `
    -NoBrowser:$NoBrowser `
    -SkipArchitectureUi `
    -IncludeUhgSecurityUi `
    -LaunchProfile $LaunchProfile `
    -MsBuildMaxCpuCount $MsBuildMaxCpuCount `
    -UseTerminalLogger:$UseTerminalLogger `
    -RunAnalyzers:$RunAnalyzers `
    -SkipBuildServerShutdown:$SkipBuildServerShutdown `
    -SkipExplicitBuild:$SkipExplicitBuild
